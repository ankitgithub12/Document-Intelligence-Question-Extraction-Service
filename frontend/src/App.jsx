import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentDetails from './pages/DocumentDetails';
import Questions from './pages/Questions';
import Review from './pages/Review';
import SettingsAnalytics from './pages/SettingsAnalytics';

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        
        {/* Authenticated Workspace Routes wrapped in AppLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Documents />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DocumentDetails />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:id/questions"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Questions />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/questions"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Questions />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:id/review"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Review />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/review"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Review />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SettingsAnalytics />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SettingsAnalytics />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
