import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/layout/AdminLayout';
import { TeacherDashboard } from './pages/teacher/Dashboard';
import { QuestionBank } from './pages/teacher/QuestionBank';
import { CreateQuestion } from './pages/teacher/CreateQuestion';
import { EditQuestion } from './pages/teacher/EditQuestion';
import { Exams as TeacherExams } from './pages/teacher/Exams';
import { StudentDashboard } from './pages/student/Dashboard';
import { StudentExam } from './pages/student/Exam';
import { StudentExams } from './pages/student/Exams';
import { StudentResults } from './pages/student/Results';
import { StudentExamResultDetail } from './pages/student/ExamResultDetail';
import { StudentProfile } from './pages/student/Profile';
import { StudentClassrooms } from './pages/student/Classrooms';
import { StudentClassroomDetail } from './pages/student/ClassroomDetail';
import { JoinClass } from './pages/student/JoinClass';
import { TeacherProfile } from './pages/teacher/Profile';
import { Classrooms } from './pages/teacher/Classrooms';
import { ClassroomDetail } from './pages/teacher/ClassroomDetail';
import { Students } from './pages/teacher/Students';
import { AdminProfile } from './pages/admin/Profile';
import { ExamResults } from './pages/teacher/ExamResults';
import { UserManagement } from './pages/admin/UserManagement';
import { Categories } from './pages/admin/Categories';
import { ExamsManagement } from './pages/admin/ExamsManagement';
import { Reports } from './pages/admin/Reports';
import { SystemSettings } from './pages/admin/SystemSettings';
import { ClassroomAllocation } from './pages/admin/ClassroomAllocation';
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { HelpCenter } from './pages/public/HelpCenter';
import { ToastProvider } from './context/ToastContext.jsx';

import { StudentLayout } from './components/layout/StudentLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { RequireRole } from './components/auth/RequireRole';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/join-class"
          element={
            <RequireRole roles={['student']}>
              <JoinClass />
            </RequireRole>
          }
        />
        <Route
          path="/student/*"
          element={
            <RequireRole roles={['student', 'admin']}>
              <StudentLayout>
                <ErrorBoundary>
                  <Routes>
                   <Route path="/" element={<StudentDashboard />} />
                    <Route path="/classrooms" element={<StudentClassrooms />} />
                    <Route path="/classrooms/:id" element={<StudentClassroomDetail />} />
                    <Route path="/exams" element={<StudentExams />} />
                    <Route path="/results" element={<StudentResults />} />
                    <Route
                      path="/results/:examId/:attemptId"
                      element={<StudentExamResultDetail />}
                    />
                    <Route path="/profile" element={<StudentProfile />} />
                  </Routes>
                </ErrorBoundary>
              </StudentLayout>
            </RequireRole>
          }
        />

        <Route
          path="/exam-focus/:id"
          element={
            <RequireRole roles={['student', 'admin']}>
              <StudentExam />
            </RequireRole>
          }
        />

        <Route
          path="/teacher/*"
          element={
            <RequireRole roles={['teacher', 'admin', 'mod']}>
              <Layout>
                <Routes>
                  <Route path="/" element={<TeacherDashboard />} />
                  <Route path="/questions" element={<QuestionBank />} />
                  <Route path="/questions/new" element={<CreateQuestion />} />
                  <Route path="/questions/edit/:id" element={<EditQuestion />} />
                  <Route path="/exams" element={<TeacherExams />} />
                  <Route path="/exams/:id/results" element={<ExamResults />} />
                  <Route path="/results" element={<ExamResults />} />
                  <Route path="/students" element={<Students />} />
                  <Route path="/classrooms" element={<Classrooms />} />
                  <Route path="/classrooms/:id" element={<ClassroomDetail />} />
                  <Route path="/profile" element={<TeacherProfile />} />
                </Routes>
              </Layout>
            </RequireRole>
          }
        />

        <Route
          path="/admin/*"
          element={
            <RequireRole roles={['admin']}>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<UserManagement />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/exams" element={<ExamsManagement />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/classrooms" element={<ClassroomAllocation />} />
                  <Route path="/settings" element={<SystemSettings />} />
                  <Route path="/profile" element={<AdminProfile />} />
                  <Route path="/help" element={<HelpCenter />} />
                </Routes>
              </AdminLayout>
            </RequireRole>
          }
        />
      </Routes>
    </ToastProvider>
  );
}

export default App;


