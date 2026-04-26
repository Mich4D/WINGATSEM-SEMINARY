import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Users, Award, ArrowRight, Search, CheckCircle, FileText, Sparkles, Cpu, Globe, Building2, MapPin, Phone, Image as ImageIcon, PlayCircle, Music, Pause, Play, Volume2, Star } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { formatImageUrl } from '../utils/formatImage';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const { logoUrl, heroBgUrl, isAdmissionOpen, anthemUrl, anthemTitle } = useSettings();
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
  const [isAnthemPlaying, setIsAnthemPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Fetch gallery images for the hero slideshow and highlights
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data, error } = await supabase
          .from('gallery')
          .select('*')
          .order('year', { ascending: false })
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          console.log('Gallery images fetched:', data.length);
          setGalleryImages(data);
        }
      } catch (err) {
        console.error('Error fetching gallery images:', err);
      }
    };
    fetchImages();
  }, []);

  // Highlights slideshow interval
  useEffect(() => {
    if (galleryImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentHighlightIndex((prev) => (prev + 1) % Math.min(8, galleryImages.length));
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [galleryImages.length]);

  // Encouragements state
  const encouragements = useMemo(() => [
    { text: "Study to shew thyself approved unto God, a workman that needeth not to be ashamed...", ref: "2 Timothy 2:15" },
    { text: "Let the wise hear and increase in learning, and the one who understands obtain guidance.", ref: "Proverbs 1:5" },
    { text: "Apply your heart to instruction and your ear to words of knowledge.", ref: "Proverbs 23:12" }
  ], []);
  const [encouragementIndex, setEncouragementIndex] = useState(0);

  // Typewriter effect state
  const [visibleCount, setVisibleCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const str1 = "Equipping Leaders for ";
  const str2 = "Global Ministry";
  const totalChars = str1.length + str2.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setEncouragementIndex((prev) => (prev + 1) % encouragements.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [encouragements.length]);

  useEffect(() => {
    let timer: any;
    if (isDeleting) {
      if (visibleCount === 0) {
        setIsDeleting(false);
      } else {
        timer = setTimeout(() => setVisibleCount(v => v - 1), 50);
      }
    } else {
      if (visibleCount === totalChars) {
        timer = setTimeout(() => setIsDeleting(true), 3000);
      } else {
        timer = setTimeout(() => setVisibleCount(v => v + 1), 100);
      }
    }
    return () => clearTimeout(timer);
  }, [visibleCount, isDeleting, totalChars]);

  const stars = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 2,
    }));
  }, []);

  const logoStars = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 120 + Math.random() * 80;
      return {
        id: i,
        angle,
        radius,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 10 + 10, // 10-20s for a full orbit
        delay: Math.random() * -20, // Start at different points in the animation
      };
    });
  }, []);

  // Determine hero background
  const currentHeroBg = useMemo(() => {
    // Fallback to static hero background from settings or placeholder
    return heroBgUrl && heroBgUrl.trim() !== "" 
      ? formatImageUrl(heroBgUrl) 
      : "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
  }, [heroBgUrl]);

  const toggleAnthem = () => {
    if (audioRef.current) {
      if (isAnthemPlaying) {
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.error("Audio playback failed:", e));
        }
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Cinematic Hero Section: Centered Majestic Layout */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-slate-950 overflow-hidden">
        
        {/* Full-Screen Background Image with Deep Atmospheric Overlay */}
        <div className="absolute inset-0 z-0 bg-slate-950">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentHeroBg}
              src={currentHeroBg} 
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.6, scale: 1.05 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="w-full h-full object-cover"
              alt="Seminary Atmosphere"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          {/* Layered Gradient for Cinematic Depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950/80"></div>
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-950/40 to-slate-950/90"></div>
          
          {/* Subtle Particles/Stars */}
          {stars.map((star) => (
            <motion.div
              key={`hero-bg-star-${star.id}`}
              className="absolute bg-white rounded-full pointer-events-none"
              style={{
                top: star.top,
                left: star.left,
                width: star.size * 0.4,
                height: star.size * 0.4,
              }}
              animate={{ 
                opacity: [0, 0.5, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: star.duration * 0.5, 
                repeat: Infinity, 
                delay: star.delay 
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left Column: Text & CTA */}
            <div className="flex flex-col items-start text-left relative z-20 pt-4 lg:pt-0">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-4 -mt-4 lg:-mt-8"
              >
                <h2 className="text-white text-3xl md:text-5xl lg:text-4xl font-display font-black tracking-wide uppercase leading-tight drop-shadow-md [text-shadow:_0_4px_8px_rgba(0,0,0,0.6)] text-balance">
                  Winning Gate Christian<br />
                  Theological Seminary
                </h2>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-600/10 border border-yellow-600/30 text-yellow-500 rounded-full text-xs font-bold uppercase tracking-widest mb-10 backdrop-blur-sm"
              >
                 <BookOpen size={16} /> Ability to build the builders
              </motion.div>

              {/* Main Headline - Larger & More Impactful */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 1 }}
                className="relative mb-4 w-full"
              >
                <h1 className="text-5xl md:text-6xl lg:text-[4rem] font-serif font-black text-white leading-[1.1] tracking-tight text-left text-balance">
                  {str1.substring(0, Math.min(visibleCount, str1.length))}
                  <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-400">
                    {visibleCount > str1.length ? str2.substring(0, visibleCount - str1.length) : ""}
                  </span>
                  <motion.span 
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-[3px] h-[0.8em] bg-yellow-600 ml-1 align-middle"
                  />
                </h1>
              </motion.div>

              {/* Description */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-lg md:text-xl text-slate-300 mb-6 max-w-2xl leading-relaxed italic font-serif"
              >
                "Offering rigorous academic training and spiritual formation <span className="text-yellow-500 font-bold not-italic">fully loaded in English & Yoruba</span> for effective service in the 21st century."
              </motion.p>

              {/* Dynamic CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="flex flex-wrap gap-4"
              >
                {isAdmissionOpen && (
                  <Link to="/admissions" className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-4 rounded-sm font-bold transition-all shadow-2xl glow-gold uppercase tracking-[0.2em] text-xs flex items-center gap-2 group">
                    Begin Application <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                <Link to="/gallery" className="bg-red-600/90 hover:bg-red-500 text-white border border-red-500/50 backdrop-blur-md shadow-[0_0_20px_rgba(220,38,38,0.4)] px-8 py-4 rounded-sm font-bold transition-all uppercase tracking-[0.2em] text-xs flex items-center gap-2 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  Watch Graduation <PlayCircle size={16} className="group-hover:scale-110 transition-transform text-red-100 relative z-10" />
                </Link>
                <Link to="/staff-portal" className="bg-blue-900/80 hover:bg-blue-800 text-white border border-blue-600/50 backdrop-blur-md shadow-[0_0_20px_rgba(30,58,138,0.6)] px-8 py-4 rounded-sm font-bold transition-all uppercase tracking-[0.2em] text-xs flex items-center gap-2 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  Teacher Portal <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-blue-300 relative z-10" />
                </Link>
                <Link to="/login" className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-8 py-4 rounded-sm font-bold transition-all uppercase tracking-[0.2em] text-xs flex items-center gap-2 group">
                  Student Login <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-yellow-500" />
                </Link>
              </motion.div>
            </div>

            {/* Right Column: Emblem & Quote */}
            <div className="relative flex justify-center lg:justify-end lg:h-full z-10 w-full pt-10 lg:pt-0 lg:-mt-8">
              <div className="flex flex-col items-center max-w-[280px] w-full lg:mr-8 xl:mr-16">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="relative w-full flex justify-center"
                >
                  <div className="relative w-full max-w-[200px] md:max-w-[240px] lg:max-w-[280px]">
                    {/* Orbiting Stars around Logo */}
                    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                      <motion.div
                        className="absolute w-full h-full rounded-full border border-yellow-500/20"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      >
                        <Star 
                          size={24} 
                          className="text-yellow-400 absolute -top-3 left-1/2 -translate-x-1/2 fill-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" 
                        />
                      </motion.div>
                      <motion.div
                        className="absolute w-[120%] h-[120%] rounded-full border border-yellow-500/10"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                      >
                        <Star 
                          size={18} 
                          className="text-yellow-300 absolute top-1/4 -right-2 fill-yellow-300 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" 
                        />
                        <Star 
                          size={16} 
                          className="text-yellow-500 absolute bottom-1/4 -left-2 fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" 
                        />
                      </motion.div>
                    </div>

                    {logoUrl ? (
                      <img 
                        src={formatImageUrl(logoUrl)} 
                        alt="Emblem" 
                        className="relative z-10 w-full h-auto drop-shadow-[0_0_60px_rgba(234,179,8,0.5)] hover:scale-105 transition-transform duration-700" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="relative z-10 w-full aspect-square rounded-full bg-slate-800/80 border-4 border-yellow-600 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                        <BookOpen size={60} className="text-yellow-600" />
                      </div>
                    )}
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                  className="mt-6 bg-slate-900/90 border border-white/5 p-4 rounded-xl w-full backdrop-blur-md shadow-2xl relative z-30"
                >
                  <div className="absolute top-0 right-10 w-20 h-1 bg-yellow-600"></div>
                  <div className="absolute bottom-10 -left-1 w-1 h-20 bg-yellow-600"></div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={encouragementIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      <p className="text-slate-200 italic font-medium leading-relaxed mb-4 text-sm">
                        "{encouragements[encouragementIndex].text}"
                      </p>
                      <p className="text-yellow-500 font-bold text-xs tracking-wider text-right uppercase">
                        - {encouragements[encouragementIndex].ref}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Cinematic Atmospheric Light Flares */}
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-yellow-600/5 blur-[120px] rounded-full pointer-events-none"></div>
      </section>

      {/* Graduation Gallery Highlights Section */}
      {galleryImages.length > 0 && (
        <section className="py-24 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="text-yellow-600 font-bold tracking-[0.3em] uppercase text-xs mb-4 flex items-center gap-2">
                  <ImageIcon size={14} /> Memories & Milestones
                </h2>
                <h3 className="text-4xl md:text-5xl font-serif font-black text-slate-900 leading-[1.1]">Graduation Highlights</h3>
              </div>
              <Link to="/gallery" className="text-yellow-600 font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:gap-3 transition-all">
                View Full Gallery <ArrowRight size={14} />
              </Link>
            </div>

            <div className="relative overflow-hidden py-4">
              <div className="flex gap-6">
                <AnimatePresence mode="popLayout">
                  {galleryImages.slice(currentHighlightIndex, currentHighlightIndex + 4).map((image, i) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="group relative flex-none w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] aspect-[4/5] bg-slate-100 rounded-sm overflow-hidden shadow-xl"
                    >
                      <img 
                        src={formatImageUrl(image.image_url || image.imageUrl)} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={`Graduation ${image.year}`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                      <div className="absolute bottom-6 left-6 right-6 text-left">
                        <span className="bg-yellow-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                          Class of {image.year}
                        </span>
                        <p className="text-white text-sm font-serif italic line-clamp-2 leading-snug">
                          {image.caption || "A moment of academic celebration and spiritual transition."}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {/* If we have fewer than 4 items showing due to slicing, wrap around */}
                  {galleryImages.length >= 4 && (currentHighlightIndex + 4 > galleryImages.length) && (
                    galleryImages.slice(0, (currentHighlightIndex + 4) % galleryImages.length).map((image, i) => (
                      <motion.div
                        key={`${image.id}-wrapped`}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.8, delay: (4 - ((currentHighlightIndex + 4) % galleryImages.length) + i) * 0.1 }}
                        className="group relative flex-none w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] aspect-[4/5] bg-slate-100 rounded-sm overflow-hidden shadow-xl"
                      >
                        <img 
                          src={formatImageUrl(image.image_url || image.imageUrl)} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          alt={`Graduation ${image.year}`}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                        <div className="absolute bottom-6 left-6 right-6 text-left">
                          <span className="bg-yellow-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                            Class of {image.year}
                          </span>
                          <p className="text-white text-sm font-serif italic line-clamp-2 leading-snug">
                            {image.caption || "A moment of academic celebration."}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-32 bg-slate-50 relative overflow-hidden">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-600/5 blur-[120px] rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-600/5 blur-[120px] rounded-full -ml-48 -mb-48"></div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-yellow-600 font-bold tracking-[0.3em] uppercase text-xs mb-4">Academic Integrity</h2>
              <h3 className="text-4xl md:text-5xl font-serif font-black text-slate-900 mb-8 leading-[1.1]">Verify Student &<br />Certificate Authenticity</h3>
              <p className="text-slate-600 text-lg mb-10 leading-relaxed max-w-xl font-light">
                We maintain the highest standards of academic integrity. Our instant verification portal allows employers, churches, and institutions to verify student credentials simply by entering their registration number.
              </p>
              <Link to="/verify" className="inline-flex items-center gap-3 bg-slate-950 hover:bg-slate-900 text-white px-10 py-5 rounded-sm font-bold transition-all shadow-2xl group uppercase text-xs tracking-widest">
                Verification Portal 
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform text-yellow-500" />
              </Link>
            </motion.div>
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: <CheckCircle className="text-green-600" />, title: "Instant", desc: "Real-time checks", delay: 0.1 },
                  { icon: <Award className="text-blue-600" />, title: "Official", desc: "Digital database", delay: 0.2 },
                  { icon: <Search className="text-yellow-600" />, title: "Global", desc: "Universal access", delay: 0.3 },
                  { icon: <FileText className="text-purple-600" />, title: "Proof", desc: "Verified info", delay: 0.4 }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: item.delay }}
                  >
                    <Link 
                      to="/verify"
                      className="bg-white p-8 rounded-sm border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:border-yellow-500/30 hover:shadow-xl transition-all h-full block"
                    >
                      <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-xs">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{item.desc}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Quick Search Action */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="bg-slate-900 p-6 rounded-sm shadow-2xl relative overflow-hidden group"
              >
                <div className="relative z-10">
                  <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-widest flex items-center gap-2">
                    <Search size={16} className="text-yellow-500" />
                    Quick Student Search
                  </h4>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const val = (e.currentTarget.elements.namedItem('regNumber') as HTMLInputElement).value;
                      if (val) window.location.href = `/verify?reg=${encodeURIComponent(val)}`;
                    }}
                    className="flex gap-2"
                  >
                    <input 
                      name="regNumber"
                      type="text" 
                      placeholder="Enter Reg Number (e.g. WGTS/26/0001)"
                      className="flex-grow bg-white/10 border border-white/20 rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <button className="bg-yellow-600 hover:bg-yellow-500 text-slate-900 px-6 py-3 rounded-sm font-bold text-sm transition-all">
                      Search
                    </button>
                  </form>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-yellow-600/20 transition-all"></div>
              </motion.div>
            </div>
          </div>

          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-yellow-600 font-bold tracking-[0.3em] uppercase text-xs mb-4">Why Choose Us</h2>
            <h3 className="text-4xl md:text-5xl font-serif font-black text-slate-900 mb-8">Excellence in Theology</h3>
            <p className="text-slate-600 text-xl font-light">Transformative education merging high academic rigor with profound spiritual formation.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Award size={40} />,
                title: "Global Accreditation",
                desc: "Our courses are fully recognized and meet premium international theological standards.",
                link: "/programmes",
                delay: 0.15
              },
              {
                icon: <GraduationCap size={40} />,
                title: "Premium Curriculum",
                desc: "From Diploma to Doctorate, our courses are fully loaded in English & Yoruba.",
                link: "/programmes",
                delay: 0.1
              },
              {
                icon: <Users size={40} />,
                title: "Elite Faculty",
                desc: "Learn from world-class scholars dedicated to your spiritual ascension.",
                link: "/about",
                delay: 0.2
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: feature.delay }}
              >
                <Link to={feature.link} className="bg-white p-12 rounded-sm border border-slate-100 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all group block h-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-0 bg-yellow-600 transition-all group-hover:h-full"></div>
                  <div className="w-20 h-20 glass bg-yellow-50 text-yellow-700 rounded-sm flex items-center justify-center mb-8 group-hover:bg-yellow-600 group-hover:text-white transition-all transform group-hover:rotate-12">
                    {feature.icon}
                  </div>
                  <h4 className="text-2xl font-serif font-black text-slate-900 mb-4 flex items-center justify-between">
                    {feature.title}
                    <ArrowRight size={20} className="text-yellow-600 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-2" />
                  </h4>
                  <p className="text-slate-500 leading-relaxed font-light">{feature.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="relative py-32 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-600/30 blur-[160px] rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-serif font-black text-white mb-8 tracking-tight">
              {isAdmissionOpen ? "Answer the Higher Calling" : "Awaiting New Season"}
            </h2>
            <p className="text-slate-400 text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              {isAdmissionOpen 
                ? "Join an elite community of believers redefining spiritual leadership for the next generation. Secure your place now."
                : "The divine portal to enrollment is currently being prepared for the next intake. Connect with us to stay informed."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {isAdmissionOpen ? (
                <Link to="/admissions" className="bg-yellow-600 hover:bg-yellow-500 text-white px-12 py-5 rounded-sm font-bold transition-all shadow-2xl glow-gold uppercase tracking-[0.2em] text-xs">
                  Begin Application
                </Link>
              ) : (
                <Link to="/contact" className="bg-white text-slate-900 hover:bg-yellow-500 hover:text-white px-12 py-5 rounded-sm font-bold transition-all uppercase tracking-[0.2em] text-xs">
                  Stay Informed
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Floating School Anthem Player */}
      {anthemUrl && (
        <div className="fixed bottom-8 left-8 z-[100]">
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3 bg-white/90 backdrop-blur-md p-2 pl-4 rounded-full border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.12)] group hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] transition-all"
          >
            <div className="hidden md:block">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Now Entertaining</h4>
              <p className="text-xs font-bold text-slate-800 whitespace-nowrap overflow-hidden max-w-[120px] truncate">{anthemTitle || 'School Anthem'}</p>
            </div>
            <button 
              onClick={toggleAnthem}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isAnthemPlaying ? 'bg-yellow-600 text-white shadow-[0_0_15px_rgba(202,138,4,0.4)]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {isAnthemPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
              {isAnthemPlaying && (
                <div className="absolute -top-1 -right-1 flex gap-0.5">
                  {[...Array(3)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: [4, 12, 4] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-yellow-400 rounded-full"
                    />
                  ))}
                </div>
              )}
            </button>
            <audio 
              ref={audioRef}
              src={anthemUrl}
              loop
              onPlay={() => setIsAnthemPlaying(true)}
              onPause={() => setIsAnthemPlaying(false)}
              onEnded={() => setIsAnthemPlaying(false)}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
