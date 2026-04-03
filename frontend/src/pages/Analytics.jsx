import React, { useState, useEffect } from 'react';
import { LineChart, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../lib/api';

const Analytics = () => {
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    apiFetch('/insights')
      .then((res) => res.json())
      .then((data) => setInsights(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="h-full flex flex-col gap-8 max-w-5xl mx-auto px-4">
      <section>
        <h2 className="text-3xl text-text-primary mb-1 font-serif">Smart Analytics</h2>
        <p className="text-text-secondary text-sm tracking-wide font-serif italic">System-wide performance monitoring</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Alerts Block */}
        <section className="bg-card shadow-sm border border-border rounded p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
            <AlertTriangle className="text-red-500" size={20} />
            <h3 className="text-lg font-serif text-text-primary">Identified Risks</h3>
          </div>
          
          <div className="space-y-4">
            {insights ? insights.criticalAlerts.map((alert, i) => (
              <div key={i} className="bg-red-50/50 border border-red-100 rounded p-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1 block">{alert.type}</span>
                <p className="text-sm text-text-primary leading-relaxed">{alert.message}</p>
              </div>
            )) : <p className="animate-pulse text-xs text-text-secondary">Loading...</p>}
          </div>
        </section>

        {/* Global Trend Block */}
        <section className="bg-inverted-bg text-inverted-text shadow-sm rounded flex flex-col p-6">
          <div className="flex items-center gap-3 border-b border-slate-700 pb-4 mb-6">
            <LineChart className="text-slate-300" size={20} />
            <h3 className="text-lg font-serif text-inverted-text">Global Trend (Simulated)</h3>
          </div>
          
          <div className="flex-1 flex items-end gap-3 justify-between pt-10">
             {[40, 50, 45, 60, 85, 70, 95].map((h, i) => (
               <div key={i} className="w-full bg-slate-500/30 rounded-t" style={{height: `${h}%`}}></div>
             ))}
          </div>
          <div className="flex justify-between text-[9px] uppercase tracking-widest text-slate-400 mt-4">
            <span>Sep</span>
            <span>Dec</span>
            <span>Mar</span>
          </div>
        </section>

      </div>
    </div>
  );
};
export default Analytics;
