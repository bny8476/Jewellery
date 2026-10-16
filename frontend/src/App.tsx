import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import AuthCallback from './pages/AuthCallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import AdminErrorBoundary from './components/admin/AdminErrorBoundary';
import { BackToTopButton } from './components/BackToTopButton';
import { pageVariants } from './utils/motion';

// Lazy Load Secondary Public Pages
const Pawn = lazy(() => import('./pages/Pawn'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const LiveRates = lazy(() => import('./pages/LiveRates'));
const AuraGold = lazy(() => import('./pages/AuraGold'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));

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

  // Smooth scroll to top on non-hash route change
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      {showNavbar && <Navbar />}
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex-1"
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/jewelry/:id" element={<ProductDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              {/* Redirect /jewelry root to home page */}
              <Route path="/jewelry" element={<Navigate to="/" replace />} />
              <Route path="/pawn" element={<Pawn />} />
              <Route
                path="/admin/login"
                element={<AdminLogin />}
              />
              <Route
                path="/admin"
                element={
                  <AdminErrorBoundary>
                    <ProtectedRoute requireAdmin={true}>
                      <Admin />
                    </ProtectedRoute>
                  </AdminErrorBoundary>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <AdminErrorBoundary>
                    <ProtectedRoute requireAdmin={true}>
                      <Admin />
                    </ProtectedRoute>
                  </AdminErrorBoundary>
                }
              />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/live-rates" element={<LiveRates />} />
              <Route path="/shop" element={<Navigate to="/" replace />} />
              <Route path="/categories" element={<Navigate to="/#categories" replace />} />
              <Route path="/orders" element={<Navigate to="/dashboard?tab=orders" replace />} />
              <Route path="/my-loans" element={<Navigate to="/dashboard?tab=loans" replace />} />
              <Route path="/gold-wallet" element={<Navigate to="/dashboard?tab=vault" replace />} />
              <Route path="/transactions" element={<Navigate to="/dashboard?tab=transactions" replace />} />
              <Route path="/help" element={<Navigate to="/#footer" replace />} />
              <Route path="/support" element={<Navigate to="/#footer" replace />} />
              <Route path="/auragold" element={<AuraGold />} />
              <Route path="/aura-gold" element={<Navigate to="/auragold" replace />} />
              <Route path="/digital-gold" element={<Navigate to="/auragold" replace />} />
              {/* Catch-all fallback route to prevent blank pages on mistyped or deep URLs */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </Suspense>
      <BackToTopButton />
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
