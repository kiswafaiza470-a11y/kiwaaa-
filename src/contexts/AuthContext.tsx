import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  isUser: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isUser: false,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 10000); // 10 seconds

    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    });

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        fetchProfile(newUser.id);
      } else {
        setProfile(null);
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('Fetching profile for:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        console.log('Profile not found (PGRST116), attempting fallback creation...');
        // Jika profile tidak ditemukan, coba buat default
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        
        // Cek apakah ini user pertama (untuk jadi admin otomatis)
        let role = 'user';
        try {
          const { count, error: countErr } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
          if (!countErr && count === 0) {
            role = 'admin';
          }
        } catch (e) {
          console.warn('Could not count profiles for admin check:', e);
        }

        const newProfile = {
          id: userId,
          nama: user?.user_metadata?.nama || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User Baru',
          email: user?.email,
          username: user?.user_metadata?.username || null,
          phone: user?.user_metadata?.phone || null,
          photo_url: user?.user_metadata?.avatar_url || user?.user_metadata?.photo_url || null,
          role: role,
        };
        
        const { data: created, error: insertErr } = await supabase
          .from('profiles')
          .upsert([newProfile], { onConflict: 'id' })
          .select()
          .single();
          
        if (created) {
          console.log('Fallback profile created successfully');
          setProfile(created);
        } else if (insertErr) {
          console.error('Failed to create fallback profile:', insertErr);
        }
      } else if (data) {
        console.log('Profile loaded successfully');
        setProfile(data);
      } else if (error) {
        console.error('Profile fetch error:', error);
      }
    } catch (err) {
      console.error('Fatal error in fetchProfile:', err);
    } finally {
      console.log('Finish fetchProfile, setting loading: false');
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isUser: profile?.role === 'user',
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
