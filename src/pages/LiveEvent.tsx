import React, { useState, useEffect } from 'react';
import { Radio, Settings, X, Video, ExternalLink, KeyRound, Server, Facebook, Share2 } from 'lucide-react';
import ReactPlayer from 'react-player';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';

const Player = ReactPlayer as any;

export default function LiveEvent() {
  const { profile } = useAuth();
  const { liveStreamUrl } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [prejoinEnabled, setPrejoinEnabled] = useState(false);
  const [streamKey] = useState(`wgts_live_${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
  
  // We use a dedicated, unique room name for your public live events
  const broadcastRoom = "wgts-public-live-event-room-2026";
  const hasCustomStream = liveStreamUrl && liveStreamUrl.trim() !== "";

  // State to hold a fallback video if no live stream is set
  const [fallbackVideoUrl, setFallbackVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestVideo = async () => {
      if (!hasCustomStream) {
        try {
          const { data, error } = await supabase
            .from('gallery_videos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (data && data.length > 0) {
            setFallbackVideoUrl(data[0].video_url || data[0].videoUrl);
          } else {
            setFallbackVideoUrl('');
          }
        } catch (err) {
          console.error("Error fetching fallback video:", err);
          setFallbackVideoUrl('');
        }
      }
    };
    fetchLatestVideo();
  }, [hasCustomStream]);

  const activeUrl = hasCustomStream ? liveStreamUrl : fallbackVideoUrl;

  return (
    <div className="flex-grow pt-12 pb-24 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${activeUrl ? 'bg-red-600 text-white animate-pulse' : 'bg-red-100 text-red-600'}`}>
              <Radio size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Live Event</h1>
              <p className="text-slate-600 mt-1">Watch our special school occasions and ceremonies live.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm rounded-full transition-all flex items-center gap-2"
            title="School Broadcasting Studio"
          >
            <Settings size={20} /> <span className="text-sm font-bold hidden sm:block">Studio Settings</span>
          </button>
        </div>

        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video relative border-4 border-slate-900 flex items-center justify-center group">
          
          {/* Logo overlay to cover Jitsi watermark (if any) */}
          {!activeUrl && (
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
                <span className="text-yellow-500 text-[10px] font-medium leading-none tracking-wider uppercase mt-1">Live Broadcast</span>
              </div>
            </div>
          )}

        {activeUrl ? (
          <Player 
            url={activeUrl} 
            width="100%" 
            height="100%" 
            controls={true}
            playing={true}
            config={{
              youtube: {
                playerVars: { showinfo: 1, controls: 1 }
              }
            }}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-black">
            <iframe
              src={`https://meet.jit.si/${broadcastRoom}#config.prejoinPageEnabled=${prejoinEnabled}&config.prejoinConfig.enabled=${prejoinEnabled}&config.disableDeepLinking=true&interfaceConfig.MOBILE_APP_PROMO=false${profile?.role === 'admin' || profile?.role === 'teacher' ? '&config.startWithVideoMuted=false&config.startWithAudioMuted=true' : '&config.startWithVideoMuted=true&config.startWithAudioMuted=true&config.disableInviteFunctions=true&config.toolbarButtons=%5B%5D&config.disableToolbarAccess=true&interfaceConfig.HIDE_INVITE_MORE_HEADER=true&interfaceConfig.TOOLBAR_BUTTONS=%5B%5D'}`}
              className="w-full h-full border-0"
              allow="camera; microphone; fullscreen; display-capture; autoplay"
            />
          </div>
        )}
        </div>
        
        <div className="mt-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-2">About this Broadcast</h3>
              <p className="text-slate-600 leading-relaxed">
                Welcome to the Wingates Theological Seminary live broadcast. This page is dedicated to general public events such as matriculation, graduation ceremonies, and special seminars. 
              </p>
            </div>
            <div className="shrink-0 flex flex-wrap gap-3">
              <button 
                onClick={() => {
                  const url = encodeURIComponent(window.location.href);
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                }}
                className="flex items-center gap-2 px-5 py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <Facebook size={20} /> <span className="hidden sm:inline">Share on Facebook</span>
              </button>
              <button 
                onClick={() => {
                  const text = encodeURIComponent(`Watch WGTS Live Event: ${window.location.href}`);
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }}
                className="flex items-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#20bd5c] text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg> <span className="hidden sm:inline">WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal - Complete Broadcast Studio */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-2 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">School Broadcasting Studio</h3>
                  <p className="text-slate-500 text-sm mt-1">Configure how your viewers see the live broadcast.</p>
                </div>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Method 1: WebRTC (Default) */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col">
                  <div className="flex items-center gap-2 mb-3 text-slate-900">
                    <Video size={20} className="text-blue-600" />
                    <h4 className="font-bold">Method 1: Virtual Camera</h4>
                  </div>
                  <p className="text-xs text-slate-600 mb-4 flex-grow">
                    Method 1 uses WebRTC via Google Meet or standard Video portals. Currently deactivated natively. Use Method 2 for Custom URLs.
                  </p>
                  <ol className="list-decimal ml-4 text-xs text-slate-700 space-y-1.5 mb-4">
                    <li>Open <strong>OBS Studio</strong> &rarr; <strong>Start Virtual Camera</strong></li>
                    <li>Turn on <strong>Device Selection Screen</strong> below.</li>
                    <li>Click the video player to join as Admin.</li>
                  </ol>
                  
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between mt-auto">
                    <span className="text-xs font-semibold text-slate-700">Device Selection Screen</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={!hasCustomStream && prejoinEnabled}
                        disabled={hasCustomStream}
                        onChange={(e) => setPrejoinEnabled(e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Method 2: Custom RTMP Stream Key */}
                <div className="bg-red-50 p-5 rounded-xl border border-red-100 flex flex-col">
                  <div className="flex items-center gap-2 mb-3 text-red-900">
                    <KeyRound size={20} className="text-red-600" />
                    <h4 className="font-bold">Method 2: Custom Stream Key</h4>
                  </div>
                  <p className="text-xs text-red-800 mb-4 flex-grow">
                    Professional broadcasting. Because this platform is serverless, you must stream your RTMP feed to a Video Delivery Network (like YouTube/Twitch) and paste the link below.
                  </p>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-red-700 block mb-1 flex items-center gap-1"><Server size={10} /> 1. Generate RTMP Stream</span>
                      <div className="bg-white p-2 rounded text-xs border border-red-200 font-mono text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                        rtmps://live-api-s.youtube.com/app2
                      </div>
                      <div className="bg-white p-2 rounded text-xs border border-red-200 font-mono text-slate-600 mt-1 flex justify-between items-center group">
                        <span>{streamKey}</span>
                        <span className="text-[9px] text-slate-400 group-hover:text-red-500 cursor-pointer">Copy</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-red-200 mt-auto">
                    <span className="text-[10px] uppercase font-bold text-red-700 block mb-1 flex items-center gap-1"><ExternalLink size={10} /> 2. Connect Your Stream URL</span>
                    <p className="text-[10px] text-slate-500 mb-2 leading-tight">Paste your live YouTube/Vimeo/Twitch link in the <strong>Admin Dashboard &rarr; Gallery &rarr; Live Stream Configuration</strong> to connect your Stream Key to this player.</p>
                    {hasCustomStream ? (
                      <div className="text-xs px-2 py-1 bg-green-100 text-green-800 border border-green-200 rounded font-medium flex items-center justify-between">
                        <span>Stream Connected</span>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      </div>
                    ) : (
                      <div className="text-xs px-2 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded font-medium flex justify-center">
                        Waiting for connection...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-8 py-2.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-md"
                >
                  Close Studio Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

