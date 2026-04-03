import React, { useMemo, useState } from 'react';
import { Bot, Send } from 'lucide-react';

const Dashboard = () => {
  const [coPilotPrompt, setCoPilotPrompt] = useState('');
  const [coPilotResponse, setCoPilotResponse] = useState(
    'Teacher Co-Pilot is ready. Ask about student concerns, attendance, or intervention plans.'
  );
  const [insightsPrompt, setInsightsPrompt] = useState('');
  const [insightsResponse, setInsightsResponse] = useState(
    'Student AI Insights is ready. Ask for risk analysis, top performers, attendance concern trends, or intervention priorities.'
  );

  const derivedInsights = useMemo(() => {
    if (!insightsPrompt.trim()) {
      return [
        'No student query yet. Start by asking about a class or student risk.',
        'Try: "Which students need support this week?"',
      ];
    }

    if (/attendance|absent|late|drop/i.test(insightsPrompt)) {
      return [
        'Attendance risk detected: prioritize follow-up for students with repeated late/absent patterns.',
        'Suggestion: parent outreach + short in-class checkpoint for the next 3 sessions.',
      ];
    }

    if (/grade|score|weak|struggle|performance/i.test(insightsPrompt)) {
      return [
        'Performance insight: learners with low participation may need concept reinforcement and guided practice.',
        'Suggestion: assign micro-remediation tasks and run a 1:1 review at week end.',
      ];
    }

    return [
      'General insight: segment students by participation and attendance, then assign support tiers.',
      'Suggestion: track a 7-day intervention plan and review growth every Friday.',
    ];
  }, [insightsPrompt]);

  const askInsights = (e) => {
    e.preventDefault();
    if (!insightsPrompt.trim()) return;
    setInsightsResponse(derivedInsights.join(' '));
    setInsightsPrompt('');
  };

  const askCoPilot = (e) => {
    e.preventDefault();
    const prompt = coPilotPrompt.trim();
    if (!prompt) return;

    if (/weak|low|drop|absent|risk|struggle/i.test(prompt)) {
      setCoPilotResponse('Action plan: identify at-risk students, run a 15-minute remediation slot, assign one focused task, and review progress in the next class.');
    } else if (/plan|schedule|strategy|improve|intervention/i.test(prompt)) {
      setCoPilotResponse('Suggested class flow: 10 min recap, 20 min guided teaching, 15 min activity, 5 min exit ticket. Track quality scores weekly and adapt pacing.');
    } else {
      setCoPilotResponse('I can help with student support plans, attendance interventions, quality-based coaching, and class pacing recommendations.');
    }

    setCoPilotPrompt('');
  };
  return (
    <div className="h-full flex flex-col gap-10 max-w-7xl mx-auto px-4">
      
      {/* Header */}
      <section className="flex flex-col gap-1">
        <h2 className="text-4xl text-text-primary mb-1 font-serif">Students Overview</h2>
        <p className="text-text-secondary text-sm tracking-wide font-serif italic">Academic Session 2025/26 • Semester II</p>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* Left Column - 2/3 */}
        <div className="col-span-1 xl:col-span-2 flex flex-col gap-8">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="bg-card border border-border shadow-sm rounded-sm px-6 py-5 relative">
              <div className="absolute bottom-6 left-6 w-24 h-1 bg-text-primary"></div>
              <div className="text-[10px] text-text-primary font-bold uppercase tracking-widest mb-4">Avg. Grade Trend</div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-semibold text-text-primary tracking-tighter">00</span>
                <span className="text-xs font-bold text-emerald-600"></span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-card border border-border shadow-sm rounded-sm px-6 py-5 relative">
              <div className="absolute bottom-6 left-6 right-10 h-1 bg-text-primary"></div>
              <div className="text-[10px] text-text-primary font-bold uppercase tracking-widest mb-4">Attendance Rate</div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-semibold text-text-primary tracking-tighter">00</span>
                <span className="text-xs font-medium text-text-secondary">Optimal</span>
              </div>
            </div>

            {/* Card 3 - Inverted dark card for contrast */}
            <div className="bg-inverted-bg shadow-sm rounded-sm px-6 py-5 relative text-inverted-text">
              <div className="text-[10px] text-inverted-text font-bold uppercase tracking-widest mb-4">Active Assessments</div>
              <div className="flex flex-col mb-2">
                <span className="text-4xl font-semibold tracking-tighter">00</span>
                <span className="text-xs font-medium text-slate-300 italic mt-2">Submission deadline in 48h</span>
              </div>
            </div>
          </div>

          {/* Student AI Insights */}
          <section className="bg-card rounded-sm shadow-sm border border-border mt-2">
            <div className="flex items-baseline justify-between p-6 border-b border-border">
              <h3 className="text-2xl font-serif text-text-primary">Student AI Insights</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-border rounded p-4">
                <p className="text-sm text-text-primary leading-relaxed">{insightsResponse}</p>
              </div>

              <form onSubmit={askInsights} className="space-y-3">
                <textarea
                  value={insightsPrompt}
                  onChange={(e) => setInsightsPrompt(e.target.value)}
                  placeholder="Ask about student trends, at-risk learners, attendance drops, or intervention plans..."
                  rows={4}
                  className="w-full border border-border rounded p-3 text-sm bg-white focus:outline-none focus:border-text-primary resize-none"
                />
                <button type="submit" className="inline-flex items-center justify-center gap-2 bg-text-primary text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors">
                  <Send size={14} />
                  Generate Insights
                </button>
              </form>
            </div>
          </section>

        </div>

        {/* Right Column - 1/3 */}
        <div className="col-span-1 flex flex-col gap-6">
          
          {/* Teacher Co-Pilot */}
          <section className="bg-card border border-border shadow-sm p-6 rounded-sm flex flex-col min-h-[420px]">
            <h3 className="text-[12px] font-bold tracking-[0.15em] text-text-primary uppercase mb-6">Teacher Co-Pilot</h3>

            <div className="bg-slate-50 border border-border rounded p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-text-primary text-white flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <p className="text-sm text-text-primary leading-relaxed">{coPilotResponse}</p>
              </div>
            </div>

            <form onSubmit={askCoPilot} className="mt-auto space-y-3">
              <textarea
                value={coPilotPrompt}
                onChange={(e) => setCoPilotPrompt(e.target.value)}
                placeholder="Ask Teacher Co-Pilot about student support, attendance, quality trends, or action plans..."
                rows={4}
                className="w-full border border-border rounded p-3 text-sm bg-white focus:outline-none focus:border-text-primary resize-none"
              />
              <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-text-primary text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors">
                <Send size={14} />
                Ask Co-Pilot
              </button>
            </form>
          </section>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
