import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthPage } from './components/auth/AuthPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ShopkeeperDashboard } from './components/shopkeeper/ShopkeeperDashboard';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { ShopView } from './components/customer/ShopView';
import { Header } from './components/layout/Header';
import { useAuthStore } from './stores/authStore';
import { supabase } from './lib/supabase';

function App() {
  const { user, role, setUser, setRole, setLoading } = useAuthStore();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setRole(session?.user?.user_metadata?.role ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setRole(session?.user?.user_metadata?.role ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setRole, setLoading]);

  const renderDashboard = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard />;
      case 'shopkeeper':
        return <ShopkeeperDashboard />;
      case 'customer':
        return <CustomerDashboard />;
      default:
        return <Navigate to="/auth" replace />;
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        
        <Routes>
          <Route path="/shop/:shopId" element={<ShopView />} />
          <Route
            path="/auth"
            element={!user ? <AuthPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/dashboard"
            element={
              user ? (
                <>
                  <Header />
                  {renderDashboard()}
                </>
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;