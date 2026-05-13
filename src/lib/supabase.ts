import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper to check if a URL is valid
const isValidUrl = (url: string | undefined) => {
  try {
    if (!url || url === 'undefined' || url.includes('placeholder')) return false;
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Robust URL detection
let finalUrl = supabaseUrl;
const finalKey = supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' ? supabaseAnonKey : '';

// Function to decode JWT securely
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

if (!isValidUrl(finalUrl) && finalKey && finalKey.startsWith('eyJ')) {
  const payload = decodeJWT(finalKey);
  if (payload && payload.ref) {
    finalUrl = `https://${payload.ref}.supabase.co`;
    console.log('Successfully reconstructed Supabase URL from Anon Key:', finalUrl);
  }
}

const isUsingPlaceholder = !isValidUrl(finalUrl) || !finalKey;

if (isUsingPlaceholder) {
  // If we still don't have a valid URL but we HAVE a key that looks like it might have a ref
  // but Reconstruction failed for some reason, we use a slightly better fallback if possible
  finalUrl = finalUrl || 'https://placeholder.supabase.co';
}

console.log('Supabase Final Config:', { 
  url: finalUrl, 
  hasKey: !!finalKey,
  isPlaceholder: isUsingPlaceholder,
  envUrlAvailable: !!supabaseUrl,
  envKeyAvailable: !!supabaseAnonKey
});

if (isUsingPlaceholder) {
  console.warn('CRITICAL: Supabase credentials missing. Check your environment variables / secrets.');
}

export const supabase = createClient(finalUrl as string, finalKey || 'placeholder-key');
