import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import { Link2, LayoutDashboard, Key, UserPlus, LogOut } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ border: '3px solid rgba(255, 255, 255, 0.1)', borderTop: '3px solid var(--accent-indigo)', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo-container">
          <Link2 size={24} style={{ strokeWidth: 3 }} />
          <span>Linklytics</span>
        </Link>
        <ul className="nav-links">
          <li>
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              Home
            </Link>
          </li>
          {user ? (
            <>
              <li>
                <Link to="/dashboard" className={`nav-link ${location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/analytics') ? 'active' : ''}`}>
                  Dashboard
                </Link>
              </li>
              <li>
                <button 
                  onClick={logout} 
                  className="btn btn-secondary btn-sm" 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.04)' }}
                >
                  <LogOut size={14} /> Log Out
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}>
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics/:id" 
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } 
            />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="footer">
          <div className="container">
            <p>&copy; {new Date().getFullYear()} Linklytics. Designed for premium link tracking.</p>
          </div>
        </footer>
      </Router>
    </AuthProvider>
  );
};

export default App;
