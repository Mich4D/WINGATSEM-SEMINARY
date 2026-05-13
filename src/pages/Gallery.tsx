import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PlayCircle, Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatImageUrl } from '../utils/formatImage';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';

export default function Gallery() {
  const [images, setImages] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [liveStreamUrl, setLiveStreamUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { } = useSettings();

  // Lightbox state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedImageYear, setSelectedImageYear] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchWithRetry = async <T,>(operation: () => Promise<T>, maxRetries = 3, delayMs = 3000): Promise<T> => {
      let lastResult: any;
      for (let i = 0; i < maxRetries; i++) {
        try {
          const result = await operation();
          if ((result as any)?.error?.message?.toLowerCase().includes('timeout')) {
            lastResult = result;
            console.log(`Gallery fetch timeout, retrying... (${i + 1}/${maxRetries})`);
            await new Promise(r => setTimeout(r, delayMs));
            continue;
          }
          return result;
        } catch (e: any) {
          if (e.message?.toLowerCase().includes('timeout')) {
             lastResult = { error: e };
             console.log(`Gallery fetch timeout (exception), retrying... (${i + 1}/${maxRetries})`);
             await new Promise(r => setTimeout(r, delayMs));
             continue;
          }
          throw e;
        }
      }
      return lastResult;
    };

    const fetchGalleryData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        
        // Fetch live stream URL
        const { data: settingsData } = await fetchWithRetry<any>(() => (supabase
          .from('settings')
          .select('live_stream_url')
          .eq('id', 'global')
          .single() as any), 2);
          
        if (settingsData?.live_stream_url && isMounted) {
          setLiveStreamUrl(settingsData.live_stream_url);
        }

        // Fetch gallery images
        try {
          const { data: galleryData, error: imgError } = await fetchWithRetry<any>(() => (supabase
            .from('gallery')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100) as any));
            
          if (imgError && isMounted) {
            console.error("Gallery images error:", imgError);
            setErrorMsg(prev => {
              const newMsg = `Images: ${imgError.message}`;
              if (prev && prev.includes(newMsg)) return prev;
              return (prev ? prev + " | " : "") + newMsg;
            });
          } else if (galleryData && isMounted) {
            setImages(galleryData);
          }
        } catch (e: any) {
          console.error(e);
        }

        // Fetch gallery videos
        try {
          const { data: videoData, error: vidError } = await fetchWithRetry<any>(() => (supabase
            .from('gallery_videos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50) as any));
            
          if (vidError && isMounted) {
            console.error("Gallery videos error:", vidError);
            setErrorMsg(prev => {
              const newMsg = `Videos: ${vidError.message}`;
              if (prev && prev.includes(newMsg)) return prev;
              return (prev ? prev + " | " : "") + newMsg;
            });
          } else if (videoData && isMounted) {
            setVideos(videoData);
          }
        } catch (e: any) {
          console.error(e);
        }
      } catch (error: any) {
        if (isMounted) {
          console.error("Error fetching gallery data:", error);
          setErrorMsg(error.message || "Unknown error fetching gallery");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchGalleryData();

    // Set up realtime subscriptions
    const imagesSubscription = supabase.channel('gallery-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, payload => {
        if (payload.eventType === 'INSERT') {
          setImages(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setImages(prev => prev.filter(img => img.id !== payload.old.id));
        }
      })
      .subscribe();

    const videosSubscription = supabase.channel('gallery-videos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_videos' }, payload => {
        if (payload.eventType === 'INSERT') {
          setVideos(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setVideos(prev => prev.filter(vid => vid.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(imagesSubscription);
      supabase.removeChannel(videosSubscription);
    };
  }, []);

  // Helper to convert standard YouTube URL to embed URL
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('youtube.com/watch?v=')) {
        const videoId = new URL(url).searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}`;
      } else if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url; // Return as is if already an embed or different format
    } catch (e) {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-yellow-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Group images by year
  const groupedImages = images.reduce((acc, img) => {
    const year = img.year || new Date(img.created_at).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(img);
    return acc;
  }, {} as Record<string, any[]>);

  // Group videos by year
  const groupedVideos = videos.reduce((acc, vid) => {
    const year = vid.year || new Date(vid.created_at).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(vid);
    return acc;
  }, {} as Record<string, any[]>);

  const allYears = new Set([...Object.keys(groupedImages), ...Object.keys(groupedVideos)]);
  const years = Array.from(allYears).sort((a, b) => {
    if (a === 'General Pictures') return -1;
    if (b === 'General Pictures') return 1;
    return parseInt(b) - parseInt(a);
  });

  // Lightbox handlers
  const openLightbox = (year: string, index: number) => {
    setSelectedImageYear(year);
    setSelectedImageIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
    setSelectedImageYear(null);
    document.body.style.overflow = 'auto';
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageYear && selectedImageIndex !== null && groupedImages[selectedImageYear]) {
      const currentYearImages = groupedImages[selectedImageYear];
      setSelectedImageIndex((selectedImageIndex + 1) % currentYearImages.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageYear && selectedImageIndex !== null && groupedImages[selectedImageYear]) {
      const currentYearImages = groupedImages[selectedImageYear];
      setSelectedImageIndex((selectedImageIndex - 1 + currentYearImages.length) % currentYearImages.length);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6">Media Gallery</h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Explore our graduation ceremonies and join our live programs.
          </p>
        </div>

        {/* Live Stream Section */}
        
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-8">
            <h3 className="text-red-800 font-bold text-lg flex items-center gap-2">
              <X className="w-5 h-5 text-red-600" />
              Failed to load gallery
            </h3>
            <p className="text-red-700 mt-2 font-mono text-sm">{errorMsg}</p>
            {errorMsg.toLowerCase().includes('timeout') ? (
              <div className="mt-4 p-4 bg-orange-100 rounded text-orange-800 text-sm border border-orange-200">
                <p className="font-bold mb-1">Temporary Database Timeout</p>
                <p>The Supabase database took too long to respond. This is usually a temporary issue that happens if the database is waking up from being paused, or if the server is under heavy load. Please wait a few seconds and refresh the page.</p>
              </div>
            ) : (
              <p className="text-red-600 text-sm mt-3 font-medium">Please check the Supabase Table RLS permissions for the 'gallery' and 'gallery_videos' tables, ensuring there is a policy that allows unauthenticated/anonymous 'select' queries.</p>
            )}
          </div>
        )}

        {liveStreamUrl && (
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <PlayCircle className="text-red-600" size={32} />
              <h2 className="text-3xl font-display font-bold text-slate-900">Live Stream</h2>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">Live Now</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900">
                <iframe 
                  src={getEmbedUrl(liveStreamUrl)} 
                  title="Live Stream" 
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        )}

        {/* Graduation Gallery Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <ImageIcon className="text-yellow-600" size={32} />
              <h2 className="text-3xl font-display font-bold text-slate-900">Graduation Ceremonies</h2>
            </div>
            
            {years.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedYear('All')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedYear === 'All' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All Years
                </button>
                {years.map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedYear === year 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>

          {years.length > 0 ? (
            <div className="space-y-12">
              {years.filter(year => selectedYear === 'All' || selectedYear === year).map(year => (
                <div key={year} className="bg-white p-6 md:p-10 rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                  {/* Decorative Year Label */}
                  <div className="absolute top-0 right-0 p-8 select-none pointer-events-none opacity-[0.03]">
                    <span className="text-9xl font-black">{year}</span>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8 relative z-10">
                    <div>
                      <h3 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight leading-none mb-2">
                        {year === 'General Pictures' ? 'General Media & Banners' : `Class of ${year}`}
                      </h3>
                      <p className="text-xs font-bold text-yellow-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-4 h-[2px] bg-yellow-600"></span>
                        {year === 'General Pictures' ? 'Featured Collection' : 'Graduation Album'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Videos Sub-section */}
                  {groupedVideos[year] && groupedVideos[year].length > 0 && (
                    <div className="mb-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupedVideos[year].map(video => (
                          <div key={video.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 truncate px-1">{video.title || `Video`}</h4>
                            <div className="aspect-video w-full rounded-md overflow-hidden bg-slate-900 shadow-md">
                              <iframe 
                                src={getEmbedUrl(video.video_url || video.videoUrl)} 
                                title={video.title || `Video`} 
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                              ></iframe>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Packed Image Grid */}
                  {groupedImages[year] && groupedImages[year].length > 0 && (
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                      {groupedImages[year].map((image, index) => (
                        <div 
                          key={image.id} 
                          className="break-inside-avoid bg-white rounded-lg overflow-hidden border border-slate-100 shadow-sm group hover:shadow-lg transition-all duration-300 cursor-pointer"
                          onClick={() => openLightbox(year, index)}
                        >
                          <div className="relative overflow-hidden">
                            <img 
                              src={formatImageUrl(image.image_url || image.imageUrl)} 
                              alt={`Graduation ${year}`} 
                              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                            {image.caption && (
                              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center pointer-events-none">
                                <p className="text-xs text-white font-medium leading-relaxed italic">{image.caption}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
              <ImageIcon className="mx-auto text-slate-300 mb-4" size={48} />
              <h3 className="text-xl font-bold text-slate-700 mb-2">No Images Found</h3>
              <p className="text-slate-500 mb-4">Graduation ceremony pictures will appear here once uploaded.</p>
              <div className="text-xs text-amber-600 bg-amber-50 p-4 rounded-lg inline-block text-left">
                <p className="font-bold">Admin Notice:</p>
                <p>If you uploaded images but they aren't showing here, check your Supabase RLS policies.</p>
                <p className="mt-1">You must allow <b>SELECT</b> operations for the <b>anon</b> role on the <b>gallery</b> table.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {selectedImageIndex !== null && selectedImageYear !== null && groupedImages[selectedImageYear] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 sm:p-8"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/70 hover:text-white transition-colors p-2 bg-black/50 hover:bg-black/80 rounded-full z-[110]"
              onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            >
              <X size={28} />
            </button>

            {/* Navigation Arrows */}
            {groupedImages[selectedImageYear].length > 1 && (
              <>
                <button 
                  className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-3 bg-black/50 hover:bg-black/80 rounded-full z-[110] backdrop-blur-md hidden sm:block"
                  onClick={prevImage}
                >
                  <ChevronLeft size={36} />
                </button>
                <button 
                  className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-3 bg-black/50 hover:bg-black/80 rounded-full z-[110] backdrop-blur-md hidden sm:block"
                  onClick={nextImage}
                >
                  <ChevronRight size={36} />
                </button>
                
                {/* Mobile tap zones */}
                <div className="absolute left-0 top-0 bottom-0 w-1/3 sm:hidden z-[105]" onClick={prevImage} />
                <div className="absolute right-0 top-0 bottom-0 w-1/3 sm:hidden z-[105]" onClick={nextImage} />
              </>
            )}

            {/* Image Container */}
            <motion.div 
              className="relative max-w-5xl max-h-full flex flex-col items-center justify-center w-full z-[100] pointer-events-none"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing lightbox
            >
              <img 
                src={formatImageUrl(groupedImages[selectedImageYear][selectedImageIndex].image_url || groupedImages[selectedImageYear][selectedImageIndex].imageUrl)} 
                alt={`Graduation ${selectedImageYear}`}
                className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl pointer-events-auto"
                referrerPolicy="no-referrer"
              />
              
              <div className="mt-6 text-center w-full max-w-2xl px-4 pointer-events-auto">
                {groupedImages[selectedImageYear][selectedImageIndex].caption && (
                  <p className="text-white text-lg font-medium tracking-wide mb-2">
                    {groupedImages[selectedImageYear][selectedImageIndex].caption}
                  </p>
                )}
                <div className="flex items-center justify-center gap-4 text-white/50 text-sm font-semibold tracking-widest uppercase">
                  <span>{selectedImageYear === 'General Pictures' ? 'General' : `Class of ${selectedImageYear}`}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-600"></span>
                  <span>{selectedImageIndex + 1} / {groupedImages[selectedImageYear].length}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
