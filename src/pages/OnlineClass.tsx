import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, ArrowLeft, ShieldAlert, Lock, Video, Mic } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Add type for Jitsi API
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function OnlineClass() {
  const { classId } = useParams<{ classId: string }>();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [accessDenied, setAccessDenied] = useState(false);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  
  const [classMode, setClassMode] = useState<'setup' | 'video' | 'audio' | 'settings'>('setup');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamMuted, setIsCamMuted] = useState(false);
  
  // Verification states
  const [verificationStep, setVerificationStep] = useState<'reg' | 'otp' | 'verified'>('verified');
  const [inputReg, setInputReg] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Settings
  const [prejoinEnabled, setPrejoinEnabled] = useState(true);

  // Constants for JaaS
  const JAAS_APP_ID = "vpaas-magic-cookie-caa2a4ec4e874f4b9413e72d1e00a9ff";
  const JITSI_DOMAIN = "8x8.vc";

  // Create a unique room name based on the class ID
  const getRoomName = (programType: string) => {
    switch(programType.toLowerCase()) {
      case "diploma":
      case "dp":
        return "wgts-diploma-class";
      case "bachelor":
      case "bd":
        return "wgts-bachelor-class";
      case "master":
      case "md":
        return "wgts-master-class";
      case "doctor":
      case "doctorate":
      case "dd":
        return "wgts-doctor-class";
      default:
        return "wgts-general-class";
    }
  };

  const roomName = classId?.startsWith('wgts-') ? classId : getRoomName(classId || '');

  useEffect(() => {
    if (loading) return;

    if (!classId) {
      navigate('/login');
      return;
    }

    if (!user && profile?.role !== 'teacher') {
      navigate('/login');
      return;
    }
    
    if (profile && !profile.isApproved && profile.role !== 'admin' && profile.role !== 'teacher') {
      setAccessDenied(true);
      return;
    }

    // Set up verification gate for students
    if (profile?.role === 'student' && !sessionStorage.getItem(`wgts_class_verified_${classId}`)) {
      setVerificationStep('reg');
    } else {
      setVerificationStep('verified');
    }

  }, [user, profile, classId, navigate, loading]);

  useEffect(() => {
    // Only load Jitsi API if we are joining a video/audio class
    if ((classMode === 'video' || classMode === 'audio') && !window.JitsiMeetExternalAPI) {
      const script = document.createElement("script");
      script.src = `https://${JITSI_DOMAIN}/${JAAS_APP_ID}/external_api.js`;
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [classMode]);

  useEffect(() => {
    // Cleanup function when component unmounts or mode changes
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, []);

  const initJitsi = () => {
    if (!window.JitsiMeetExternalAPI || !jitsiContainerRef.current) return;
    
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
    }

    const startAudioOnly = classMode === 'audio';

    const options = {
      roomName: `${JAAS_APP_ID}/${roomName}`,
      jwt: "eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtY2FhMmE0ZWM0ZTg3NGY0Yjk0MTNlNzJkMWUwMGE5ZmYvNGQzYjY4LVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NzcxMzA4NTMsImV4cCI6MTc3NzEzODA1MywibmJmIjoxNzc3MTMwODQ4LCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtY2FhMmE0ZWM0ZTg3NGY0Yjk0MTNlNzJkMWUwMGE5ZmYiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOnRydWUsImZpbGUtdXBsb2FkIjp0cnVlLCJvdXRib3VuZC1jYWxsIjp0cnVlLCJzaXAtb3V0Ym91bmQtY2FsbCI6ZmFsc2UsInRyYW5zY3JpcHRpb24iOnRydWUsImxpc3QtdmlzaXRvcnMiOmZhbHNlLCJyZWNvcmRpbmciOnRydWUsImZsaXAiOmZhbHNlfSwidXNlciI6eyJoaWRkZW4tZnJvbS1yZWNvcmRlciI6ZmFsc2UsIm1vZGVyYXRvciI6dHJ1ZSwibmFtZSI6IndpbmdhdHNlbSIsImlkIjoiZ29vZ2xlLW9hdXRoMnwxMDk5MjYyNTQ4MjE3MjUyMzQ3NjEiLCJhdmF0YXIiOiIiLCJlbWFpbCI6IndpbmdhdHNlbUBnbWFpbC5jb20ifX0sInJvb20iOiIqIn0.XLUUjKvdJ7OPjOH9sJOqO8VjoktFIJh7pejd4UtJPtkgEQMPiJTyVTE2jfqoaZZn6F32vYaFH9QHg5NuoVn96mpvzsOBaYva2DG7R3KPTW_PSiVySGdTQvPt8n-N0_jSJYXzNdbMIlqu7okCWltXInMeL5E4Qjrzj2d4pF9c2ha-B0wNxgPC0Kmwgcuj15XXkmNGJ28OM895rm4rvTqHDJWizwMrRpfgeZM1OtvgQJHA8VTBbaCjxwszAJbx9E8BSz1vKZikKzobUhIplkY9ge_dQAyb4YKLyP_X3za_LmGhAmsuq-SDgytBTKcobPzD72xLkm_h0RtxpaAapjwJkA",
      parentNode: jitsiContainerRef.current,
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: startAudioOnly,
        prejoinPageEnabled: prejoinEnabled,
        prejoinConfig: {
            enabled: prejoinEnabled
        },
        enableTopBar: false,
        disableVideoBackground: true,
        disableLocalVideoFlip: true,
        disableInviteFunctions: true,
      },
      interfaceConfigOverwrite: {
        TILE_VIEW_MAX_COLUMNS: 2,
        HIDE_INVITE_MORE_HEADER: true,
        TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'chat', 'raisehand',
            'videoquality', 'filmstrip', 'shortcuts',
            'tileview', 'videobackgroundblur', 'mute-everyone'
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false,
        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
        VIDEO_LAYOUT_FIT: 'both',
        ENFORCE_NOTIFICATION_AUTO_DISMISS: true,
      },
      userInfo: {
        displayName: profile?.displayName || profile?.registrationNumber || 'Student'
      }
    };

    const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, options);
    jitsiApiRef.current = api;
    
    api.addListener('videoMuteStatusChanged', (e: any) => setIsCamMuted(e.muted));
    api.addListener('audioMuteStatusChanged', (e: any) => setIsMicMuted(e.muted));
    
    // Auto-adjust layout logic
    setTimeout(() => {
        api.executeCommand('toggleTileView');
    }, 2000);
  };

  useEffect(() => {
    // Check periodically for Jitsi API if it hasn't loaded immediately
    let interval: NodeJS.Timeout;
    
    if ((classMode === 'video' || classMode === 'audio') && jitsiContainerRef.current && !jitsiApiRef.current) {
      if (window.JitsiMeetExternalAPI) {
        initJitsi();
      } else {
        interval = setInterval(() => {
          if (window.JitsiMeetExternalAPI) {
            initJitsi();
            clearInterval(interval);
          }
        }, 500);
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [classMode]);

  const leaveClass = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
    
    if (profile?.role === 'admin') {
      navigate('/admin');
    } else if (profile?.role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/dashboard');
    }
  };

  const joinClass = (mode: 'video' | 'audio') => {
    setClassMode(mode);
  };

  const handleVerifyReg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    const submittedReg = inputReg.trim().toUpperCase();
    const actualReg = profile.registrationNumber?.trim().toUpperCase();
    
    if (!actualReg || submittedReg !== actualReg) {
      setVerifyError('Incorrect Registration Number. Please ensure you are entering the correct ID assigned to your account.');
      return;
    }

    setIsVerifying(true);
    setVerifyError('');

    try {
      const resp = await fetch('/api/send-class-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: profile.email, 
          phone: profile.phoneNumber, 
          studentName: profile.displayName || profile.name, 
          regNumber: actualReg 
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setVerificationStep('otp');
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsVerifying(true);
    setVerifyError('');

    try {
      const resp = await fetch('/api/verify-class-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, code: otpCode })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Invalid OTP');
      
      sessionStorage.setItem(`wgts_class_verified_${classId}`, 'true');
      setVerificationStep('verified');
      setVerifyError('');
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-slate-700 border-t-yellow-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl border border-slate-700">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-slate-400 mb-8">
            Your account has not been approved yet. Only approved students can access the live class portal. Please contact administration for approval.
          </p>
          <button 
            onClick={leaveClass}
            className="w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (verificationStep !== 'verified') {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col overflow-hidden relative">
        <div className="absolute top-4 left-4">
          <button 
            onClick={leaveClass}
            className="p-2 hover:bg-slate-800 text-white rounded-full transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} /> Back
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl border border-slate-700">
            <div className="w-16 h-16 bg-yellow-600/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={32} />
            </div>
            
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              {verificationStep === 'reg' ? 'Classroom Security' : 'Verification Required'}
            </h2>
            <p className="text-slate-400 text-center mb-8 text-sm">
              {verificationStep === 'reg' 
                ? 'To join this lecture, please confirm your student Registration Number.'
                : 'Enter the 6-digit code sent to your registered email or phone.'}
            </p>

            {verifyError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
                {verifyError}
              </div>
            )}

            {verificationStep === 'reg' && (
              <form onSubmit={handleVerifyReg} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Registration Number</label>
                  <input
                    type="text"
                    required
                    value={inputReg}
                    onChange={(e) => setInputReg(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 transition-all font-mono"
                    placeholder="e.g. WGTS/DP/..."
                    disabled={isVerifying}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isVerifying || !inputReg.trim()}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-700 disabled:text-slate-400 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  {isVerifying ? 'Verifying...' : 'Continue'}
                </button>
              </form>
            )}

            {verificationStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">6-Digit Code</label>
                  <input
                    type="text"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-4 text-center tracking-[1em] focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 transition-all font-mono text-xl font-bold"
                    placeholder="------"
                    disabled={isVerifying}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={isVerifying || otpCode.length < 6}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-700 disabled:text-slate-400 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  {isVerifying ? 'Verifying Code...' : 'Enter Classroom'}
                </button>
                <div className="text-center mt-4">
                  <button 
                    type="button" 
                    onClick={() => setVerificationStep('reg')}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-md z-10 w-full relative">
        <div className="flex items-center gap-4">
          <button 
            onClick={classMode === 'setup' || classMode === 'settings' ? leaveClass : () => {
              if (jitsiApiRef.current) { jitsiApiRef.current.dispose(); jitsiApiRef.current = null; }
              setClassMode('setup');
            }}
            className="p-2 hover:bg-slate-700 text-white rounded-full transition-colors bg-slate-700 shadow flex items-center justify-center"
            title={classMode === 'setup' ? "Back to Dashboard" : "Back to Setup"}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Virtual Class Session</h1>
            <p className="text-sm text-slate-400">Class: {classId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
            <ShieldAlert size={14} />
            <span>Secure Connection</span>
          </div>
          {classMode !== 'setup' && (
            <div className="flex items-center gap-2 bg-slate-700 px-3 py-1.5 rounded-full text-sm">
              <Users size={16} />
              <span>Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative bg-black flex flex-col items-center justify-center overflow-hidden">
        {classMode === 'setup' || classMode === 'settings' ? (
          <div className="flex-1 flex items-center justify-center p-4 w-full h-full bg-slate-900">
            <div className="bg-slate-800 p-8 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-700">
              {classMode === 'setup' ? (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-bold text-white">Join Live Class</h2>
                    {(profile?.role === 'admin' || profile?.role === 'teacher') && (
                      <button 
                        onClick={() => setClassMode('settings')}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Advanced Settings"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      </button>
                    )}
                  </div>
                  <p className="text-slate-400 mb-8">How would you like to join this session?</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <button
                      onClick={() => joinClass('video')}
                      className="flex flex-col items-center justify-center gap-4 p-6 bg-slate-700 hover:bg-slate-600 rounded-xl border-2 border-transparent hover:border-yellow-500 transition-all group"
                    >
                      <div className="w-16 h-16 bg-slate-800 group-hover:bg-yellow-500/20 rounded-full flex items-center justify-center transition-colors">
                        <Video size={32} className="text-white group-hover:text-yellow-500" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-white">Video Class</h3>
                        <p className="text-xs text-slate-400 mt-1">Camera and microphone</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => joinClass('audio')}
                      className="flex flex-col items-center justify-center gap-4 p-6 bg-slate-700 hover:bg-slate-600 rounded-xl border-2 border-transparent hover:border-yellow-500 transition-all group"
                    >
                      <div className="w-16 h-16 bg-slate-800 group-hover:bg-yellow-500/20 rounded-full flex items-center justify-center transition-colors">
                        <Mic size={32} className="text-white group-hover:text-yellow-500" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-white">Audio Class</h3>
                        <p className="text-xs text-slate-400 mt-1">Microphone only</p>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button 
                      onClick={() => setClassMode('setup')}
                      className="text-slate-400 hover:text-white"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl font-bold text-white">Advanced Settings</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-white">Enable Device Selection Screen</h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={prejoinEnabled}
                            onChange={(e) => setPrejoinEnabled(e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                        </label>
                      </div>
                      <p className="text-xs text-slate-400">
                        Turn this on to show a screen before joining where you can select your specific camera and microphone.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex-1 relative overflow-hidden group bg-black">
            {/* Logo overlay to cover Jitsi watermark */}
            <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur px-5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl border border-slate-700/50 z-50 pointer-events-none min-w-[220px]">
              <div className="w-10 h-10 border-[2px] border-yellow-500 rounded-full flex items-center justify-center p-0.5 shadow-lg bg-slate-900 border-t-yellow-300">
                <div className="w-full h-full bg-slate-800 rounded-full flex justify-center items-center overflow-hidden relative">
                  <div className="absolute inset-x-0 bottom-0 top-1/2 bg-yellow-600/20 rounded-b-full"></div>
                  <div className="flex -space-x-1 mt-1 z-10">
                    <div className="w-1.5 h-3 bg-white rounded-sm transform rotate-12"></div>
                    <div className="w-1.5 h-3 bg-yellow-500 rounded-sm transform -rotate-12 translate-y-[1px]"></div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg leading-none tracking-tight">Wgts.</span>
                <span className="text-yellow-500 text-[10px] font-medium leading-none tracking-wider uppercase mt-1">Live Portal</span>
              </div>
            </div>

            {/* Jitsi Meet Container */}
            <div 
              ref={jitsiContainerRef} 
              id="liveClassContainer" 
              className="absolute inset-0 w-full h-full bg-black [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
            ></div>

            {/* Custom Admin Controls overlay */}
            {(profile?.role === 'admin' || profile?.role === 'teacher') && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur px-6 py-3 rounded-2xl opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity pointer-events-auto">
                <button
                  onClick={() => jitsiApiRef.current?.executeCommand('toggleAudio')}
                  className={`p-3 rounded-full ${isMicMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                  title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isMicMuted ? (
                      <>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                      </>
                    ) : (
                      <>
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                      </>
                    )}
                  </svg>
                </button>
                <button
                  onClick={() => jitsiApiRef.current?.executeCommand('toggleVideo')}
                  className={`p-3 rounded-full ${isCamMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                  title={isCamMuted ? "Turn on Camera" : "Turn off Camera"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isCamMuted ? (
                      <>
                        <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </>
                    ) : (
                      <>
                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
