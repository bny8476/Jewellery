import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AuthCallback from './pages/AuthCallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import { WhatsAppButton } from './components/WhatsAppButton';

// Lazy Load Pages
const Pawn = lazy(() => import('./pages/Pawn'));
const Admin = lazy(() => import('./pages/Admin'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--gold-primary)] border-t-transparent mx-auto mb-3" />
      <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">Loading Portal</p>
    </div>
  </div>
);

function AppContent() {
  const location = useLocation();
  const showNavbar = !['/login', '/auth/callback'].includes(location.pathname) && !location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      {showNavbar && <Navbar />}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* Redirect /jewelry to home page since it's now combined */}
          <Route path="/jewelry" element={<Navigate to="/" replace />} />
          <Route path="/pawn" element={<Pawn />} />
          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </Suspense>
      <WhatsAppButton />
    </div>
  );
}

import { ThemeProvider, useTheme } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { RateProvider } from './context/RateContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ThemedToastContainer() {
  const { theme } = useTheme();
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme}
    />
  );
}

function App() {
  return (
    <ThemeProvider>
      <ThemedToastContainer />
      <AuthProvider>
        <RateProvider>
          <WishlistProvider>
            <CartProvider>
              <Router>
                <AppContent />
              </Router>
            </CartProvider>
          </WishlistProvider>
        </RateProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
