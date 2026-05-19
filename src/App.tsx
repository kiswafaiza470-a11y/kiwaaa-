import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/app/user/dashboard" />;
  return <>{children}</>;
};

const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const LoadingSpinner = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-white relative overflow-hidden">
    {/* Subtle Background Elements */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
    <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-blue-50 rounded-full blur-[80px]" />
    
    <div className="relative z-10 flex flex-col items-center gap-8">
      <div className="relative">
        {/* Pulsing Sonar Effect */}
        <motion.div 
          animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 bg-primary/20 rounded-3xl"
        />
        <motion.div 
          animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
          className="absolute inset-0 bg-primary/20 rounded-3xl"
        />
        
        {/* Main Icon Container */}
        <motion.div 
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-primary/40 relative z-10"
        >
          <ShieldCheck size={36} strokeWidth={2.5} />
        </motion.div>
      </div>

      <div className="text-center space-y-3">
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center justify-center gap-1">
            KasKita
            <span className="w-2 h-2 bg-primary rounded-full" />
          </h2>
        </motion.div>
        
        <div className="flex flex-col items-center gap-4">
          <motion.p 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1"
          >
            Sinkronisasi Data Real-time
          </motion.p>
          
          {/* Subtle Progress Line */}
          <div className="w-32 h-[2px] bg-slate-100 rounded-full overflow-hidden relative">
            <motion.div 
              animate={{ x: [-128, 128] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full bg-primary"
            />
          </div>
        </div>
      </div>
    </div>

    {/* Footer Detail */}
    <div className="absolute bottom-12 left-0 w-full text-center">
      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
        Protected by Enterprise-grade Encryption
      </p>
    </div>
  </div>
);

function AppRoutes() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? (isAdmin ? <Navigate to="/app/admin/dashboard" /> : <Navigate to="/app/user/dashboard" />) : <LoginPage />} />
      
      {/* Admin App */}
      <Route path="/app/admin" element={<AdminRoute><Layout /></AdminRoute>}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pemasukan" element={<Transactions type="income" />} />
        <Route path="pengeluaran" element={<Transactions type="expense" />} />
        <Route path="laporan" element={<Reports />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* User App */}
      <Route path="/app/user" element={<UserRoute><Layout /></UserRoute>}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pemasukan" element={<Transactions type="income" />} />
        <Route path="pengeluaran" element={<Transactions type="expense" />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
