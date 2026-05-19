import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  ShieldCheck, 
  Zap,
  TrendingUp,
  FileText,
  CheckCircle2,
  ArrowDownCircle,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';
import Footer from '../components/Footer';
import { cn } from '../lib/utils';

export default function LandingPage() {
  const { user, isAdmin } = useAuth();
  const [memberCount, setMemberCount] = useState<number>(0);
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabaseService.getAllProfiles();
      if (data) {
        setMemberCount(data.length);
        setRecentMembers(data.slice(0, 5));
      }
    };
    fetchMembers();
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const navLink = user ? (isAdmin ? "/app/admin/dashboard" : "/app/user/dashboard") : "/login";

  return (
    <div className="min-h-screen bg-[#fcfdff] selection:bg-blue-100 selection:text-blue-900 relative overflow-hidden">
      {/* Background Decorative Blurs */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-400/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-2xl border-b border-white/40">
        <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 transition-transform group-hover:rotate-6">
              <Zap size={24} fill="currentColor" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">KasKita</span>
          </div>
          
          <div className="flex items-center gap-10">
            <div className="hidden md:flex items-center gap-10 text-[13px] font-bold uppercase tracking-widest text-slate-500">
              <a href="#fitur" className="hover:text-primary transition-colors">Features</a>
              <a href="#tentang" className="hover:text-primary transition-colors">Vision</a>
            </div>
            <Link 
              to={navLink}
              className="px-7 py-3.5 bg-slate-900 text-white rounded-2xl text-[13px] font-bold uppercase tracking-widest hover:bg-primary transition-all shadow-2xl shadow-slate-900/10 active:scale-95"
            >
              {user ? 'Open Console' : 'Get Started'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-8 relative z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <motion.div {...fadeInUp}>
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-primary/5 text-primary rounded-full text-[11px] font-bold uppercase tracking-[0.2em] mb-8 border border-primary/10 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Digital Financial Integrity
            </div>
            <h1 className="text-6xl lg:text-8xl font-extrabold tracking-tighter text-slate-900 leading-[0.95] mb-10">
              Transforming <br /> Class <span className="text-primary">Finance.</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed max-w-xl mb-12 font-medium">
              The premier platform for classroom treasury. Streamline audits, track flows, and deliver absolute transparency in real-time.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link 
                to="/login"
                className="w-full sm:w-auto btn-primary shadow-2xl shadow-primary/30 py-5 px-10 text-base"
              >
                Access Platform
                <ChevronRight size={22} strokeWidth={2.5} />
              </Link>
              <div className="flex items-center gap-5 px-6 py-4 bg-white/40 backdrop-blur-xl border border-white rounded-[2rem] shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-primary flex items-center justify-center border border-primary/5">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 opacity-70">Active Network</p>
                  <p className="text-xl font-extrabold text-slate-900 leading-none">{memberCount} Verified Users</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="aspect-[4/5] bg-primary/5 rounded-[5rem] flex items-center justify-center p-12 border border-primary/10 shadow-inner group">
              <div className="w-full h-full glass-card overflow-hidden flex flex-col hover:scale-[1.02] transition-transform duration-700">
                <div className="h-16 border-b border-white/40 flex items-center px-8 justify-between shrink-0 bg-white/30">
                  <div className="flex gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-rose-400"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-400"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="w-40 h-2 bg-slate-200/50 rounded-full"></div>
                </div>
                <div className="p-10 flex-1 space-y-8 bg-white/20">
                  <div className="h-40 bg-slate-900 rounded-[2.5rem] p-8 flex flex-col justify-end text-white relative overflow-hidden group/card shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none group-hover/card:scale-125 transition-transform duration-1000">
                        <Zap size={140} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-50 mb-3">System Balance</p>
                    <p className="text-4xl font-extrabold tracking-tighter">Rp 2.450.000</p>
                  </div>
                  <div className="space-y-5">
                    {[1, 2].map(i => (
                      <div key={i} className="flex items-center justify-between p-6 bg-white/60 border border-white rounded-[2rem] shadow-sm backdrop-blur-md">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                             "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                             i === 1 ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-900 text-white shadow-slate-900/10'
                          )}>
                            {i === 1 ? <TrendingUp size={22} /> : <ArrowDownCircle size={22} />}
                          </div>
                          <div>
                            <div className="h-3 w-32 bg-slate-900/5 rounded-full mb-2"></div>
                            <div className="h-2 w-20 bg-slate-900/5 rounded-full opacity-50"></div>
                          </div>
                        </div>
                        <div className="h-3 w-20 bg-primary/10 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Absolute badge */}
            <div className="absolute -top-10 -left-10 p-6 bg-white rounded-[3rem] shadow-2xl border border-slate-50 flex items-center gap-5 z-20">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-emerald-500/10 border border-emerald-200">
                <ShieldCheck size={28} />
              </div>
              <div className="pr-4">
                 <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Encrypted</span>
                 <span className="text-lg font-bold text-slate-900 whitespace-nowrap">Security Protocol</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <p className="text-primary font-black uppercase tracking-[0.4em] text-[11px] mb-6">Capabilities</p>
            <h2 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">Elite Financial <br /> Infrastructure.</h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">Built with the latest technologies to ensure your class funds are managed with precision and absolute transparency.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                icon: Zap,
                title: "Atomic Sync",
                desc: "Every transaction propagates across our network instantly. No refresh, no delay, just pure data flow.",
                color: "text-primary bg-primary/10",
                shadow: "shadow-primary/20"
              },
              {
                icon: ShieldCheck,
                title: "Immutable History",
                desc: "Audit logs are strictly read-only for members. Every entry is verified to prevent unauthorized alterations.",
                color: "text-slate-900 bg-slate-900/5",
                shadow: "shadow-slate-900/10"
              },
              {
                icon: FileText,
                title: "Pro Reports",
                desc: "Generate professional-grade PDF summaries including balance curves and categorized spending analysis.",
                color: "text-primary bg-primary/10",
                shadow: "shadow-primary/20"
              }
            ].map((f, i) => (
              <motion.div 
                key={i} 
                className="glass-card p-12 group"
                whileHover={{ y: -12 }}
              >
                <div className={cn(
                    "w-16 h-16 rounded-3xl flex items-center justify-center mb-10 transition-all duration-500 group-hover:rotate-6",
                    f.color,
                    "shadow-2xl",
                    f.shadow
                )}>
                  <f.icon size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">{f.title}</h3>
                <p className="text-slate-500 text-base leading-relaxed font-medium opacity-80">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="tentang" className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              <div>
                <span className="text-primary font-black uppercase tracking-[0.3em] text-[11px] mb-6 block">Our Vision</span>
                <h2 className="text-5xl lg:text-7xl font-extrabold tracking-tighter text-slate-900 leading-[0.95]">
                  Cultivating <span className="text-primary">Integrity</span> in Education.
                </h2>
              </div>
              
              <p className="text-xl text-slate-600 font-medium leading-relaxed opacity-90">
                KasKita was forged to bridge the gap between administrative burdens and student trust. We believe that financial integrity should be a core experience in every classroom.
              </p>

              <div className="space-y-6">
                {[
                  { title: "Standardized Flow", desc: "Setting the national standard for digital classroom treasury management." },
                  { title: "Total Auditing", desc: "Providing peace of mind through radical transparency and verified data history." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 p-8 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-sm hover:shadow-xl transition-all duration-500 group">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shrink-0">
                      <CheckCircle2 size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="text-xl font-extrabold text-slate-900 mb-2 tracking-tight">{item.title}</h4>
                      <p className="text-sm text-slate-500 font-bold leading-relaxed opacity-70">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square glass-card p-12 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                 {/* Background large logo */}
                <div className="absolute opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <Zap size={600} />
                </div>
                
                <div className="w-28 h-28 bg-primary rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-primary/30 mb-10 rotate-6 transition-transform group-hover:rotate-0">
                  <Zap size={56} fill="currentColor" />
                </div>
                <h3 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">Financial Hub</h3>
                <p className="text-lg text-slate-500 font-bold max-w-sm mb-12 leading-relaxed opacity-70">
                  "Empowering student treasurers with tools that inspire trust and eliminate bureaucracy."
                </p>
                <div className="flex -space-x-4 mb-3">
                   {recentMembers.length > 0 ? (
                     recentMembers.map((member, i) => (
                       <div key={i} className="w-14 h-14 rounded-2xl border-4 border-white bg-blue-100 overflow-hidden shadow-2xl flex items-center justify-center text-blue-600 font-black relative group hover:-translate-y-2 transition-transform duration-300">
                         {member.photo_url ? (
                           <img src={member.photo_url} alt={member.nama} className="w-full h-full object-cover" />
                         ) : (
                           <span className="text-lg">{(member.nama || '?').charAt(0).toUpperCase()}</span>
                         )}
                         {i === 0 && (
                           <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full">
                             <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                           </div>
                         )}
                       </div>
                     ))
                   ) : (
                     <div className="w-14 h-14 rounded-2xl border-4 border-white bg-slate-100"></div>
                   )}
                </div>
                <div className="flex items-center gap-3 mb-6">
                   <div className="flex h-2 w-2 relative">
                      <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></div>
                      <div className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></div>
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Mainframe Status: Operational</p>
                </div>
                <p className="text-sm font-bold text-slate-700">Trusted by over <span className="text-primary font-extrabold">2,400+</span> Academic Entities</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
