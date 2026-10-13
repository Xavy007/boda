import { MotionConfig } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingScreen } from './components/LoadingScreen';
import { StatusScreen } from './components/StatusScreen';
import InvitationPage from './pages/InvitationPage';

// El panel se carga aparte: los invitados nunca descargan su código
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Invitations = lazy(() => import('./pages/admin/Invitations'));
const Photos = lazy(() => import('./pages/admin/Photos'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const Logs = lazy(() => import('./pages/admin/Logs'));

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/i/:token" element={<InvitationPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="invitaciones" element={<Invitations />} />
            <Route path="fotos" element={<Photos />} />
            <Route path="configuracion" element={<Settings />} />
            <Route path="accesos" element={<Logs />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
          <Route path="*" element={<StatusScreen kind="INVALID" />} />
        </Routes>
      </Suspense>
    </MotionConfig>
  );
}
