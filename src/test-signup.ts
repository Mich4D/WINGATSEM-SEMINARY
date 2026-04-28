import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const email = `teststudent${Date.now()}@example.com`;
  console.log('registering:', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: { data: { full_name: 'test' } }
  });
  console.log('Signup result:', { data: !!data.user, error: error?.message });
  
  if (data.user) {
    const { error: upsertError } = await supabase.from('users').upsert({
      id: data.user.id,
      name: 'test',
      email: email,
      role: 'student',
      is_approved: false
    });
    console.log('Upsert result:', { error: upsertError?.message });
  }

  const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
    email,
    password: 'password123'
  });
  console.log('Signin result:', { data: !!signinData.session, error: signinError?.message });
}
run();
