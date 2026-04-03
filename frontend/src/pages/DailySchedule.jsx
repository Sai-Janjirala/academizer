import React, { useMemo, useState } from 'react';
import { Calendar, Plus } from 'lucide-react';

const DailySchedule = () => {
  const [scheduleDate, setScheduleDate] = useState('2026-04-03');
  const [scheduleRows, setScheduleRows] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    period: '',
    name: '',
    hall: '',
    duration: '',
    status: 'PENDING'
  });
  const [editingId, setEditingId] = useState(null);

  const humanDate = useMemo(() => {
    if (!scheduleDate) return 'No Date Selected';
    return new Date(scheduleDate).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [scheduleDate]);

  const onAddOrUpdateSchedule = (e) => {
    e.preventDefault();
    if (!newSchedule.period || !newSchedule.name || !newSchedule.hall || !newSchedule.duration) return;

    if (editingId) {
      setScheduleRows((prev) => prev.map((row) => (row.id === editingId ? { ...row, ...newSchedule } : row)));
      setEditingId(null);
    } else {
      setScheduleRows((prev) => [...prev, { id: crypto.randomUUID(), ...newSchedule }]);
    }

    setNewSchedule({
      period: '',
      name: '',
      hall: '',
      duration: '',
      status: 'PENDING'
    });
  };

  const onEditSchedule = (row) => {
    setEditingId(row.id);
    setNewSchedule({
      period: row.period,
      name: row.name,
      hall: row.hall,
      duration: row.duration,
      status: row.status
    });
  };

  return (
    <div className="h-full flex flex-col gap-8 max-w-6xl mx-auto px-4">
      <section className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-text-primary mb-1 font-serif">Daily Schedule</h2>
          <p className="text-text-secondary text-sm tracking-wide font-serif italic">Manage your class plan whenever needed</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-text-secondary" />
          <input
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="text-[11px] font-bold uppercase tracking-widest border border-border bg-slate-50 px-2 py-1 rounded"
          />
        </div>
      </section>

      <section className="bg-card rounded-sm shadow-sm border border-border mt-2">
        <form onSubmit={onAddOrUpdateSchedule} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-4 border-b border-border bg-slate-50/50">
          <input value={newSchedule.period} onChange={(e) => setNewSchedule({ ...newSchedule, period: e.target.value })} placeholder="Period" className="border border-border rounded px-2 py-2 text-xs bg-white" />
          <input value={newSchedule.name} onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })} placeholder="Course / Topic" className="border border-border rounded px-2 py-2 text-xs bg-white md:col-span-2" />
          <input value={newSchedule.hall} onChange={(e) => setNewSchedule({ ...newSchedule, hall: e.target.value })} placeholder="Hall" className="border border-border rounded px-2 py-2 text-xs bg-white" />
          <input value={newSchedule.duration} onChange={(e) => setNewSchedule({ ...newSchedule, duration: e.target.value })} placeholder="Duration" className="border border-border rounded px-2 py-2 text-xs bg-white" />
          <button type="submit" className="inline-flex items-center justify-center gap-2 bg-text-primary text-white rounded px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-slate-800">
            <Plus size={12} />
            {editingId ? 'Update' : 'Add'}
          </button>
        </form>

        <div className="flex items-center px-6 py-3 text-[10px] text-text-primary font-bold uppercase tracking-wider border-b border-border bg-slate-50/50">
          <div className="w-16">Period</div>
          <div className="w-1/3">Course ID</div>
          <div className="w-1/4">Hall</div>
          <div className="w-1/4">Duration</div>
          <div className="flex-1 text-center">Status</div>
        </div>

        {scheduleRows.length === 0 && (
          <div className="px-6 py-6 text-sm text-text-secondary">No plans yet for {humanDate}. Add a schedule item above.</div>
        )}
        {scheduleRows.map((row) => (
          <div key={row.id} className="flex items-center px-6 py-5 border-b border-border last:border-b-0 hover:bg-slate-50 transition-colors">
            <div className="w-16 font-bold text-text-primary">{row.period}</div>
            <div className="w-1/3 pr-4">
              <p className="text-sm font-serif italic text-text-primary">{row.name}</p>
            </div>
            <div className="w-1/4 text-sm text-text-primary">{row.hall}</div>
            <div className="w-1/4 text-sm text-text-primary">{row.duration}</div>
            <div className="flex-1 flex justify-center">
              <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border ${
                row.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                row.status === 'ACTIVE' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                'bg-slate-100 border-slate-200 text-slate-500'
              }`}>
                {row.status}
              </span>
            </div>
            <div className="pl-4">
              <button onClick={() => onEditSchedule(row)} className="text-[10px] uppercase tracking-widest font-bold text-text-secondary hover:text-text-primary">
                Edit
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default DailySchedule;
