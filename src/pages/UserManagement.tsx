import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  Search, 
  Calendar, 
  AlertCircle,
  Mail,
  MoreVertical
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';
import { motion } from 'motion/react';

import { cn } from '../lib/utils';

interface Profile {
  id: string;
  nama: string;
  email: string;
  username?: string;
  phone?: string;
  role: 'admin' | 'user';
  photo_url?: string;
  created_at: string;
}

export default function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfiles();
    
    // Subscribe to profile changes
    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchProfiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true });
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (profile: Profile) => {
    const newRole = profile.role === 'admin' ? 'user' : 'admin';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profile.id);
      
      if (error) throw error;
      // Fetch will happen via subscription, but we update locally for speed
      setProfiles(profiles.map(p => p.id === profile.id ? { ...p, role: newRole } : p));
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    (p.nama?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Manajemen Pengguna</h1>
          <p className="text-slate-500 font-medium tracking-tight">Atur hak akses dan otoritas anggota KasKita.</p>
        </div>
      </div>

      {/* Filter & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex items-center gap-4 py-4 px-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm transition-all focus-within:border-blue-200">
           <Search size={20} className="text-slate-400" />
           <input 
             type="text"
             placeholder="Cari anggota berdasarkan nama atau email..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-slate-900 placeholder:text-slate-300"
           />
        </div>
        <div className="flex items-center gap-4 py-4 px-8 bg-slate-900 text-white rounded-[2rem] shadow-xl">
           <Users size={24} className="text-blue-400" />
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Anggota Aktif</p>
              <p className="text-xl font-black leading-none">{profiles.length}</p>
           </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredProfiles.length > 0 ? (
          filteredProfiles.map((profile, i) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="card-modern group hover:border-blue-200 transition-all p-6 relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-6">
                 <div className="relative">
                   {profile.photo_url ? (
                     <img 
                       src={profile.photo_url} 
                       alt={profile.nama} 
                       className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md"
                     />
                   ) : (
                     <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                        {profile.nama?.charAt(0).toUpperCase() || '?'}
                     </div>
                   )}
                 </div>
                 <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                    profile.role === 'admin' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'bg-slate-50 text-slate-400'
                 }`}>
                    {profile.role === 'admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                    {profile.role}
                 </div>
              </div>

              <div className="space-y-4">
                <div>
                   <div className="flex items-center justify-between">
                     <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{profile.nama}</h3>
                     <span className="text-[10px] font-bold text-slate-400 text-right">@{profile.username || 'user'}</span>
                   </div>
                   <div className="flex items-center gap-2 text-slate-400 text-xs mt-1 font-medium">
                      <Mail size={12} className="shrink-0" />
                      <span className="truncate">{profile.email}</span>
                   </div>
                   {profile.phone && (
                     <div className="flex items-center gap-2 text-slate-400 text-xs mt-1 font-medium">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 shrink-0">+62</span>
                        <span className="truncate">{profile.phone}</span>
                     </div>
                   )}
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Calendar size={12} />
                      Joined {new Date(profile.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                   </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
             <AlertCircle size={48} className="mx-auto mb-4 text-slate-200" />
             <p className="font-bold text-slate-400">Tidak ada anggota yang cocok dengan pencarian.</p>
          </div>
        )}
      </div>
    </div>
  );
}
