import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, GraduationCap, Award, FileText, CheckCircle, XCircle, Loader2, Calendar, BookOpen, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';

export default function VerifyStudent() {
  const [regNumber, setRegNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const location = useLocation();

  // Handle query parameter for quick search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const regParam = params.get('reg');
    if (regParam) {
      setRegNumber(regParam.toUpperCase());
      performVerification(regParam);
    }
  }, [location.search]);

  const performVerification = async (searchVal: string) => {
    if (!searchVal.trim()) return;

    setLoading(true);
    setError('');
    setStudent(null);
    setCertificates([]);
    setSearched(true);
    
    let sanitizedVal = searchVal.trim();
    // If it looks like a registration number (contains slashes), remove all spaces
    if (sanitizedVal.includes('/')) {
      sanitizedVal = sanitizedVal.replace(/\s/g, '');
    }

    try {
      // Fetch student info
      // Try exact registration number only (case-insensitive) for better privacy
      const { data: studentData, error: studentError } = await supabase
        .from('users')
        .select('id, name, registration_number, department_code, program_type, level, date_registered, profile_image_url')
        .ilike('registration_number', sanitizedVal)
        .maybeSingle();

      if (studentError) {
        console.error('Database Error:', studentError);
        if (studentError.code === '42501' || studentError.message?.includes('policy')) {
          setError('Verification unavailable: Please contact the administrator. (DB Policy Restriction)');
        } else {
          setError(`Database Error: ${studentError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!studentData) {
        setError('No student found with this registration number. Ensure the format is correct (e.g., WGTS/DP/26/0001).');
        setLoading(false);
        return;
      }

      setStudent(studentData);

      // Fetch issued certificates
      const { data: certData, error: certError } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', studentData.id)
        .order('date_awarded', { ascending: false });

      if (certData) {
        setCertificates(certData);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('An error occurred while verifying the registration number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(regNumber);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-yellow-100 rounded-full text-yellow-700 mb-4">
            <GraduationCap size={40} />
          </div>
          <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">Student & Certificate Verification</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Verify the authenticity of student credentials and certificates issued by Winning Gate Christian Theological Seminary.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 mb-8 p-6 md:p-8">
          <form onSubmit={handleVerify} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Enter Registration Number or Email Address"
                className="block w-full pl-10 pr-3 py-4 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent sm:text-lg transition-all"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-70 gap-2 shadow-lg shadow-slate-900/10 min-w-[160px]"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'Verify Status'}
            </button>
          </form>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-4"
            >
              <XCircle className="text-red-500 shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="text-lg font-bold text-red-900">Verification Failed</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {student && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Student Info Card */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-2xl bg-yellow-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                      {student.profile_image_url ? (
                        <img 
                          src={student.profile_image_url} 
                          alt={student.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Users size={64} className="text-yellow-600" />
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-4 border-white">
                      <CheckCircle size={20} />
                    </div>
                  </div>

                  <div className="flex-grow text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-3xl font-serif font-bold text-slate-900">{student.name}</h2>
                        <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                            Active Student Status verified
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Registration Number</span>
                        <span className="text-lg font-mono font-bold text-slate-900 tracking-tighter">{student.registration_number}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Programme</span>
                          <span className="text-slate-900 font-medium capitalize">{student.department_code || 'Theological Studies'}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                          <GraduationCap size={20} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Level</span>
                          <span className="text-slate-900 font-medium">{student.level || 'Diploma'}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Admission Date</span>
                          <span className="text-slate-900 font-medium">
                            {student.date_registered ? new Date(student.date_registered).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificates Section */}
              <div>
                <h3 className="text-2xl font-serif font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Award className="text-yellow-600" />
                  Educational Credentials & Certificates
                </h3>

                {certificates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {certificates.map((cert) => (
                      <div key={cert.id} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 flex items-start gap-4">
                        <div className="p-4 bg-yellow-50 text-yellow-600 rounded-xl">
                          <Award size={32} />
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1">{cert.course_name || cert.courseName || 'Certificate of Completion'}</h4>
                            <CheckCircle className="text-green-500 shrink-0" size={20} />
                          </div>
                          <p className="text-sm text-slate-500 mb-4">{cert.department || 'Theological Department'}</p>
                          
                          <div className="flex flex-wrap gap-4 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                              <Calendar size={14} />
                              <span>Awarded: {cert.date_awarded ? new Date(cert.date_awarded).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                              <FileText size={14} />
                              <span>Verified Authentic</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-100 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
                    <FileText size={48} className="mx-auto text-slate-400 mb-4" />
                    <h4 className="text-lg font-bold text-slate-700">No Certificates Found</h4>
                    <p className="text-slate-500">No public certificates have been issued to this registration number yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {!searched && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="bg-slate-100 inline-block p-6 rounded-3xl mb-4">
                <Search size={48} className="text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">Ready to verify. Enter a registration number above.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-20 text-center border-t border-slate-200 pt-8">
          <p className="text-slate-500 text-sm">
            For further verification inquiries, please contact our administrative office at 
            <a href="mailto:wingatsem@gmail.com" className="text-yellow-600 font-bold ml-1 hover:underline">wingatsem@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
