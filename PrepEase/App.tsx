import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import QuizRunner from './components/QuizRunner';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import CourseDetail from './pages/student/CourseDetail';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentResources from './pages/student/StudentResources';
import StudentAnalytics from './pages/student/StudentAnalytics';
import Settings from './pages/student/Settings';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CourseMaterials from './pages/teacher/CourseMaterials';
import CreateAssessment from './pages/teacher/CreateAssessment';
import ClassAnalytics from './pages/teacher/ClassAnalytics';
import AssignmentGrading from './pages/teacher/AssignmentGrading';
import QuizUpload from './pages/teacher/QuizUpload';
import QuizAttempts from './pages/teacher/QuizAttempts';

// Admin Pages
import UserManagement from './pages/admin/UserManagement';
import SystemHealth from './pages/admin/SystemHealth';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<Layout role="student"><StudentDashboard /></Layout>} />
        <Route path="/student/course/:id" element={<Layout role="student"><CourseDetail /></Layout>} />
        <Route path="/student/assignments" element={<Layout role="student"><StudentAssignments /></Layout>} />
        <Route path="/student/quiz/:quizId" element={<Layout role="student"><QuizRunner /></Layout>} />
        <Route path="/student/resources" element={<Layout role="student"><StudentResources /></Layout>} />
        <Route path="/student/analytics" element={<Layout role="student"><StudentAnalytics /></Layout>} />
        <Route path="/student/settings" element={<Layout role="student"><Settings /></Layout>} />

        {/* Teacher Routes */}
        <Route path="/teacher/dashboard" element={<Layout role="teacher"><TeacherDashboard /></Layout>} />
        <Route path="/teacher/materials" element={<Layout role="teacher"><CourseMaterials /></Layout>} />
        <Route path="/teacher/quizzes" element={<Layout role="teacher"><QuizUpload /></Layout>} />
        <Route path="/teacher/quizzes/:quizId/attempts" element={<Layout role="teacher"><QuizAttempts /></Layout>} />
        <Route path="/teacher/create-quiz" element={<Layout role="teacher"><CreateAssessment /></Layout>} />
        <Route path="/teacher/analytics" element={<Layout role="teacher"><ClassAnalytics /></Layout>} />
        <Route path="/teacher/assignments/:assignmentId/grade" element={<Layout role="teacher"><AssignmentGrading /></Layout>} />

        {/* Admin Routes */}
        <Route path="/admin/users" element={<Layout role="admin"><UserManagement /></Layout>} />
        <Route path="/admin/health" element={<Layout role="admin"><SystemHealth /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;