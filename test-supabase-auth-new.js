import { createClient } from '@supabase/supabase-js';

const url = 'https://ttyonsqdftgvcrcqepom.supabase.co';
const key = 'sb_publishable_06MxUSl1DS9osK-WMq9vjQ_pOypW7N-';

const supabase = createClient(url, key);

async function test() {
  console.log('Testing Supabase connection with NEW key...');
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
