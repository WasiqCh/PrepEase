import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/auth/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentLayout from "./components/StudentLayout";
import TeacherLayout from "./components/TeacherLayout";
import AdminLayout from "./components/AdminLayout";
import Navbar from "./components/Navbar";

// Student Portal Pages
import StudentDashboard from "../pages/student/StudentDashboard";
import StudentAssignments from "../pages/student/StudentAssignments";
import StudentResources from "../pages/student/StudentResources";
import StudentAnalytics from "../pages/student/StudentAnalytics";
import CourseDetail from "../pages/student/CourseDetail";
import StudentSettings from "../pages/student/Settings";
import QuizRunner from "./components/QuizRunner.tsx";
import StudyBuddyChat from "../pages/student/StudyBuddyChat.tsx";
import FlashcardGenerator from "../pages/student/FlashcardGenerator.tsx";
import ResourceSuggestions from "../pages/student/ResourceSuggestions.tsx";

// Teacher Portal Pages
import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import CourseMaterials from "../pages/teacher/CourseMaterials";
import CreateAssessment from "../pages/teacher/CreateAssessment";
import ClassAnalytics from "../pages/teacher/ClassAnalytics";
import LectureUpload from "../pages/teacher/LectureUpload";
import AssignmentUpload from "../pages/teacher/AssignmentUpload";
import QuizUpload from "../pages/teacher/QuizUploadClean";
import StudentProgress from "../pages/teacher/StudentProgress";
import AssignmentGrading from "../pages/teacher/AssignmentGrading";
import QuizAttempts from "../pages/teacher/QuizAttempts";
import TeacherSettings from "../pages/teacher/Settings";
import AIGenerator from "../pages/teacher/AIGenerator.tsx";

// Admin Portal Pages
import UserManagement from "../pages/admin/UserManagement";
import AdminDashboard from "../pages/admin/Dashboard";
import StudentManagement from "../pages/admin/StudentManagement";
import TeacherManagement from "../pages/admin/TeacherManagement";
import AdminSettings from "../pages/admin/Settings";
import CourseManagement from "../pages/admin/CourseManagement";

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          {/* Teacher Portal Routes with Layout */}
          <Route element={<ProtectedRoute allowedRoles={["Teacher"]} />}>
            <Route element={<TeacherLayout />}>
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/lectures" element={<LectureUpload />} />
              <Route path="/teacher/assignments" element={<AssignmentUpload />} />
              <Route path="/teacher/assignments/:assignmentId/grade" element={<AssignmentGrading />} />
              <Route path="/teacher/quizzes" element={<QuizUpload />} />
              <Route path="/teacher/quizzes/:quizId/attempts" element={<QuizAttempts />} />
              <Route path="/teacher/students" element={<StudentProgress />} />
              <Route path="/teacher/materials" element={<CourseMaterials />} />
              <Route path="/teacher/assessment" element={<CreateAssessment />} />
              <Route path="/teacher/analytics" element={<ClassAnalytics />} />
              <Route path="/teacher/ai-generator" element={<AIGenerator />} />
              <Route path="/teacher/settings" element={<TeacherSettings />} />
            </Route>
          </Route>
          
          {/* Student Portal Routes with Layout */}
          <Route element={<ProtectedRoute allowedRoles={["Student"]} />}>
            <Route element={<StudentLayout />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/assignments" element={<StudentAssignments />} />
              <Route path="/student/resources" element={<StudentResources />} />
              <Route path="/student/analytics" element={<StudentAnalytics />} />
              <Route path="/student/course/:id" element={<CourseDetail />} />
              <Route path="/student/quiz/:quizId" element={<QuizRunner />} />
              <Route path="/chat/:materialId" element={<StudyBuddyChat />} />
              <Route path="/chat" element={<StudyBuddyChat />} />
              <Route path="/flashcards" element={<FlashcardGenerator />} />
              <Route path="/resources-discover" element={<ResourceSuggestions />} />
              <Route path="/student/settings" element={<StudentSettings />} />
            </Route>
          </Route>

          {/* Admin Portal Routes with Layout */}
          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/students" element={<StudentManagement />} />
              <Route path="/admin/teachers" element={<TeacherManagement />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/courses" element={<CourseManagement />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
