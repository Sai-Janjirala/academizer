import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

const emptySlot = () => ({ day: 'Monday', startTime: '08:00', endTime: '09:00', hall: '' });

const AdminTimetable = () => {
  const [classes, setClasses] = useState([]);
  const [selected, setSelected] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    apiFetch('/admin/classes-overview')
      .then((r) => r.json())
      .then((c) => {
        setClasses(Array.isArray(c) ? c : []);
        if (c[0]) setSelected(c[0]._id);
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    apiFetch(`/classes/${selected}`)
      .then((r) => r.json())
      .then((cls) => setSchedule(cls.schedule?.length ? cls.schedule : [emptySlot()]))
      .catch(() => setSchedule([emptySlot()]));
  }, [selected]);

  const save = async () => {
    setStatus('');
    const res = await apiFetch(`/admin/classes/${selected}/schedule`, {
      method: 'PUT',
      body: JSON.stringify({ schedule })
    });
    const j = await res.json();
    if (!res.ok) setStatus(j.error || 'Save failed');
    else setStatus('Timetable saved. Students see it on their portal.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
      <header>
        <h1 className="font-serif text-3xl font-bold text-slate-900">Set class timetable</h1>
        <p className="text-slate-600 mt-2">Updates the schedule students see under Timetable.</p>
      </header>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full max-w-md rounded-xl border-2 border-cyan-100 px-4 py-3 text-sm font-medium"
      >
        {classes.map((c) => (
          <option key={c._id} value={c._id}>
            {c.courseName || c.className}
          </option>
        ))}
      </select>
      <div className="space-y-3">
        {schedule.map((slot, i) => (
          <div key={i} className="flex flex-wrap gap-2 items-end rounded-2xl border border-cyan-100 bg-white/90 p-4">
            <select
              value={slot.day}
              onChange={(e) => setSchedule((s) => s.map((x, j) => (j === i ? { ...x, day: e.target.value } : x)))}
              className="rounded-xl border px-2 py-2 text-sm"
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={slot.startTime || ''}
              onChange={(e) => setSchedule((s) => s.map((x, j) => (j === i ? { ...x, startTime: e.target.value } : x)))}
              className="rounded-xl border px-2 py-2 text-sm"
            />
            <input
              type="time"
              value={slot.endTime || ''}
              onChange={(e) => setSchedule((s) => s.map((x, j) => (j === i ? { ...x, endTime: e.target.value } : x)))}
              className="rounded-xl border px-2 py-2 text-sm"
            />
            <input
              placeholder="Hall"
              value={slot.hall || ''}
              onChange={(e) => setSchedule((s) => s.map((x, j) => (j === i ? { ...x, hall: e.target.value } : x)))}
              className="flex-1 min-w-[120px] rounded-xl border px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => setSchedule((s) => s.filter((_, j) => j !== i))}
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSchedule((s) => [...s, emptySlot()])}
          className="inline-flex items-center gap-2 text-sm font-bold text-cyan-800"
        >
          <Plus className="h-4 w-4" />
          Add slot
        </button>
      </div>
      <button
        type="button"
        onClick={save}
        className="rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold px-8 py-3 shadow-md"
      >
        Save timetable
      </button>
      {status && <p className="text-sm text-emerald-700 font-medium">{status}</p>}
    </div>
  );
};

export default AdminTimetable;
