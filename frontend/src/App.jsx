import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import TeacherLayout from './components/TeacherLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import Attendance from './pages/Attendance';
import Gradebook from './pages/Gradebook';
import Analytics from './pages/Analytics';
import Timetable from './pages/Timetable';
import DailySchedule from './pages/DailySchedule';
import StudentDataManager from './pages/StudentDataManager';
import StudentAttendancePortal from './pages/StudentAttendancePortal';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';
import StudentHome from './pages/student/StudentHome';
import StudentReportCard from './pages/student/StudentReportCard';
import StudentRemarks from './pages/student/StudentRemarks';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentTimetable from './pages/student/StudentTimetable';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminClasses from './pages/admin/AdminClasses';
import AdminTimetable from './pages/admin/AdminTimetable';
import AdminRemarks from './pages/admin/AdminRemarks';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import TeacherAdminInbox from './pages/teacher/TeacherAdminInbox';
import TeacherStudentRemarks from './pages/teacher/TeacherStudentRemarks';
import { useAuth } from './context/AuthContext';

function RoleHomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'teacher') return <Navigate to="/faculty" replace />;
  if (user.role === 'student') return <Navigate to="/student" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/check-in" element={<StudentAttendancePortal />} />
      <Route path="/app" element={<RoleHomeRedirect />} />

      <Route
        path="/faculty"
        element={
          <ProtectedRoute roles={['teacher']}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="gradebook" element={<Gradebook />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="class-data" element={<StudentDataManager />} />
        <Route path="daily-schedule" element={<DailySchedule />} />
        <Route path="assignments" element={<TeacherAssignments />} />
        <Route path="student-remarks" element={<TeacherStudentRemarks />} />
        <Route path="admin-inbox" element={<TeacherAdminInbox />} />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentHome />} />
        <Route path="report-card" element={<StudentReportCard />} />
        <Route path="remarks" element={<StudentRemarks />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="timetable" element={<StudentTimetable />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="teachers" element={<AdminTeachers />} />
        <Route path="classes" element={<AdminClasses />} />
        <Route path="timetable" element={<AdminTimetable />} />
        <Route path="remarks" element={<AdminRemarks />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
