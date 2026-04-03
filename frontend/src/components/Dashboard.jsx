import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Send, Loader2, TrendingUp, Users, BookOpen, Sparkles, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE } from '../config/api';

// ─── Utility ────────────────────────────────────────────────────────────────
const apiFetch = async (url, opts = {}) => {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
};

// Simple markdown-like renderer (bold **text**, bullet - text)
const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    // Bold
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const rendered = parts.map((p, j) => (j % 2 === 1 ? <strong key={j}>{p}</strong> : p));
    // Bullet
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      return (
        <li key={i} className="ml-4 list-disc text-[13px] text-[#3a3a3a] leading-relaxed">
          {rendered}
        </li>
      );
    }
    // Heading-ish lines that start with * or #
    if (line.trim().startsWith('# ') || line.trim().startsWith('### ')) {
      return <p key={i} className="text-[13px] font-semibold text-[#1a1a1a] mt-2">{rendered}</p>;
    }
    if (!line.trim()) return <br key={i} />;
    return <p key={i} className="text-[13px] text-[#3a3a3a] leading-relaxed">{rendered}</p>;
  });
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, unit, accent, loading }) => (
  <div
    className={`relative rounded-xl border shadow-sm px-6 py-5 overflow-hidden transition-transform hover:scale-[1.02] duration-200 ${
      accent
        ? 'bg-gradient-to-br from-violet-100 via-fuchsia-50 to-amber-100 border-violet-200/60 text-violet-950'
        : 'bg-white border-[#e5e5e5] text-[#1a1a1a]'
    }`}
  >
    <div className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${accent ? 'text-violet-700' : 'text-[#555]'}`}>
      {label}
    </div>
    {loading ? (
      <div className="flex items-center gap-2 mb-4">
        <Loader2 size={20} className="animate-spin text-[#999]" />
        <span className="text-sm text-[#999]">Loading…</span>
      </div>
    ) : (
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-4xl font-semibold tracking-tighter">{value ?? '—'}</span>
        {unit && <span className={`text-xs font-medium ${accent ? 'text-violet-700' : 'text-[#888]'}`}>{unit}</span>}
      </div>
    )}
    <div className={`absolute bottom-5 left-6 right-6 h-[2px] ${accent ? 'bg-violet-300' : 'bg-[#1a1a1a]'} opacity-20`} />
  </div>
);

// ─── Chat Message ────────────────────────────────────────────────────────────
const ChatMessage = ({ role, content, isTyping }) => {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={15} />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
          isUser
            ? 'bg-[#1a1a1a] text-white rounded-tr-sm'
            : 'bg-slate-50 border border-[#e8e8e8] text-[#222] rounded-tl-sm'
        }`}
      >
        {isTyping ? (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#888] animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#888] animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#888] animate-bounce [animation-delay:300ms]" />
          </div>
        ) : isUser ? (
          <span>{content}</span>
        ) : (
          <div className="space-y-1">{renderMarkdown(content)}</div>
        )}
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // AI Insights
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState('');
  const [insightsExpanded, setInsightsExpanded] = useState(false);

  // Copilot chat
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content:
        "Hello! I'm your Teacher Co-Pilot 👋\n\nI have **live access to your student database**. You can ask me anything:\n- \"Which students are at risk?\"\n- \"Show me attendance for John\"\n- \"Who are the top performers in Math?\"\n- \"Give me an intervention plan for struggling students\""
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  // Insights chat
  const [insightsInput, setInsightsInput] = useState('');
  const [insightsChatLoading, setInsightsChatLoading] = useState(false);
  const [insightsChatHistory, setInsightsChatHistory] = useState([]);
  const [insightsChatError, setInsightsChatError] = useState('');

  const chatEndRef = useRef(null);
  const insightsChatEndRef = useRef(null);

  // ── Load stats ──
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await apiFetch(`${API_BASE}/ai/stats`);
      setStats(data);
    } catch {
      setStats({ avgScore: 0, avgAttendance: 0, activeAssessments: 0, totalStudents: 0, totalClasses: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Load AI insights summary ──
  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    setInsightsError('');
    try {
      const data = await apiFetch(`${API_BASE}/ai/summary`);
      setInsights(data.insights || []);
    } catch (e) {
      setInsightsError(e.message);
      setInsights([]);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadInsights();
  }, [loadStats, loadInsights]);

  // Auto-scroll chats
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  useEffect(() => {
    insightsChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [insightsChatHistory, insightsChatLoading]);

  // ── Copilot ask ──
  const handleCopilotSend = async (e) => {
    e.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt || chatLoading) return;

    setChatInput('');
    setChatError('');
    const userMsg = { role: 'user', content: prompt };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatLoading(true);

    try {
      // Build history for API (exclude the initial greeting)
      const apiHistory = newHistory.slice(1, -1).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      const data = await apiFetch(`${API_BASE}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history: apiHistory })
      });

      setChatHistory((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setChatError(err.message);
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${err.message}` }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Insights ask ──
  const handleInsightsAsk = async (e) => {
    e.preventDefault();
    const prompt = insightsInput.trim();
    if (!prompt || insightsChatLoading) return;

    setInsightsInput('');
    setInsightsChatError('');
    const userMsg = { role: 'user', content: prompt };
    const newHistory = [...insightsChatHistory, userMsg];
    setInsightsChatHistory(newHistory);
    setInsightsChatLoading(true);

    try {
      const apiHistory = newHistory.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const data = await apiFetch(`${API_BASE}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history: apiHistory })
      });

      setInsightsChatHistory((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setInsightsChatError(err.message);
      setInsightsChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${err.message}` }
      ]);
    } finally {
      setInsightsChatLoading(false);
    }
  };

  const handleCopilotKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCopilotSend(e);
    }
  };

  const handleInsightsKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInsightsAsk(e);
    }
  };

  // ── Quick prompts ──
  const quickPrompts = [
    'Who are the at-risk students?',
    'Top 3 performers overall',
    'Attendance below 75%',
    'Suggest intervention plan'
  ];

  return (
    <div className="h-full flex flex-col gap-8 max-w-7xl mx-auto px-4 pb-10">

      {/* Header */}
      <section className="flex flex-col gap-1 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl text-[#1a1a1a] mb-1 font-serif">Students Overview</h2>
            <p className="text-[#777] text-sm tracking-wide font-serif italic">
              Academic Session 2025/26 • Semester II
              {stats && stats.totalStudents > 0 && (
                <span className="ml-3 not-italic font-sans text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {stats.totalStudents} students · {stats.totalClasses} classes
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => { loadStats(); loadInsights(); }}
            className="flex items-center gap-1.5 text-xs text-[#777] hover:text-[#1a1a1a] transition-colors px-3 py-1.5 rounded-lg border border-[#e5e5e5] hover:border-[#ccc] bg-white"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </section>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Avg. Grade Trend"
          value={stats?.avgScore !== undefined ? `${stats.avgScore}%` : null}
          unit={stats?.avgScore >= 70 ? 'Good' : stats?.avgScore > 0 ? 'Needs Attention' : ''}
          loading={statsLoading}
        />
        <StatCard
          label="Attendance Rate"
          value={stats?.avgAttendance !== undefined ? `${stats.avgAttendance}%` : null}
          unit={stats?.avgAttendance >= 80 ? 'Optimal' : stats?.avgAttendance > 0 ? 'Monitor' : ''}
          loading={statsLoading}
        />
        <StatCard
          label="Active Assessments"
          value={stats?.activeAssessments !== undefined ? stats.activeAssessments : null}
          unit="students with marks"
          accent
          loading={statsLoading}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

        {/* Left Column — AI Insights */}
        <div className="col-span-1 xl:col-span-2 flex flex-col gap-6">

          {/* AI Insights Panel */}
          <section className="bg-white rounded-xl shadow-sm border border-[#e5e5e5]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-violet-500" />
                <h3 className="text-xl font-serif text-[#1a1a1a]">Student AI Insights</h3>
              </div>
              <button
                onClick={loadInsights}
                disabled={insightsLoading}
                className="flex items-center gap-1.5 text-xs text-[#777] hover:text-[#1a1a1a] transition-colors px-2 py-1 rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={12} className={insightsLoading ? 'animate-spin' : ''} />
                Regenerate
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">

              {/* Auto-generated insights */}
              <div className="bg-gradient-to-br from-slate-50 to-violet-50/30 border border-[#e8e8e8] rounded-xl p-4 space-y-3">
                {insightsLoading ? (
                  <div className="flex items-center gap-3 text-sm text-[#777]">
                    <Loader2 size={16} className="animate-spin text-violet-500" />
                    <span>Analysing your student database…</span>
                  </div>
                ) : insightsError ? (
                  <div className="flex items-start gap-2 text-sm text-red-600">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{insightsError}</span>
                  </div>
                ) : insights.length === 0 ? (
                  <p className="text-sm text-[#777]">No insights available — add students to get started.</p>
                ) : (
                  insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                        {i + 1}
                      </div>
                      <p className="text-[13px] text-[#333] leading-relaxed">{insight}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Insights chat history */}
              {insightsChatHistory.length > 0 && (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {insightsChatHistory.map((msg, i) => (
                    <ChatMessage key={i} role={msg.role} content={msg.content} />
                  ))}
                  {insightsChatLoading && (
                    <ChatMessage role="assistant" content="" isTyping />
                  )}
                  <div ref={insightsChatEndRef} />
                </div>
              )}

              {insightsChatError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle size={13} />
                  {insightsChatError}
                </div>
              )}

              {/* Insights input */}
              <form onSubmit={handleInsightsAsk} className="space-y-2">
                <div className="relative">
                  <textarea
                    value={insightsInput}
                    onChange={(e) => setInsightsInput(e.target.value)}
                    onKeyDown={handleInsightsKeyDown}
                    placeholder="Ask about trends, at-risk learners, subject performance… (Enter to send)"
                    rows={3}
                    className="w-full border border-[#e0e0e0] rounded-xl p-3 pr-12 text-sm bg-white focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]/10 resize-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={insightsChatLoading || !insightsInput.trim()}
                    className="absolute right-3 bottom-3 w-8 h-8 bg-[#1a1a1a] text-white rounded-lg flex items-center justify-center hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {insightsChatLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              </form>
            </div>
          </section>

        </div>

        {/* Right Column — Teacher Co-Pilot */}
        <div className="col-span-1 flex flex-col gap-6">

          <section className="bg-white border border-[#e5e5e5] shadow-sm rounded-xl flex flex-col" style={{ height: '600px' }}>

            {/* Header */}
            <div className="px-5 py-4 border-b border-[#e5e5e5] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide text-[#1a1a1a]">Teacher Co-Pilot</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-[#888]">Live DB · Gemini AI</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setChatHistory([{
                  role: 'assistant',
                  content: "Hello! I'm your Teacher Co-Pilot 👋\n\nI have **live access to your student database**. You can ask me anything:\n- \"Which students are at risk?\"\n- \"Show me attendance for John\"\n- \"Who are the top performers in Math?\"\n- \"Give me an intervention plan for struggling students\""
                }])}
                className="text-[10px] text-[#999] hover:text-[#555] transition-colors px-2 py-1 rounded hover:bg-slate-50"
              >
                Clear
              </button>
            </div>

            {/* Quick prompts */}
            <div className="px-4 py-2.5 border-b border-[#f0f0f0] flex gap-1.5 flex-wrap shrink-0">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  disabled={chatLoading}
                  onClick={async () => {
                    if (chatLoading) return;
                    setChatError('');
                    const userMsg = { role: 'user', content: q };
                    const newHistory = [...chatHistory, userMsg];
                    setChatHistory(newHistory);
                    setChatLoading(true);
                    try {
                      const apiHistory = newHistory.slice(1, -1).map((m) => ({
                        role: m.role === 'user' ? 'user' : 'assistant',
                        content: m.content
                      }));
                      const data = await apiFetch(`${API_BASE}/ai/ask`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: q, history: apiHistory })
                      });
                      setChatHistory((prev) => [...prev, { role: 'assistant', content: data.response }]);
                    } catch (err) {
                      setChatHistory((prev) => [...prev, { role: 'assistant', content: `⚠️ Error: ${err.message}` }]);
                    } finally {
                      setChatLoading(false);
                    }
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-slate-50 border border-[#e5e5e5] text-[#555] hover:border-[#aaa] hover:text-[#1a1a1a] transition-colors whitespace-nowrap disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat history */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {chatHistory.map((msg, i) => (
                <ChatMessage key={i} role={msg.role} content={msg.content} />
              ))}
              {chatLoading && <ChatMessage role="assistant" content="" isTyping />}
              {chatError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle size={13} />
                  {chatError}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleCopilotSend} className="px-4 pb-4 pt-2 shrink-0 border-t border-[#f0f0f0]">
              <div className="relative">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleCopilotKeyDown}
                  placeholder="Ask about any student… (Enter to send)"
                  rows={2}
                  className="w-full border border-[#e0e0e0] rounded-xl p-3 pr-11 text-[13px] bg-[#fafafa] focus:outline-none focus:border-[#1a1a1a] focus:bg-white focus:ring-1 focus:ring-[#1a1a1a]/10 resize-none transition-all"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="absolute right-2.5 bottom-2.5 w-7 h-7 bg-[#1a1a1a] text-white rounded-lg flex items-center justify-center hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {chatLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                </button>
              </div>
            </form>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
