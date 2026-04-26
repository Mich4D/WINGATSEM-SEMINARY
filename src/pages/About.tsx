import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { formatImageUrl } from '../utils/formatImage';
import { Globe } from 'lucide-react';

export default function About() {
  const { rectorImageUrl } = useSettings();

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4">About Us</h1>
          <div className="w-24 h-1 bg-yellow-600 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-6">Our History & Mission</h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              WINNING GATE CHRISTIAN THEOLOGICAL SEMINARY was founded with a clear mandate: to equip men and women for effective ministry in the 21st century. Our motto, <span className="font-semibold text-yellow-600">"Ability to Build the Builders"</span>, reflects our commitment to developing leaders who will in turn develop others.
            </p>
            <p className="text-slate-600 text-lg leading-relaxed mb-8">
              We provide a rigorous academic environment combined with deep spiritual formation, ensuring our graduates are not only theologically sound but practically equipped for the challenges of modern ministry.
            </p>
            
            <h2 className="text-3xl font-serif font-bold text-slate-900 mb-6">Our Vision</h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              To be a world-class theological institution that raises transformational leaders, deeply rooted in the Word of God, empowered by the Holy Spirit, and dedicated to advancing the Kingdom of God across all spheres of human endeavor globally.
            </p>

            <div className="mt-12 p-8 bg-yellow-50 rounded-2xl border border-yellow-100 flex items-start gap-6">
              <div className="w-16 h-16 bg-yellow-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                <Globe size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Language of Instruction</h3>
                <p className="text-slate-600 leading-relaxed">
                  Our comprehensive curriculum is <span className="font-bold text-yellow-600 italic uppercase tracking-tighter">fully loaded</span> in both <span className="font-bold text-slate-900 leading-none">English and Yoruba Languages</span>. This ensures every student can reach their highest potential in their preferred tongue.
                </p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-600 rounded-2xl transform translate-x-4 translate-y-4 opacity-20"></div>
            <img 
              src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
              alt="Seminary Campus" 
              className="rounded-2xl shadow-xl relative z-10 w-full h-auto object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-lg bg-slate-100 relative">
                {rectorImageUrl ? (
                  <img 
                    src={formatImageUrl(rectorImageUrl)} 
                    alt="Pastor Dr ADEWOLE ADETORO" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <img 
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                    alt="Pastor Dr ADEWOLE ADETORO" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                  <h3 className="text-white font-display font-bold text-xl tracking-wide uppercase">Pastor Dr ADEWOLE ADETORO</h3>
                  <p className="text-yellow-400 text-sm font-medium uppercase tracking-widest">Rector</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7">
              <h3 className="text-yellow-600 font-semibold tracking-wider uppercase text-sm mb-2">Message from the Rector</h3>
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-6 uppercase tracking-tight">Welcome to WINNING GATE CHRISTIAN THEOLOGICAL SEMINARY</h2>
              <div className="prose prose-lg text-slate-600">
                <p>
                  Welcome to WINNING GATE CHRISTIAN THEOLOGICAL SEMINARY. It is our joy to partner with you in your journey of theological education and ministerial preparation.
                </p>
                <p>
                  In a rapidly changing world, the need for grounded, visionary, and compassionate Christian leaders has never been greater. Our curriculum is designed to challenge your intellect, deepen your faith, and sharpen your practical skills.
                </p>
                <p>
                  Whether you are called to pastoral ministry, missions, academic research, or marketplace leadership, you will find a supportive community here dedicated to your success.
                </p>
                <p className="font-serif italic text-xl text-slate-800 mt-8 border-l-4 border-yellow-600 pl-6">
                  "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
