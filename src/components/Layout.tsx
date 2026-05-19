import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  FileText, 
  Users, 
  UserCircle,
  LogOut,
  Menu,
  Zap,
  ShieldCheck,
  TrendingUp,
  Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Layout() {
  const { profile, isAdmin, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userDisplay = {
    nama: profile?.nama || user?.user_metadata?.nama || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
    username: profile?.username || user?.user_metadata?.username || 'user',
    photo: profile?.photo_url || user?.user_metadata?.avatar_url || user?.user_metadata?.photo_url,
    role: profile?.role || 'User'
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await supabase.auth.signOut();
    navigate('/');
  };

  const profilePath = isAdmin ? '/app/admin/profile' : '/app/user/profile';
  const prefix = isAdmin ? '/app/admin' : '/app/user';

  const navItems = [
    { label: 'Beranda', path: '/', icon: Zap },
    { 
      label: 'Dashboard', 
      path: isAdmin ? '/app/admin/dashboard' : '/app/user/dashboard', 
      icon: LayoutDashboard 
    },
    { label: isAdmin ? 'Audit Pemasukan' : 'Pemasukan', path: `${prefix}/pemasukan`, icon: ArrowUpCircle },
    { label: isAdmin ? 'Audit Pengeluaran' : 'Pengeluaran', path: `${prefix}/pengeluaran`, icon: ArrowDownCircle },
    ...(isAdmin ? [
      { label: 'Laporan Kas', path: '/app/admin/laporan', icon: FileText },
      { label: 'Anggota', path: '/app/admin/users', icon: Users },
    ] : []),
    { label: 'Settings', path: profilePath, icon: Settings },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden" onClick={() => isProfileOpen && setIsProfileOpen(false)}>
      {/* Decorative Atmospheric Blur */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-400/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none z-0"></div>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 glass-sidebar z-50 transition-transform duration-500 ease-out lg:translate-x-0 lg:static",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-8">
          <div className="flex items-center gap-4 mb-14 px-1 cursor-pointer group" onClick={() => navigate('/')}>
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all duration-500 group-hover:rotate-6",
              isAdmin ? "bg-slate-900 shadow-slate-900/30" : "bg-primary shadow-primary/30"
            )}>
              {isAdmin ? <ShieldCheck size={26} strokeWidth={2} /> : <Zap size={26} strokeWidth={2} />}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-none">KasKita</h1>
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-[0.15em] leading-none mt-1.5 opacity-60",
              )}>
                {isAdmin ? 'ADMIN PORTAL' : 'MEMBER HUB'}
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-4">Main Menu</p>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "sidebar-link",
                    isActive ? "sidebar-link-active" : "sidebar-link-inactive"
                  )}
                >
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                  <span className="text-[14px]">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6">
            <div className="p-5 bg-white/40 border border-white/60 rounded-3xl backdrop-blur-sm shadow-sm">
               <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0 border border-primary/20">
                      {userDisplay.photo ? (
                        <img 
                          key={userDisplay.photo}
                          src={`${userDisplay.photo}?t=${Date.now()}`} 
                          alt="Profile" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-base uppercase">{(userDisplay.nama || '?').charAt(0)}</span>
                      )}
                    </div>
                  <div className="min-w-0">
                     <p className="text-sm font-bold text-slate-800 truncate leading-tight">{userDisplay.nama}</p>
                     <p className="text-[11px] font-semibold text-slate-400 truncate tracking-wide">{isAdmin ? 'Administrator' : 'Active Member'}</p>
                  </div>
               </div>
               <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900/5 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-2xl transition-all text-xs font-bold"
              >
                <LogOut size={14} strokeWidth={2.5} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <header className="h-24 bg-white/40 backdrop-blur-xl border-b border-white/40 sticky top-0 z-40 flex items-center justify-between px-8 lg:px-12">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-3 -ml-2 text-slate-500 lg:hidden hover:bg-white/60 rounded-2xl transition-all shadow-sm"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex flex-col">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">
                {navItems.find(i => location.pathname === i.path)?.label || 'Overview'}
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isAdmin ? 'Auth Tier: System Admin' : 'Status: Connected'}</span>
              </div>
            </div>
          </div>

            <div className="flex items-center gap-5">
              <div className="flex flex-col text-right hidden sm:flex">
                <p className="text-sm font-bold text-slate-900 leading-none mb-1">{userDisplay.nama}</p>
                <button 
                  onClick={() => navigate(profilePath)}
                  className="text-[10px] font-bold text-primary hover:text-primary-dark transition-colors uppercase tracking-widest"
                >
                  Manage Account
                </button>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileOpen(!isProfileOpen);
                }}
                className="w-12 h-12 rounded-2xl shadow-xl shadow-primary/10 border-2 border-white ring-4 ring-primary/5 flex items-center justify-center text-primary font-bold text-lg overflow-hidden shrink-0 transition-all hover:scale-105 active:scale-95"
              >
                {userDisplay.photo ? (
                  <img 
                    key={userDisplay.photo}
                    src={`${userDisplay.photo}?t=${Date.now()}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="uppercase">{(userDisplay.nama || '?').charAt(0)}</span>
                )}
              </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  className="absolute top-full right-0 mt-4 w-56 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white p-3 z-50"
                >
                   <Link 
                    to={profilePath}
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3.5 p-4 text-slate-700 hover:bg-primary hover:text-white rounded-2xl transition-all duration-300 group"
                   >
                     <UserCircle size={20} className="opacity-60 group-hover:opacity-100" />
                     <span className="text-sm font-bold">My Profile</span>
                   </Link>
                   <button 
                    onClick={handleLogout}
                    className="w-full mt-1 flex items-center gap-3.5 p-4 text-rose-600 hover:bg-rose-500 hover:text-white rounded-2xl transition-all duration-300 group"
                   >
                     <LogOut size={20} className="opacity-60 group-hover:opacity-100" />
                     <span className="text-sm font-bold">Sign Out</span>
                   </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-8 lg:p-12 relative z-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

