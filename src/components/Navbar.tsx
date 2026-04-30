import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { BookOpen, LogOut, Menu, X, Search, ChevronDown, User, Settings, LayoutDashboard, Download, Smartphone } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import { formatImageUrl } from '../utils/formatImage';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const isLoggedIn = !!user || !!profile;
  const { logoUrl } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const { isInstallable, install, isStandalone } = usePWA();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';
  
  const navBackground = 'bg-white shadow-sm text-slate-800';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setShowUserMenu(false);
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const linkClass = (path: string) => `
    relative font-semibold text-sm transition-all duration-300
    ${isActive(path) 
      ? 'text-slate-900' 
      : 'text-slate-600 hover:text-slate-900'}
  `;

  const NavLink = ({ to, children }: { to: string, children: React.ReactNode }) => (
    <Link to={to} className={linkClass(to)}>
      {children}
      {isActive(to) && (
        <motion.div 
          layoutId="activeNav"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-yellow-600 rounded-full"
        />
      )}
    </Link>
  );

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${navBackground}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center transition-all duration-500 ${isScrolled ? 'h-16' : 'h-20 md:h-24'}`}>
          {/* Top-Left Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3">
              {logoUrl ? (
                <img 
                  src={formatImageUrl(logoUrl)} 
                  alt="Winning Gate Logo" 
                  className="h-16 md:h-20 w-auto object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="bg-yellow-600 p-2 md:p-2.5 rounded-full text-white shadow-lg flex items-center gap-2">
                  <BookOpen size={32} />
                </div>
              )}
            </Link>
          </div>
          
          {/* Top-Right Navigation & Actions */}
          <div className="flex items-center gap-3 lg:gap-4 xl:gap-8">
            {/* Desktop Navigation Menu */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
              {profile?.role === 'student' ? (
                <>
                  <NavLink to="/dashboard">Dashboard</NavLink>
                  <NavLink to="/dashboard?tab=courses">Academics</NavLink>
                  <NavLink to="/dashboard?tab=paycenter">Finance</NavLink>
                </>
              ) : profile?.role === 'teacher' ? (
                <>
                  <NavLink to="/teacher">Dashboard</NavLink>
                  <NavLink to="/class/general">Classroom</NavLink>
                  <NavLink to="/live">Live Events</NavLink>
                </>
              ) : profile?.role === 'admin' ? (
                <>
                  <NavLink to="/admin">Dashboard</NavLink>
                  <NavLink to="/class/general">Classroom</NavLink>
                  <NavLink to="/live">Live Events</NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/">Home</NavLink>
                  <NavLink to="/about">About</NavLink>
                  <NavLink to="/programmes">Programmes</NavLink>
                  <NavLink to="/admissions">Admissions</NavLink>
                  <NavLink to="/gallery">Gallery</NavLink>
                  <NavLink to="/blog">Blog</NavLink>
                  <Link to="/live" className="flex items-center gap-1.5 text-slate-800 hover:text-slate-900 font-semibold transition-all">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Live Event
                  </Link>
                  <NavLink to="/contact">Contact</NavLink>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 lg:gap-4 ml-2 xl:ml-4">
              {isLoggedIn ? (
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-4 pr-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-yellow-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm overflow-hidden">
                      {profile?.profileImageUrl ? (
                        <img src={formatImageUrl(profile.profileImageUrl)} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        profile?.displayName?.charAt(0) || <User size={14} />
                      )}
                    </div>
                    <span className="text-[10px] font-bold truncate max-w-[80px] hidden lg:block uppercase tracking-wider">{profile?.displayName?.split(' ')[0] || 'User'}</span>
                    <ChevronDown size={12} className={`transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden py-2"
                      >
                        <div className="px-4 py-3 border-b border-slate-50 mb-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Signed in as</p>
                          <p className="text-xs font-bold text-slate-900 truncate">{profile?.email}</p>
                        </div>
                        <Link 
                          to={profile?.role === 'admin' ? '/admin' : profile?.role === 'teacher' ? '/teacher' : '/dashboard'} 
                          className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-wider"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <LayoutDashboard size={16} className="text-yellow-600" />
                          Dashboard
                        </Link>
                        {isInstallable && (
                          <button 
                            onClick={() => {
                              install();
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-wider"
                          >
                            <Download size={16} className="text-yellow-600" />
                            Install App
                          </button>
                        )}
                        <button 
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors mt-1 uppercase tracking-wider"
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link 
                    to="/login" 
                    className="hidden lg:block font-semibold text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Student Login
                  </Link>
                  <Link 
                    to="/staff-portal" 
                    className="hidden lg:flex px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded font-semibold text-sm transition-all shadow-[0_0_15px_rgba(30,58,138,0.5)]"
                  >
                    Teacher Portal
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <div className="lg:hidden flex items-center gap-2">
                <button 
                  onClick={() => setIsOpen(!isOpen)} 
                  className={`p-2 rounded-lg transition-colors ${isHome && !isScrolled ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-slate-100'}`}
                >
                  {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-slate-100 overflow-hidden shadow-2xl"
          >
            <div className="px-4 pt-1 pb-8 space-y-0.5">
              {profile?.role === 'student' ? (
                <>
                  <MobileNavLink to="/dashboard">Overview</MobileNavLink>
                  <MobileNavLink to="/dashboard?tab=courses">Courses</MobileNavLink>
                  <MobileNavLink to="/dashboard?tab=paycenter">Pay Center</MobileNavLink>
                </>
              ) : profile?.role === 'teacher' ? (
                <>
                  <MobileNavLink to="/teacher">Teacher Portal</MobileNavLink>
                  <MobileNavLink to="/class/general">Classroom</MobileNavLink>
                  <MobileNavLink to="/live">Live Events</MobileNavLink>
                </>
              ) : profile?.role === 'admin' ? (
                <>
                  <MobileNavLink to="/admin">Admin Dashboard</MobileNavLink>
                  <MobileNavLink to="/class/general">Classroom</MobileNavLink>
                  <MobileNavLink to="/live">Live Events</MobileNavLink>
                </>
              ) : (
                <>
                  <MobileNavLink to="/">Home</MobileNavLink>
                  <MobileNavLink to="/about">About</MobileNavLink>
                  <MobileNavLink to="/programmes">Programmes</MobileNavLink>
                  <MobileNavLink to="/admissions">Admissions</MobileNavLink>
                  <MobileNavLink to="/gallery">Gallery</MobileNavLink>
                  <MobileNavLink to="/blog">Blog</MobileNavLink>
                  <MobileNavLink to="/live" className="text-red-600 font-bold border-l-4 border-red-600 bg-red-50">Live Event</MobileNavLink>
                  <MobileNavLink to="/contact">Contact</MobileNavLink>
                </>
              )}
              
              {isInstallable && !isStandalone && (
                <button 
                  onClick={install}
                  className="w-full flex items-center gap-4 px-4 py-3 text-base font-bold text-yellow-600 bg-yellow-50 rounded-xl transition-all active:translate-x-1"
                >
                  <Download size={20} />
                  Install App
                </button>
              )}
              
              {/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream && !isStandalone && (
                <div className="mx-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mt-2">
                  <p className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Smartphone size={14} className="text-yellow-600" />
                    How to Install on iPhone
                  </p>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Tap the <span className="font-bold">Share</span> button and select <span className="font-bold">"Add to Home Screen"</span>.
                  </p>
                </div>
              )}
              
              <div className="mt-2 pt-4 border-t border-slate-100 space-y-3 px-3">
                {isLoggedIn ? (
                  <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-50 text-red-600 font-bold text-sm tracking-widest uppercase transition-all active:scale-95">
                    <LogOut size={18} />
                    Sign Out
                  </button>
                ) : (
                  <>
                    <Link to="/login" className="block w-full text-center py-3.5 rounded-xl bg-slate-50 text-slate-900 font-bold text-sm tracking-widest uppercase">Student Login</Link>
                    <Link to="/staff-portal" className="block w-full text-center py-3.5 rounded-xl bg-blue-900 text-white font-bold text-sm tracking-widest uppercase shadow-lg shadow-blue-900/40">Teacher Portal</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function MobileNavLink({ to, children, className = '' }: { to: string, children: React.ReactNode, className?: string }) {
  return (
    <Link 
      to={to} 
      className={`block px-4 py-3 text-base font-bold text-slate-700 hover:bg-slate-50 hover:text-yellow-600 rounded-xl transition-all active:translate-x-1 ${className}`}
    >
      {children}
    </Link>
  );
}
