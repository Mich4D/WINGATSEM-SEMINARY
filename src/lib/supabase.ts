import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper to check if a URL is valid
const isValidUrl = (url: string | undefined) => {
  try {
    if (!url || url === 'undefined') return false;
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Robust URL detection
let finalUrl = supabaseUrl;
const finalKey = supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' ? supabaseAnonKey : 'placeholder-key';

if (!isValidUrl(finalUrl) && finalKey.startsWith('eyJ')) {
  try {
    // Try to extract project ref from JWT
    const payload = JSON.parse(atob(finalKey.split('.')[1]));
    if (payload.ref) {
      finalUrl = `https://${payload.ref}.supabase.co`;
      console.log('Reconstructed Supabase URL from Key:', finalUrl);
    }
  } catch (e) {
    console.error('Failed to parse Supabase key:', e);
  }
}

if (!isValidUrl(finalUrl)) {
  finalUrl = 'https://placeholder.supabase.co';
}

console.log('Supabase Init:', { 
  url: finalUrl, 
  hasKey: !!supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' 
});

if (finalUrl.includes('placeholder') || !supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.warn('Supabase credentials not found or invalid. Using placeholder credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

export const supabase = createClient(finalUrl as string, finalKey as string);
