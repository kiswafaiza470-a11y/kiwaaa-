import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Trash2, 
  Edit3,
  X,
  Calendar,
  AlertCircle,
  Clock,
  Camera,
  Image as ImageIcon,
  ShieldCheck
} from 'lucide-react';
import { supabaseService, Transaction } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface TransactionsProps {
  type?: 'income' | 'expense';
}

export default function Transactions({ type }: TransactionsProps) {
  const { user, profile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    type: type || 'income',
    amount: '',
    description: '',
    category: '',
    pembayar: '',
    photo_url: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [tempFile, setTempFile] = useState<File | null>(null);

  useEffect(() => {
    fetchTransactions();
    const subscription = supabaseService.subscribeToTransactions(() => {
      fetchTransactions();
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [type]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      console.log('Fetching transactions for type:', type);
      const { data, error } = await supabaseService.getTransactions();
      
      if (error) {
        console.error('Error fetching transactions:', error);
        setErrorMessage('Gagal memuat data transaksi: ' + error.message);
        return;
      }
      
      console.log('Total data from DB:', data?.length);
      if (data && data.length > 0) {
        console.log('Sample transaction type:', data[0].type);
        console.log('Active filter type:', type);
      }
      
      // Gunakan pembersihan string agar tidak ada spasi atau beda huruf besar/kecil
      const filtered = type 
        ? (data || []).filter(t => {
            const tType = (t.type || '').trim().toLowerCase();
            const filterType = type.trim().toLowerCase();
            return tType === filterType;
          }) 
        : (data || []);
      
      console.log('Filtered result count:', filtered.length);
      setTransactions(filtered as Transaction[]);
    } catch (error) {
      console.error('Error in fetchTransactions:', error);
      setErrorMessage('Terjadi kesalahan saat memuat data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (t?: Transaction) => {
    setErrorMessage(null);
    if (t) {
      setFormData({
        type: t.type,
        amount: t.amount.toString(),
        description: t.description,
        category: t.category,
        pembayar: t.pembayar || '',
        photo_url: t.photo_url || '',
        date: t.date
      });
      setTempFile(null);
      setEditingId(t.id);
    } else {
      setFormData({
        type: type || 'income',
        amount: '',
        description: '',
        category: '',
        pembayar: '',
        photo_url: '',
        date: new Date().toISOString().split('T')[0]
      });
      setTempFile(null);
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('Sesi anda telah berakhir. Silakan login kembali.');
      return;
    }

    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('Jumlah harus berupa angka yang valid dan lebih dari 0');
      return;
    }

    // Pastikan type sesuai dengan prop yang dipassing atau pilihan form
    const currentType = type || formData.type;

    try {
      setSubmitting(true);
      
      let finalPhotoURL = formData.photo_url;
      if (tempFile) {
        finalPhotoURL = await supabaseService.uploadTransactionPhoto(tempFile);
      }

      const payload: any = {
        type: currentType as 'income' | 'expense',
        amount: amountNum,
        description: currentType === 'income' ? `Pemasukan dari ${formData.pembayar || 'Seseorang'}` : formData.description,
        category: 'Umum',
        date: formData.date,
        photo_url: finalPhotoURL
      };

      if (currentType === 'income') {
        payload.pembayar = formData.pembayar;
      }

      const { error } = editingId 
        ? await supabaseService.updateTransaction(editingId, payload)
        : await supabaseService.addTransaction(payload);

      if (error) {
        console.error('Error saving transaction:', error);
        
        if (error.message?.includes('check constraint') || error.message?.includes('transactions_type_check')) {
          setErrorMessage('Database belum sinkron. Silakan jalankan perintah SQL di file "supabase_schema.sql" pada SQL Editor Supabase.');
        } else if (error.message?.includes('photo_url') || error.message?.includes('column')) {
          setErrorMessage('Fitur Foto/Database belum aktif. Kamu WAJIB copy isi "supabase_schema.sql" dan jalankan di SQL Editor Supabase agar fitur ini bisa berjalan.');
        } else if (error.message?.includes('user_id') && error.message?.includes('null value')) {
          setErrorMessage('Error database: Kolom "user_id" tidak boleh kosong. Silakan coba simpan sekali lagi.');
        } else if (error.message?.includes('column "pembayar"')) {
          setErrorMessage('Database belum di-update. Silakan jalankan SQL terbaru di file supabase_schema.sql.');
        } else {
          setErrorMessage('Error: ' + (error.message || 'Gagal menyimpan.'));
        }
        return;
      }

      setShowModal(false);
      await fetchTransactions();
    } catch (error: any) {
      setErrorMessage('Terjadi kesalahan: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini?')) return;
    
    try {
      setLoading(true);
      const { error } = await supabaseService.deleteTransaction(id);
      
      if (error) {
        console.error('Error deleting transaction:', error);
        if (error.message.includes('permission') || error.message.includes('policy')) {
          setErrorMessage('Izin ditolak. Anda hanya bisa menghapus transaksi yang Anda buat sendiri.');
        } else {
          setErrorMessage('Gagal menghapus: ' + error.message);
        }
      } else {
        await fetchTransactions();
      }
    } catch (error: any) {
      console.error('Error in handleDelete:', error);
      setErrorMessage('Terjadi kesalahan saat menghapus data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Ukuran foto terlalu besar. Maksimal 2MB.');
        return;
      }
      setTempFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.pembayar && t.pembayar.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTitle = () => {
    if (type === 'income') return 'Pemasukan Kas';
    if (type === 'expense') return 'Pengeluaran Kas';
    return 'Riwayat Transaksi';
  };

  const getSubtitle = () => {
    if (type === 'income') return 'Daftar penyetor uang kas kelas.';
    if (type === 'expense') return 'Daftar belanja dan biaya operasional.';
    return 'Catat setiap pemasukan dan pengeluaran kas kelas.';
  };

  return (
    <div className="space-y-12 pb-16 relative">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse" />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-8"
      >
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2 leading-none">{getTitle()}</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] ml-1 opacity-70">{getSubtitle()}</p>
        </div>
        {!isAdmin && (
          <motion.button 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal()}
            className={cn(
              "px-8 py-5 text-white rounded-[2rem] font-extrabold uppercase tracking-widest text-[11px] flex items-center justify-center gap-4 shadow-2xl transition-all",
              isAdmin ? "bg-slate-900 shadow-slate-900/40" : "bg-primary shadow-primary/30 hover:bg-primary-dark"
            )}
          >
            <div className="p-2 bg-white/20 rounded-xl">
              <Plus size={20} strokeWidth={3} />
            </div>
            {isAdmin ? 'Forge Entry' : `Register ${type === 'income' ? 'Entry' : type === 'expense' ? 'Exit' : 'Record'}`}
          </motion.button>
        )}
      </motion.div>

      {/* Filter & Search Bar */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-wrap items-center gap-6 py-6 px-10 glass-card border-white/60"
      >
        <div className="flex-1 min-w-[300px] relative group">
          <Search size={22} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" strokeWidth={3} />
          <input 
            type="text" 
            placeholder="Query records..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-slate-50/50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-primary/10 focus:ring-4 focus:ring-primary/5 transition-all font-bold text-slate-700 placeholder:text-slate-300 uppercase tracking-widest text-xs"
          />
        </div>
        <motion.button 
          whileHover={{ x: 5 }}
          className="px-8 py-5 bg-slate-100/50 text-slate-400 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-slate-900 hover:text-white transition-all"
        >
          <Filter size={18} strokeWidth={3} />
          Advanced Query
        </motion.button>
      </motion.div>

      {/* Table Section */}
      <div className="glass-card overflow-hidden border-white/60 p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-white/60">
                <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Type</th>
                <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  {type === 'income' ? 'Source Designation' : type === 'expense' ? 'Narrative' : 'Transaction Info'}
                </th>
                <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Timestamp</th>
                <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Magnitude</th>
                {!isAdmin && <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Operations</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-40">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full mx-auto mb-8"
                    ></motion.div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Synchronizing Ledger Protocol...</p>
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((t, i) => (
                  <motion.tr 
                    key={t.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}
                    className="group transition-colors"
                  >
                    <td className="px-12 py-7">
                       <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform border-4 border-white ${
                         t.type === 'income' ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-900 text-white shadow-slate-900/20'
                       }`}>
                         {t.type === 'income' ? <TrendingUp size={24} strokeWidth={3} /> : <TrendingDown size={24} strokeWidth={3} />}
                       </div>
                    </td>
                    <td className="px-12 py-7">
                      <div className="flex items-center gap-6">
                        <p className="font-extrabold text-slate-900 leading-tight tracking-tight text-xl group-hover:text-primary transition-colors">
                          {t.type === 'income' ? (t.pembayar || t.description) : t.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-12 py-7">
                       <div className="flex items-center gap-3 text-slate-400 font-bold text-xs uppercase tracking-widest opacity-70">
                          <Clock size={16} className="text-slate-200" strokeWidth={3} />
                          {new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                       </div>
                    </td>
                    <td className="px-12 py-7 text-right whitespace-nowrap">
                      <span className={`font-black tracking-tighter text-2xl ${t.type === 'income' ? 'text-primary' : 'text-slate-900'}`}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount).replace('Rp', '').trim()}
                      </span>
                    </td>
                    {!isAdmin && (
                      <td className="px-12 py-7">
                        <div className="flex items-center justify-center gap-4">
                          <motion.button 
                            whileHover={{ scale: 1.1, backgroundColor: "white", color: "#2563eb" }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleOpenModal(t)}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl glass-card text-slate-300 transition-all border-white/60"
                          >
                            <Edit3 size={20} strokeWidth={3} />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1, backgroundColor: "#fff1f2", color: "#e11d48" }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(t.id)}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl glass-card text-slate-300 transition-all border-white/60"
                          >
                            <Trash2 size={20} strokeWidth={3} />
                          </motion.button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-40">
                     <div className="w-32 h-32 bg-slate-50/50 rounded-full flex items-center justify-center mx-auto mb-10 text-slate-200">
                        <AlertCircle size={64} strokeWidth={1} />
                     </div>
                     <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-[10px] mb-10">No entropy matching records detected</p>
                     <motion.button 
                       whileHover={{ y: -5 }}
                       whileTap={{ scale: 0.95 }}
                       onClick={fetchTransactions}
                       className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-extrabold text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20"
                     >
                       Re-Sync Database
                     </motion.button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal content refactored below */}

      {/* Transaction Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(30,41,59,0.3)] overflow-hidden"
            >
              <div className="px-12 py-10 bg-slate-900 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-3xl font-black tracking-tighter leading-none mb-3">
                    {editingId ? 'Update' : 'Register'} {formData.type === 'income' ? 'Entry' : 'Exit'}
                  </h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-80">
                    Secure Data Record Protocol V2.0
                  </p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="absolute top-10 right-10 w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all group z-20"
                >
                  <X size={24} className="group-hover:rotate-90 transition-transform" />
                </button>
                {/* Background Decor */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              </div>

              <form onSubmit={handleSubmit} className="p-12 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 bg-rose-50 border-2 border-rose-100 rounded-[1.5rem]"
                  >
                    <div className="flex items-center gap-3 text-rose-600 text-xs font-black mb-2 uppercase tracking-widest">
                      <AlertCircle size={20} strokeWidth={3} />
                      Operation Failed
                    </div>
                    <p className="text-rose-500 text-[11px] font-bold leading-relaxed">
                      {errorMessage}
                    </p>
                  </motion.div>
                )}
                
                {!type && (
                  <div className="grid grid-cols-2 gap-5 p-2 bg-slate-50 rounded-[2rem]">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      disabled={submitting}
                      onClick={() => setFormData({ ...formData, type: 'income' })}
                      className={`py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all ${
                        formData.type === 'income' 
                        ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                        : 'bg-transparent text-slate-400'
                      }`}
                    >
                      <TrendingUp size={18} strokeWidth={3} />
                      Income
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      disabled={submitting}
                      onClick={() => setFormData({ ...formData, type: 'expense' })}
                      className={`py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all ${
                        formData.type === 'expense' 
                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' 
                        : 'bg-transparent text-slate-400'
                      }`}
                    >
                      <TrendingDown size={18} strokeWidth={3} />
                      Expense
                    </motion.button>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Amount in IDR</label>
                    <input 
                      type="number" 
                      required
                      disabled={submitting}
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="Enter numeric value"
                      className="input-modern"
                    />
                  </div>

                  {formData.type === 'income' ? (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Payer Identity</label>
                      <input 
                        type="text" 
                        required
                        disabled={submitting}
                        value={formData.pembayar}
                        onChange={(e) => setFormData({ ...formData, pembayar: e.target.value })}
                        placeholder="Full Name"
                        className="input-modern"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Description of Exit</label>
                      <input 
                        type="text" 
                        required
                        disabled={submitting}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Purpose of transaction"
                        className="input-modern"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Record Date</label>
                    <input 
                      type="date" 
                      required
                      disabled={submitting}
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="input-modern"
                    />
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] text-white transition-all shadow-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 ${
                    formData.type === 'income' 
                    ? 'bg-primary shadow-primary/30' 
                    : 'bg-slate-900 shadow-slate-900/30'
                  }`}
                >
                  {submitting ? (
                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ShieldCheck size={20} strokeWidth={3} />
                  )}
                  {submitting ? 'Authenticating...' : (editingId ? 'Authorize Update' : `Authorize ${formData.type === 'income' ? 'Income' : 'Expense'}`)}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
