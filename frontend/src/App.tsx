import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ConductorLogin from './components/Conductor/ConductorLogin';
import TicketForm from './components/Conductor/TicketForm';
import QRPaymentScreen from './components/Conductor/QRPaymentScreen';
import RecoveryDashboard from './components/Recovery/RecoveryDashboard';
import PassengerRetryPage from './components/Passenger/PassengerRetryPage';

// Role-based redirect from root
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/recovery" replace />;
  return <Navigate to="/conductor" replace />;
};

// Protected route — requires auth
const Protected: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children,
  roles,
}) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path="/login" element={<ConductorLogin />} />
    <Route
      path="/conductor"
      element={
        <Protected roles={['conductor', 'admin']}>
          <TicketForm />
        </Protected>
      }
    />
    <Route
      path="/conductor/qr/:sessionId"
      element={
        <Protected roles={['conductor', 'admin']}>
          <QRPaymentScreen />
        </Protected>
      }
    />
    <Route
      path="/recovery"
      element={
        <Protected roles={['admin']}>
          <RecoveryDashboard />
        </Protected>
      }
    />
    <Route path="/retry" element={<PassengerRetryPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
