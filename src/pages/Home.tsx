import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Users, Award, ArrowRight, Globe, Building2, Quote, PlayCircle, CheckCircle, Star, Music, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';
import { formatImageUrl } from '../utils/formatImage';
import { supabase } from '../lib/supabase';

const TESTIMONIALS = [
  {
    quote: "Winning Gate Seminary equipped me not just with knowledge, but with a deeper relationship with God and the tools to impact my world.",
    author: "Pastor Daniel A.",
    role: "Alumnus, Class of 2021",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80"
  },
  {
    quote: "The practical ministry training and mentorship I received here transformed my pastoral approach. I am forever grateful.",
    author: "Rev. Sarah M.",
    role: "Alumna, Class of 2022",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80"
  },
  {
    quote: "A truly Christ-centered environment. The faculty genuinely cares about your spiritual growth as much as your academic excellence.",
    author: "Minister John K.",
    role: "Current Student",
    img: "https://images.unsplash.com/photo-1542596594-649edbc13630?w=100&q=80"
  },
  {
    quote: "Every class challenged me to dive deeper into the Word. This seminary has been the stepping stone for my global ministry.",
    author: "Apostle Grace T.",
    role: "Alumna, Class of 2019",
    img: "https://images.unsplash.com/photo-1531123897727-8f129e1b4eca?w=100&q=80"
  },
  {
    quote: "Affordable, accessible, and anointed. Finding a seminary that balances strict theology with the moving of the Spirit is rare.",
    author: "Pastor David L.",
    role: "Alumnus, Class of 2023",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
  },
  {
    quote: "The leadership principles I learned here didn't just change my church—they changed my entire family and community.",
    author: "Evangelist Mary B.",
    role: "Alumna, Class of 2020",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80"
  }
];

export default function Home() {
  const { isAdmissionOpen, heroBgUrl, logoUrl, heroBanners, anthemUrl, anthemTitle, testimonials } = useSettings();
  
  const currentTestimonials = testimonials && testimonials.length > 0 ? testimonials : TESTIMONIALS;

  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [selectedFullImage, setSelectedFullImage] = useState<string | null>(null);

  const nextTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev + 1) % currentTestimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev - 1 + currentTestimonials.length) % currentTestimonials.length);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchGallery = async (retryCount = 0) => {
      try {
        const { data, error } = await supabase
          .from('gallery')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8);
          
        if (error) {
          if (error.message?.toLowerCase().includes('timeout') && retryCount < 3) {
            console.log(`Gallery fetch timeout, retrying... (${retryCount + 1}/3)`);
            setTimeout(() => { if (isMounted) fetchGallery(retryCount + 1); }, 3000);
            return;
          }
          if (isMounted) {
            console.error("Supabase Error fetching gallery:", error);
            setGalleryError(error.message);
          }
        } else if (data && data.length > 0 && isMounted) {
          setGalleryError(null);
          setGalleryImages(data);
        }
      } catch (error: any) {
        if (error.message?.toLowerCase().includes('timeout') && retryCount < 3) {
          console.log(`Gallery fetch timeout, retrying... (${retryCount + 1}/3)`);
          setTimeout(() => { if (isMounted) fetchGallery(retryCount + 1); }, 3000);
          return;
        }
        if (isMounted) {
          console.error("Exception fetching gallery for hero:", error);
          setGalleryError(error.message || "Unknown error");
        }
      }
    };
    fetchGallery();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (galleryImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentGalleryIndex(prev => (prev + 1) % galleryImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [galleryImages.length]);

  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Hero Section */}
      <section className="relative w-full bg-[#0a1930] pt-20 pb-32 lg:pb-48 overflow-hidden font-sans">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img src={formatImageUrl(heroBgUrl) || "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"} alt="Seminary" className="w-full h-full object-cover opacity-30 mix-blend-overlay" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1930] via-[#0a1930]/80 to-transparent"></div>
          
          {/* Spark Effects */}
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={`spark-${i}`}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full"
              style={{
                boxShadow: "0 0 10px 2px rgba(253, 224, 71, 0.8)"
              }}
              initial={{
                opacity: 0,
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * 500 + 400,
                scale: Math.random() * 0.8 + 0.2,
              }}
              animate={{
                opacity: [0, 1, 0],
                y: [null, -100 - (Math.random() * 400)],
                x: [null, `+=${(Math.random() - 0.5) * 200}`]
              }}
              transition={{
                duration: Math.random() * 3 + 3,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 pt-8 flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="max-w-2xl text-left">
            <h4 className="text-yellow-500 uppercase tracking-widest text-xs font-bold mb-4 flex items-center gap-3">
              <span className="w-8 h-px bg-yellow-500"></span>
              WELCOME TO WINNING GATE
              <span className="w-16 h-px bg-yellow-500 border-t border-yellow-500 max-w-[4rem]"></span>
            </h4>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl lg:text-7xl font-serif text-white leading-[1.05] tracking-tight mb-5"
            >
              <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="block">Equipping Leaders</motion.span>
              <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="block">Transforming Lives</motion.span>
              <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="block">Impacting Nations</motion.span>
            </motion.h1>
            <p className="text-slate-300 text-lg sm:text-xl leading-relaxed mb-6 font-light max-w-xl">
              Raising a new generation of Spirit-filled leaders through sound doctrine, practical training, and Christ-centered education.
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              {isAdmissionOpen && (
                <Link to="/admissions" className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-slate-950 px-8 py-4 rounded-sm font-bold uppercase tracking-widest text-sm hover:from-yellow-500 hover:to-yellow-400 transition-all shadow-[0_10px_30px_rgba(202,138,4,0.3)] flex items-center gap-3">
                  APPLY NOW <ArrowRight size={18} />
                </Link>
              )}
              <Link to="/programmes" className="bg-transparent border border-slate-600 text-white hover:bg-white/5 px-8 py-4 rounded-sm font-bold uppercase tracking-widest text-sm transition-all flex items-center gap-3">
                EXPLORE PROGRAMS <PlayCircle size={18} />
              </Link>
              {anthemUrl && (
                <div className="flex items-center gap-3 bg-white/5 border border-yellow-600/30 px-6 py-4 rounded-sm">
                   <Music className="text-yellow-500 w-5 h-5 flex-shrink-0" />
                   <audio src={anthemUrl} controls className="h-6 w-32 md:w-48 opacity-80" />
                </div>
              )}
              <Link to="/verify" className="bg-transparent border border-yellow-600/50 text-yellow-500 hover:bg-yellow-600/10 px-8 py-4 rounded-sm font-bold uppercase tracking-widest text-sm transition-all flex items-center gap-3">
                VERIFY CERTIFICATE <Award size={18} />
              </Link>
            </div>
          </div>
          
          {/* Orbiting Logo */}
          <div className="hidden lg:flex relative w-[400px] h-[400px] lg:absolute lg:top-0 lg:right-0 lg:-mt-10 lg:mr-10 items-center justify-center flex-shrink-0">
             <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                 <motion.div
                   animate={{ rotate: -360 }}
                   transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                   className="absolute w-[310px] h-[310px] rounded-full border border-yellow-500/10 border-b-yellow-500/60 relative"
                 >
                   <Star className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-400 fill-yellow-400 w-4 h-4" />
                 </motion.div>
                 <motion.div
                   animate={{ rotate: 360 }}
                   transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                   className="absolute w-[360px] h-[360px] rounded-full border border-yellow-500/5 border-l-yellow-500/40 relative"
                 >
                    <Star className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-500 fill-yellow-500 w-5 h-5" />
                 </motion.div>
                 <motion.div
                   animate={{ rotate: -360 }}
                   transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
                   className="absolute w-[410px] h-[410px] rounded-full border border-yellow-500/5 border-t-yellow-500/30 relative"
                 >
                    <Star className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-yellow-300 fill-yellow-300 w-6 h-6" />
                 </motion.div>
             </div>
             <div className="relative z-10 bg-[#0a1930] bg-opacity-90 backdrop-blur-md p-3 rounded-full shadow-[0_0_50px_rgba(202,138,4,0.3)] border border-yellow-600/30 flex items-center justify-center overflow-hidden w-[280px] h-[280px]">
                {logoUrl ? (
                  <img src={formatImageUrl(logoUrl)} className="w-[95%] h-[95%] object-contain drop-shadow-[0_0_30px_rgba(202,138,4,0.3)]" alt="Logo" referrerPolicy="no-referrer" />
                ) : (
                  <BookOpen className="text-yellow-500 w-24 h-24 drop-shadow-xl" />
                )}
             </div>
          </div>
        </div>
      </section>

      {/* Feature Bar Overlay */}
      <section className="relative z-20 -mt-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="bg-[#051124] rounded-2xl shadow-2xl p-6 sm:p-10 border border-slate-800 flex flex-col md:flex-row md:divide-x divide-y md:divide-y-0 divide-slate-800/50 gap-6 md:gap-0">
          {[
            { icon: <BookOpen className="text-yellow-500 w-8 h-8"/>, title: "BIBLICAL\nFOUNDATION", desc: "Grounded in the Word,\nbuilt on truth." },
            { icon: <Users className="text-yellow-500 w-8 h-8"/>, title: "LEADERSHIP\nDEVELOPMENT", desc: "Equipping leaders for\nministry and beyond." },
            { icon: <Globe className="text-yellow-500 w-8 h-8"/>, title: "GLOBAL\nIMPACT", desc: "Raising men and women\nto impact the nations." },
            { icon: <GraduationCap className="text-yellow-500 w-8 h-8"/>, title: "QUALITY\nEDUCATION", desc: "Academic excellence\nwith spiritual depth." }
          ].map((feat, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 flex-1 md:px-6 first:pl-0 last:pr-0 pt-6 md:pt-0 first:pt-0 group">
               <div className="w-16 h-16 rounded-full border border-yellow-600/30 flex items-center justify-center shrink-0 group-hover:bg-yellow-600/10 transition-colors">
                 {feat.icon}
               </div>
               <div>
                 <h4 className="text-white font-black text-xs uppercase tracking-wider mb-2 whitespace-pre-line">{feat.title}</h4>
                 <p className="text-slate-400 text-[11px] leading-relaxed whitespace-pre-line">{feat.desc}</p>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
           <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-10 mb-16">
             <div className="max-w-xl">
               <h4 className="text-yellow-600 font-bold tracking-[0.2em] uppercase text-[10px] mb-3">OUR PROGRAMS</h4>
               <h2 className="text-4xl md:text-5xl font-serif font-black text-slate-900 leading-[1.1] mb-6">
                 Discover Your <br/>
                 God-Given <span className="text-yellow-600 italic font-medium">Calling</span>
               </h2>
               <p className="text-slate-600 leading-relaxed mb-6">
                 We offer Spirit-led, accredited programs designed to prepare you for effective ministry and kingdom impact.
               </p>
               <Link to="/programmes" className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-8 py-3.5 rounded-sm font-bold uppercase tracking-widest text-xs inline-flex items-center gap-3 transition-colors shadow-lg">
                 VIEW ALL PROGRAMS <ArrowRight size={16} />
               </Link>
             </div>
             
             <div className="flex flex-col gap-6 w-full lg:w-auto">
               {anthemUrl && (
                 <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-slate-100 flex-shrink-0 flex flex-col sm:flex-row items-center gap-6 max-w-lg w-full relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                     <Music className="w-32 h-32 text-yellow-600" />
                   </div>
                   <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600 flex-shrink-0 relative z-10">
                     <Music size={32} />
                   </div>
                   <div className="text-center sm:text-left relative z-10 flex-1">
                     <h3 className="font-bold text-slate-800 text-lg mb-1">{anthemTitle || 'School Anthem'}</h3>
                     <audio controls className="w-full mt-2 h-10 outline-none">
                       <source src={anthemUrl} type="audio/mpeg" />
                       Your browser does not support the audio element.
                     </audio>
                   </div>
                 </div>
               )}

               <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-slate-100 flex-shrink-0 flex flex-col sm:flex-row items-center gap-6 max-w-lg w-full relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                   <Award className="w-32 h-32 text-yellow-600" />
                 </div>
                 <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600 flex-shrink-0 relative z-10">
                   <Award size={32} />
                 </div>
                 <div className="text-center sm:text-left relative z-10 flex-1">
                   <h3 className="font-bold text-slate-800 text-lg mb-1">Verify a Certificate</h3>
                   <p className="text-sm text-slate-500 mb-4">Confirm the authenticity of certificates issued by our seminary</p>
                   <Link to="/verify" className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-sm font-bold uppercase tracking-widest text-xs transition-colors shadow-md whitespace-nowrap inline-flex items-center justify-center w-full sm:w-auto">
                     Verify Now
                   </Link>
                 </div>
               </div>
             </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 bg-white shadow-xl lg:grid-cols-4 gap-0 rounded-2xl overflow-hidden border border-slate-100">
             {[
               { image: heroBanners?.[0] ? formatImageUrl(heroBanners[0]) : "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", icon: <BookOpen className="text-yellow-600 w-6 h-6"/>, title: "DIPLOMA\nIN THEOLOGY", desc: "Practical training for effective ministry." },
               { image: heroBanners?.[1] ? formatImageUrl(heroBanners[1]) : (heroBanners?.[0] ? formatImageUrl(heroBanners[0]) : "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"), icon: <GraduationCap className="text-yellow-600 w-6 h-6"/>, title: "BACHELOR\nOF THEOLOGY", desc: "In-depth study for leadership and ministry growth." },
               { image: heroBanners?.[2] ? formatImageUrl(heroBanners[2]) : (heroBanners?.[0] ? formatImageUrl(heroBanners[0]) : "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"), icon: <Award className="text-yellow-600 w-6 h-6"/>, title: "MASTER\nOF THEOLOGY", desc: "Advanced studies for mature leaders." },
               { image: heroBanners?.[3] ? formatImageUrl(heroBanners[3]) : (heroBanners?.[0] ? formatImageUrl(heroBanners[0]) : "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"), icon: <Award className="text-yellow-600 w-6 h-6"/>, title: "DOCTOR\nOF THEOLOGY", desc: "Highest academic achievement for scholars and leaders." },
             ].map((prog, i) => (
               <div key={i} className="flex flex-col group border-b md:border-b-0 md:border-r border-slate-100 last:border-r-0 hover:shadow-2xl transition-all relative z-10 bg-white">
                 <div className="h-48 overflow-hidden relative cursor-zoom-in" onClick={() => setSelectedFullImage(prog.image)}>
                   <img src={prog.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={prog.title} referrerPolicy="no-referrer" />
                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Click to preview</span>
                   </div>
                   <div className="absolute -bottom-6 w-full flex justify-center z-20">
                     <div className="w-12 h-12 bg-yellow-50 rounded-lg shadow-sm flex items-center justify-center transform rotate-45 border border-yellow-100 group-hover:bg-yellow-600 transition-colors">
                       <div className="-rotate-45 group-hover:text-white transition-colors">{prog.icon}</div>
                     </div>
                   </div>
                 </div>
                 <div className="pt-12 pb-8 px-8 text-center flex flex-col flex-1">
                   <h3 className="text-[15px] tracking-wide font-black text-slate-800 leading-[1.3] mb-4 whitespace-pre-line uppercase">{prog.title}</h3>
                   <p className="text-slate-500 text-[13px] leading-relaxed mb-8 flex-1">{prog.desc}</p>
                   <Link to="/admissions" className="text-yellow-600 uppercase font-bold text-[11px] tracking-widest flex items-center justify-center gap-2 group-hover:gap-3 transition-all">
                     LEARN MORE <ArrowRight size={14}/>
                   </Link>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#1e103c] py-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-white/5">
          {[
            { icon: <Users className="text-yellow-500/80 w-8 h-8"/>, num: "1,200+", label: "STUDENTS ENROLLED" },
            { icon: <Building2 className="text-yellow-500/80 w-8 h-8"/>, num: "50+", label: "QUALIFIED LECTURERS" },
            { icon: <Globe className="text-yellow-500/80 w-8 h-8"/>, num: "25+", label: "NATIONS REACHED" },
            { icon: <GraduationCap className="text-yellow-500/80 w-8 h-8"/>, num: "100%", label: "KINGDOM FOCUSED" }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center sm:flex-row sm:justify-center text-center sm:text-left px-4 gap-4">
              <div className="mb-2 sm:mb-0 shrink-0">{stat.icon}</div>
              <div>
                <div className="text-white text-3xl font-serif font-medium mb-1">{stat.num}</div>
                <div className="text-slate-400 text-[9px] uppercase tracking-widest font-bold">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us & Testimonial */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
           
           <div className="flex flex-col">
             <div className="mb-14">
               <h4 className="text-yellow-600 font-bold tracking-[0.2em] uppercase text-[10px] mb-4">WHY CHOOSE US?</h4>
               <h2 className="text-4xl md:text-5xl font-serif font-black text-slate-900 leading-[1.1] mb-8">
                 A Seminary With<br/>
                 Kingdom Purpose
               </h2>
               <ul className="space-y-4">
                 {[
                   "Christ-centered and Spirit-led environment",
                   "Experienced and anointed faculty",
                   "Practical ministry training and mentorship",
                   "Global recognition and accreditation",
                   "Affordable and accessible education"
                 ].map((item, i) => (
                   <li key={i} className="flex items-center gap-3">
                     <div className="w-5 h-5 rounded-full bg-yellow-600 text-white flex items-center justify-center shrink-0">
                        <CheckCircle size={14} />
                     </div>
                     <span className="text-slate-700 font-medium text-sm">{item}</span>
                   </li>
                 ))}
               </ul>
             </div>

             <div className="bg-[#0a1930] rounded-xl p-8 lg:p-10 shadow-2xl text-white border-l-4 border-yellow-600 w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Quote className="w-24 h-24 text-yellow-500" />
                </div>
                <Quote className="text-yellow-500 w-10 h-10 mb-6 opacity-80 relative z-10" />
                
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentTestimonialIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-base sm:text-lg leading-relaxed mb-8 font-light text-slate-200 relative z-10 min-h-[140px] md:min-h-[120px]">
                      {currentTestimonials[currentTestimonialIndex]?.quote}
                    </p>
                    <div className="flex justify-between items-end border-t border-slate-800 pt-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <img src={currentTestimonials[currentTestimonialIndex]?.img} alt="User" className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 shadow-lg" referrerPolicy="no-referrer" />
                        <div>
                          <h5 className="font-bold text-sm tracking-wide">{currentTestimonials[currentTestimonialIndex]?.author}</h5>
                          <p className="text-yellow-500 text-xs">{currentTestimonials[currentTestimonialIndex]?.role}</p>
                        </div>
                      </div>
                      <div className="hidden sm:flex gap-2">
                        <button onClick={prevTestimonial} className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-20 cursor-pointer">
                          <span className="text-xs">←</span>
                        </button>
                        <button onClick={nextTestimonial} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white border border-slate-700 transition-colors hover:bg-slate-700 z-20 cursor-pointer">
                          <span className="text-xs">→</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-center gap-1.5 mt-8 sm:hidden relative z-10">
                  {currentTestimonials.map((_, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setCurrentTestimonialIndex(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentTestimonialIndex ? 'bg-yellow-500' : 'bg-slate-700'}`}
                    />
                  ))}
                </div>
             </div>
           </div>

           <div className="h-full flex flex-col justify-center items-center lg:pt-16 w-full max-w-full">
             <div className="rounded-xl shadow-2xl w-full h-[600px] border-8 border-white bg-slate-100 overflow-hidden relative group">
               {galleryError ? (
                 <div className="absolute inset-0 flex items-center justify-center bg-red-50/90 p-6 text-center z-20 backdrop-blur-sm">
                   <div className="max-w-xs">
                     <p className="text-red-600 font-bold mb-2">Could not load gallery</p>
                     <p className="text-xs text-red-500 font-mono mb-3">{galleryError}</p>
                     {galleryError.toLowerCase().includes('timeout') ? (
                       <div className="bg-white/80 p-3 rounded-lg text-xs text-red-600 border border-red-100">
                         <strong>Temporary Timeout:</strong> The database is waking up. Please wait a few seconds and refresh.
                       </div>
                     ) : (
                       <p className="text-xs text-red-400">Check your Supabase RLS policies. The 'gallery' table must allow public SELECT queries for anonymous users.</p>
                     )}
                   </div>
                 </div>
               ) : null}
               
               {galleryImages.length > 0 ? (
                 <AnimatePresence mode="wait">
                   <motion.img
                     key={currentGalleryIndex}
                     src={galleryImages[currentGalleryIndex]?.image_url || galleryImages[currentGalleryIndex]?.imageUrl ? formatImageUrl(galleryImages[currentGalleryIndex].image_url || galleryImages[currentGalleryIndex].imageUrl) : "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"}
                     initial={{ opacity: 0, scale: 1.05 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 0.8 }}
                     className="w-full h-full object-cover absolute inset-0"
                     alt="Gallery" referrerPolicy="no-referrer"
                   />
                 </AnimatePresence>
               ) : (
                 <div className="w-full h-full absolute inset-0 bg-slate-200 flex flex-col justify-center items-center text-center p-6">
                   <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Students studying" className="w-full h-full object-cover absolute inset-0 opacity-50 mix-blend-overlay" referrerPolicy="no-referrer" />
                   <div className="relative z-10 bg-white/90 p-6 rounded-lg backdrop-blur-sm max-w-sm">
                     <p className="text-slate-800 font-bold mb-2">Configure Your Gallery</p>
                     <p className="text-sm text-slate-600 mb-4">Images from your gallery will appear here automatically.</p>
                     <div className="text-xs text-amber-700 bg-amber-100 p-3 rounded text-left border border-amber-200">
                       <strong>Admin Note:</strong> If you uploaded images in the admin dashboard but they aren't showing here, check your Supabase <strong>RLS Policies</strong>. The <code>gallery</code> table must allow <strong>SELECT</strong> operations for the <strong>anon</strong> (anonymous) role.
                     </div>
                   </div>
                 </div>
               )}
               
               {/* Controls/Indicators overlay optional */}
               {galleryImages.length > 1 && (
                 <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10">
                   {galleryImages.map((_, idx) => (
                     <button
                       key={idx}
                       onClick={() => setCurrentGalleryIndex(idx)}
                       className={`w-2.5 h-2.5 rounded-full transition-all ${currentGalleryIndex === idx ? 'bg-yellow-500 scale-125' : 'bg-white/50 hover:bg-white'}`}
                     />
                   ))}
                 </div>
               )}
             </div>
           </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-gradient-to-r from-yellow-700 via-yellow-600 to-[#c28420] py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.15]">
          <img src="https://images.unsplash.com/photo-1438283173091-5dbf5c5a3206?auto=format&fit=crop&w=1920&q=80" alt="Background map" className="w-full h-full object-cover object-center grayscale mix-blend-overlay" />
        </div>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
           <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
             <div className="w-20 h-20 bg-[#0a1930] rounded-full flex items-center justify-center border-[6px] border-white/10 shrink-0 overflow-hidden">
               {logoUrl ? (
                 <img src={formatImageUrl(logoUrl)} className="w-full h-full object-contain p-2" alt="Logo" />
               ) : (
                 <BookOpen className="text-yellow-500 w-8 h-8" />
               )}
             </div>
             <div>
               <h2 className="text-3xl md:text-4xl font-serif font-black text-white mb-2 leading-tight drop-shadow-sm">
                 Your Future in Ministry Starts Here
               </h2>
               <p className="text-yellow-50 text-sm md:text-base font-medium max-w-xl">
                 Take the next step in your calling. Apply today and become part of a global family raising kingdom leaders.
               </p>
             </div>
           </div>
           <Link to="/admissions" className="bg-[#0a1930] hover:bg-[#112444] text-white px-8 py-4 rounded-sm font-black uppercase tracking-widest text-xs transition-all whitespace-nowrap inline-flex items-center gap-3 shrink-0 shadow-2xl hover:scale-105">
             APPLY NOW <ArrowRight size={16} />
           </Link>
        </div>
      </section>

      {/* Full Screen Image Preview Modal */}
      <AnimatePresence>
        {selectedFullImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-8"
            onClick={() => setSelectedFullImage(null)}
          >
            <button 
              className="absolute top-6 right-6 text-white hover:text-yellow-500 transition-colors z-[110]"
              onClick={() => setSelectedFullImage(null)}
            >
              <X size={40} />
            </button>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedFullImage} 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                alt="Full preview"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
