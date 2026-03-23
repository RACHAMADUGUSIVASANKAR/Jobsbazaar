import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

const assistantApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const model = assistantApiKey
  ? new ChatGoogleGenerativeAI({
    apiKey: assistantApiKey,
    model: "gemini-1.5-flash",
    temperature: 0.2
  })
  : null;

const conversations = new Map();

const DEFAULT_FILTERS = {
  role: "",
  skills: [],
  location: "",
  jobType: "",
  workMode: "",
  datePosted: "",
  matchScore: ""
};

const HELP_RESPONSES = {
  bestMatches: "Open Best Matches from the left sidebar to view the highest relevance jobs first.",
  uploadResume: "Go to Profile and use the Resume Upload section to upload or replace your resume.",
  matchingWorks: "Job matching uses resume skills when available; otherwise it uses your profile skills.",
  applications: "Open Applied Jobs from the sidebar to see your tracked applications and statuses."
};

const AssistantState = Annotation.Root({
  message: Annotation(),
  context: Annotation(),
  history: Annotation(),
  normalizedInput: Annotation(),
  quickHandled: Annotation(),
  parsed: Annotation(),
  actionPlan: Annotation(),
  response: Annotation()
});

const extractJsonObject = (text = "") => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
};

const mergeFilters = (base = {}, incoming = {}) => {
  const next = { ...DEFAULT_FILTERS, ...base };

  if (typeof incoming.role === "string") next.role = incoming.role.trim();
  if (Array.isArray(incoming.skills)) next.skills = incoming.skills.filter(Boolean);
  if (typeof incoming.location === "string") next.location = incoming.location.trim();
  if (typeof incoming.jobType === "string") next.jobType = incoming.jobType.trim();
  if (typeof incoming.workMode === "string") next.workMode = incoming.workMode.trim();
  if (typeof incoming.datePosted === "string") next.datePosted = incoming.datePosted.trim();
  if (typeof incoming.matchScore === "string") next.matchScore = incoming.matchScore.trim();

  return next;
};

const normalizeWorkMode = (value = "") => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw.includes("remote") || raw.includes("wfh")) return "Remote";
  if (raw.includes("full")) return "Full Time";
  if (raw.includes("part")) return "Part Time";
  if (raw.includes("contract") || raw.includes("freelance")) return "Contract";
  return value;
};

const normalizeJobType = (value = "") => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw.includes("full")) return "Full Time";
  if (raw.includes("part")) return "Part Time";
  if (raw.includes("contract") || raw.includes("freelance")) return "Contract";
  if (raw.includes("intern")) return "Internship";
  return value;
};

const normalizeMatchScore = (value = "") => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw.includes("high") || raw.includes("strong")) return "High";
  if (raw.includes("medium") || raw.includes("mid")) return "Medium";
  if (raw.includes("low")) return "Low";
  if (raw.includes("all") || raw.includes("any")) return "All";
  return value;
};

const normalizeDatePosted = (value = "") => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw.includes("24") || raw.includes("today")) return "Last 24 hours";
  if (raw.includes("3")) return "Last 3 days";
  if (raw.includes("7") || raw.includes("week")) return "Last 7 days";
  if (raw.includes("30") || raw.includes("month")) return "Last 30 days";
  if (raw.includes("any") || raw.includes("all")) return "Any";
  return value;
};

const sanitizeFilters = (filters = {}) => mergeFilters(DEFAULT_FILTERS, {
  role: typeof filters.role === "string" ? filters.role : "",
  skills: Array.isArray(filters.skills)
    ? filters.skills
    : (typeof filters.skills === "string"
      ? filters.skills.split(",").map((item) => item.trim()).filter(Boolean)
      : []),
  location: typeof filters.location === "string" ? filters.location : "",
  jobType: typeof filters.jobType === "string" ? normalizeJobType(filters.jobType) : "",
  workMode: typeof filters.workMode === "string" ? normalizeWorkMode(filters.workMode) : "",
  datePosted: typeof filters.datePosted === "string"
    ? normalizeDatePosted(filters.datePosted)
    : (typeof filters.postedWithin === "string" ? normalizeDatePosted(filters.postedWithin) : ""),
  matchScore: typeof filters.matchScore === "string" ? normalizeMatchScore(filters.matchScore) : ""
});

const toLow = (value = "") => String(value || "").toLowerCase().trim();

const extractLocation = (text = "") => {
  const inMatch = text.match(/\b(?:in|at|near)\s+([a-zA-Z\s]{2,40})$/i)
    || text.match(/\b(?:in|at|near)\s+([a-zA-Z\s]{2,40})\b/i);
  if (!inMatch) return "";
  return String(inMatch[1] || "")
    .trim()
    .replace(/\b(remote|jobs?|roles?)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const knownSkills = [
  "react",
  "python",
  "node",
  "node.js",
  "javascript",
  "typescript",
  "java",
  "sql",
  "aws",
  "docker",
  "mongodb"
];

const detectSkills = (text = "") => {
  const low = toLow(text);
  return knownSkills
    .filter((skill) => low.includes(skill))
    .map((skill) => (skill === "node.js" ? "Node.js" : skill.charAt(0).toUpperCase() + skill.slice(1)));
};

const deterministicIntent = (message = "", context = {}) => {
  const text = String(message || "").trim();
  const low = toLow(text);
  const hasWord = (pattern) => pattern.test(low);

  if (!text) {
    return {
      intent: "help",
      message: "Ask me to find jobs, update filters, or explain dashboard sections."
    };
  }

  if (hasWord(/\bwhere\b/) && low.includes("best match")) {
    return { intent: "help", message: HELP_RESPONSES.bestMatches };
  }
  if ((hasWord(/\bupload\b/) && hasWord(/\bresume\b/)) || low.includes("replace resume")) {
    return { intent: "help", message: HELP_RESPONSES.uploadResume };
  }
  if ((hasWord(/\bhow\b/) && hasWord(/\bmatch(?:ing)?\b/)) || low.includes("matching works")) {
    return { intent: "help", message: HELP_RESPONSES.matchingWorks };
  }
  if (hasWord(/\bwhere\b/) && (hasWord(/\bapplication\b/) || hasWord(/\bapplied\b/))) {
    return { intent: "help", message: HELP_RESPONSES.applications };
  }

  if ((low.includes("clear") || low.includes("reset")) && low.includes("filter")) {
    return {
      intent: "filter_update",
      filters: { ...DEFAULT_FILTERS },
      message: "Cleared all filters."
    };
  }

  const nextFilters = mergeFilters(DEFAULT_FILTERS, context || {});

  if (low.includes("remote")) nextFilters.workMode = "Remote";
  if (low.includes("full-time") || low.includes("full time")) nextFilters.jobType = "Full Time";
  if (low.includes("part-time") || low.includes("part time")) nextFilters.jobType = "Part Time";
  if (low.includes("contract")) nextFilters.jobType = "Contract";
  if (low.includes("intern")) nextFilters.jobType = "Internship";

  if (low.includes("high match") || low.includes("best match") || low.includes("70")) {
    nextFilters.matchScore = "High";
  }
  if (low.includes("this week") || low.includes("last 7 days")) {
    nextFilters.datePosted = "Last 7 days";
  }
  if (low.includes("today") || low.includes("last 24")) {
    nextFilters.datePosted = "Last 24 hours";
  }

  const location = extractLocation(text);
  if (location) nextFilters.location = location;

  const skills = detectSkills(text);
  if (skills.length) {
    nextFilters.skills = skills;
    if (!nextFilters.role && (low.includes("developer") || low.includes("engineer") || low.includes("role"))) {
      nextFilters.role = `${skills[0]} developer`;
    }
  }

  if (!nextFilters.role && low.includes("react developer")) nextFilters.role = "React developer";
  if (!nextFilters.role && low.includes("python internship")) nextFilters.role = "Python internship";
  if (!nextFilters.role && low.includes("internship")) nextFilters.role = "Internship";

  const changed = JSON.stringify(mergeFilters(DEFAULT_FILTERS, context || {})) !== JSON.stringify(nextFilters);
  if (!changed) {
    return {
      intent: "help",
      message: "Tell me what to filter, for example: Remote React jobs in Bangalore with high match score."
    };
  }

  return {
    intent: "filter_update",
    filters: nextFilters,
    message: "Updated your job filters."
  };
};

const inputNode = async (state) => {
  return {
    normalizedInput: {
      text: String(state.message || '').trim(),
      context: state.context || {}
    }
  };
};

const intentNode = async (state) => {
  const deterministic = deterministicIntent(state.normalizedInput?.text || "", state.context || {});

  if (deterministic.intent === "help") {
    return {
      quickHandled: true,
      parsed: {
        intent: "help",
        filters: mergeFilters(DEFAULT_FILTERS, state.context || {}),
        message: deterministic.message
      }
    };
  }

  return {
    quickHandled: true,
    parsed: {
      intent: "filter_update",
      filters: sanitizeFilters(deterministic.filters || {}),
      message: deterministic.message || "Updated your filters."
    }
  };
};

const classifyIntentNode = async (state) => {
  if (!model) {
    return {
      parsed: {
        intent: "help",
        filters: mergeFilters(DEFAULT_FILTERS, state.context || {}),
        message: "Assistant AI fallback is active. I can still update filters from direct commands."
      }
    };
  }

  const historyText = (state.history || [])
    .slice(-6)
    .map((m) => `${m.role}: ${m.text}`)
    .join("\n");

  const prompt = `You are JobsBazaar AI assistant for a job dashboard.
Return only valid JSON with this exact shape:
{
  "intent": "filter_update" | "help",
  "filters": {
    "role": string,
    "skills": string[],
    "location": string,
    "jobType": string,
    "workMode": string,
    "matchScore": string,
    "datePosted": string
  },
  "message": string
}

Rules:
- Use "filter_update" for any filter action.
- Use "help" for product usage questions only.
- Do not fabricate jobs.
- Keep message short and clear.

Current filters: ${JSON.stringify(state.context || {})}
Recent history:\n${historyText || "none"}
User message: ${state.normalizedInput?.text || state.message}`;

  const response = await model.invoke(prompt);
  const raw = Array.isArray(response.content)
    ? response.content.map((p) => (typeof p === "string" ? p : p?.text || "")).join(" ")
    : String(response.content || "");

  const parsed = extractJsonObject(raw) || {
    intent: "help",
    filters: mergeFilters(DEFAULT_FILTERS, state.context || {}),
    message: "I can help filter jobs by role, location, work mode, and match score."
  };

  return {
    parsed: {
      intent: parsed.intent === "filter_update" ? "filter_update" : "help",
      filters: sanitizeFilters(parsed.filters || {}),
      message: typeof parsed.message === "string" ? parsed.message : "I can help you with job filters."
    }
  };
};

const actionNode = async (state) => {
  const parsed = state.parsed || {};
  const intent = parsed.intent === "filter_update" ? "filter_update" : "help";

  const filters = sanitizeFilters(parsed.filters || {});
  const filterPayload = {
    role: filters.role,
    location: filters.location,
    skills: filters.skills.join(", "),
    workMode: filters.workMode || "All",
    matchScore: filters.matchScore || "All",
    datePosted: filters.datePosted || "Any"
  };

  const actions = intent === "filter_update"
    ? [{ type: "setFilters", payload: filterPayload }]
    : [{ type: "none", payload: {} }];

  return { actionPlan: { intent, actions } };
};

const responseNode = async (state) => {
  const parsed = state.parsed || {};
  const filters = sanitizeFilters(parsed.filters || {});
  const intent = parsed.intent === "filter_update" ? "filter_update" : "help";
  const message = typeof parsed.message === "string"
    ? parsed.message
    : "I can help you refine jobs using smart filters.";

  const actions = state.actionPlan?.actions || [{ type: "none", payload: {} }];
  const safeActions = actions.length > 0 ? actions : [{ type: "none", payload: {} }];

  const primaryAction = safeActions[0] || { type: "none", payload: {} };

  const uiFunctionCall = {
    name: primaryAction.type,
    arguments: primaryAction.payload || {}
  };

  return {
    response: {
      intent,
      filters: {
        role: filters.role,
        skills: filters.skills,
        location: filters.location,
        jobType: filters.jobType,
        workMode: filters.workMode,
        datePosted: filters.datePosted,
        matchScore: filters.matchScore
      },
      message,
      actions: safeActions,
      uiFunctionCall
    }
  };
};

const assistantGraph = new StateGraph(AssistantState)
  .addNode("input", inputNode)
  .addNode("intent", intentNode)
  .addNode("classifyIntent", classifyIntentNode)
  .addNode("action", actionNode)
  .addNode("respond", responseNode)
  .addEdge(START, "input")
  .addEdge("input", "intent")
  .addConditionalEdges("intent", (state) => (state.quickHandled ? "action" : "classifyIntent"))
  .addEdge("classifyIntent", "action")
  .addEdge("action", "respond")
  .addEdge("respond", END)
  .compile();

const assistantOrchestrator = {
  processMessage: async (message, context = {}, userId = "anonymous") => {
    try {
      const previous = conversations.get(userId) || { history: [], filters: {} };
      const mergedContext = { ...previous.filters, ...(context || {}) };

      const result = await assistantGraph.invoke({
        message,
        context: mergedContext,
        history: previous.history
      });

      const response = result.response || {
        intent: "help",
        filters: {},
        message: "I can help you filter job results.",
        actions: [{ type: "none", payload: {} }]
      };

      const nextFilters = response.intent === "filter_update"
        ? mergeFilters(mergedContext, response.filters)
        : mergeFilters(DEFAULT_FILTERS, mergedContext);
      const nextHistory = [
        ...previous.history,
        { role: "user", text: message },
        { role: "assistant", text: response.message }
      ].slice(-20);

      conversations.set(userId, {
        filters: nextFilters,
        history: nextHistory
      });

      return response;
    } catch (error) {
      console.error("Assistant Error:", error);
      return {
        intent: "help",
        filters: { ...DEFAULT_FILTERS },
        message: "I am having trouble processing that right now. How else can I help?",
        actions: [{ type: "none", payload: {} }]
      };
    }
  }
};

export default assistantOrchestrator;
