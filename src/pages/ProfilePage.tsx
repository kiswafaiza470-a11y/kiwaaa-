import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Camera, Save, CheckCircle2, ArrowLeft, Shield, ExternalLink } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [editNama, setEditNama] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditNama(profile.nama || '');
      setEditUsername(profile.username || '');
      setEditPhone(profile.phone || '');
      setEditPhotoURL(profile.photo_url || '');
    } else if (user) {
      setEditNama(user.user_metadata?.full_name || '');
      setEditUsername(user.user_metadata?.username || '');
      setEditPhone(user.user_metadata?.phone || '');
      setEditPhotoURL(user.user_metadata?.avatar_url || '');
    }
    setImageError(false);
  }, [profile, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        alert('Ukuran foto terlalu besar! Maksimal 2MB.');
        return;
      }
      setTempFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      let finalPhotoURL = editPhotoURL;

      if (tempFile) {
        finalPhotoURL = await supabaseService.uploadAvatar(user.id, tempFile);
      }

      // 1. Update Tabel Profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          nama: editNama,
          username: editUsername,
          phone: editPhone,
          photo_url: finalPhotoURL,
          email: user.email,
        });
      
      if (profileError) throw profileError;

      // 2. Update Auth Metadata (Agar sinkron di semua tempat)
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          nama: editNama,
          full_name: editNama,
          username: editUsername,
          avatar_url: finalPhotoURL,
          photo_url: finalPhotoURL
        }
      });

      if (authError) throw authError;
      
      // 3. Update data di seluruh aplikasi (Sidebar, Header, dll)
      await refreshProfile();
      
      setTempFile(null);
      setEditPhotoURL(finalPhotoURL);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Profile save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate(-1)}
            className="p-4 glass-card hover:bg-white/40 transition-all active:scale-95 border-white/60"
          >
            <ArrowLeft size={22} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-none mb-2">Member Identity</h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] ml-1 opacity-70">Synthesize your digital presence on the platform.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-extrabold uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/10 hover:bg-primary transition-all active:scale-95"
        >
          <ExternalLink size={18} />
          View Matrix
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-card p-12 text-center group border-white/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative inline-block mb-10 cursor-pointer" onClick={() => document.getElementById('photo-upload')?.click()}>
              <div className="relative">
                <div className="w-48 h-48 rounded-[3.5rem] overflow-hidden border-8 border-white/50 shadow-inner mx-auto bg-slate-900/5 flex items-center justify-center transition-all group-hover:scale-[1.02] group-hover:-rotate-2">
                  {editPhotoURL && !imageError ? (
                    <img 
                      key={editPhotoURL}
                      src={editPhotoURL.startsWith('http') ? `${editPhotoURL}?t=${Date.now()}` : editPhotoURL} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span className="text-6xl font-extrabold text-primary">{(editNama || 'U').substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute -bottom-2 -right-2 p-5 bg-primary text-white rounded-3xl shadow-2xl border-4 border-white transition-colors"
                >
                  <Camera size={22} strokeWidth={2.5} />
                </motion.div>
                {tempFile && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-2 -right-2 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg"
                  >
                    <CheckCircle2 size={20} strokeWidth={3} />
                  </motion.div>
                )}
              </div>
              <input 
                type="file" 
                id="photo-upload" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </div>
            
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2 truncate px-4">{editNama || 'Entity Profile'}</h3>
            <div className="flex items-center justify-center gap-2 mb-10">
               <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border ${
                  profile?.role === 'admin' ? 'bg-primary/10 text-primary border-primary/10' : 'bg-slate-100 text-slate-400 border-slate-200/50'
               }`}>
                  <Shield size={14} />
                  {profile?.role === 'admin' ? 'System Admin' : 'Authorized User'}
               </span>
            </div>
            
            <div className="pt-8 border-t border-white/60 space-y-4">
              <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
                <span className="opacity-60">Auth Status</span>
                <span className="text-emerald-500 font-extrabold">Verified</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
                <span className="opacity-60">Network Year</span>
                <span className="text-slate-900 font-extrabold">{profile?.created_at ? new Date(profile.created_at).getFullYear() : '2024'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="glass-card p-10 md:p-14 border-white/60">
            <div className="flex items-center gap-5 mb-12">
              <div className="p-4 bg-primary/10 text-primary rounded-[1.5rem] border border-primary/5">
                <User size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">Modify Core Data</h4>
                <p className="text-sm font-bold text-slate-400 opacity-70">Synchronize your entity metadata across the network.</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-5 opacity-70">
                  Full Entity Designation
                </label>
                <input 
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="input-modern"
                  placeholder="Full Name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-5 opacity-70">
                    Network Alias
                  </label>
                  <input 
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="input-modern"
                    placeholder="username"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-5 opacity-70">
                    Contact Vector
                  </label>
                  <input 
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="input-modern"
                    placeholder="812xxx"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 ml-5 opacity-70">
                  Endpoint Identification (Read Only)
                </label>
                <input 
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="input-modern bg-slate-100/50 text-slate-400 border-slate-200/50 cursor-not-allowed font-bold"
                />
              </div>

              <div className="pt-10 border-t border-white/60 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-primary text-white rounded-[1.5rem] py-5 px-14 hover:bg-primary-dark transition-all shadow-2xl shadow-primary/20 font-extrabold uppercase tracking-widest text-[11px] flex items-center gap-4 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    'Writing Data...'
                  ) : showSuccess ? (
                    <><CheckCircle2 size={20} /> Integrity Verified</>
                  ) : (
                    <><Save size={20} /> Commit Changes</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
