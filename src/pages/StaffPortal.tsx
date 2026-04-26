import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { GraduationCap, ShieldCheck, ArrowRight, BookOpen, UserCog, TowerControl as Control } from 'lucide-react';
import { formatImageUrl } from '../utils/formatImage';
import { motion } from 'motion/react';

export default function StaffPortal() {
  const navigate = useNavigate();
  const { logoUrl } = useSettings();

  const staffTypes = [
    {
      id: 'teacher',
      title: 'Teacher Portal',
      description: 'Access your classes, manage attendance, and communicate with students using your teacher passkey.',
      icon: <GraduationCap size={48} className="text-yellow-600" />,
      link: '/teacher-login',
      color: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      hoverBorder: 'hover:border-yellow-500'
    },
    {
      id: 'admin',
      title: 'Admin Portal',
      description: 'System administrators can manage settings, approve admissions, and oversee total seminary operations.',
      icon: <UserCog size={48} className="text-slate-800" />,
      link: '/login?role=admin', // Administrative login currently uses the main authentication system
      color: 'bg-slate-50',
      borderColor: 'border-slate-200',
      hoverBorder: 'hover:border-slate-800'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-yellow-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-slate-900/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 cursor-pointer"
            onClick={() => navigate('/')}
          >
            {logoUrl ? (
              <img src={formatImageUrl(logoUrl)} alt="Logo" className="h-24 w-auto object-contain drop-shadow-md" />
            ) : (
              <div className="w-20 h-20 bg-yellow-600 rounded-full flex items-center justify-center text-white shadow-xl">
                <BookOpen size={40} />
              </div>
            )}
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="text-4xl md:text-6xl font-serif font-black text-slate-900 mb-6 tracking-tight"
          >
            Staff Portal Entry
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="text-slate-500 text-lg md:text-xl max-w-2xl font-light leading-relaxed"
          >
            Please select your appropriate portal to access the seminary administrative and educational systems.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {staffTypes.map((type, idx) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (idx * 0.1), duration: 0.8 }}
              whileHover={{ y: -5 }}
              onClick={() => navigate(type.link)}
              className={`group cursor-pointer p-10 rounded-2xl border-2 ${type.borderColor} ${type.color} ${type.hoverBorder} transition-all duration-500 flex flex-col items-start h-full shadow-sm hover:shadow-2xl relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5 group-hover:opacity-10 transition-all group-hover:scale-125 duration-700">
                {type.icon}
              </div>
              
              <div className="mb-8 p-4 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-500">
                {type.icon}
              </div>
              
              <h2 className="text-2xl font-serif font-black text-slate-900 mb-4 flex items-center gap-2">
                {type.title}
              </h2>
              
              <p className="text-slate-600 font-light leading-relaxed mb-auto">
                {type.description}
              </p>
              
              <div className="mt-10 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] group-hover:gap-4 transition-all border-b-2 border-transparent group-hover:border-current pb-1">
                Enter Portal <ArrowRight size={16} />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-20 text-center"
        >
          <button 
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-yellow-600 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 mx-auto"
          >
            <Control size={16} /> Back to Homepage
          </button>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <div className="py-10 text-center border-t border-slate-50 bg-slate-50/50">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Secured Staff Authentication System &copy; {new Date().getFullYear()} Winning Gate Seminary
        </p>
      </div>
    </div>
  );
}
