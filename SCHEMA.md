# Supabase Database Setup

To fix the registration and profile completion issues, please run the following SQL in your Supabase SQL Editor.

## 1. Update Users Table
Run this to add missing columns and set up security for the `users` table:

```sql
-- 1. Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS program_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS class_language TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_credential_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_history JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_fee_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tuition_fee_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS selfie_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reference_letter1_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reference_letter2_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS baptism_certificate_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_registered TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Create Security Policies (Drop first to avoid errors if they exist)
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" 
ON users FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" 
ON users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- 4. Create Admin Security Policies so Admins can see all students
-- FIX: Using a more robust check to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC Function for Admin Dashboard to fetch users without RLS recursion
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS SETOF public.users AS $$
BEGIN
  -- Re-validate admin status
  IF EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN QUERY SELECT * FROM public.users;
  ELSE
    RAISE EXCEPTION 'Not authorized';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Admins can read all profiles" ON users;
CREATE POLICY "Admins can read all profiles" 
ON users FOR SELECT 
TO authenticated 
USING ( public.is_admin(auth.uid()) );

-- 5. Public Verification Policy (MANDATORY for the Verification Portal)
DROP POLICY IF EXISTS "Allow public student verification" ON users;
CREATE POLICY "Allow public student verification" 
ON users FOR SELECT 
TO public 
USING (registration_number IS NOT NULL);

DROP POLICY IF EXISTS "Allow public certificate verification" ON certificates;
CREATE POLICY "Allow public certificate verification" 
ON certificates FOR SELECT 
TO public 
USING (true);

-- 6. Admin Management Policies
DROP POLICY IF EXISTS "Admins can insert users" ON users;
CREATE POLICY "Admins can insert users" 
ON users FOR INSERT 
TO authenticated 
WITH CHECK ( public.is_admin(auth.uid()) );

DROP POLICY IF EXISTS "Admins can delete users" ON users;
CREATE POLICY "Admins can delete users" 
ON users FOR DELETE 
TO authenticated 
USING ( public.is_admin(auth.uid()) );

DROP POLICY IF EXISTS "Admins can update users" ON users;
CREATE POLICY "Admins can update users" 
ON users FOR UPDATE 
TO authenticated 
USING ( public.is_admin(auth.uid()) );

-- 7. Policies for other tables (Certificates, Grades, Assignments, etc.)
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage certificates" ON certificates;
CREATE POLICY "Admins can manage certificates" ON certificates FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage grades" ON grades;
CREATE POLICY "Admins can manage grades" ON grades FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage assignments" ON assignments;
CREATE POLICY "Admins can manage assignments" ON assignments FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
CREATE POLICY "Admins can manage departments" ON departments FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
CREATE POLICY "Admins can manage courses" ON courses FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

---

## 5. Master Admin & Cascade Delete Fixes
Run this if you have issues deleting teachers/students or seeing "infinite recursion" errors:

```sql
-- 1. Ensure public.is_admin is SECURITY DEFINER to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Add CASCADE DELETE to related tables so users can be removed cleanly
-- Assignments
ALTER TABLE public.assignments 
DROP CONSTRAINT IF EXISTS assignments_teacher_id_fkey,
ADD CONSTRAINT assignments_teacher_id_fkey 
  FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Grades
ALTER TABLE public.grades 
DROP CONSTRAINT IF EXISTS grades_student_id_fkey,
ADD CONSTRAINT grades_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.grades 
DROP CONSTRAINT IF EXISTS grades_teacher_id_fkey,
ADD CONSTRAINT grades_teacher_id_fkey 
  FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. Reset and Re-apply Admin Policies for Users table
DROP POLICY IF EXISTS "Admins can delete users" ON users;
CREATE POLICY "Admins can delete users" 
ON users FOR DELETE 
TO authenticated 
USING ( public.is_admin(auth.uid()) );

DROP POLICY IF EXISTS "Admins can update users" ON users;
CREATE POLICY "Admins can update users" 
ON users FOR UPDATE 
TO authenticated 
USING ( public.is_admin(auth.uid()) );
```

### ⚠️ IMPORTANT: Email Confirmation
By default, Supabase requires users to confirm their email address before they can log in.
If your students are getting "Invalid login credentials" even with the correct password:

1. Go to **Authentication** -> **Providers** -> **Email**.
2. Toggle **Confirm email** to **OFF** if you want them to log in immediately.
3. Or, tell students to check their inbox (and spam folder) for the confirmation link.
```

## 2. Initialize Settings Table
If you haven't created the `settings` table yet, or if it's empty, run this:

```sql
-- Create settings table if it doesn't exist with all functional fields
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  fees JSONB,
  flutterwave_public_key TEXT,
  logo_url TEXT,
  hero_bg_url TEXT,
  rector_image_url TEXT,
  anthem_url TEXT,
  anthem_title TEXT DEFAULT 'School Anthem',
  school_name TEXT DEFAULT 'WGTS',
  is_admission_open BOOLEAN DEFAULT TRUE,
  important_dates JSONB,
  admission_notification_email TEXT
);

-- Insert the global settings row with initial defaults
INSERT INTO settings (id, fees, flutterwave_public_key, is_admission_open, important_dates)
VALUES ('global', '{
  "registration": 10000,
  "tuition": {
    "100": 100000,
    "200": 100000,
    "300": 100000,
    "400": 100000
  }
}', 'FLWPUBK_TEST-59e5b8b99061c41001901642cc671e15-X', true, '{
  "applicationOpens": "1st May 2026",
  "applicationDeadline": "30th Aug 2026",
  "orientationBegins": "15th Sept 2026"
}')
ON CONFLICT (id) DO UPDATE SET
  fees = EXCLUDED.fees,
  flutterwave_public_key = EXCLUDED.flutterwave_public_key,
  important_dates = EXCLUDED.important_dates;
```

## 3. Create Storage Bucket
The application expects a storage bucket named `App_files`.

1. Go to **Storage** in your Supabase dashboard.
2. Click **New Bucket**.
3. Name it `App_files`.
4. Set it to **Public** (this is the easiest way to ensure images show up).
5. Click **Save**.

## 4. Create Mail and Gallery Tables
Run this to create the tables for messages and gallery:

```sql
-- Mail Table
CREATE TABLE IF NOT EXISTS mail (
  id BIGSERIAL PRIMARY KEY,
  "to" TEXT,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery Table (Images)
CREATE TABLE IF NOT EXISTS gallery (
  id BIGSERIAL PRIMARY KEY,
  year TEXT,
  caption TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery Videos Table
CREATE TABLE IF NOT EXISTS gallery_videos (
  id BIGSERIAL PRIMARY KEY,
  year TEXT,
  title TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mail ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_videos ENABLE ROW LEVEL SECURITY;

-- Policies for Mail
DROP POLICY IF EXISTS "Public can insert mail" ON mail;
CREATE POLICY "Public can insert mail" ON mail FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can read mail" ON mail;
CREATE POLICY "Admins can read mail" ON mail FOR SELECT TO authenticated USING ( public.is_admin(auth.uid()) );

-- Policies for Gallery
DROP POLICY IF EXISTS "Public can view gallery" ON gallery;
CREATE POLICY "Public can view gallery" ON gallery FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins can manage gallery" ON gallery;
CREATE POLICY "Admins can manage gallery" ON gallery FOR ALL TO authenticated USING ( public.is_admin(auth.uid()) );

-- Policies for Gallery Videos
DROP POLICY IF EXISTS "Public can view gallery_videos" ON gallery_videos;
CREATE POLICY "Public can view gallery_videos" ON gallery_videos FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins can manage gallery_videos" ON gallery_videos;
CREATE POLICY "Admins can manage gallery_videos" ON gallery_videos FOR ALL TO authenticated USING ( public.is_admin(auth.uid()) );
```

## 5. Blog Posts Table

Run this to create the table for the blog:

```sql
-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'draft',
  author_id uuid REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policies for Blog Posts
DROP POLICY IF EXISTS "Public can read published posts" ON blog_posts;
CREATE POLICY "Public can read published posts" ON blog_posts FOR SELECT TO public USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage blog posts" ON blog_posts;
CREATE POLICY "Admins can manage blog posts" ON blog_posts FOR ALL TO authenticated USING ( public.is_admin(auth.uid()) );

DROP POLICY IF EXISTS "Admins can view draft posts" ON blog_posts;
CREATE POLICY "Admins can view draft posts" ON blog_posts FOR SELECT TO authenticated USING ( public.is_admin(auth.uid()) );
```

### Manual Storage Policies (If not Public)
If you prefer not to make the bucket public, add these policies to the `App_files` bucket:

**Allow Uploads:**
- Policy Name: `Allow Authenticated Uploads`
- Allowed Operations: `INSERT`, `UPDATE`
- Target Role: `authenticated`
- Check Expression: `(bucket_id = 'App_files'::text)`

**Allow Reads:**
- Policy Name: `Allow Public Reads`
- Allowed Operations: `SELECT`
- Target Role: `public`
- Check Expression: `(bucket_id = 'App_files'::text)`
