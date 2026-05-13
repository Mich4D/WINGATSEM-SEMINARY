import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const rawSupabaseUrl = process.env.VITE_SUPABASE_URL;
const rawSupabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseUrl = rawSupabaseUrl || 'https://placeholder.supabase.co';
const supabaseKey = (rawSupabaseKey && rawSupabaseKey !== 'YOUR_SUPABASE_ANON_KEY') ? rawSupabaseKey : 'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUrl() {
    const { data: globalSet } = await supabase.from('settings').select('value').eq('id', 'global').maybeSingle();
    const dbCloudinaryUrl = globalSet?.value?.cloudinary_url;
    console.log("DB Cloudinary URL:", dbCloudinaryUrl);
}
checkUrl();
