import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-1.5-flash",
  temperature: 0.2
});

const conversations = new Map();

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

const normalizeWorkMode = (value = "") => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw.includes("remote") || raw.includes("wfh")) return "Remote";
  if (raw.includes("full")) return "Full Time";
  if (raw.includes("part")) return "Part Time";
  if (raw.includes("contract") || raw.includes("freelance")) return "Contract";
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

const normalizePostedWithin = (value = "") => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw.includes("24") || raw.includes("today")) return "Last 24 hours";
  if (raw.includes("3")) return "Last 3 days";
  if (raw.includes("7") || raw.includes("week")) return "Last 7 days";
  if (raw.includes("30") || raw.includes("month")) return "Last 30 days";
  if (raw.includes("any") || raw.includes("all")) return "Any";
  return value;
};

const sanitizeFilters = (filters = {}) => ({
  role: typeof filters.role === "string" ? filters.role : "",
  location: typeof filters.location === "string" ? filters.location : "",
  workMode: typeof filters.workMode === "string" ? normalizeWorkMode(filters.workMode) : "",
  jobType: typeof filters.jobType === "string" ? filters.jobType : "",
  matchScore: typeof filters.matchScore === "string" ? normalizeMatchScore(filters.matchScore) : "",
  postedWithin: typeof filters.postedWithin === "string" ? normalizePostedWithin(filters.postedWithin) : ""
});

const inputNode = async (state) => {
  return {
    normalizedInput: {
      text: String(state.message || '').trim(),
      context: state.context || {}
    }
  };
};

const intentNode = async (state) => {
  const text = String(state.normalizedInput?.text || "").toLowerCase();

  if (/\b(clear|reset)\b/.test(text) && /\b(filter|filters|search|all)\b/.test(text)) {
    return {
      quickHandled: true,
      parsed: {
        intent: "clear_filters",
        filters: {},
        message: "Done. I cleared all filters.",
        actions: [{ type: "resetFilters", payload: {} }]
      }
    };
  }

  if (/\b(refresh|latest|new jobs|live jobs|sync)\b/.test(text)) {
    return {
      quickHandled: true,
      parsed: {
        intent: "filter_update",
        filters: {},
        message: "Refreshing live jobs now so you can see the latest matches.",
        actions: [{ type: "refresh_live_jobs", payload: {} }]
      }
    };
  }

  return { quickHandled: false };
};

const classifyIntentNode = async (state) => {
  const historyText = (state.history || [])
    .slice(-6)
    .map((m) => `${m.role}: ${m.text}`)
    .join("\n");

  const prompt = `You are JobsBazaar AI assistant for a job dashboard.
Return only valid JSON with this exact shape:
{
  "intent": "filter_update" | "help" | "clear_filters",
  "filters": {
    "role": string,
    "location": string,
    "workMode": string,
    "jobType": string,
    "matchScore": string,
    "postedWithin": string
  },
  "message": string,
  "actions": [{
    "type": "setFilters" | "resetFilters" | "updateMatchScoreFilter" | "searchBySkill" | "searchByLocation" | "none",
    "payload": object
  }]
}

Rules:
- If user asks to apply/change role/location/work mode/date filters, use intent "filter_update" and action type "setFilters".
- If user asks to update score threshold, use action type "updateMatchScoreFilter" with payload {"matchScore": "High|Medium|Low|All"}.
- If user asks to search by a skill keyword, use action type "searchBySkill" with payload {"skill": "<skill>"}.
- If user asks to search by location, use action type "searchByLocation" with payload {"location": "<location>"}.
- If user asks to reset/clear, use intent "clear_filters" and action type "resetFilters".
- For general Q&A, use intent "help" and action type "none".
- Keep filters empty strings when not specified.

Current filters: ${JSON.stringify(state.context || {})}
Recent history:\n${historyText || "none"}
User message: ${state.normalizedInput?.text || state.message}`;

  const response = await model.invoke(prompt);
  const raw = Array.isArray(response.content)
    ? response.content.map((p) => (typeof p === "string" ? p : p?.text || "")).join(" ")
    : String(response.content || "");

  const parsed = extractJsonObject(raw) || {
    intent: "help",
    filters: {},
    message: "I can help filter jobs by role, location, work mode, and match score.",
    actions: [{ type: "none", payload: {} }]
  };

  return { parsed };
};

const actionNode = async (state) => {
  const parsed = state.parsed || {};
  const intent = typeof parsed.intent === "string" ? parsed.intent : "help";

  const actions = Array.isArray(parsed.actions) && parsed.actions.length > 0
    ? parsed.actions
    : [{ type: intent === "clear_filters" ? "resetFilters" : "none", payload: {} }];

  return { actionPlan: { intent, actions } };
};

const responseNode = async (state) => {
  const parsed = state.parsed || {};
  const filters = sanitizeFilters(parsed.filters);
  const intent = typeof parsed.intent === "string" ? parsed.intent : "help";
  const message = typeof parsed.message === "string"
    ? parsed.message
    : "I can help you refine jobs using smart filters.";

  const actions = state.actionPlan?.actions || [{ type: intent === "clear_filters" ? "resetFilters" : "none", payload: {} }];
  const safeActions = actions.length > 0 ? actions : [{ type: intent === 'clear_filters' ? 'resetFilters' : 'none', payload: {} }];

  const primaryAction = safeActions[0] || { type: 'none', payload: {} };

  const uiFunctionCall = {
    name: primaryAction.type,
    arguments: primaryAction.payload || {}
  };

  return {
    response: {
      intent,
      filters,
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

      const nextFilters = response.intent === "clear_filters" ? {} : { ...mergedContext, ...response.filters };
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
        filters: {},
        message: "I am having trouble processing that right now. How else can I help?",
        actions: [{ type: "none", payload: {} }]
      };
    }
  }
};

export default assistantOrchestrator;
