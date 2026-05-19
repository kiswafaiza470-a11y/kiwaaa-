import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Zap, 
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [resending, setResending] = useState(false);
  
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      // Client-side validation
      if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
        throw new Error('Alamat email tidak valid. Pastikan penulisan benar (contoh: user@gmail.com)');
      }

      if (trimmedPassword.length < 6) {
        throw new Error('Password minimal 6 karakter.');
      }

      if (isRegister) {
        // Cek apakah username sudah diambil sebelum daftar
        try {
          const { data: existingUsername } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username.trim())
            .maybeSingle();

          if (existingUsername) {
            throw new Error('Username ini sudah diambil. Silakan pilih username lain.');
          }
        } catch (e: any) {
          console.warn('Username check skipped or failed:', e);
          // If profiles table doesn't exist yet, we'll let signUp handle the error
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: {
            data: {
              nama: nama.trim(),
              full_name: nama.trim(), 
              username: username.trim() || null,
              phone: phone.trim() || null,
            }
          }
        });
        
        if (signUpError) {
          console.error('Sign Up Error:', signUpError);
          
          if (signUpError.message.toLowerCase().includes('email') && signUpError.message.toLowerCase().includes('invalid')) {
            setError('Format email tidak valid atau domain dilarang. Pastikan tidak ada spasi.');
            return;
          }
          
          if (signUpError.message.toLowerCase().includes('rate limit')) {
            setError('Terlalu banyak mencoba: Silakan tunggu beberapa menit atau matikan "Confirm Email" di Dashboard Supabase agar bisa langsung masuk.');
            return;
          }

          if (signUpError.message.toLowerCase().includes('email signups are disabled')) {
            setError('Pendaftaran via Email dinonaktifkan: Silakan nyalakan "Enable Email Signup" di Dashboard Supabase -> Authentication -> Providers -> Email.');
            return;
          }
          
          if (signUpError.message.includes('Database error saving new user')) {
            setError('Database Belum Siap: Silakan jalankan SQL Schema (di file supabase_schema.sql) di Dashboard Supabase SQL Editor.');
            return;
          }
          throw signUpError;
        }

        if (data.session) {
          navigate('/login');
        } else {
          setSuccess('Registrasi berhasil! Anda sekarang bisa masuk.');
          setIsRegister(false);
          // Clear sensitive fields
          setPassword('');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword
        });
        
        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            setError('Email belum dikonfirmasi. Silakan cek inbox/spam email Anda.');
            // Berikan opsi resend email secara otomatis atau via tombol
            setSuccess('Butuh kirim ulang email konfirmasi? Klik tombol di bawah.');
            return;
          }
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Email atau password salah. Jika belum punya akun, silakan klik "Daftar Gratis" di bawah.');
            return;
          }
          if (signInError.message.includes('relation "profiles" does not exist')) {
            setError('Database Belum Siap: Silakan jalankan kodingan SQL Schema (di file supabase_schema.sql) di Dashboard Supabase SQL Editor.');
            return;
          }
          if (signInError.message.toLowerCase().includes('email') && signInError.message.toLowerCase().includes('invalid')) {
            setError('Format email tidak valid atau domain tidak diizinkan. Gunakan email standar seperti @gmail.com.');
            return;
          }
          if (signInError.message.toLowerCase().includes('email logins are disabled')) {
            setError('Login via Email dinonaktifkan: Silakan nyalakan "Enable Email Login" di Dashboard Supabase -> Authentication -> Providers -> Email.');
            return;
          }
          throw signInError;
        }

        if (data.session) {
          // Navigasi ke /login agar dihandle oleh redirect otomatis di App.tsx yang sudah tahu role-nya
          navigate('/login');
        }
      }
    } catch (err: any) {
      console.error('Auth error log:', err);
      // Special handling for the infamous "Database error saving new user"
      if (err.message?.includes('Database error saving new user')) {
        setError('Gagal membuat akun: Terjadi kesalahan di database (mungkin username/email duplikat). Coba username lain.');
      } else {
        setError(err.message || 'Terjadi kesalahan sistem.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError('Masukkan email Anda terlebih dahulu.');
      return;
    }
    
    setResending(true);
    setError(null);
    setSuccess(null);
    
    try {
      const trimmedEmail = email.trim();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: trimmedEmail,
      });
      
      if (resendError) throw resendError;
      setSuccess('Email konfirmasi baru telah dikirim! Silakan cek kotak masuk Anda.');
    } catch (err: any) {
      setError('Gagal mengirim ulang email: ' + err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbff] flex items-center justify-center p-6 relative overflow-hidden">
       {/* Background Decorative Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-400/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <Link 
        to="/" 
        className="absolute top-10 left-10 hidden md:flex items-center gap-3 text-slate-400 hover:text-primary transition-all font-bold text-xs uppercase tracking-widest z-20"
      >
        <ArrowLeft size={16} strokeWidth={2.5} />
        Back to Nexus
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[460px] glass-card overflow-hidden z-10 border-white/60"
      >
        {/* Header Section */}
        <div className="bg-slate-900 pt-20 pb-14 px-12 text-center relative overflow-hidden group">
          <div className="flex justify-center mb-10 relative z-10">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 flex items-center justify-center text-white shadow-2xl transition-transform duration-700 group-hover:rotate-12">
              <Zap size={48} fill="currentColor" />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tighter text-white mb-3 relative z-10">KasKita</h1>
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.3em] leading-relaxed max-w-[240px] mx-auto relative z-10">
            {isRegister 
              ? 'ESTABLISH NEW FINANCIAL PROTOCOL' 
              : 'AUTHORIZE SYSTEM ACCESS'}
          </p>
          
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Form Section */}
        <div className="p-10 lg:p-14">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[11px] font-bold text-center leading-relaxed">
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-[11px] font-bold text-center leading-relaxed">
              {success}
              {success.includes('Klik tombol di bawah') && (
                <button
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="block w-full mt-4 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {resending ? 'Processing...' : 'Resend Verification Protocol'}
                </button>
              )}
            </motion.div>
          )}

          <form onSubmit={handleAuth} className="space-y-8">
            <AnimatePresence mode="wait">
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-8"
                >
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3.5 block ml-1">Full Entity Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none text-slate-300">
                        <UserIcon size={20} />
                      </div>
                      <input
                        type="text"
                        required
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        placeholder="John Doe"
                        className="input-modern pl-16"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3.5 block ml-1">Unique Username</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none text-slate-300">
                        <span className="text-sm font-bold opacity-40">@</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="john_doe"
                        className="input-modern pl-16 lowercase"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3.5 block ml-1">Communication Endpoint (Email)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none text-slate-300">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nexus.com"
                  className="input-modern pl-16"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3.5 block ml-1">Security Keyphrase</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none text-slate-300">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-modern pl-16 pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-7 flex items-center text-slate-300 hover:text-primary transition-all focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 py-5 bg-primary text-white rounded-2xl font-extrabold shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50 group text-sm uppercase tracking-widest"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isRegister ? 'Initialize Account' : 'Authenticate'}</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[13px] font-bold text-slate-400">
              {isRegister ? 'Already have an account?' : "Don't have an account yet?"}
              <button 
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                  setSuccess(null);
                }}
                className="ml-2 text-primary font-extrabold hover:underline transition-all"
              >
                {isRegister ? 'Return to Portal' : 'Create One Now'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
