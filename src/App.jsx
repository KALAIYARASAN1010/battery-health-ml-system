import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import AdminPanel from './pages/AdminPanel';
import { getSession } from './lib/auth';

function ProtectedRoute({ children, requiredRole }) {
  const session = getSession();

  if (!session?.token || !session?.user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return <Navigate to={session.user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
}

function App() {
  const session = getSession();
  const defaultPath = session?.user?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden font-sans">
      {/* Bright Global Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 opacity-100"></div>
        {/* Colorful subtle geometric shapes for attraction */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-r from-cyan-300/30 to-blue-300/30 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-l from-purple-300/30 to-pink-300/30 blur-[120px]"></div>

        {/* Soft Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e144_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e144_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* App Content */}
      <div className="relative z-10 h-full w-full">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to={session?.token ? defaultPath : '/login'} replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={(
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/admin"
              element={(
                <ProtectedRoute requiredRole="admin">
                  <AdminPanel />
                </ProtectedRoute>
              )}
            />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
