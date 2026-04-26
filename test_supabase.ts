import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ttyonsqdftgvcrcqepom.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0eW9uc3FkZnRndmNyY3FlcG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjU1NTEsImV4cCI6MjA5MTQwMTU1MX0.WTDlW8qulNU8dgxpMKuA-iwrn-U-LpwPCTPt3CPSl3A');

async function test() {
  const { data, error } = await supabase.from('settings').upsert({
    id: 'global',
    logo_url: 'test'
  });
  console.log('Upsert result:', { data, error });
}

test();
