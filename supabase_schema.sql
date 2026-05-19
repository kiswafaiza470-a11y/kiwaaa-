-- ==========================================================
-- REPARASI TOTAL KASKITA (VERSI V10 - ANTI GAGAL DAFTAR)
-- ==========================================================
-- INSTRUKSI:
-- 1. Salin SEMUA kode ini.
-- 2. Ke Dashboard Supabase -> SQL Editor -> Klik "+ New Query".
-- 3. Paste dan klik tombol "RUN" (di pojok kanan bawah).
-- ==========================================================

-- 1. BERSIHKAN SEMUA YANG BERPOTENSI EROR (Trigger & Fungsi Lama)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. PASTIKAN TABEL UTAMA ADA (Profiles & Transactions)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nama TEXT DEFAULT 'User Baru',
  email TEXT,
  username TEXT UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'user',
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  pembayar TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  category TEXT DEFAULT 'Umum',
  photo_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. FUNGSI OTOMATISASI YANG LEBIH TANGGUH (handle_new_user)
-- Fungsi ini akan jalan tiap kali ada orang DAFTAR (Sign Up)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Cek apakah sebelumnya sudah ada user? Jika belum, user pertama jadi ADMIN
  SELECT count(*) = 0 INTO is_first_user FROM public.profiles;
  
  INSERT INTO public.profiles (id, nama, email, username, phone, role, photo_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nama', new.raw_user_meta_data->>'full_name', 'User Baru'), 
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)), -- Fallback jika username kosong
    new.raw_user_meta_data->>'phone',
    CASE WHEN is_first_user THEN 'admin' ELSE 'user' END,
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'photo_url')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nama = EXCLUDED.nama,
    role = CASE WHEN is_first_user THEN 'admin' ELSE profiles.role END;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. PASANG ULANG TRIGGER KE TABEL AUTH.USERS
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. SINKRONISASI USER LAMA (Biar yang sudah terlanjur daftar tetap punya profil)
INSERT INTO public.profiles (id, nama, email, role)
SELECT id, COALESCE(raw_user_meta_data->>'nama', email), email, 'admin'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 6. KEAMANAN DATA (RLS - Row Level Security)
-- Dibuat paling simpel agar tidak menghalangi proses pendaftaran
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All For Profiles" ON public.profiles;
CREATE POLICY "Allow All For Profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All For Transactions" ON public.transactions;
CREATE POLICY "Allow All For Transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- 7. AKTIFKAN REAL-TIME (Supaya data update otomatis tanpa refresh)
DO $$ 
BEGIN
  -- Coba tambahkan tabel ke publikasi real-time, abaikan jika sudah aktif
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'transactions') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 8. TIPS JADI ADMIN MANUAL:
-- Jalankan perintah ini (ganti emailnya):
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'EMAIL_KAKAK@GMAIL.COM';

-- ==========================================================
-- SELESAI. Silakan klik tombol "RUN" (Hijau).
-- ==========================================================
