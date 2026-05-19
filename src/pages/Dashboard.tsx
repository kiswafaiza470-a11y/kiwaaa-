import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  ShieldCheck,
  Zap,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService, Transaction, Profile } from '../services/supabaseService';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const userDisplay = {
    nama: profile?.nama || user?.user_metadata?.nama || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
    photo: profile?.photo_url || user?.user_metadata?.avatar_url || user?.user_metadata?.photo_url
  };

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    monthlyIncome: 0,
    monthlyExpense: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: transactions, error } = await supabaseService.getTransactions();
        
        if (error) {
          console.error('Error fetching dashboard data:', error);
          return;
        }

        if (transactions) {
          calculateStats(transactions as Transaction[]);
          setRecentTransactions((transactions as Transaction[]).slice(0, 5));
        }

        if (isAdmin) {
          setLoadingMembers(true);
          const { data: profiles } = await supabaseService.getAllProfiles();
          if (profiles) {
            setMembers(profiles as Profile[]);
          }
          setLoadingMembers(false);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up Realtime
    const subscription = supabaseService.subscribeToTransactions(() => {
      fetchData(); // Simple re-fetch for now to ensure all stats update
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [imageError, setImageError] = useState(false);

  const calculateStats = (transactions: Transaction[]) => {
    let income = 0;
    let expense = 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let mIncome = 0;
    let mExpense = 0;

    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      const tDate = new Date(t.date);
      const isCurrentMonth = tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;

      if (t.type === 'income') {
        income += amount;
        if (isCurrentMonth) mIncome += amount;
      } else {
        expense += amount;
        if (isCurrentMonth) mExpense += amount;
      }
    });

    setStats({
      totalBalance: income - expense,
      totalIncome: income,
      totalExpense: expense,
      monthlyIncome: mIncome,
      monthlyExpense: mExpense
    });
  };

  const handleDownloadRecap = async () => {
    try {
      const { data, error } = await supabaseService.getTransactions();
      if (error) throw error;
      if (!data || data.length === 0) {
        alert('Tidak ada data transaksi untuk diunduh.');
        return;
      }

      // Inisialisasi PDF
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });

      // Header PDF
      doc.setFontSize(22);
      doc.setTextColor(30, 64, 175); // Blue-800
      doc.text('KasKita - Laporan Kas', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Dicetak pada: ${today}`, 14, 30);
      doc.text(`Dicetak oleh: ${userDisplay.nama}`, 14, 35);

      // Ringkasan Saldo
      doc.setDrawColor(240);
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.roundedRect(14, 42, 182, 30, 3, 3, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text('RINGKASAN SALDO', 20, 52);
      
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text(formatCurrency(stats.totalBalance), 20, 62);

      // Tabel Transaksi
      const tableColumn = ['No', 'Tanggal', 'Tipe', 'Keterangan', 'Kategori', 'Jumlah'];
      const tableRows: any[] = [];

      data.forEach((t, index) => {
        const transactionData = [
          index + 1,
          new Date(t.date).toLocaleDateString('id-ID'),
          t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
          t.type === 'income' ? (t.pembayar || t.description) : t.description,
          t.category || 'Umum',
          formatCurrency(t.amount)
        ];
        tableRows.push(transactionData);
      });

      autoTable(doc, {
        startY: 80,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { 
          fillColor: [37, 99, 235], // Blue-600
          textColor: 255, 
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { top: 80 },
      });

      // Footer
      const pageCount = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Halaman ${i} dari ${pageCount} - KasKita Digital Bendahara`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Download PDF
      doc.save(`Rekap_KasKita_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error downloading recap:', error);
      alert('Gagal mengunduh rekap. Silakan coba lagi.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-10 relative">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-200/50 pb-8"
      >
        <div className="flex items-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
            {userDisplay.photo && !imageError ? (
              <motion.div className="relative w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-blue-100 flex items-center justify-center ring-8 ring-primary/5">
                <motion.img 
                  key={userDisplay.photo}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  src={`${userDisplay.photo}?t=${Date.now()}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              </motion.div>
            ) : (
              <div className={cn(
                "relative w-24 h-24 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-2xl shrink-0 ring-8 ring-primary/5",
                isAdmin ? "bg-slate-900" : "bg-primary"
              )}>
                {(userDisplay.nama || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
                Hi, {userDisplay.nama.split(' ')[0]}
              </h1>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "px-5 py-2 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg flex items-center gap-2",
                  isAdmin ? "bg-slate-900 text-white" : "bg-primary/10 text-primary border border-primary/20 backdrop-blur-md"
                )}
              >
                {isAdmin ? <ShieldCheck size={14} strokeWidth={2.5} /> : <Zap size={14} strokeWidth={2.5} className="fill-primary" />}
                {isAdmin ? 'System Admin' : 'Verified User'}
              </motion.div>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.25em] text-[11px] flex items-center gap-3">
               <span>Balance Overview</span>
               <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
               <span>{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 px-6 py-4 bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-sm transition-all hover:shadow-xl cursor-default"
          >
            <Calendar size={20} className="text-primary" />
            <span className="text-sm font-bold text-slate-600">
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
             "stat-card md:col-span-1 lg:col-span-2 group min-h-[320px] flex flex-col justify-center",
             isAdmin ? "bg-slate-900 text-white border-slate-800" : "bg-white overflow-hidden p-0"
          )}
        >
          {/* Internal gradient layer for the large card if not admin */}
          {!isAdmin && (
            <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
          )}
          
          <div className="relative z-10 px-12">
            <div className="flex items-center justify-between mb-10">
            <div className={cn(
              "w-16 h-16 rounded-3xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110",
              isAdmin ? "bg-white/10 border-white/20 text-white" : "bg-primary text-white border-primary/20 shadow-2xl shadow-primary/40"
            )}>
              <Wallet size={32} strokeWidth={2} />
            </div>
              <div className="flex flex-col items-end">
                  <p className={cn(
                      "font-black uppercase tracking-[0.3em] text-[11px] mb-1 opacity-40",
                      isAdmin ? "text-white" : "text-slate-900"
                  )}>
                    {isAdmin ? 'ESTIMATED POOL' : 'CURRENT BALANCE'}
                  </p>
                  <p className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <TrendingUp size={14} /> +2.4% this month
                  </p>
              </div>
            </div>
            
            <h2 className={cn(
                "text-7xl font-extrabold tracking-tighter transition-all duration-700 group-hover:tracking-normal",
                isAdmin ? "text-white" : "text-slate-900"
            )}>
              {formatCurrency(stats.totalBalance)}
            </h2>
            
            <div className="mt-12 flex items-center gap-10">
                <div className="flex flex-col">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Flow</p>
                    <p className={cn("text-lg font-bold", isAdmin ? "text-white" : "text-slate-900")}>
                        {formatCurrency(stats.totalIncome + stats.totalExpense)}
                    </p>
                </div>
                <div className="w-[1px] h-10 bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex flex-col">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entries</p>
                    <p className={cn("text-lg font-bold", isAdmin ? "text-white" : "text-slate-900")}>
                        {recentTransactions.length}+ Records
                    </p>
                </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000 pointer-events-none">
            <Zap size={400} strokeWidth={1} />
          </div>
        </motion.div>

        <div className="flex flex-col gap-8">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="stat-card flex-1 border-l-4 border-l-emerald-500"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                  <ArrowUpRight size={24} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">MONTHLY</span>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-2 text-right">Income</p>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 text-right">
                {formatCurrency(stats.monthlyIncome)}
              </h2>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="stat-card flex-1 border-l-4 border-l-rose-500"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                  <ArrowDownRight size={24} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md uppercase tracking-wider">MONTHLY</span>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-2 text-right">Expenses</p>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 text-right">
                {formatCurrency(stats.monthlyExpense)}
              </h2>
            </motion.div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-12 pt-4">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 space-y-10">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recent Activity</h3>
              <p className="text-sm font-semibold text-slate-400 mt-1">Live tracking and updates</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(isAdmin ? '/app/admin/laporan' : '/app/user/laporan')}
              className="text-xs font-bold text-primary px-5 py-3 bg-primary/5 rounded-2xl hover:bg-primary/10 transition-all border border-primary/10"
            >
              View All History
            </motion.button>
          </div>
          
          <div className="glass-card p-4 overflow-hidden">
            <div className="space-y-2">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((t, i) => (
                  <motion.div 
                    key={t.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ x: 6 }}
                    className="flex items-center justify-between p-7 bg-white/50 hover:bg-white rounded-[2rem] transition-all cursor-pointer group border border-transparent hover:border-slate-100/50 hover:shadow-xl hover:shadow-primary/5"
                  >
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110",
                        t.type === 'income' ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-900 text-white shadow-slate-900/20'
                      )}>
                        {t.type === 'income' ? <TrendingUp size={26} /> : <TrendingDown size={26} />}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 tracking-tight text-xl leading-tight mb-2">
                          {t.type === 'income' ? (t.pembayar || t.description) : t.description}
                        </p>
                        <div className="flex items-center gap-4">
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                            <Calendar size={14} className="opacity-40" />
                            {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                          <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg",
                            t.type === 'income' ? 'bg-blue-50 text-primary' : 'bg-slate-50 text-slate-500'
                          )}>
                            {t.category || t.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-extrabold text-2xl tracking-tighter",
                        t.type === 'income' ? 'text-primary' : 'text-slate-900'
                      )}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount).replace('Rp', '').trim()}
                      </p>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Confirmed</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-24 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center">
                   <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mb-6 text-slate-300">
                      <Clock size={40} />
                   </div>
                   <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">Awaiting transactions</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Actions/Infos */}
        <div className="space-y-10">
          {isAdmin && (
            <div className="space-y-10">
              <div className="px-2">
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Members</h3>
                <p className="text-sm font-semibold text-slate-400 mt-1">Personnel registered in the grid</p>
              </div>
              <div className="glass-card p-8 space-y-6">
                {loadingMembers ? (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : members.length > 0 ? (
                  <div className="space-y-6">
                    {members.slice(0, 6).map((member, i) => (
                      <motion.div 
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-4 group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-slate-900/5 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm ring-4 ring-slate-50 group-hover:ring-primary/10 transition-all">
                          {member.photo_url ? (
                            <img src={member.photo_url} alt={member.nama} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-black text-primary">{(member.nama || 'U').charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{member.nama}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
                        </div>
                        {member.role === 'admin' && (
                          <ShieldCheck size={14} className="text-slate-900 opacity-20" />
                        )}
                      </motion.div>
                    ))}
                    {members.length > 6 && (
                      <button 
                        onClick={() => navigate('/app/admin/anggota')}
                        className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all"
                      >
                        View All {members.length} Members
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest">No members found</p>
                )}
              </div>
            </div>
          )}

          <div className="px-2">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Resources</h3>
            <p className="text-sm font-semibold text-slate-400 mt-1">Tools and exported summaries</p>
          </div>
          
          <motion.div 
            whileHover={{ y: -8 }}
            className="glass-card p-12 bg-slate-900 text-white border-slate-800 shadow-2xl relative overflow-hidden group min-h-[460px] flex flex-col"
          >
              <div className="relative z-10 flex-1">
                <div className="flex items-center gap-4 mb-12">
                   <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/40">
                      <TrendingUp size={24} className="text-white" />
                   </div>
                   <div className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">
                      Verified Report
                   </div>
                </div>
                
                <h4 className="text-4xl font-extrabold tracking-tight mb-8 leading-tight">
                    Generate <span className="text-primary">Executive Summary</span>
                </h4>
                <p className="text-slate-400 text-base font-medium leading-relaxed mb-12 opacity-80">
                  Export your class financial statements including flow charts and verified categories in a single PDF.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-12">
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Format</p>
                        <p className="text-sm font-bold text-white">Adobe PDF</p>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Access</p>
                        <p className="text-sm font-bold text-white">Full Rights</p>
                    </div>
                </div>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownloadRecap}
                className="w-full py-5 bg-primary text-white rounded-2xl font-bold tracking-tight hover:bg-primary-dark transition-all flex items-center justify-center gap-3 shadow-2xl shadow-primary/40 text-sm"
              >
                Export Report
                <ArrowDownRight size={20} strokeWidth={3} />
              </motion.button>
              
              {/* Decorative graphic */}
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-1000 pointer-events-none">
                <ShieldCheck size={380} strokeWidth={1} />
              </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
