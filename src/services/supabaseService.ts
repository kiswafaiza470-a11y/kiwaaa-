import { supabase } from '../lib/supabase';

// SQL to run in Supabase SQL Editor:
/*
-- ==========================================
-- SQL SCHEMA LENGKAP (Termasuk Storage Bucket)
-- Salin dan Jalankan di SQL Editor Supabase
-- ==========================================

-- 1. Tabel Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nama TEXT,
  email TEXT,
  username TEXT UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Tabel Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  category TEXT DEFAULT 'Umum',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, 
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. Aktifkan RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. Policies Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 5. Policies Transactions
DROP POLICY IF EXISTS "Transactions viewable by owner or admin" ON public.transactions;
CREATE POLICY "Transactions viewable by owner or admin" ON public.transactions 
FOR SELECT TO authenticated 
USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
CREATE POLICY "Users can create their own transactions" ON public.transactions 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = created_by);

-- 6. Storage Setup (Eksklusif buat KasKita)
-- Buat bucket 'kaskita' jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('kaskita', 'kaskita', true)
ON CONFLICT (id) DO NOTHING;

-- Policy Storage (Jalankan satu-satu jika error di editor)
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'kaskita');
-- CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kaskita');

-- 7. Trigger User Baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  SELECT count(*) = 0 INTO is_first_user FROM public.profiles;
  INSERT INTO public.profiles (id, nama, email, username, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nama', new.raw_user_meta_data->>'full_name', 'User Baru'),
    new.email,
    new.raw_user_meta_data->>'username',
    CASE WHEN is_first_user THEN 'admin' ELSE 'user' END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/

export interface Profile {
  id: string;
  nama: string;
  email: string;
  username?: string;
  phone?: string;
  role: 'admin' | 'user';
  photo_url?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  pembayar?: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  created_by: string;
  photo_url?: string;
  created_at: string;
  profiles?: {
    nama: string;
    username?: string;
    phone?: string;
  }
}

export const supabaseService = {
  // Profiles
  async getCurrentProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not logged in' };
    return await supabase.from('profiles').select('*').eq('id', user.id).single();
  },

  async getAllProfiles() {
    return await supabase.from('profiles').select('*').order('role', { ascending: true });
  },

  async updateProfile(userId: string, data: Partial<Profile>) {
    return await supabase.from('profiles').update(data).eq('id', userId);
  },

  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    // Upload to 'kaskita' bucket
    const { error: uploadError } = await supabase.storage
      .from('kaskita')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('kaskita')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async uploadTransactionPhoto(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `tx-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = fileName;

    // Upload to 'kaskita' bucket
    const { error: uploadError } = await supabase.storage
      .from('kaskita')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('kaskita')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async updateProfileRole(userId: string, role: 'admin' | 'user') {
    return await supabase.from('profiles').update({ role }).eq('id', userId);
  },

  // Transactions
  async getTransactions(limit = 100) {
    try {
      console.log('Fetching transactions from Supabase...');
      // Menggunakan join yang lebih eksplisit untuk menghindari error relasi
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles:created_by (
            nama
          )
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.warn('Join query failed, retrying simple query:', error.message);
        // Fallback ke query sederhana jika join gagal
        return await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false })
          .limit(limit);
      }
      
      console.log('Fetched transactions successfully:', data?.length);
      return { data, error: null };
    } catch (err: any) {
      console.error('getTransactions exception:', err);
      return { data: null, error: err };
    }
  },

  async getTransactionsByRange(startDate: string, endDate: string) {
    return await supabase
      .from('transactions')
      .select('*, profiles:created_by(nama)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
  },

  async addTransaction(data: { 
    type: 'income' | 'expense', 
    amount: number, 
    description: string, 
    date: string, 
    category?: string, 
    pembayar?: string,
    photo_url?: string 
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload: any = {
        ...data,
        category: data.category || 'Umum',
        created_by: user?.id
      };
      
      console.log('Final Payload Sending to Supabase:', payload);
      
      const { data: result, error } = await supabase
        .from('transactions')
        .insert([payload])
        .select();
        
      return { data: result, error };
    } catch (err: any) {
      console.error('Catch error in addTransaction:', err);
      return { error: { message: err.message || 'Unknown error' } };
    }
  },

  async updateTransaction(id: string, data: any) {
    return await supabase.from('transactions').update(data).eq('id', id);
  },

  async deleteTransaction(id: string) {
    return await supabase.from('transactions').delete().eq('id', id);
  },

  // Real-time
  subscribeToTransactions(callback: () => void) {
    const channel = supabase
      .channel('realtime-transactions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'transactions' 
      }, () => {
        callback();
      })
      .subscribe();
    
    return {
      unsubscribe: () => supabase.removeChannel(channel)
    };
  }
};
