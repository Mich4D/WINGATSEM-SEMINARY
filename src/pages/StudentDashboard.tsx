import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Book, Award, CreditCard, Download, User, CheckCircle, AlertCircle, Video, Lock, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import Webcam from 'react-webcam';
import { Country, State, City } from 'country-state-city';

import PaymentButton from '../components/PaymentButton';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState<string | null>(null);
  
  // Class Join Verification State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [verifyRegNumber, setVerifyRegNumber] = useState('');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const webcamRef = React.useRef<Webcam>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Download OTP states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpTargetCert, setOtpTargetCert] = useState<any>(null);
  const [otpError, setOtpError] = useState('');
  
  // Profile completion form state
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    phoneNumber: profile?.phoneNumber || '',
    address: profile?.address || '',
    dateOfBirth: profile?.dateOfBirth || '',
    gender: profile?.gender || '',
    country: profile?.nationality || '', // Assuming country maps to nationality
    nationality: profile?.nationality || '',
    stateOfOrigin: profile?.stateOfOrigin || '',
    city: profile?.address || '', // Assuming city maps to address
    programType: profile?.programType || '',
    departmentCode: profile?.departmentCode || '',
    level: profile?.level || '',
    declarationOfFaith: profile?.declarationOfFaith || '',
    baptismDate: profile?.baptismDate || '',
    churchName: profile?.churchName || '',
    churchPosition: profile?.churchPosition || '',
    learningMode: profile?.learningMode || '',
    classLanguage: profile?.classLanguage || 'English',
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [refLetter1File, setRefLetter1File] = useState<File | null>(null);
  const [refLetter2File, setRefLetter2File] = useState<File | null>(null);
  const [baptismCertFile, setBaptismCertFile] = useState<File | null>(null);
  const [academicCredentialFile, setAcademicCredentialFile] = useState<File | null>(null);
  
  const [academicHistory, setAcademicHistory] = useState({
    diploma: { year: '', date: '', school: '' },
    bachelor: { year: '', date: '', school: '' },
    master: { year: '', date: '', school: '' },
  });
  const [diplomaFile, setDiplomaFile] = useState<File | null>(null);
  const [bachelorFile, setBachelorFile] = useState<File | null>(null);
  const [masterFile, setMasterFile] = useState<File | null>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const [registrationStep, setRegistrationStep] = useState<1 | 2 | 3>(1);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase.from('departments').select('*');
        if (error || !data || data.length === 0) {
          // If no departments exist, use some defaults for the UI
          setDepartments([
            { id: 'diploma', code: 'DIP', name: 'Diploma In Th' },
            { id: 'bachelor', code: 'BACH', name: 'Bachelor' },
            { id: 'masters', code: 'MAST', name: 'Masters' },
            { id: 'doctorate', code: 'DOC', name: 'Doctorate' }
          ]);
        } else {
          setDepartments(data);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        // Fallback defaults if permission denied or other error
        setDepartments([
          { id: 'diploma', code: 'DIP', name: 'Diploma In Th' },
          { id: 'bachelor', code: 'BACH', name: 'Bachelor' },
          { id: 'masters', code: 'MAST', name: 'Masters' },
          { id: 'doctorate', code: 'DOC', name: 'Doctorate' }
        ]);
      }
    };
    fetchDepartments();

    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').eq('id', 'global').single();
      if (data) {
        setSettings(data);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (profile && !hasInitialized) {
      setFormData({
        displayName: profile.displayName || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
        dateOfBirth: profile.dateOfBirth || '',
        gender: profile.gender || '',
        country: profile.country || '',
        nationality: profile.nationality || '',
        stateOfOrigin: profile.stateOfOrigin || '',
        city: profile.city || '',
        programType: profile.programType || '',
        departmentCode: profile.departmentCode || '',
        level: profile.level || '',
        declarationOfFaith: profile.declarationOfFaith || '',
        baptismDate: profile.baptismDate || '',
        churchName: profile.churchName || '',
        churchPosition: profile.churchPosition || '',
        learningMode: profile.learningMode || '',
        classLanguage: profile.classLanguage || 'English',
      });
      
      if (profile.academicHistory) {
        setAcademicHistory({
          diploma: { year: profile.academicHistory.diploma?.year || '', date: profile.academicHistory.diploma?.date || '', school: profile.academicHistory.diploma?.school || '' },
          bachelor: { year: profile.academicHistory.bachelor?.year || '', date: profile.academicHistory.bachelor?.date || '', school: profile.academicHistory.bachelor?.school || '' },
          master: { year: profile.academicHistory.master?.year || '', date: profile.academicHistory.master?.date || '', school: profile.academicHistory.master?.school || '' },
        });
      }
      setHasInitialized(true);
    }
  }, [profile, hasInitialized]);

  useEffect(() => {
    if (!user || !profile) return;

    // Fetch courses for student's department and level
    const fetchCourses = async () => {
      if (profile.departmentCode && profile.level) {
        // Find department ID first
        const { data: deptData } = await supabase
          .from('departments')
          .select('id')
          .eq('code', profile.departmentCode)
          .single();

        if (deptData) {
          const { data: coursesData } = await supabase
            .from('courses')
            .select('*')
            .eq('department_id', deptData.id)
            .eq('level', profile.level);
          
          if (coursesData) setCourses(coursesData);
        }
      }
    };

    // Fetch certificates
    const fetchCertificates = async () => {
      const { data } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id);
      if (data) setCertificates(data);
      setLoading(false);
    };

    // Fetch grades (assume table exists or ignore)
    const fetchGrades = async () => {
      const { data } = await supabase
        .from('grades')
        .select('*')
        .eq('user_id', user.id);
      if (data) setGrades(data);
    };

    // Fetch assignments (assume table exists or ignore)
    const fetchAssignments = async () => {
      const { data } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', user.id);
      if (data) setAssignments(data);
    };

    fetchCourses();
    fetchCertificates();
    fetchGrades();
    fetchAssignments();
  }, [user, profile]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const certId = urlParams.get('certId');

    if (paymentStatus === 'success' && certId && user) {
      const updateCertificate = async () => {
        try {
          console.log("Processing certificate payment success from URL...");
          await supabase
            .from('certificates')
            .update({ payment_status: 'paid' })
            .eq('id', certId);
          
          // Clean up the URL but preserve other params like 'tab'
          const newParams = new URLSearchParams(window.location.search);
          newParams.delete('payment');
          newParams.delete('certId');
          newParams.delete('tx_ref');
          newParams.delete('transaction_id');
          const newSearch = newParams.toString();
          const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '');
          window.history.replaceState({}, document.title, newUrl);
          
          alert("Certificate payment successful! You can now download your certificate.");
          window.location.reload();
        } catch (error) {
          console.error("Error updating certificate after payment:", error);
        }
      };
      
      updateCertificate();
    } else if (paymentStatus === 'registration_success' && user) {
      const completeRegistration = async () => {
        try {
          console.log("Processing registration payment success from URL...");
          await supabase
            .from('users')
            .update({ 
              profile_completed: true,
              registration_fee_paid: true 
            })
            .eq('id', user.id);
          
          // Clean up the URL but preserve other params
          const newParams = new URLSearchParams(window.location.search);
          newParams.delete('payment');
          newParams.delete('tx_ref');
          newParams.delete('transaction_id');
          const newSearch = newParams.toString();
          const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '');
          window.history.replaceState({}, document.title, newUrl);

          alert("Payment successful! Your profile has been submitted for approval.");
          window.location.reload();
        } catch (error) {
          console.error("Error completing registration:", error);
        }
      };
      
      completeRegistration();
    } else if (paymentStatus === 'cancelled') {
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete('payment');
      const newSearch = newParams.toString();
      const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '');
      window.history.replaceState({}, document.title, newUrl);
      alert("Payment was cancelled.");
    } else if (paymentStatus === 'registration_cancelled') {
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete('payment');
      const newSearch = newParams.toString();
      const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '');
      window.history.replaceState({}, document.title, newUrl);
      alert("Registration payment was cancelled. Your profile details were saved, but you must complete payment to submit your application.");
    }
  }, [user]);

  const handleRequestDownload = async (cert: any) => {
    if (!user?.email) {
      alert("User email not found. Please contact support.");
      return;
    }
    setOtpTargetCert(cert);
    setIsSendingOtp(true);
    setOtpError('');
    try {
      const resp = await fetch('/api/send-download-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          studentName: profile?.displayName || 'Student',
          certificateName: cert.course_name || cert.courseName || 'Seminary Certificate'
        })
      });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Failed to send verification code");
      }
      setShowOtpModal(true);
    } catch (err: any) {
      console.error("OTP send error:", err);
      alert("Error: " + err.message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyDownload = async () => {
    if (!otpCode || !user?.email) return;
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      const resp = await fetch('/api/verify-download-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, code: otpCode })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Verification failed");
      
      // Success - download!
      const downloadUrl = otpTargetCert.certificate_download_url || otpTargetCert.certificateDownloadUrl;
      if (downloadUrl) {
        // Create a temporary link to force download if possible, or just open
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.download = `Certificate_${otpTargetCert.course_name || 'Degree'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setShowOtpModal(false);
      setOtpCode('');
      setOtpTargetCert(null);
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent): Promise<boolean> => {
    if (e) e.preventDefault();
    if (!user) return false;
    
    setSavingProfile(true);
    setProfileError(null);
    console.log("Starting profile save process...");
    try {
      let profileImageUrl = profile?.profileImageUrl || null;
      let referenceLetter1Url = profile?.referenceLetter1Url || null;
      let referenceLetter2Url = profile?.referenceLetter2Url || null;
      let baptismCertificateUrl = profile?.baptismCertificateUrl || null;
      let academicCredentialUrl = profile?.academicCredentialUrl || null;
      let diplomaUrl = profile?.academicHistory?.diploma?.url || profile?.academic_history?.diploma?.url || null;
      let bachelorUrl = profile?.academicHistory?.bachelor?.url || profile?.academic_history?.bachelor?.url || null;
      let masterUrl = profile?.academicHistory?.master?.url || profile?.academic_history?.master?.url || null;

      // Sequential uploads to avoid overwhelming the connection
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
      
      const validateAndUpload = async (file: File, path: string, label: string) => {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`${label}: File ${file.name} is too large (max 5MB).`);
        }
        console.log(`Uploading ${label} (${file.size} bytes) to ${path}...`);
        try {
          const { data, error } = await supabase.storage.from('App_files').upload(path, file, { upsert: true });
          if (error) throw error;
          
          const { data: { publicUrl } } = supabase.storage.from('App_files').getPublicUrl(path);
          console.log(`Successfully uploaded ${label}`);
          return publicUrl;
        } catch (err: any) {
          console.warn(`Failed to upload ${label}:`, err.message);
          throw err;
        }
      };

      // Parallelize uploads to speed up the process
      const uploadPromises: Promise<void>[] = [];

      if (profileImageFile) {
        uploadPromises.push(validateAndUpload(profileImageFile, `${user.id}/profile_${Date.now()}`, "Profile Picture").then(url => { profileImageUrl = url; }));
      }
      if (refLetter1File) {
        uploadPromises.push(validateAndUpload(refLetter1File, `${user.id}/ref1_${Date.now()}.pdf`, "Reference Letter 1").then(url => { referenceLetter1Url = url; }));
      }
      if (refLetter2File) {
        uploadPromises.push(validateAndUpload(refLetter2File, `${user.id}/ref2_${Date.now()}.pdf`, "Reference Letter 2").then(url => { referenceLetter2Url = url; }));
      }
      if (baptismCertFile) {
        uploadPromises.push(validateAndUpload(baptismCertFile, `${user.id}/baptism_${Date.now()}`, "Baptism Certificate").then(url => { baptismCertificateUrl = url; }));
      }
      if (academicCredentialFile) {
        uploadPromises.push(validateAndUpload(academicCredentialFile, `${user.id}/academic_${Date.now()}`, "Academic Credential").then(url => { academicCredentialUrl = url; }));
      }
      if (diplomaFile) {
        uploadPromises.push(validateAndUpload(diplomaFile, `${user.id}/diploma_${Date.now()}`, "Diploma").then(url => { diplomaUrl = url; }));
      }
      if (bachelorFile) {
        uploadPromises.push(validateAndUpload(bachelorFile, `${user.id}/bachelor_${Date.now()}`, "Bachelor Degree").then(url => { bachelorUrl = url; }));
      }
      if (masterFile) {
        uploadPromises.push(validateAndUpload(masterFile, `${user.id}/master_${Date.now()}`, "Master Degree").then(url => { masterUrl = url; }));
      }

      await Promise.all(uploadPromises);

      // Clear file states so they aren't re-uploaded on subsequent saves
      if (profileImageFile) setProfileImageFile(null);
      if (refLetter1File) setRefLetter1File(null);
      if (refLetter2File) setRefLetter2File(null);
      if (baptismCertFile) setBaptismCertFile(null);
      if (academicCredentialFile) setAcademicCredentialFile(null);
      if (diplomaFile) setDiplomaFile(null);
      if (bachelorFile) setBachelorFile(null);
      if (masterFile) setMasterFile(null);

      console.log("All uploads completed (or skipped). Preparing Supabase update...");
      
      const updateData = {
        name: formData.displayName,
        phone_number: formData.phoneNumber,
        address: formData.address,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender,
        nationality: formData.nationality,
        state_of_origin: formData.stateOfOrigin,
        program_type: formData.programType,
        department_code: formData.departmentCode,
        level: formData.level,
        declaration_of_faith: formData.declarationOfFaith,
        baptism_date: formData.baptismDate || null,
        church_name: formData.churchName,
        church_position: formData.churchPosition,
        learning_mode: formData.learningMode,
        class_language: formData.classLanguage,
        profile_image_url: profileImageUrl,
        reference_letter1_url: referenceLetter1Url,
        reference_letter2_url: referenceLetter2Url,
        baptism_certificate_url: baptismCertificateUrl,
        academic_credential_url: academicCredentialUrl,
        academic_history: {
          diploma: { ...academicHistory.diploma, url: diplomaUrl },
          bachelor: { ...academicHistory.bachelor, url: bachelorUrl },
          master: { ...academicHistory.master, url: masterUrl },
        }
      };

      console.log("Updating Supabase document with upsert...");
      // Save data using upsert to handle cases where the row might not exist yet
      const { error } = await supabase.from('users').upsert({
        id: user.id,
        ...updateData
      });
      if (error) throw error;
      console.log("Supabase upsert successful.");

      return true; // Return true to allow step advancement
    } catch (error: any) {
      console.error("Error saving profile:", error);
      let errorMessage = error.message || 'Please try again.';
      if (errorMessage.includes('bucket not found') || errorMessage.includes('Bucket not found')) {
        errorMessage = 'Storage bucket "App_files" not found. Please contact the administrator to create the bucket in Supabase Storage.';
      } else if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
        errorMessage = `Database schema mismatch: ${errorMessage}. Please contact the administrator to update the "users" table columns.`;
      }
      setProfileError(errorMessage);
      return false;
    } finally {
      setSavingProfile(false);
    }
  };

  const calculateGPA = () => {
    if (grades.length === 0) return '0.00';
    let totalPoints = 0;
    let totalCredits = 0;

    grades.forEach(g => {
      const credits = Number(g.credits) || 3; // default to 3 credits
      let points = 0;
      if (g.grade === 'A') points = 4.0;
      else if (g.grade === 'B') points = 3.0;
      else if (g.grade === 'C') points = 2.0;
      else if (g.grade === 'D') points = 1.0;
      else if (g.grade === 'F') points = 0.0;
      else if (g.score) {
        if (g.score >= 90) points = 4.0;
        else if (g.score >= 80) points = 3.0;
        else if (g.score >= 70) points = 2.0;
        else if (g.score >= 60) points = 1.0;
      }
      totalPoints += points * credits;
      totalCredits += credits;
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  const handleVerifyAndJoin = async () => {
    if (!verifyRegNumber.trim()) {
      setVerifyError('Please enter your registration number.');
      return;
    }
    
    if (verifyRegNumber.trim() !== profile?.registrationNumber) {
      setVerifyError('Invalid registration number. Please check and try again.');
      return;
    }

    if (cameraError) {
      if (!verifyEmail.trim()) {
        setVerifyError('Please enter your email address to verify.');
        return;
      }
      if (verifyEmail.trim().toLowerCase() !== user?.email?.toLowerCase()) {
        setVerifyError('Invalid email address. Please check and try again.');
        return;
      }
    } else {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) {
        setVerifyError('Failed to capture selfie. Please ensure your camera is enabled, or click "Camera not working?" below.');
        return;
      }
    }
    
    setIsVerifying(true);
    setVerifyError('');
    
    try {
      let selfieUrl = null;
      
      if (!cameraError) {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
          // Convert base64 to blob
          const res = await fetch(imageSrc);
          const blob = await res.blob();
          
          // Upload selfie to storage
          const selfiePath = `${user?.id}_${Date.now()}.jpg`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('App_files')
            .upload(selfiePath, blob, { upsert: true });
            
          if (uploadError) throw uploadError;
            
          const { data: { publicUrl } } = supabase.storage
            .from('App_files')
            .getPublicUrl(selfiePath);
          selfieUrl = publicUrl;
        }
      }
      
      // Log attendance to Supabase
      await supabase.from('attendance').insert({
        student_id: user?.id,
        student_name: profile?.displayName,
        registration_number: profile?.registrationNumber,
        department_code: profile?.departmentCode,
        level: profile?.level,
        selfie_url: selfieUrl,
        type: 'live_class_join'
      });

      // Call the external API for attendance
      try {
        await fetch('/mark-attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            regNumber: profile?.registrationNumber,
            level: profile?.level,
            department: profile?.departmentCode
          })
        });
      } catch (err) {
        console.error("Failed to call /mark-attendance endpoint", err);
      }
      
      // Close modal and redirect
      setShowJoinModal(false);
      
      const getRoomName = (deptCode: string, programType: string) => {
        if (!deptCode || !programType) return "wgts-pending-class";
        return `wgts-${deptCode.toLowerCase()}-${programType.toLowerCase()}-class`;
      };
      
      const startLiveClass = () => {
        const roomName = getRoomName(profile?.departmentCode || '', profile?.programType || '');
        const domain = "meet.jit.si";

        // Configure Jitsi to hide invite functions, start muted, and hide the link
        const configOptions = [
          "config.prejoinPageEnabled=false",
          "config.prejoinConfig.enabled=false",
          "config.startWithVideoMuted=true",
          "config.startWithAudioMuted=true",
          "config.disableDeepLinking=true",
          "config.disableInviteFunctions=true",
          "config.toolbarButtons=%5B%5D",
          "config.disableToolbarAccess=true",
          "interfaceConfig.HIDE_INVITE_MORE_HEADER=true",
          "interfaceConfig.TOOLBAR_BUTTONS=%5B%5D",
          "interfaceConfig.MOBILE_APP_PROMO=false",
          "interfaceConfig.SHOW_CHROME_EXTENSION_BANNER=false",
          "config.hideConferenceSubject=true",
          "config.hideConferenceTimer=true"
        ].join("&");

        const iframe = `
          <iframe
            src="https://${domain}/${roomName}#${configOptions}"
            width="100%"
            height="600"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            style="border:0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"
          >
          </iframe>
        `;

        const container = document.getElementById("liveClassContainer");
        if (container) {
          container.innerHTML = iframe;
          // Scroll to the container
          container.scrollIntoView({ behavior: 'smooth' });
        }
      };

      startLiveClass();
    } catch (error: any) {
      console.error("Verification error:", error);
      if (error.code === 'storage/retry-limit-exceeded' || error.message.includes('retry time')) {
        setVerifyError('Supabase Storage is not enabled or reached its limit. The admin needs to check the Supabase dashboard.');
      } else {
        setVerifyError('An error occurred during verification. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      {/* Loading Overlay for Profile Saving */}
      {savingProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Saving Your Profile</h3>
            <p className="text-slate-500">We are uploading your documents and securing your information. This may take a minute depending on your file sizes.</p>
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs text-yellow-600 font-bold uppercase tracking-widest animate-pulse">Processing Uploads...</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 border-b border-gray-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-serif font-bold text-yellow-600">WINNING GATE CHRISTIAN THEOLOGICAL SEMINARY Portal</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-slate-200 mb-8 pb-px">
          <button
            onClick={() => setSearchParams({ tab: 'overview' })}
            className={`whitespace-nowrap py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'overview' ? 'border-yellow-600 text-yellow-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            Profile & Overview
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'courses' })}
            className={`whitespace-nowrap py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'courses' ? 'border-yellow-600 text-yellow-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            Courses & Academics
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'paycenter' })}
            className={`whitespace-nowrap py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'paycenter' ? 'border-yellow-600 text-yellow-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            Pay Center
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md border border-slate-100 p-6">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 overflow-hidden">
                    {profile?.profileImageUrl ? (
                      <img src={profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-yellow-600">Welcome, {profile?.displayName}!</h2>
                  <p className="text-sm text-slate-500">{profile?.email}</p>
                  
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-600/10 text-yellow-600 text-xs font-bold uppercase tracking-wider">
                    {profile?.isApproved ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {profile?.isApproved ? 'Approved' : 'Pending'}
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Registration Number</p>
                    <p className="font-mono text-slate-900 font-medium">{profile?.registrationNumber || 'Pending Approval'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Academic Level</p>
                    <p className="text-slate-900 font-medium">{profile?.level || 'Not Assigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Department</p>
                    <p className="text-slate-900 font-medium">{profile?.departmentCode || 'Not Assigned'}</p>
                  </div>
                  {profile?.profileCompleted && (
                    <>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Phone Number</p>
                        <p className="text-slate-900 font-medium">{profile?.phoneNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Gender</p>
                        <p className="text-slate-900 font-medium">{profile?.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Nationality</p>
                        <p className="text-slate-900 font-medium">{profile?.nationality || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">State of Origin</p>
                        <p className="text-slate-900 font-medium">{profile?.stateOfOrigin || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Baptism Date</p>
                        <p className="text-slate-900 font-medium">{profile?.baptismDate || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Learning Mode</p>
                        <p className="text-slate-900 font-medium capitalize">{profile?.learningMode || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Class Language</p>
                        <p className="text-slate-900 font-medium capitalize">{profile?.classLanguage || 'English'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Church Name</p>
                        <p className="text-slate-900 font-medium">{profile?.churchName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Church Position</p>
                        <p className="text-slate-900 font-medium">{profile?.churchPosition || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Declaration of Faith</p>
                        <p className="text-slate-900 font-medium text-sm line-clamp-3" title={profile?.declarationOfFaith}>{profile?.declarationOfFaith || 'N/A'}</p>
                      </div>
                      {profile?.baptismCertificateUrl && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Baptism Certificate</p>
                          <a href={profile.baptismCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:underline flex items-center gap-1 text-sm font-medium">
                            <Download size={14} /> View Document
                          </a>
                        </div>
                      )}
                      {profile?.referenceLetter1Url && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Reference Letter 1</p>
                          <a href={profile.referenceLetter1Url} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:underline flex items-center gap-1 text-sm font-medium">
                            <Download size={14} /> View PDF
                          </a>
                        </div>
                      )}
                      {profile?.referenceLetter2Url && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Reference Letter 2</p>
                          <a href={profile.referenceLetter2Url} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:underline flex items-center gap-1 text-sm font-medium">
                            <Download size={14} /> View PDF
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              {!profile?.profileCompleted ? (
                <div className="bg-white rounded-lg shadow-md border border-slate-100 p-6">
                  <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Complete Your Profile</h2>
                      <p className="text-sm text-slate-500">Please provide your details before an admin can approve your registration.</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0"></div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-yellow-600 z-0 transition-all duration-300" style={{ width: `${(registrationStep - 1) * 50}%` }}></div>
                      
                      <div className={`relative z-10 flex flex-col items-center ${registrationStep >= 1 ? 'text-yellow-600' : 'text-slate-400'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-colors ${registrationStep >= 1 ? 'bg-yellow-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                        <span className="text-sm font-medium">Profile & Overview</span>
                      </div>
                      
                      <div className={`relative z-10 flex flex-col items-center ${registrationStep >= 2 ? 'text-yellow-600' : 'text-slate-400'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-colors ${registrationStep >= 2 ? 'bg-yellow-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                        <span className="text-sm font-medium">Courses & Academic</span>
                      </div>
                      
                      <div className={`relative z-10 flex flex-col items-center ${registrationStep >= 3 ? 'text-yellow-600' : 'text-slate-400'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-colors ${registrationStep >= 3 ? 'bg-yellow-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
                        <span className="text-sm font-medium">Pay Center</span>
                      </div>
                    </div>
                  </div>

                  <form id="profileForm" onSubmit={(e) => { e.preventDefault(); if (registrationStep === 3) handleSaveProfile(); }} className="space-y-6">
                    {profileError && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="text-sm font-bold text-red-800">Registration Error</p>
                          <p className="text-sm text-red-700">{profileError}</p>
                        </div>
                      </div>
                    )}
                    {registrationStep === 1 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.displayName}
                        onChange={e => setFormData({...formData, displayName: e.target.value})}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                      <input 
                        type="tel" 
                        required
                        value={formData.phoneNumber}
                        onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
                      <input 
                        type="date" 
                        required
                        value={formData.dateOfBirth}
                        onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                      <select 
                        required
                        value={formData.gender}
                        onChange={e => setFormData({...formData, gender: e.target.value})}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                      >
                        <option value="" disabled>Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
                      <select 
                        required
                        value={formData.country}
                        onChange={e => setFormData({...formData, country: e.target.value, stateOfOrigin: '', city: ''})}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                      >
                        <option value="" disabled>Select Country</option>
                        {Country.getAllCountries().map(country => (
                          <option key={country.isoCode} value={country.isoCode}>{country.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">State/Province *</label>
                      <select 
                        required
                        value={formData.stateOfOrigin}
                        onChange={e => setFormData({...formData, stateOfOrigin: e.target.value, city: ''})}
                        disabled={!formData.country}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="" disabled>Select State</option>
                        {formData.country && State.getStatesOfCountry(formData.country).map(state => (
                          <option key={state.isoCode} value={state.isoCode}>{state.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                      <input 
                        list="city-list"
                        required
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                        disabled={!formData.stateOfOrigin}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400"
                        placeholder="Select or type your city"
                      />
                      <datalist id="city-list">
                        {formData.stateOfOrigin && City.getCitiesOfState(formData.country, formData.stateOfOrigin).map(city => (
                          <option key={city.name} value={city.name} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nationality *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.nationality}
                        onChange={e => setFormData({...formData, nationality: e.target.value})}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                        placeholder="e.g. Nigerian"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Baptism Date *</label>
                      <input 
                        type="date" 
                        required
                        value={formData.baptismDate}
                        onChange={e => setFormData({...formData, baptismDate: e.target.value})}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name of Church *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.churchName}
                        onChange={e => setFormData({...formData, churchName: e.target.value})}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                        placeholder="e.g. First Baptist Church"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Position in Church *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.churchPosition}
                        onChange={e => setFormData({...formData, churchPosition: e.target.value})}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                        placeholder="e.g. Member, Deacon, Choir"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Learning Mode *</label>
                      <select 
                        required
                        value={formData.learningMode}
                        onChange={e => setFormData({...formData, learningMode: e.target.value})}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                      >
                        <option value="" disabled>Select Learning Mode</option>
                        <option value="physical">Physical Classes (Lagos)</option>
                        <option value="online">Online Classes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Class Language *</label>
                      <select 
                        required
                        value={formData.classLanguage}
                        onChange={e => setFormData({...formData, classLanguage: e.target.value})}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                      >
                        <option value="English">English Class</option>
                        <option value="Yoruba">Yoruba Class</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Address *</label>
                      <textarea 
                        required
                        rows={3}
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                        placeholder="Enter your full residential address"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Declaration of Faith *</label>
                      <textarea 
                        required
                        rows={4}
                        value={formData.declarationOfFaith}
                        onChange={e => setFormData({...formData, declarationOfFaith: e.target.value})}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                        placeholder="Please provide your declaration of faith..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Profile Picture *</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        required={!profile?.profileImageUrl}
                        onChange={e => setProfileImageFile(e.target.files?.[0] || null)}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                      />
                      {profile?.profileImageUrl && <p className="text-xs text-green-600 mt-1">✓ Current picture exists</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Reference Letter 1 *</label>
                      <input type="file" accept=".png,.jpeg,.jpg,.doc,.docx,.pdf" required={!profile?.referenceLetter1Url} onChange={e => setRefLetter1File(e.target.files?.[0] || null)} className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent" />
                      {profile?.referenceLetter1Url && <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Reference Letter 2 *</label>
                      <input type="file" accept=".png,.jpeg,.jpg,.doc,.docx,.pdf" required={!profile?.referenceLetter2Url} onChange={e => setRefLetter2File(e.target.files?.[0] || null)} className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent" />
                      {profile?.referenceLetter2Url && <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Baptism Certificate *</label>
                      <input type="file" accept=".png,.jpeg,.jpg,.doc,.docx,.pdf" required={!profile?.baptismCertificateUrl} onChange={e => setBaptismCertFile(e.target.files?.[0] || null)} className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent" />
                      {profile?.baptismCertificateUrl && <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>}
                    </div>
                  </div>
                )}

                    {registrationStep === 2 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Program Type *</label>
                          <select required value={formData.programType} onChange={e => setFormData({...formData, programType: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent">
                            <option value="" disabled>Select Program Type</option>
                            <option value="diploma">Diploma</option>
                            <option value="bachelor">Bachelor</option>
                            <option value="master">Master</option>
                            <option value="doctorate">Doctorate</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Department Applied For *</label>
                          <select required value={formData.departmentCode} onChange={e => setFormData({...formData, departmentCode: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent">
                            <option value="" disabled>Select Department</option>
                            <option value="DIP">Diploma In Th</option>
                            <option value="BACH">Bachelor</option>
                            <option value="MAST">Masters</option>
                            <option value="DOC">Doctorate</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Level *</label>
                          <select required value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent">
                            <option value="" disabled>Select Level</option>
                            <option value="100">100 Level</option>
                            <option value="200">200 Level</option>
                            <option value="300">300 Level</option>
                            <option value="400">400 Level</option>
                          </select>
                        </div>

                        {/* Conditional Academic History Fields */}
                        {['bachelor', 'master', 'doctorate'].includes(formData.programType) && (
                          <div className="md:col-span-2 bg-slate-50 p-4 rounded-md border border-slate-200">
                            <h4 className="font-semibold text-slate-800 mb-4">Diploma Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">School Name *</label>
                                <input type="text" required value={academicHistory.diploma.school} onChange={e => setAcademicHistory({...academicHistory, diploma: {...academicHistory.diploma, school: e.target.value}})} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-yellow-600 focus:border-transparent" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Year Obtained *</label>
                                <input type="number" required value={academicHistory.diploma.year} onChange={e => setAcademicHistory({...academicHistory, diploma: {...academicHistory.diploma, year: e.target.value}})} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-yellow-600 focus:border-transparent" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Date Obtained *</label>
                                <input type="date" required value={academicHistory.diploma.date} onChange={e => setAcademicHistory({...academicHistory, diploma: {...academicHistory.diploma, date: e.target.value}})} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-yellow-600 focus:border-transparent" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Upload Diploma Certificate *</label>
                              <input type="file" accept=".png,.jpeg,.jpg,.doc,.docx,.pdf" required={!profile?.academicHistory?.diploma?.url} onChange={e => setDiplomaFile(e.target.files?.[0] || null)} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-yellow-600 focus:border-transparent bg-white" />
                              {profile?.academicHistory?.diploma?.url && <p className="text-xs text-green-600 mt-1">✓ Current document exists</p>}
                            </div>
                          </div>
                        )}

                        {['master', 'doctorate'].includes(formData.programType) && (
                          <div className="md:col-span-2 bg-slate-50 p-4 rounded-md border border-slate-200">
                            <h4 className="font-semibold text-slate-800 mb-4">Bachelor's Degree Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">School Name *</label>
                                <input type="text" required value={academicHistory.bachelor.school} onChange={e => setAcademicHistory({...academicHistory, bachelor: {...academicHistory.bachelor, school: e.target.value}})} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-yellow-600 focus:border-transparent" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Year Obtained *</label>
                                <input type="number" required value={academicHistory.bachelor.year} onChange={e => setAcademicHistory({...academicHistory, bachelor: {...academicHistory.bachelor, year: e.target.value}})} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-yellow-600 focus:border-transparent" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Date Obtained *</label>
                                <input type="date" required value={academicHistory.bachelor.date} onChange={e => setAcademicHistory({...academicHistory, bachelor: {...academicHistory.bachelor, date: e.target.value}})} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-yellow-600 focus:border-transparent" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Upload Bachelor's Certificate *</label>
                              <input type="file" accept=".png,.jpeg,.jpg,.doc,.docx,.pdf" required={!profile?.academicHistory?.bachelor?.url} onChange={e => setBachelorFile(e.target.files?.[0] || null)} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-yellow-600 focus:border-transparent bg-white" />
                              {profile?.academicHistory?.bachelor?.url && <p className="text-xs text-green-600 mt-1">✓ Current document exists</p>}
                            </div>
                          </div>
                        )}

                        {formData.programType === 'doctorate' && (
                          <div className="md:col-span-2 bg-slate-50 p-4 rounded-md border border-slate-200">
                            <h4 className="font-semibold text-slate-800 mb-4">Master's Degree Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">School Name *</label>
                                <input type="text" required value={academicHistory.master.school} onChange={e => setAcademicHistory({...academicHistory, master: {...academicHistory.master, school: e.target.value}})} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-yellow-600 focus:border-transparent" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Year Obtained *</label>
                                <input type="number" required value={academicHistory.master.year} onChange={e => setAcademicHistory({...academicHistory, master: {...academicHistory.master, year: e.target.value}})} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-yellow-600 focus:border-transparent" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Date Obtained *</label>
                                <input type="date" required value={academicHistory.master.date} onChange={e => setAcademicHistory({...academicHistory, master: {...academicHistory.master, date: e.target.value}})} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-yellow-600 focus:border-transparent" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Upload Master's Certificate *</label>
                              <input type="file" accept=".png,.jpeg,.jpg,.doc,.docx,.pdf" required={!profile?.academicHistory?.master?.url} onChange={e => setMasterFile(e.target.files?.[0] || null)} className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-yellow-600 focus:border-transparent bg-white" />
                              {profile?.academicHistory?.master?.url && <p className="text-xs text-green-600 mt-1">✓ Current document exists</p>}
                            </div>
                          </div>
                        )}

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Highest Academic Credential (PDF/Image/Word) *</label>
                          <input 
                            type="file" 
                            accept=".png,.jpeg,.jpg,.doc,.docx,.pdf" 
                            required={!profile?.academicCredentialUrl} 
                            onChange={e => setAcademicCredentialFile(e.target.files?.[0] || null)} 
                            className="w-full border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-600 focus:border-transparent" 
                          />
                          {profile?.academicCredentialUrl && <p className="text-xs text-green-600 mt-1">✓ Current document exists</p>}
                        </div>
                      </div>
                    )}

                    {registrationStep === 3 && (
                      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-center animate-in fade-in slide-in-from-right-4 duration-300">
                        {profile?.registrationFeePaid ? (
                          <>
                            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Payment Successful</h3>
                            <p className="text-slate-600 mb-6 max-w-md mx-auto">
                              Your registration fee has been paid. Click "Submit Application" to complete your profile.
                            </p>
                            <button 
                              type="button"
                              onClick={async () => {
                                const success = await handleSaveProfile();
                                if (success) {
                                  await supabase.from('users').update({
                                    profile_completed: true
                                  }).eq('id', user!.id);
                                  alert("Profile submitted successfully! You are now pending admin approval.");
                                  window.location.reload();
                                }
                              }}
                              disabled={savingProfile}
                              className="bg-yellow-600 text-white px-8 py-3 rounded-md font-bold hover:bg-yellow-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2 text-lg shadow-md"
                            >
                              {savingProfile ? 'Submitting...' : 'Submit Application'}
                            </button>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Registration Payment</h3>
                            <p className="text-slate-600 mb-6 max-w-md mx-auto">
                              You are about to pay the registration fee of <span className="font-bold text-slate-900">{settings?.fees?.currency || 'NGN'} {settings?.fees?.registration || 10000}</span>. 
                              Once payment is successful, your application will be submitted for admin review.
                            </p>
                            
                            <PaymentButton 
                              amount={settings?.fees?.registration || 10000}
                              currency={settings?.fees?.currency || 'NGN'}
                              description="Registration Fee"
                              customerEmail={user?.email || "student@email.com"}
                              customerName={formData.displayName || "Student Name"}
                              text={savingProfile ? 'Processing...' : 'Pay Registration Fee & Submit'}
                              className="bg-yellow-600 text-white px-8 py-3 rounded-md font-bold hover:bg-yellow-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2 text-lg shadow-md w-full justify-center"
                              disabled={savingProfile}
                              flutterwavePublicKey={settings?.flutterwave_public_key || settings?.flutterwavePublicKey}
                              onBeforePayment={async () => {
                                return await handleSaveProfile();
                              }}
                              onSuccess={async (response) => {
                                try {
                                  await supabase.from('users').update({
                                    registration_fee_paid: true,
                                    profile_completed: true
                                  }).eq('id', user!.id);
                                  
                                  await supabase.from('payments').insert([{
                                    user_id: user!.id,
                                    type: 'registration_fee',
                                    amount: settings?.fees?.registration || 10000,
                                    currency: settings?.fees?.currency || 'NGN',
                                    status: 'success',
                                    tx_ref: response.tx_ref,
                                    transaction_id: response.transaction_id,
                                    timestamp: new Date().toISOString()
                                  }]);

                                  alert("Payment successful! Your application has been submitted.");
                                  
                                  // Update local state to immediately show the dashboard instead of reloading
                                  window.location.reload();
                                } catch (error) {
                                  console.error("Error completing registration:", error);
                                  alert("Payment was successful, but there was an error updating your profile. Please refresh the page.");
                                }
                              }}
                            />
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between pt-6 border-t border-slate-100 mt-8">
                      {registrationStep > 1 ? (
                        <button type="button" onClick={() => setRegistrationStep(prev => (prev - 1) as 1 | 2 | 3)} className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
                          <ChevronLeft size={18} /> Back
                        </button>
                      ) : <div></div>}
                      
                      {registrationStep < 3 ? (
                        <button 
                          type="button" 
                          disabled={savingProfile}
                          onClick={async () => {
                            const form = document.getElementById('profileForm') as HTMLFormElement;
                            if (form && !form.checkValidity()) {
                              console.warn("Form validation failed. Required fields might be missing.");
                              const invalidFields = Array.from(form.querySelectorAll(':invalid')) as HTMLInputElement[];
                              invalidFields.forEach(field => {
                                console.warn(`Invalid field: ${field.name || field.placeholder || field.type} - ${field.validationMessage}`);
                              });
                              form.reportValidity();
                              setProfileError("Please fill in all required fields correctly.");
                              return;
                            }
                            
                            // Save profile and upload documents when moving between steps
                            if (registrationStep === 1 || registrationStep === 2) {
                              const success = await handleSaveProfile();
                              if (!success) return;
                            }
                            
                            setRegistrationStep(prev => (prev + 1) as 1 | 2 | 3);
                          }} 
                          className="px-6 py-2 bg-yellow-600 text-white rounded-md font-medium hover:bg-yellow-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          {savingProfile ? 'Saving...' : (
                            <>Next <ChevronRight size={18} /></>
                          )}
                        </button>
                      ) : null}
                    </div>
                  </form>
              </div>
            ) : (
              <>
                {/* Live Class Container */}
                <div id="liveClassContainer" className="mb-6 rounded-lg overflow-hidden shadow-md"></div>
                
                <div className="bg-white rounded-lg shadow-md border border-slate-100 p-6">
                  <h2 className="text-xl font-bold text-yellow-600 mb-4">Welcome to your Dashboard</h2>
                  <p className="text-slate-600">
                    From here you can access your courses, view your grades, and manage your payments.
                    Use the tabs above to navigate through the portal.
                  </p>
                </div>
              </>
            )}
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-8">
            {!profile?.profileCompleted ? (
              <div className="bg-white rounded-lg shadow-md border border-slate-100 p-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Profile Incomplete</h2>
                <p className="text-slate-600 mb-4">You must complete your profile registration in the Overview tab before accessing your courses.</p>
              </div>
            ) : (
              <>
                {/* Courses Section */}
                <div className="bg-white rounded-lg shadow-md border border-slate-100 p-6">
                  <div className="flex items-center justify-between gap-3 mb-4 border-b border-gray-200 pb-2">
                    <h2 className="text-xl font-bold text-yellow-600">My Courses</h2>
                {profile?.learningMode === 'online' && profile?.isApproved && (
                  <button 
                    onClick={() => setShowJoinModal(true)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors"
                  >
                    <Video size={16} />
                    Join Live Class
                  </button>
                )}
              </div>

              {courses.length > 0 ? (
                <ul className="space-y-3">
                  {courses.map(course => (
                    <li key={course.id} className="p-4 bg-[#f9f9f9] border border-[#eee] rounded-md">
                      <h3 className="font-bold text-slate-900 mb-1">
                        {course.courseName || course.course_name} {course.courseCode ? `(${course.courseCode})` : ''}
                      </h3>
                      {course.shortDescription && <p className="text-sm text-slate-600 mb-2">{course.shortDescription}</p>}
                      <p className="text-xs text-slate-500 uppercase tracking-wider">{course.level}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-3">
                  <li className="p-4 bg-[#f9f9f9] border border-[#eee] rounded-md text-slate-500">
                    Loading courses... (or none assigned yet)
                  </li>
                </ul>
              )}
            </div>

            {/* Academic Progress Section */}
            <div className="bg-white rounded-lg shadow-md border border-slate-100 p-6">
              <div className="flex items-center justify-between gap-3 mb-4 border-b border-gray-200 pb-2">
                <h2 className="text-xl font-bold text-yellow-600">Academic Progress</h2>
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                  GPA: {calculateGPA()}
                </div>
              </div>

              <div className="space-y-6">
                {/* Grades */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Award size={18} className="text-yellow-600" />
                    Course Grades
                  </h3>
                  {grades.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 rounded-tl-md">Course</th>
                            <th className="px-4 py-2">Credits</th>
                            <th className="px-4 py-2">Score</th>
                            <th className="px-4 py-2 rounded-tr-md">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grades.map(grade => (
                            <tr key={grade.id} className="border-b border-slate-100">
                              <td className="px-4 py-2 font-medium text-slate-900">{grade.courseName}</td>
                              <td className="px-4 py-2">{grade.credits || 3}</td>
                              <td className="px-4 py-2">{grade.score || '-'}</td>
                              <td className="px-4 py-2 font-bold">{grade.grade || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-md">No grades recorded yet.</p>
                  )}
                </div>

                {/* Assignments */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Book size={18} className="text-yellow-600" />
                    Recent Assignments
                  </h3>
                  {assignments.length > 0 ? (
                    <ul className="space-y-2">
                      {assignments.map(assignment => (
                        <li key={assignment.id} className="p-3 bg-slate-50 border border-slate-100 rounded-md flex justify-between items-center">
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{assignment.assignmentName}</p>
                            <p className="text-xs text-slate-500">{assignment.courseName}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              assignment.status === 'graded' ? 'bg-green-100 text-green-800' :
                              assignment.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {assignment.status ? assignment.status.toUpperCase() : 'PENDING'}
                            </span>
                            {assignment.score && <p className="text-sm font-bold text-slate-700 mt-1">{assignment.score}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-md">No assignments recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )}

    {activeTab === 'paycenter' && (
      <div className="space-y-8">
        {!profile?.profileCompleted ? (
          <div className="bg-white rounded-lg shadow-md border border-slate-100 p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Profile Incomplete</h2>
            <p className="text-slate-600 mb-4">You must complete your profile registration in the Overview tab before accessing the Pay Center.</p>
          </div>
        ) : (
          <>
            {/* Tuition Fee Section */}
            {!profile?.tuitionFeePaid && profile?.level && (
              <div className="bg-white rounded-lg shadow-md border border-slate-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-yellow-800 mb-1">Tuition Fee Payment</h3>
                    <p className="text-sm text-yellow-700">Please pay your tuition fee for the {profile.level} level to access all course materials.</p>
                  </div>
                  <PaymentButton 
                    amount={settings?.fees?.tuition?.[profile.level.toLowerCase()] || 100000}
                    currency={settings?.fees?.currency || 'NGN'}
                    description={`Tuition Fee for ${profile.level}`}
                    customerEmail={user.email || "student@email.com"}
                    customerName={profile?.displayName || "Student Name"}
                    text={`Pay ${settings?.fees?.currency === 'USD' ? '$' : '₦'}${(settings?.fees?.tuition?.[profile.level.toLowerCase()] || 100000).toLocaleString()}`}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-md font-bold transition-colors whitespace-nowrap ml-4"
                    flutterwavePublicKey={settings?.flutterwave_public_key || settings?.flutterwavePublicKey}
                    onSuccess={async (response) => {
                      try {
                        await supabase.from('users').update({
                          tuition_fee_paid: true
                        }).eq('id', user.id);
                        await supabase.from('payments').insert([{
                          user_id: user.id,
                          type: 'tuition_fee',
                          amount: settings?.fees?.tuition?.[profile.level.toLowerCase()] || 100000,
                          currency: settings?.fees?.currency || 'NGN',
                          status: 'success',
                          tx_ref: response.tx_ref,
                          transaction_id: response.transaction_id,
                          timestamp: new Date().toISOString()
                        }]);
                        
                        alert("Tuition payment successful!");
                        
                        // Update local state to immediately reflect changes
                        window.location.reload();
                      } catch (error) {
                        console.error("Error updating tuition status:", error);
                        alert("Payment was successful, but there was an error updating your profile. Please refresh the page.");
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Certificate Section */}
            <div className="bg-white rounded-lg shadow-md border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-4 border-b border-gray-200 pb-2">
                <h2 className="text-xl font-bold text-yellow-600">My Certificates</h2>
              </div>

              {certificates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certificates.map(cert => {
                    const isPaid = (cert.payment_status || cert.paymentStatus) === 'paid';
                    const downloadUrl = cert.certificate_download_url || cert.certificateDownloadUrl;
                    const courseName = cert.course_name || cert.courseName;
                    const isPdf = downloadUrl?.toLowerCase().includes('.pdf');
                    
                    return (
                      <div 
                        key={cert.id} 
                        className={`relative overflow-hidden rounded-xl border-2 transition-all group ${isPaid ? 'border-green-500 hover:shadow-lg' : 'border-yellow-400 hover:border-yellow-500'}`}
                      >
                        {/* Certificate Preview Background */}
                        <div 
                          className={`w-full h-48 bg-slate-100 flex items-center justify-center relative ${!isPaid ? 'blur-[3px] opacity-70 grayscale' : 'cursor-pointer hover:bg-slate-200 transition-colors'}`}
                          onClick={() => {
                            if (isPaid) {
                              if (downloadUrl) {
                                handleRequestDownload(cert);
                              } else {
                                alert("Certificate download URL is not available yet.");
                              }
                            }
                          }}
                        >
                          {downloadUrl && !isPdf ? (
                            <img 
                              src={downloadUrl} 
                              alt="Certificate Preview" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex flex-col items-center text-slate-400">
                              <FileText size={48} className="mb-2" />
                              <span className="font-medium">Certificate Document</span>
                            </div>
                          )}

                          {/* Constant Watermark Layer (Even if blurred) */}
                          <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none flex flex-wrap justify-center items-center gap-8 p-4 rotate-[-25deg] scale-125">
                            {Array.from({ length: 12 }).map((_, i) => (
                              <span key={i} className="text-sm font-black tracking-widest text-slate-900/40 uppercase whitespace-nowrap select-none">
                                OFFICIAL SEMINARY SEAL • UNPAID
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Lock Overlay for Unpaid */}
                        {!isPaid && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/20 backdrop-blur-[1px]">
                            <div className="relative z-10 bg-white shadow-2xl p-5 rounded-2xl text-center border-t-4 border-yellow-500 max-w-[90%]">
                              <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Lock size={24} className="text-yellow-600" />
                              </div>
                              <h4 className="font-bold text-slate-900 text-lg">Payment Required</h4>
                              <p className="text-xs text-slate-500 mb-4 px-2">This certificate is issued but locked. Pay to remove watermark and download the official copy.</p>
                              <PaymentButton 
                                amount={cert.price || 5000}
                                description={`Certificate Payment: ${courseName || 'Graduation Certificate'}`}
                                customerEmail={user.email || "student@email.com"}
                                customerName={profile?.displayName || "Student Name"}
                                text={`Pay ${settings?.fees?.currency === 'USD' ? '$' : '₦'}${(cert.price || 5000).toLocaleString()}`}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors w-full"
                                flutterwavePublicKey={settings?.flutterwave_public_key || settings?.flutterwavePublicKey}
                                currency={settings?.fees?.currency || 'NGN'}
                                onSuccess={async (response) => {
                                  try {
                                    await supabase.from('certificates').update({
                                      payment_status: 'paid',
                                      payment_date: new Date().toISOString()
                                    }).eq('id', cert.id);
                                    
                                    await supabase.from('payments').insert([{
                                      user_id: user.id,
                                      certificate_id: cert.id,
                                      amount: cert.price || 5000,
                                      currency: settings?.fees?.currency || 'NGN',
                                      status: 'success',
                                      tx_ref: response.tx_ref,
                                      transaction_id: response.transaction_id,
                                      timestamp: new Date().toISOString()
                                    }]);

                                    alert("Certificate payment successful!");
                                    
                                    // Update local state to immediately reflect changes
                                    setCertificates(prevCerts => 
                                      prevCerts.map(c => 
                                        c.id === cert.id 
                                          ? { ...c, payment_status: 'paid', paymentStatus: 'paid', payment_date: new Date().toISOString() } 
                                          : c
                                      )
                                    );
                                  } catch (error) {
                                    console.error("Error updating certificate after payment:", error);
                                    alert("Payment was successful, but there was an error updating your certificate. Please refresh the page.");
                                  }
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Certificate Details Footer */}
                        <div className="p-4 bg-white border-t border-slate-100 relative z-10">
                          <h3 className="font-bold text-slate-900 truncate">{courseName || 'Graduation Certificate'}</h3>
                          <div className="flex justify-between items-center mt-2">
                            {cert.dateAwarded && (
                              <p className="text-xs text-slate-500">
                                {cert.dateAwarded?.toDate ? new Date(cert.dateAwarded.toDate()).toLocaleDateString() : new Date(cert.dateAwarded).toLocaleDateString()}
                              </p>
                            )}
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {isPaid ? 'PAID & UNLOCKED' : 'PAYMENT REQUIRED'}
                            </span>
                          </div>
                          
                          {isPaid && (
                            <button 
                              onClick={() => handleRequestDownload(cert)}
                              className="mt-4 w-full bg-slate-100 hover:bg-yellow-600 hover:text-white text-yellow-700 py-2 rounded-md transition-all flex items-center justify-center gap-2 text-sm font-bold border border-yellow-100"
                            >
                              <Download size={16} />
                              Download Official Copy
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <ul className="space-y-3">
                  <li className="p-4 bg-[#f9f9f9] border border-[#eee] rounded-md text-slate-500">
                    Loading certificates... (or none available yet)
                  </li>
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    )}
      </div>

      {/* OTP Download Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
            <div className="bg-yellow-600 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} />
              </div>
              <h3 className="text-2xl font-bold">Download Security</h3>
              <p className="opacity-90 text-sm mt-1">A verification code has been sent to your email</p>
            </div>
            
            <div className="p-8">
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2 text-center uppercase tracking-wider">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 border-2 border-slate-200 rounded-xl focus:border-yellow-600 focus:outline-none transition-all"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                {otpError && (
                  <p className="mt-3 text-red-500 text-sm font-medium flex items-center justify-center gap-2">
                    <AlertCircle size={16} />
                    {otpError}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleVerifyDownload}
                  disabled={otpCode.length < 6 || isVerifyingOtp}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  {isVerifyingOtp ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      Verify and Download
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setShowOtpModal(false);
                    setOtpCode('');
                    setOtpTargetCert(null);
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">
                  Protecting your academic records. If you didn't receive the code, check your spam folder or try again.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Class Verification Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Class Verification</h3>
              <p className="text-sm text-slate-500 mt-1">Please verify your identity to join the live class.</p>
            </div>
            
            <div className="p-6 space-y-6">
              {verifyError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-sm text-red-700">
                  {verifyError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  value={verifyRegNumber}
                  onChange={(e) => setVerifyRegNumber(e.target.value)}
                  placeholder="e.g. WGTS/DP/26/0001"
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-600 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                {cameraError ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address (Fallback Verification)</label>
                    <input
                      type="email"
                      value={verifyEmail}
                      onChange={(e) => setVerifyEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-600 focus:border-transparent outline-none mb-2"
                    />
                    <p className="text-xs text-slate-500 text-center">Since your camera is not working, please verify your email address instead.</p>
                  </div>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Take a Selfie</label>
                    <div className="rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-100 relative aspect-video">
                      {/* @ts-ignore - react-webcam types are overly strict in this version */}
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover"
                        videoConstraints={{ facingMode: "user" }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-center">Ensure your face is clearly visible in the frame.</p>
                  </>
                )}
                <button 
                  onClick={() => setCameraError(!cameraError)}
                  className="text-xs text-blue-600 hover:text-blue-800 mt-3 w-full text-center"
                >
                  {cameraError ? "Try camera again" : "Camera not working?"}
                </button>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setVerifyError('');
                  setVerifyRegNumber('');
                  setVerifyEmail('');
                  setCameraError(false);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                disabled={isVerifying}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyAndJoin}
                disabled={isVerifying}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {isVerifying ? 'Verifying...' : 'Verify & Join'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
