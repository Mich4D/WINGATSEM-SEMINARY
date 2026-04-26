import React from 'react';
import { BookOpen, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { formatImageUrl } from '../utils/formatImage';

export default function Footer() {
  const { logoUrl } = useSettings();

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              {logoUrl ? (
                <img 
                  src={formatImageUrl(logoUrl)} 
                  alt="Winning Gate Logo" 
                  className="h-12 w-auto object-contain bg-white p-1 rounded-md"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="bg-yellow-600 p-2 rounded-full text-white">
                  <BookOpen size={24} />
                </div>
              )}
              <div>
                <span className="font-display font-black text-xl text-white block leading-tight tracking-tight">WINNING GATE</span>
                <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.2em] block">Christian Theological Seminary</span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Ability to Build the Builders. Equipping leaders for effective ministry in the 21st century through rigorous theological education.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="hover:text-yellow-500 transition-colors">About Us</Link></li>
              <li><Link to="/programmes" className="hover:text-yellow-500 transition-colors">Academic Programmes</Link></li>
              <li><Link to="/admissions" className="hover:text-yellow-500 transition-colors">Admissions</Link></li>
              <li><Link to="/verify" className="hover:text-yellow-500 transition-colors">Verify Certificate</Link></li>
              <li><Link to="/login" className="hover:text-yellow-500 transition-colors">Student Portal</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Programmes</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/programmes?prog=Diploma" className="hover:text-yellow-500 transition-colors">Diploma in Theology</Link></li>
              <li><Link to="/programmes?prog=Bachelor" className="hover:text-yellow-500 transition-colors">Bachelor of Theology</Link></li>
              <li><Link to="/programmes?prog=Master" className="hover:text-yellow-500 transition-colors">Master of Theology</Link></li>
              <li><Link to="/programmes?prog=Doctorate" className="hover:text-yellow-500 transition-colors">Doctorate in Theology</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Contact Us</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-yellow-600 shrink-0 mt-0.5" />
                <span>3, Church Street, Aboru Iyana Ipaja,<br/>Lagos State Nigeria</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={18} className="text-yellow-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-2">
                  <a href="tel:08063885201" className="hover:text-yellow-500 transition-colors">08063885201</a>
                  <a href="https://wa.me/2349067505783" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-green-400 transition-colors text-slate-300">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    09067505783
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-yellow-600 shrink-0" />
                <a href="mailto:wingatsem@gmail.com" className="hover:text-yellow-500 transition-colors">wingatsem@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} WINNING GATE CHRISTIAN THEOLOGICAL SEMINARY. All rights reserved.</p>
          <p>Designed for Excellence</p>
        </div>
      </div>
    </footer>
  );
}
