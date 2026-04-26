import { createClient } from '@supabase/supabase-js';

const url = 'https://ttyonsqdftgvcrcqepom.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0eW9uc3FkZnRndmNyY3FlcG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjU1NTEsImV4cCI6MjA5MTQwMTU1MX0.WTDlW8qulNU8dgxpMKuA-iwrn-U-LpwPCTPt3CPSl3A';

const supabase = createClient(url, key);

async function test() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    
    if (error) {
      console.log('Error (Expected if wrong password, but proves connection works):', error.message);
    } else {
      console.log('Success:', data);
    }
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

test();
