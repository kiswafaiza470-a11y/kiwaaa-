import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Instagram, 
  Github, 
  Mail, 
  ChevronRight, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative px-6 pb-12 pt-24 overflow-hidden bg-white">
      {/* Background Glow Ornament */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Card */}
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 relative overflow-hidden shadow-2xl shadow-slate-200">
          {/* Subtle Animated Background Gradients */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/5 rounded-full blur-[100px] -ml-48 -mb-48"></div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
            {/* 1. Brand Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Zap size={28} fill="currentColor" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-white">KasKita</span>
              </div>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Platform digital untuk mengelola kas kelas secara transparan, aman, dan real-time. Membantu bendahara bekerja lebih cerdas.
              </p>
              <div className="flex items-center gap-4">
                {[
                  { icon: Instagram, href: "#" },
                  { icon: Github, href: "#" },
                  { icon: Mail, href: "mailto:hello@kaskita.id" }
                ].map((social, i) => (
                  <motion.a
                    key={i}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all shadow-lg"
                  >
                    <social.icon size={18} />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* 2. Navigation */}
            <div>
              <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-[10px]">Navigasi Utama</h4>
              <ul className="space-y-4">
                {[
                  { name: 'Beranda', path: '/' },
                  { name: 'Fitur', path: '#fitur' },
                  { name: 'Tentang', path: '#tentang' }
                ].map((item) => (
                  <li key={item.name}>
                    <a 
                      href={item.path} 
                      className="text-slate-400 hover:text-blue-400 text-sm font-bold transition-all flex items-center group"
                    >
                      <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-2" />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Features */}
            <div>
              <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-[10px]">Fitur Unggulan</h4>
              <ul className="space-y-4">
                {[
                  'Real-time Update',
                  'Transparansi Penuh',
                  'Laporan Otomatis',
                  'Export PDF & CSV',
                  'Keamanan Data'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. CTA Highlight Card */}
            <div className="lg:pl-4">
              <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 border border-white/10 relative group">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/40 rotate-12 group-hover:rotate-0 transition-transform">
                  <ArrowUpRight size={24} />
                </div>
                <h4 className="text-white font-bold text-lg mb-3">Kelola Kas Lebih Mudah</h4>
                <p className="text-slate-400 text-xs font-medium leading-relaxed mb-8">
                  Pantau pemasukan dan pengeluaran secara real-time tanpa ribet melalui dashboard transparan.
                </p>
                <div className="space-y-3">
                  <Link 
                    to="/login"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                  >
                    Mulai Sekarang
                  </Link>
                  <Link 
                    to="/login"
                    className="w-full flex items-center justify-center py-3 bg-white/5 text-white border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                  >
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar Content inside Main Card */}
          <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-500 text-xs font-bold font-mono">
              © {currentYear} KASKITA. ALL RIGHTS RESERVED.
            </p>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
               <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                  Dibuat untuk transparansi keuangan kelas 💙
               </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
