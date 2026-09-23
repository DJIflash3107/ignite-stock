import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Landing from './pages';
import NotFoundPage from './pages/not-found';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import MarketPage from './pages/market';
import InvestigationsPage from './pages/investigations';
import InvestigationDetailPage from './pages/investigations/detail';
import InvestigationAiPage from './pages/investigations/ai';
import ProfilePage from './pages/profile';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { GuestRoute } from './components/auth/GuestRoute';
import { AppShell } from './components/layout/AppShell';
import { useAuthInit } from './hooks/useAuthInit';

function AppRoutes() {
  // Initialize auth state and listen for session expiry / 401 events
  useAuthInit();

  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Guest Only Routes (Redirects authenticated users to /market) */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Authenticated Application Shell & Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/market" element={<MarketPage />} />
          <Route path="/investigations" element={<InvestigationsPage />} />
          <Route path="/investigations/:id" element={<InvestigationDetailPage />} />
          <Route path="/investigations/:id/ai" element={<InvestigationAiPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
