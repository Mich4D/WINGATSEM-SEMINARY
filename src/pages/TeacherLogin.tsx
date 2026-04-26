import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { GraduationCap, ShieldAlert, ArrowRight, BookOpen } from 'lucide-react';
import { formatImageUrl } from '../utils/formatImage';
import { motion } from 'motion/react';

export default function TeacherLogin() {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithPasskey } = useAuth();
  const { logoUrl } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) {
      setError('Please enter your teacher passkey.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loginWithPasskey(passkey);
      navigate('/teacher');
    } catch (err: any) {
      setError(err.message || 'Invalid passkey. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Side - Big Animated Logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#b8860b] items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative background elements */}
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
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
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

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
          <div className="text-center lg:text-left">
            {/* Mobile logo (hidden on desktop) */}
            <div className="lg:hidden mb-6 flex justify-center">
              {logoUrl ? (
                <img 
                  src={formatImageUrl(logoUrl)} 
                  alt="Winning Gate Logo" 
                  className="h-20 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-16 w-16 bg-[#b8860b] rounded-full flex items-center justify-center text-white shadow-lg">
                  <BookOpen size={32} />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-[#b8860b]">
                <GraduationCap size={20} />
              </div>
              <h2 className="text-3xl font-serif font-bold text-[#b8860b]">
                Teacher Portal
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Enter your passkey to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
              <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teacher Passkey</label>
                <input
                  type="text"
                  required
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-4 py-4 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent sm:text-lg text-center font-mono tracking-widest"
                  placeholder="WGTS/TCH/..."
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-medium text-white bg-[#b8860b] hover:bg-[#9a7009] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b8860b] transition-all disabled:opacity-70"
              >
                {loading ? 'Verifying...' : (
                  <>
                    Access Dashboard <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/staff-portal')}
                className="text-sm font-medium text-[#b8860b] hover:text-[#9a7009] transition-colors"
              >
                Back to Staff Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

