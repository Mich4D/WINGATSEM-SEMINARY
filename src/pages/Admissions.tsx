import React from 'react';
import { FileText, CheckCircle, CreditCard, UserPlus, Globe, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

export default function Admissions() {
  const { importantDates, isAdmissionOpen } = useSettings();

  const parseDate = (dateStr: string | undefined) => {
    if (!dateStr) return { month: 'TBD', day: '' };
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length < 2) return { month: parts[0] || 'TBD', day: '' };
    
    // Check if first part is numeric (e.g. "15 Aug")
    if (/^\d+$/.test(parts[0])) {
      return { month: parts[1], day: parts[0] };
    }
    // Default to "Aug 15" format
    return {
      month: parts[0] || 'TBD',
      day: parts[1] || ''
    };
  };

  const opens = parseDate(importantDates?.applicationOpens);
  const deadline = parseDate(importantDates?.applicationDeadline);
  const orientation = parseDate(importantDates?.orientationBegins);

  const steps = [
    {
      icon: <UserPlus size={24} />,
      title: "Create an Account",
      desc: "Sign up on our student portal to begin your application process."
    },
    {
      icon: <FileText size={24} />,
      title: "Complete Application",
      desc: "Fill out the online application form with your personal and academic details."
    },
    {
      icon: <CreditCard size={24} />,
      title: "Pay Application Fee",
      desc: "Submit the non-refundable application fee securely online."
    },
    {
      icon: <CheckCircle size={24} />,
      title: "Await Admission",
      desc: "Our admissions committee will review your application and notify you of their decision."
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4">Admissions</h1>
          <div className="w-24 h-1 bg-yellow-600 mx-auto rounded-full mb-6"></div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Take the first step towards your theological education. Our admissions process is designed to be straightforward and accessible.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-6 py-2.5 bg-yellow-500/10 text-yellow-800 rounded-full text-[10px] uppercase font-black tracking-[0.2em] border border-yellow-500/20 shadow-sm">
            <Globe size={14} className="text-yellow-600" />
            Fully Loaded in English & Yoruba
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-16 mb-16">
          <h2 className="text-3xl font-serif font-bold text-slate-900 mb-10 text-center">Application Process</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-slate-100 z-0"></div>
            
            {steps.map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-white rounded-full border-4 border-slate-50 shadow-md flex items-center justify-center text-yellow-600 mb-6 relative">
                  {step.icon}
                  <div className="absolute -top-2 -left-2 w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                    {idx + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className={`rounded-3xl p-10 md:p-12 relative overflow-hidden text-white transition-all ${isAdmissionOpen ? 'bg-slate-900' : 'bg-slate-800'}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
            
            <h2 className="text-3xl font-serif font-bold mb-6 relative z-10">
              {isAdmissionOpen ? 'Ready to Apply?' : 'Admission Closed'}
            </h2>
            <p className="text-slate-300 mb-8 leading-relaxed relative z-10">
              {isAdmissionOpen 
                ? "Applications for the upcoming academic session are currently open. Create an account on our student portal to start your application today."
                : "The admission portal is currently closed for the season. You can still learn about our programmes or contact us for inquiries."
              }
            </p>
            
            {isAdmissionOpen ? (
              <Link to="/login" className="inline-block bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-4 rounded-md font-bold transition-colors shadow-lg relative z-10">
                Go to Student Portal
              </Link>
            ) : (
              <Link to="/contact" className="inline-block bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-md font-bold transition-colors relative z-10 backdrop-blur-sm">
                Inquire About Next Intake
              </Link>
            )}
          </div>
          
          <div className="bg-white rounded-3xl p-10 md:p-12 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Important Dates</h2>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 pb-6 border-b border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-xl flex flex-col items-center justify-center shrink-0 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase">{opens.month}</span>
                  <span className="text-xl font-bold text-yellow-600">{opens.day}</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Application Opens</h4>
                  <p className="text-sm text-slate-600">Portal opens for new applications for the Fall semester.</p>
                </div>
              </li>
              <li className="flex items-start gap-4 pb-6 border-b border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-xl flex flex-col items-center justify-center shrink-0 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase">{deadline.month}</span>
                  <span className="text-xl font-bold text-yellow-600">{deadline.day}</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Application Deadline</h4>
                  <p className="text-sm text-slate-600">Last day to submit applications and supporting documents.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-xl flex flex-col items-center justify-center shrink-0 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase">{orientation.month}</span>
                  <span className="text-xl font-bold text-yellow-600">{orientation.day}</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Orientation Begins</h4>
                  <p className="text-sm text-slate-600">Mandatory orientation for all newly admitted students.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div className="bg-slate-900 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-3xl font-display font-bold text-white mb-6">Need Help with Your Application?</h2>
            <p className="text-slate-300 mb-10 max-w-2xl mx-auto italic">
              "Our admissions counselors are standing by to guide you through the process in both Yoruba and English."
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a 
                href="tel:08063885201" 
                className="flex items-center gap-3 bg-yellow-600 hover:bg-yellow-500 text-slate-950 px-10 py-5 rounded-sm font-black transition-all uppercase tracking-[0.2em] text-[12px] shadow-xl shadow-yellow-600/20"
              >
                <Phone size={18} />
                Call Admissions
              </a>
              <a 
                href="https://wa.me/2349067505783" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-sm font-black transition-all border border-white/20 uppercase tracking-[0.2em] text-[12px] backdrop-blur-md"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#22c55e" className="shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp Us
              </a>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-600/10 blur-[100px] rounded-full -ml-32 -mb-32"></div>
        </div>
      </div>
    </div>
  );
}
