import React, { useState } from 'react';
import { Clock, Plus } from 'lucide-react';

const Timetable = () => {
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    day: 'Monday',
    time: '',
    subject: ''
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.day || !form.time || !form.subject) return;

    if (editingId) {
      setEntries((prev) => prev.map((entry) => (entry.id === editingId ? { ...entry, ...form } : entry)));
      setEditingId(null);
    } else {
      setEntries((prev) => [...prev, { id: crypto.randomUUID(), ...form }]);
    }

    setForm({ day: 'Monday', time: '', subject: '' });
  };

  const onEdit = (entry) => {
    setEditingId(entry.id);
    setForm({ day: entry.day, time: entry.time, subject: entry.subject });
  };

  return (
    <div className="h-full flex flex-col gap-8 max-w-6xl mx-auto px-4">
      <section className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-text-primary mb-1 font-serif">Timetable</h2>
          <p className="text-text-secondary text-sm tracking-wide font-serif italic">Faculty Schedule • Dr. Aris Thorne</p>
        </div>
      </section>

      <section className="bg-card shadow-sm border border-border rounded overflow-hidden flex-1 p-6 space-y-6">
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={form.day}
            onChange={(e) => setForm({ ...form, day: e.target.value })}
            className="bg-slate-50 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-text-primary"
          >
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="bg-slate-50 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-text-primary"
          />
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Subject"
            className="bg-slate-50 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-text-primary"
          />
          <button type="submit" className="inline-flex items-center justify-center gap-2 bg-text-primary text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors">
            <Plus size={14} />
            {editingId ? 'Update Slot' : 'Add Slot'}
          </button>
        </form>

        <div className="rounded border border-border overflow-hidden">
          <div className="grid grid-cols-4 bg-slate-50 border-b border-border">
            <div className="p-3 text-[11px] font-bold uppercase tracking-widest text-text-primary">Day</div>
            <div className="p-3 text-[11px] font-bold uppercase tracking-widest text-text-primary flex items-center gap-2"><Clock size={14} /> Time</div>
            <div className="p-3 text-[11px] font-bold uppercase tracking-widest text-text-primary">Subject</div>
            <div className="p-3 text-[11px] font-bold uppercase tracking-widest text-text-primary text-center">Action</div>
          </div>

          {entries.length === 0 && (
            <div className="p-4 text-sm text-text-secondary">No timetable slots yet. Add day, time, and subject above.</div>
          )}

          {entries.map((entry) => (
            <div key={entry.id} className="grid grid-cols-4 border-b border-border last:border-b-0">
              <div className="p-3 text-sm text-text-primary">{entry.day}</div>
              <div className="p-3 text-sm text-text-primary">{entry.time}</div>
              <div className="p-3 text-sm text-text-primary">{entry.subject}</div>
              <div className="p-3 text-center">
                <button onClick={() => onEdit(entry)} className="text-xs font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
export default Timetable;
