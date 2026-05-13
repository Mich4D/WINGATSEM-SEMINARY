import React from 'react';
import { BookOpen, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { formatImageUrl } from '../utils/formatImage';

export default function Footer() {
  const { logoUrl } = useSettings();

  return (
    <footer className="bg-[#0f172a] text-slate-300 py-16 border-t border-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column - wider */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-4 mb-6">
              {logoUrl ? (
                <img 
                  src={formatImageUrl(logoUrl)} 
                  alt="Winning Gate Logo" 
                  className="h-16 w-auto object-contain bg-white p-1 rounded-sm"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="bg-yellow-600 p-3 rounded-full text-white shadow-lg">
                  <BookOpen size={28} />
                </div>
              )}
              <div className="flex flex-col justify-center">
                <span className="font-display font-black text-3xl text-white block leading-[0.9] tracking-[0.02em] uppercase whitespace-nowrap text-center">WINNING GATE</span>
                <span className="text-[10.5px] font-bold text-yellow-500 uppercase tracking-[0.26em] block font-sans mt-1 whitespace-nowrap pl-1 text-center">Christian Theological Seminary</span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-sm">
              Equipping leaders, transforming lives, and impacting nations through Christ-centered theological education.
            </p>
            <div className="flex gap-4">
               <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-yellow-600 hover:text-white transition-colors">
                 <Facebook size={18} />
               </a>
               <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-yellow-600 hover:text-white transition-colors">
                 <Twitter size={18} />
               </a>
               <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-yellow-600 hover:text-white transition-colors">
                 <Instagram size={18} />
               </a>
               <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-yellow-600 hover:text-white transition-colors">
                 <Youtube size={18} />
               </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest flex items-center gap-2">
              <span className="w-4 h-0.5 bg-yellow-600"></span>
              Quick Links
            </h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to="/about" className="text-slate-400 hover:text-yellow-500 transition-colors uppercase tracking-wider text-[11px]">About Us</Link></li>
              <li><Link to="/programmes" className="text-slate-400 hover:text-yellow-500 transition-colors uppercase tracking-wider text-[11px]">Programs</Link></li>
              <li><Link to="/admissions" className="text-slate-400 hover:text-yellow-500 transition-colors uppercase tracking-wider text-[11px]">Admissions</Link></li>
              <li><Link to="/gallery" className="text-slate-400 hover:text-yellow-500 transition-colors uppercase tracking-wider text-[11px]">Gallery</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-yellow-500 transition-colors uppercase tracking-wider text-[11px]">Contact Us</Link></li>
              <li><Link to="/login" className="text-slate-400 hover:text-yellow-500 transition-colors uppercase tracking-wider text-[11px]">Student Login</Link></li>
            </ul>
          </div>
          
          {/* Programmes */}
          <div>
            <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest flex items-center gap-2">
              <span className="w-4 h-0.5 bg-yellow-600"></span>
              Programs
            </h3>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to="/programmes" className="text-slate-400 hover:text-yellow-500 transition-colors uppercase tracking-wider text-[11px]">Certificate in Theology</Link></li>
              <li><Link to="/programmes" className="text-slate-400 hover:text-yellow-500 transition-colors uppercase tracking-wider text-[11px]">Diploma in Ministry</Link></li>
              <li><Link to="/programmes" className="text-slate-400 hover:text-yellow-500 transition-colors uppercase tracking-wider text-[11px]">Bachelor of Theology</Link></li>
              <li><Link to="/programmes" className="text-slate-400 hover:text-yellow-500 transition-colors uppercase tracking-wider text-[11px]">Master of Theology</Link></li>
              <li><Link to="/programmes" className="text-slate-400 hover:text-yellow-500 transition-colors uppercase tracking-wider text-[11px]">Short Courses</Link></li>
            </ul>
          </div>
          
          {/* Contact Details & Newsletter */}
          <div>
            <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest flex items-center gap-2">
              <span className="w-4 h-0.5 bg-yellow-600"></span>
              Contact Us
            </h3>
            <ul className="space-y-4 text-sm mb-8">
              <li className="flex items-start gap-3 text-slate-400">
                <MapPin size={16} className="text-yellow-600 shrink-0 mt-1" />
                <span className="leading-relaxed text-[13px]">3, Church Street, Aboru Iyana Ipaja, Lagos State Nigeria</span>
              </li>
              <li className="flex items-start gap-3 text-slate-400">
                <Phone size={16} className="text-yellow-600 shrink-0 mt-1" />
                <div className="flex flex-col gap-1 text-[13px]">
                  <a href="tel:08063885201" className="hover:text-yellow-500 transition-colors">08063885201</a>
                </div>
              </li>
              <li className="flex items-start gap-3 text-slate-400">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366" className="shrink-0 mt-1"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                <div className="flex flex-col gap-1 text-[13px]">
                  <a href="https://wa.me/2349067505783" target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition-colors">09067505783</a>
                </div>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Mail size={16} className="text-yellow-600 shrink-0" />
                <a href="mailto:wingatsem@gmail.com" className="hover:text-yellow-500 transition-colors text-[13px]">wingatsem@gmail.com</a>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Globe size={16} className="text-yellow-600 shrink-0" />
                <span className="text-[13px]">www.winninggateseminary.com.ng</span>
              </li>
            </ul>

            <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-widest">Newsletter</h4>
            <div className="flex gap-2">
               <input type="email" placeholder="Email Address" className="bg-slate-800 border-none outline-none text-white text-xs px-4 py-2 w-full rounded-sm placeholder:text-slate-500 focus:ring-1 focus:ring-yellow-600" />
               <button className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-colors">
                 Subscribe
               </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-500 font-medium">
          <p>&copy; {new Date().getFullYear()} Winning Gate Theological Seminary. All rights reserved.</p>
          <p className="italic text-slate-400 uppercase tracking-widest text-[10px]">&quot;...raising champions for Christ and impacting generations.&quot;</p>
        </div>
      </div>
    </footer>
  );
}
