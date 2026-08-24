import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { CandidateLayout } from './layouts/CandidateLayout';
import Home from './pages/public/Home';
import UnauthorizedPage from './pages/public/Unauthorized';
import NotFoundPage from './pages/public/NotFound';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import ForgotPasswordPage from './pages/auth/ForgotPassword';
import ResetPasswordPage from './pages/auth/ResetPassword';
import OtpLoginPage from './pages/auth/OtpLogin';
import VerifyConvocationPage from './pages/public/VerifyConvocation';
import AdminDashboard from './pages/admin/Dashboard';
import CompetitionsPage from './pages/admin/Competitions';
import JobOffersPage from './pages/admin/JobOffers';
import ApplicationsPage from './pages/admin/Applications';
import CandidateDashboard from './pages/candidate/Dashboard';
import CandidateDocuments from './pages/candidate/Documents';
import CandidateOffers from './pages/candidate/Offers';
import CandidateApplications from './pages/candidate/Applications';
import CandidateProfile from './pages/candidate/Profile';
import DepartmentsPage from './pages/admin/Departments';
import UsersPage from './pages/admin/Users';
import EvaluationsPage from './pages/admin/Evaluations';
import DispatchPage from './pages/admin/Dispatch';
import RankingPage from './pages/admin/Ranking';
import SettingsPage from './pages/admin/Settings';
import {
  Role,
  StaffRoles,
  CompetitionManagers,
  JobOfferManagers,
  Evaluators,
  RankingViewers,
  DepartmentViewers,
  ApplicationViewers,
} from './lib/roles';

const ROLE_CANDIDAT = [Role.Candidat, 'Candidat'];

function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* ── Pages publiques ── */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login-otp" element={<OtpLoginPage />} />
        <Route path="/verify-convocation" element={<VerifyConvocationPage />} />

        {/* ── Dashboard admin : accessible à tout le personnel ── */}
        <Route element={<ProtectedRoute allowedRoles={StaffRoles} />}>
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={DepartmentViewers} />}>
          <Route path="/admin/departments" element={<AdminLayout><DepartmentsPage /></AdminLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[...CompetitionManagers, Role.Administrateur]} />}>
          <Route path="/admin/competitions" element={<AdminLayout><CompetitionsPage /></AdminLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={JobOfferManagers} />}>
          <Route path="/admin/job-offers" element={<AdminLayout><JobOffersPage /></AdminLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={ApplicationViewers} />}>
          <Route path="/admin/applications" element={<AdminLayout><ApplicationsPage /></AdminLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={Evaluators} />}>
          <Route path="/admin/evaluations" element={<AdminLayout><EvaluationsPage /></AdminLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={RankingViewers} />}>
          <Route path="/admin/ranking" element={<AdminLayout><RankingPage /></AdminLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={CompetitionManagers} />}>
          <Route path="/admin/dispatch" element={<AdminLayout><DispatchPage /></AdminLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[Role.SuperAdmin]} />}>
          <Route path="/admin/users" element={<AdminLayout><UsersPage /></AdminLayout>} />
          <Route path="/admin/settings" element={<AdminLayout><SettingsPage /></AdminLayout>} />
        </Route>

        {/* ── Espace Candidat ── */}
        <Route element={<ProtectedRoute allowedRoles={ROLE_CANDIDAT} />}>
          <Route path="/candidate" element={<CandidateLayout><CandidateDashboard /></CandidateLayout>} />
          <Route path="/candidate/applications" element={<CandidateLayout><CandidateApplications /></CandidateLayout>} />
          <Route path="/candidate/offers" element={<CandidateLayout><CandidateOffers /></CandidateLayout>} />
          <Route path="/candidate/profile" element={<CandidateLayout><CandidateProfile /></CandidateLayout>} />
          <Route path="/candidate/documents" element={<CandidateLayout><CandidateDocuments /></CandidateLayout>} />
        </Route>

        {/* ── Fallbacks ── */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
