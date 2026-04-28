import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data: settingsData, error } = await supabase.from('settings').select('is_admission_open').eq('id', 'global').single();
  console.log('Settings Data:', settingsData);
  console.log('Settings Error:', error);
}
run();
