import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Dashboard from './components/Dashboard';
import Attendance from './pages/Attendance';
import Gradebook from './pages/Gradebook';
import Analytics from './pages/Analytics';
import Timetable from './pages/Timetable';
import DailySchedule from './pages/DailySchedule';
import StudentDataManager from './pages/StudentDataManager';

function App() {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full relative">
        <TopNav />
        <main className="flex-1 overflow-y-auto px-10 py-8 border-t border-border/40 bg-background">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/gradebook" element={<Gradebook />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/class-data" element={<StudentDataManager />} />
            <Route path="/daily-schedule" element={<DailySchedule />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
