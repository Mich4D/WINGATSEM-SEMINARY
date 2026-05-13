# Supabase Database Setup (FINAL FIX)

To fix all database related issues, please run the following **Master SQL Block** in your Supabase SQL Editor. 

### 📱 MOBILE USERS: Copy the entire block below and paste it once.

```sql
-- 1. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SETTINGS TABLE FIX (Crucial for Logo & Images)
-- We use TEXT for ID so we can use "global", "anthem", etc.
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY,
  fees JSONB,
  flutterwave_public_key TEXT,
  logo_url TEXT,
  admission_flyer_url TEXT,
  hero_bg_url TEXT,
  rector_image_url TEXT,
  about_image_url TEXT,
  live_stream_url TEXT,
  anthem_url TEXT,
  anthem_title TEXT DEFAULT 'School Anthem',
  school_name TEXT DEFAULT 'WGTS',
  is_admission_open BOOLEAN DEFAULT TRUE,
  important_dates JSONB,
  admission_notification_email TEXT,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- If ID is currently UUID, we need to change it to TEXT
DO $$ 
BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'id') = 'uuid' THEN
        ALTER TABLE public.settings ALTER COLUMN id TYPE TEXT;
    END IF;
END $$;

-- Populate Global Settings
INSERT INTO public.settings (id, school_name, is_admission_open, fees)
VALUES ('global', 'Winning Gate Christian Theological Seminary', true, '{
  "registration": 10000,
  "tuition": {
    "diploma": 100000,
    "bachelor": 120000,
    "master": 150000,
    "doctorate": 180000
  }
}') ON CONFLICT (id) DO NOTHING;

-- 3. CORE USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'student',
  is_approved BOOLEAN DEFAULT FALSE,
  level TEXT,
  department_code TEXT,
  registration_number TEXT UNIQUE,
  profile_image_url TEXT,
  selfie_url TEXT,
  reference_letter1_url TEXT,
  reference_letter2_url TEXT,
  baptism_certificate_url TEXT,
  academic_credential_url TEXT,
  date_registered TIMESTAMPTZ DEFAULT NOW(),
  phone_number TEXT,
  address TEXT,
  date_of_birth TEXT,
  gender TEXT,
  nationality TEXT,
  state_of_origin TEXT,
  city TEXT,
  declaration_of_faith TEXT,
  baptism_date TEXT,
  church_name TEXT,
  church_position TEXT,
  learning_mode TEXT,
  profile_completed BOOLEAN DEFAULT FALSE,
  program_type TEXT,
  class_language TEXT DEFAULT 'English',
  academic_history JSONB DEFAULT '{}'::jsonb,
  registration_fee_paid BOOLEAN DEFAULT FALSE,
  tuition_fee_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ACADEMIC & DEPARTMENT TABLES
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  level TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grades (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  course_name TEXT,
  credits INTEGER DEFAULT 3,
  score INTEGER,
  grade TEXT,
  teacher_id uuid REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MEDIA & BLOG TABLES
CREATE TABLE IF NOT EXISTS public.gallery (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  year TEXT NOT NULL,
  caption TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gallery_videos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  year TEXT NOT NULL,
  title TEXT,
  video_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'draft',
  author_id uuid REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PAYMENTS & INFRASTRUCTURE
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id),
  amount NUMERIC NOT NULL,
  payment_type TEXT,
  transaction_id TEXT,
  status TEXT DEFAULT 'completed',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mail (
  id BIGSERIAL PRIMARY KEY,
  "to" TEXT,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SECURITY & POLICIES (MASTER RESET)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Dynamic Admin Check Function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clear previous policies to avoid errors
DO $$ 
BEGIN
    -- This will clear most policies. Add more if needed.
    EXECUTE (SELECT 'DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON ' || quote_ident(tablename) 
             FROM pg_policies WHERE schemaname = 'public');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Define Policies
CREATE POLICY "Public Read Access" ON public.settings FOR SELECT TO public USING (true);
CREATE POLICY "Public Read Gallery" ON public.gallery FOR SELECT TO public USING (true);
CREATE POLICY "Public Read Videos" ON public.gallery_videos FOR SELECT TO public USING (true);
CREATE POLICY "Public Read Blog" ON public.blog_posts FOR SELECT TO public USING (status = 'published');
CREATE POLICY "Admin All Access Settings" ON public.settings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admin All Access Gallery" ON public.gallery FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admin All Access Videos" ON public.gallery_videos FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admin All Access Blog" ON public.blog_posts FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Users Read Own" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Public Student Check" ON public.users FOR SELECT TO public USING (registration_number IS NOT NULL);
CREATE POLICY "Admin All Access Users" ON public.users FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- 8. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', 'User'), 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 🚨 HOW TO FIX "LOGO NOT SHOWING"
1. Run the SQL above.
2. Go to your Admin Dashboard.
3. Re-upload your logo in the **Settings** tab. 
4. The system will now save it correctly.

### 🔐 HOW TO GAIN ADMIN ACCESS
If you can't reach the admin dashboard, run this SQL with your email:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 📁 STORAGE BUCKET SETUP
You MUST create public storage buckets in Supabase for everything to work correctly:
1. Go to **Storage** in Supabase.
2. Click **New Bucket**.
3. Create the following buckets:
   - `image`: Name it **image** and make it **Public**. (Used for school logo, rector photo, gallery photos, etc.)
   - `student`: Name it **student** and make it **Public**. (Used for student documents like PDF/Images for registration)
4. **Apply Storage Policies:** Run the following SQL in your SQL Editor to secure these buckets:

```sql
-- Policies for 'image' bucket
CREATE POLICY "Public Read Image" ON storage.objects FOR SELECT USING (bucket_id = 'image');
CREATE POLICY "Admin Full Access Image" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'image' AND public.is_admin(auth.uid()));

-- Policies for 'student' bucket
CREATE POLICY "Public Read Student" ON storage.objects FOR SELECT USING (bucket_id = 'student');
CREATE POLICY "Student Upload Access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'student');
CREATE POLICY "Admin Full Access Student" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'student' AND public.is_admin(auth.uid()));
```
5. Ensure these are exactly named `image` and `student`.

