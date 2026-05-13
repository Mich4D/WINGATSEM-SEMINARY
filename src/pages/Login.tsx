import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { BookOpen, ShieldAlert, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { formatImageUrl } from '../utils/formatImage';

import { motion } from 'motion/react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(() => {
    if (typeof window === 'undefined') return false;
    if ((window as any).__IS_PASSWORD_RECOVERY) return true;
    const hasRecoveryHash = window.location.hash && (window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token='));
    const hasRecoverySearch = window.location.search && window.location.search.includes('type=recovery');
    return !!(hasRecoveryHash || hasRecoverySearch);
  });
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');
      if (errorDesc) {
        return decodeURIComponent(errorDesc.replace(/\+/g, ' '));
      }
    } catch (e) {}
    return '';
  });
  const [loading, setLoading] = useState(false);
  
  // Replace email with identifier (email or reg number)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isAdminRole = queryParams.get('role') === 'admin';
  const forceVerify = queryParams.get('verify') === 'true';
  
  const { profile, isPasswordRecovery, setIsPasswordRecovery } = useAuth();
  const { logoUrl } = useSettings();

  useEffect(() => {
    if (isPasswordRecovery) {
      setIsResettingPassword(true);
      setIsForgotPassword(false);
    }
  }, [isPasswordRecovery]);

  useEffect(() => {
    if (window.location.hash && window.location.hash.includes('type=recovery')) {
      setIsResettingPassword(true);
      setIsForgotPassword(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
        setIsForgotPassword(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check login redirection & 2FA requirement
  React.useEffect(() => {
    const isActuallyResetting = (window as any).__IS_PASSWORD_RECOVERY ||
                               window.location.hash.includes('type=recovery') || 
                               window.location.hash.includes('access_token=') ||
                               isResettingPassword ||
                               isPasswordRecovery;

    if (profile && !isActuallyResetting) {
      if (profile.role === 'admin') {
        navigate('/admin');
      } else if (profile.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/dashboard');
      }
    } else if (forceVerify && !profile) {
      // If forced to verify but not logged in, drop the flag
      navigate('/login', { replace: true });
    }
  }, [profile, navigate, isResettingPassword, isPasswordRecovery]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = identifier.trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      setError('Please enter a valid email address to reset your password.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, {
        redirectTo: `${window.location.origin}/login?type=recovery`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      let msg = err.message || 'Failed to send password reset email. Please try again.';
      if (msg.toLowerCase().includes('request this after')) {
        msg = `Rate Limit: ${msg}. Please wait a few moments before trying again.`;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      alert('Password updated successfully! Please sign in with your new password.');
      await supabase.auth.signOut();
      setIsResettingPassword(false);
      setIsPasswordRecovery(false);
      (window as any).__IS_PASSWORD_RECOVERY = false;
      setIsLogin(true);
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId || !password.trim()) {
      setError('Please enter both your identifier (Email or Reg No) and password.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      let targetEmail = cleanId;
      
      // If logging in and looking like a reg number, lookup the email
      if (isLogin && !cleanId.includes('@')) {
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('registration_number', cleanId)
          .single();
          
        if (userError || !userRecord?.email) {
          throw new Error("Could not find a student with that Registration Number.");
        }
        targetEmail = userRecord.email;
      } else if (!isLogin && !cleanId.includes('@')) {
        throw new Error("Registration requires a valid email address.");
      }

      if (isLogin) {
        await supabase.auth.signOut().catch(() => {});

        const { error } = await supabase.auth.signInWithPassword({ email: targetEmail, password });
        
        if (error) {
          setPassword('');
          throw error;
        }
      } else {
        const { data: settingsData } = await supabase.from('settings').select('is_admission_open').eq('id', 'global').single();
        if (settingsData && settingsData.is_admission_open === false) {
          setError('The admission portal is currently closed. New registrations are not accepted at this time.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({ 
          email: targetEmail, 
          password,
          options: {
            data: { full_name: targetEmail.split('@')[0] },
            emailRedirectTo: `${window.location.origin}/login`
          }
        });
        if (error) throw error;

        if (data.user) {
          const { error: upsertError } = await supabase.from('users').upsert({
            id: data.user.id,
            name: targetEmail.split('@')[0],
            email: targetEmail,
            role: 'student',
            is_approved: false
          });
          
          if (upsertError) console.error("Error creating user profile:", upsertError);

          setRegistrationSuccess(true);
          try {
            await supabase.from('mail').insert([{
              to: 'wingatsem@gmail.com',
              subject: `New Student Registration: ${targetEmail}`,
              body: `A new student has registered with the email: ${targetEmail}.\n\nPlease check the admin dashboard to review their profile once they complete it.`,
              status: 'pending'
            }]);
          } catch (mailError) {
            console.error("Failed to send admin notification:", mailError);
          }
        }
      }
    } catch (err: any) {
      let msg = err.message || 'Authentication failed. Please try again.';
      if (msg.includes('Failed to fetch')) {
        msg = 'Connection Error: Could not reach the server. Please check your internet connection or disable ad-blockers.';
      } else if (msg.includes('Invalid API key') || msg.includes('JWT')) {
        msg = 'Configuration Error: Invalid or missing Supabase API Key. Please make sure to add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the AI Studio Settings "Secrets" panel.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'Invalid credentials. Please check your inputs and try again.';
        if (cleanId.toLowerCase() === 'wingatsem@gmail.com') {
          msg += ' If you have not created your admin account yet, please choose "Register here" first. Once registered, visit /bootstrap to elevate your account to Admin.';
        }
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Please confirm your email address before signing in. Check your inbox for the confirmation link.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-serif font-bold text-slate-900 mb-4">Registration Successful!</h2>
          <p className="text-slate-600 mb-8">
            We've sent a confirmation link to <span className="font-bold text-slate-900">{identifier}</span>. 
            Please check your email and click the link to activate your account.
          </p>
          <button
            onClick={() => {
              setRegistrationSuccess(false);
              setIsLogin(true);
              setError('');
            }}
            className="w-full py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-medium text-white bg-[#b8860b] hover:bg-[#9a7009] transition-all"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      
      <div className="hidden lg:flex lg:w-1/2 bg-[#b8860b] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center"
        >
          {logoUrl ? (
            <motion.img 
              src={formatImageUrl(logoUrl)} 
              alt="Winning Gate Logo" 
              className="w-64 h-64 object-contain drop-shadow-2xl"
              referrerPolicy="no-referrer"
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <motion.div 
              className="w-48 h-48 bg-white rounded-full flex items-center justify-center text-[#b8860b] shadow-2xl"
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <BookOpen size={80} />
            </motion.div>
          )}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-8 text-4xl font-serif font-bold text-white text-center leading-tight"
          >
            Winning Gate Christian <br/> Theological Seminary
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-4 text-yellow-100 text-lg text-center max-w-md"
          >
            Equipping leaders for global impact through transformative theological education.
          </motion.p>
        </motion.div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
          <div className="text-center lg:text-left">
            <div className="lg:hidden mb-6 flex justify-center">
              {logoUrl ? (
                <img src={formatImageUrl(logoUrl)} alt="Winning Gate Logo" className="h-20 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-16 w-16 bg-[#b8860b] rounded-full flex items-center justify-center text-white shadow-lg"><BookOpen size={32} /></div>
              )}
            </div>
            
            <h2 className="text-3xl font-serif font-bold text-[#b8860b] mb-2">
              {isResettingPassword ? 'Create New Password' : (isForgotPassword ? 'Reset Password' : (isAdminRole ? 'Admin Portal' : 'Student Portal'))}
            </h2>
            <p className="text-sm text-slate-500">
              {isResettingPassword 
                ? 'Please enter your new secure password below.'
                : (isForgotPassword 
                  ? 'Enter your email to receive a password reset link.' 
                  : (isLogin ? 'Sign in to access your dashboard.' : 'Create an account to get started.'))}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
              <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-8">
            {isResettingPassword ? (
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="appearance-none rounded-xl relative block w-full px-4 py-4 pr-12 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent sm:text-lg"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#b8860b] focus:outline-none">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-medium text-white bg-[#b8860b] hover:bg-[#9a7009] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b8860b] transition-all disabled:opacity-70">
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            ) : isForgotPassword ? (
              <div className="space-y-6">
                {resetSent ? (
                  <div className="text-center">
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md mb-6">
                      <p className="text-sm text-green-700">Password reset email sent! Check your inbox for instructions.</p>
                    </div>
                    <button onClick={() => { setIsForgotPassword(false); setResetSent(false); }} className="text-sm font-medium text-[#b8860b] hover:text-[#9a7009] transition-colors">Return to login</button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="appearance-none rounded-xl relative block w-full px-4 py-4 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent sm:text-lg"
                        placeholder="you@example.com"
                        disabled={loading}
                      />
                    </div>
                    <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-medium text-white bg-[#b8860b] hover:bg-[#9a7009] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b8860b] transition-all disabled:opacity-70">
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    <div className="text-center">
                      <button type="button" onClick={() => { setIsForgotPassword(false); setError(''); }} className="text-sm font-medium text-[#b8860b] hover:text-[#9a7009] transition-colors">Back to login</button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {isLogin ? 'Registration Number or Email' : 'Email Address'}
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full px-4 py-4 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent sm:text-lg"
                    placeholder={isLogin ? "WGTS/... or Email" : "you@example.com"}
                    disabled={loading}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    {isLogin && (
                      <button type="button" onClick={() => { setIsForgotPassword(true); setError(''); setResetSent(false); }} className="text-sm font-medium text-[#b8860b] hover:text-[#9a7009]">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none rounded-xl relative block w-full px-4 py-4 pr-12 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent sm:text-lg"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#b8860b] focus:outline-none">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-medium text-white bg-[#b8860b] hover:bg-[#9a7009] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b8860b] transition-all disabled:opacity-70">
                  {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Register')}
                </button>
              </form>
            )}
            
            {!isForgotPassword && (
              <div className="mt-6 flex flex-col gap-3 text-center">
                <button onClick={() => { setIsLogin(!isLogin); setError(''); setIdentifier(''); setPassword(''); }} className="text-sm font-medium text-[#b8860b] hover:text-[#9a7009] transition-colors">
                  {isLogin ? "Don't have an account? Register here" : "Already have an account? Sign in"}
                </button>
                <button onClick={() => navigate('/staff-portal')} className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                  Staff Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
