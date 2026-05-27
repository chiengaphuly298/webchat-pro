import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-dark-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-dark-primary">
        <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { checkAuth } = useAuthStore();
  const { connect } = useSocketStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const token = useAuthStore.getState().token;
    if (token && useAuthStore.getState().isAuthenticated) {
      connect(token);
    }
  }, [connect]);

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="chat/:conversationId" element={<Chat />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;