fetch('https://ttyonsqdftgvcrcqepom.supabase.co/auth/v1/health')
  .then(r => r.json())
  .then(data => console.log('SUCCESS:', data))
  .catch(err => console.error('ERROR:', err.message));
