import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

const TeacherLayout = () => (
  <div className="flex h-screen w-full bg-background overflow-hidden relative font-sans">
    <Sidebar />
    <div className="flex flex-col flex-1 h-full relative min-w-0">
      <TopNav />
      <main className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 border-t border-border/40 bg-main-gradient animate-fade-in">
        <Outlet />
      </main>
    </div>
  </div>
);

export default TeacherLayout;
