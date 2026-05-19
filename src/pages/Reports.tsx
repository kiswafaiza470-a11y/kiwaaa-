import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Filter, 
  Calendar, 
  FileText, 
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  FileBarChart,
  Clock
} from 'lucide-react';
import { supabaseService, Transaction } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '../lib/utils';

export default function Reports() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchTransactions();
    const sub = supabaseService.subscribeToTransactions(fetchTransactions);
    return () => { sub.unsubscribe(); };
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseService.getTransactions();
      
      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }

      const rawData = data || [];
      // Filter by period
      const filtered = rawData.filter(t => {
        const d = new Date(t.date);
        return (d.getMonth() + 1) === filter.month && d.getFullYear() === filter.year;
      });
      setTransactions(filtered as Transaction[]);
    } catch (error) {
      console.error('Error in fetchTransactions reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const totals = transactions.reduce((acc, t) => {
    if (t.type === 'income') acc.income += t.amount;
    else acc.expense += t.amount;
    return acc;
  }, { income: 0, expense: 0 });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleExportPDF = () => {
    if (transactions.length === 0) {
      alert('Tidak ada data untuk dicetak.');
      return;
    }

    const doc = new jsPDF();
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const periodName = `${monthNames[filter.month - 1]} ${filter.year}`;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Replaced blue-800 with primary blue
    doc.text('Laporan KasKita Digital', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Periode Laporan: ${periodName}`, 14, 30);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 35);

    // Summary Box
    doc.setDrawColor(240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 45, 182, 35, 3, 3, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('RINGKASAN PERIODE:', 20, 52);
    
    doc.setTextColor(37, 99, 235);
    doc.text(`Total Pemasukan: ${formatCurrency(totals.income)}`, 20, 60);
    doc.setTextColor(15, 23, 42); // Replaced rose with slate-900 (deep blue-ish black)
    doc.text(`Total Pengeluaran: ${formatCurrency(totals.expense)}`, 20, 66);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(`Saldo Akhir Periode: ${formatCurrency(totals.income - totals.expense)}`, 20, 74);

    // Table
    const tableColumn = ['No', 'Tanggal', 'Tipe', 'Keterangan', 'Jumlah'];
    const tableRows = transactions.map((t, i) => [
      i + 1,
      new Date(t.date).toLocaleDateString('id-ID'),
      t.type === 'income' ? 'Masuk' : 'Keluar',
      t.type === 'income' ? (t.pembayar || t.description) : t.description,
      formatCurrency(t.amount)
    ]);

    autoTable(doc, {
      startY: 85,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      margin: { top: 85 }
    });

    // Footer
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Dicetak otomatis oleh Sistem KasKita - Halaman ${i}/${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`Laporan_KasKita_${periodName.replace(' ', '_')}.pdf`);
  };

  return (
    <div className="space-y-12 pb-16 relative">
      {/* Decorative background element */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-8"
      >
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2 leading-none">
            {isAdmin ? 'Financial Ledger' : 'Laporan Keuangan'}
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] ml-1 opacity-70">
            {isAdmin ? 'Automated Transparency Protocol' : 'Daftar riwayat keuangan transparan'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportPDF}
            className={cn(
              "px-8 py-5 text-white rounded-[2.5rem] font-extrabold uppercase tracking-widest text-[11px] flex items-center gap-4 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] transition-all",
              isAdmin ? "bg-slate-900 shadow-slate-900/40" : "bg-primary shadow-primary/30 hover:bg-primary-dark"
            )}
          >
            <div className="p-2 bg-white/20 rounded-xl">
              <FileBarChart size={20} strokeWidth={3} />
            </div>
            {isAdmin ? 'Export Full Ledger' : 'Unduh Laporan PDF'}
          </motion.button>
        </div>
      </motion.div>

      {/* Report Controls */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-12 flex flex-wrap items-center gap-12 border-white/60"
      >
        <div className="flex items-center gap-6">
           <div className="p-5 bg-primary/10 text-primary rounded-[1.75rem] shadow-inner border border-primary/5">
              <Calendar size={28} strokeWidth={2.5} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2 opacity-70">Selection Range</p>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">Period Filter</span>
           </div>
        </div>
        <div className="flex gap-5 flex-grow sm:flex-grow-0 ml-auto">
           <div className="relative group">
             <select 
               value={filter.month}
               onChange={(e) => setFilter({ ...filter, month: parseInt(e.target.value) })}
               className="appearance-none w-52 px-10 py-5 bg-slate-50/50 border-2 border-transparent rounded-[1.5rem] font-extrabold text-[11px] uppercase tracking-widest focus:bg-white focus:border-primary/10 focus:ring-4 focus:ring-primary/5 outline-none transition-all cursor-pointer text-slate-700"
             >
               {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                 <option key={i} value={i + 1}>{m}</option>
               ))}
             </select>
             <div className="absolute right-7 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                <Filter size={16} strokeWidth={3} />
             </div>
           </div>
           
           <div className="relative group">
             <select 
               value={filter.year}
               onChange={(e) => setFilter({ ...filter, year: parseInt(e.target.value) })}
               className="appearance-none w-36 px-10 py-5 bg-slate-50/50 border-2 border-transparent rounded-[1.5rem] font-extrabold text-[11px] uppercase tracking-widest focus:bg-white focus:border-primary/10 focus:ring-4 focus:ring-primary/5 outline-none transition-all cursor-pointer text-slate-700"
             >
               {Array.from({ length: (new Date().getFullYear() + 10) - 2020 + 1 }, (_, i) => 2020 + i).map(year => (
                 <option key={year} value={year}>{year}</option>
               ))}
             </select>
             <div className="absolute right-7 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                <Calendar size={16} strokeWidth={3} />
             </div>
           </div>
        </div>
      </motion.div>

      {/* Summary Recap Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
         <motion.div 
           whileHover={{ y: -10, scale: 1.02 }}
           className="glass-card p-12 border-white/60 bg-primary/10"
         >
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-primary/20">
                <ArrowUpRight size={24} strokeWidth={3} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Inbound</p>
            </div>
            <h3 className="text-4xl font-black text-primary tracking-tighter leading-none mb-2">
              {formatCurrency(totals.income).replace('Rp', '').trim()}
            </h3>
            <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest leading-none">Total IDR Collected</p>
         </motion.div>

         <motion.div 
           whileHover={{ y: -10, scale: 1.02 }}
           className="glass-card p-12 border-slate-700/10 bg-slate-900 shadow-2xl shadow-slate-900/20"
         >
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/40 border border-slate-700/50">
                <ArrowDownRight size={24} strokeWidth={3} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Outbound</p>
            </div>
            <h3 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">
              {formatCurrency(totals.expense).replace('Rp', '').trim()}
            </h3>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Total IDR Disbursed</p>
         </motion.div>

         <motion.div 
           whileHover={{ scale: 1.02 }}
           className="glass-card p-12 lg:col-span-2 relative overflow-hidden flex flex-col justify-between border-white/80"
         >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-2 h-8 bg-primary rounded-full shadow-lg shadow-primary/20" />
                <p className="text-slate-400 font-extrabold uppercase tracking-[0.35em] text-[10px] opacity-70">Net Liquid Capital</p>
              </div>
              <h3 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
                {formatCurrency(totals.income - totals.expense).replace('Rp', '').trim()}
              </h3>
            </div>
            <div className="mt-10 flex items-center gap-5 relative z-10">
               <div className="px-5 py-3 bg-white/50 backdrop-blur-sm rounded-[1.25rem] flex items-center gap-3 border border-white/80 shadow-sm">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">System Verified</span>
               </div>
               <div className="px-5 py-3 bg-white/50 backdrop-blur-sm rounded-[1.25rem] flex items-center gap-3 border border-white/80 shadow-sm">
                  <FileText size={16} className="text-primary" strokeWidth={3} />
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest opacity-60">Hash 0x82A...</span>
               </div>
            </div>
            {/* Background Graphic */}
            <div className="absolute -bottom-16 -right-16 opacity-[0.05] rotate-12 pointer-events-none group-hover:rotate-6 transition-transform duration-700">
               <FileBarChart size={320} strokeWidth={0.5} />
            </div>
         </motion.div>
      </div>

      {/* Detailed Table */}
      <div className="space-y-8">
         <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Activity Matrix</h3>
               <div className="w-2 h-2 bg-slate-300 rounded-full" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{transactions.length} Active Records</span>
            </div>
            <motion.button 
              whileHover={{ x: 5 }}
              className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3"
            >
              Scan For Anomalies <ArrowUpRight size={14} strokeWidth={3} />
            </motion.button>
         </div>
         
         <div className="card-modern p-0 overflow-hidden shadow-2xl shadow-slate-200/50 border-none bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Timestamp</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Identity / Narrative</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Magnitude</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-32">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Collating Report Data...</p>
                    </td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((t, idx) => (
                    <motion.tr 
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.5)" }}
                      className="group transition-colors"
                    >
                      <td className="px-12 py-7 font-black text-slate-400 text-[10px] uppercase tracking-widest whitespace-nowrap">
                        <div className="flex items-center gap-3">
                           <Clock size={14} className="text-slate-200" strokeWidth={3} />
                           {new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-12 py-7">
                        <p className="font-black text-slate-900 tracking-tight text-lg group-hover:text-primary transition-colors">
                          {t.type === 'income' ? (t.pembayar || t.description) : t.description}
                        </p>
                      </td>
                      <td className={`px-12 py-7 text-right font-black tracking-tighter text-xl ${t.type === 'income' ? 'text-primary' : 'text-slate-900'}`}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount).replace('Rp', '').trim()}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-40">
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-100">
                         <AlertCircle size={48} strokeWidth={1} />
                      </div>
                      <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-[10px]">No ledger activity detected for this cycle</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
         </div>
      </div>
    </div>
  );
}
