import React from 'react';
import { motion } from 'motion/react';

export default function FloatingWhatsApp() {
  const whatsappNumber = "2349067505783"; 
  
  return (
    <motion.a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-5 md:bottom-28 md:right-8 bg-[#25D366] text-white p-3 md:p-4 rounded-full shadow-lg z-50 hover:bg-[#20bd5a] transition-colors flex items-center justify-center group"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
      <span className="absolute right-full mr-3 bg-white text-slate-800 text-sm py-1 px-3 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
        Chat on WhatsApp
      </span>
    </motion.a>
  );
}
