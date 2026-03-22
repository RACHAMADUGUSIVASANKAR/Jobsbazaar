import { useState, useEffect, useRef } from 'react';
import { FiMessageSquare, FiX, FiSend, FiMic } from 'react-icons/fi';
import './AIAssistantPanel.css';

const AIAssistantPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am your AI Job Assistant. I can help you find jobs, filter roles, or explain platform features.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript.trim()) {
        setInput(transcript);
        handleSend(transcript);
      }
    };
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: text,
          context: window.__jobFeedFilters || {}
        })
      });

      const data = await response.json();

      const aiMsg = { role: 'assistant', text: data.message };
      setMessages(prev => [...prev, aiMsg]);

      const actionFromList = Array.isArray(data.actions) ? data.actions[0] : null;
      const actionFromFunctionCall = data.uiFunctionCall
        ? { type: data.uiFunctionCall.name, payload: data.uiFunctionCall.arguments || {} }
        : null;
      const action = actionFromFunctionCall || actionFromList;
      const shouldApply = data.intent === 'filter_update'
        || action?.type === 'apply_filters'
        || action?.type === 'setFilters'
        || action?.type === 'updateMatchScoreFilter'
        || action?.type === 'searchBySkill'
        || action?.type === 'searchByLocation';
      const shouldClear = data.intent === 'clear_filters'
        || action?.type === 'clear_filters'
        || action?.type === 'resetFilters';
      const shouldRefreshLive = action?.type === 'refresh_live_jobs';

      if (shouldApply) {
        window.dispatchEvent(new CustomEvent('updateFilters', { detail: action?.payload || data.filters || {} }));
      }

      if (shouldClear) {
        window.dispatchEvent(new CustomEvent('updateFilters', {
          detail: {
            role: '',
            location: '',
            skills: '',
            workMode: 'All',
            matchScore: 'All',
            datePosted: 'Any'
          }
        }));
      }

      if (shouldRefreshLive) {
        window.dispatchEvent(new CustomEvent('assistantRefreshLiveJobs'));
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    "Show remote jobs",
    "Find React developer roles",
    "High match scores only",
    "Internships for Python",
    "Jobs posted this week",
    "Clear all filters"
  ];

  const handleVoiceInput = () => {
    if (!recognitionRef.current || listening) return;
    recognitionRef.current.start();
  };

  return (
    <>
      {/* Floating Button */}
      <button className="ai-fab" onClick={() => setIsOpen(true)}>
        <FiMessageSquare size={24} />
      </button>

      {/* Assistant Panel */}
      <div className={`ai-panel ${isOpen ? 'open' : ''}`}>
        <div className="ai-panel__header">
          <div className="header__title-group">
            <h3>AI Job Assistant</h3>
            <p>Helps you find better jobs faster</p>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            <FiX size={20} />
          </button>
        </div>

        <div className="ai-panel__chat">
          {messages.map((msg, index) => (
            <div key={`msg-${index}-${msg.role}`} className={`message ${msg.role}`}>
              <div className="message-bubble">{msg.text}</div>
            </div>
          ))}
          {isTyping && <div className="message assistant typing">Typing...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-panel__suggestions">
          {suggestions.map((s, i) => (
            <button key={`sugg-${i}-${s}`} className="suggestion-btn" onClick={() => handleSend(s)}>
              {s}
            </button>
          ))}
        </div>

        <div className="ai-panel__input">
          <div className="input-box">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="voice-btn" onClick={handleVoiceInput} disabled={listening} title="Voice search">
              <FiMic />
            </button>
            <button className="send-btn" onClick={() => handleSend()}><FiSend /></button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIAssistantPanel;
