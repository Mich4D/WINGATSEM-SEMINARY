import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';
import { Users, Book, Settings, FileText, CheckCircle, XCircle, Upload, Download, Video, Image as ImageIcon, ArrowLeft, Award, Mail, X, GraduationCap, Copy, ShieldCheck, CreditCard, Search, DollarSign, ExternalLink, Globe, Megaphone, Send, Cloud } from 'lucide-react';

import { formatImageUrl } from '../utils/formatImage';
import { compressImage } from '../utils/imageUpload';
import AdminBlog from '../components/AdminBlog';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { refreshSettings } = useSettings();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [settingsTab, setSettingsTab] = useState<'identity' | 'integrations'>('identity');
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  
  const showToast = (text: string, type: 'success' | 'error' = 'success', duration: number = 3000) => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), duration);
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      showToast("Please enter a recipient email", "error");
      return;
    }
    setIsTestingEmail(true);
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
      });
      const data = await response.json();
      if (data.success) {
        showToast("Test email sent! Check your inbox (and spam).", "success");
      } else {
        throw new Error(data.error || "Failed to send test email");
      }
    } catch (err: any) {
      console.error("Test Email error:", err);
      showToast(err.message, "error");
    } finally {
      setIsTestingEmail(false);
    }
  };
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentDurations, setDepartmentDurations] = useState<Record<string, number>>({});
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newCourse, setNewCourse] = useState({ course_name: '', level: '100' });
  const [newDepartment, setNewDepartment] = useState({ name: '', code: '' });
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', department: '' });
  const [newTestimonial, setNewTestimonial] = useState({ quote: '', author: '', role: '', img: '' });
  const [liveClassDept, setLiveClassDept] = useState('General');
  const [liveClassLevel, setLiveClassLevel] = useState('100');
  const [settings, setSettings] = useState({ 
    logoUrl: '', 
    rectorImageUrl: '', 
    heroBgUrl: '', 
    heroBanners: [] as string[],
    testimonials: [] as { quote: string; author: string; role: string; img: string; }[],
    aboutImageUrl: '' as string | null,
    liveStreamUrl: '',
    anthemUrl: '',
    anthemTitle: 'School Anthem',
    admissionFlyerUrl: '',
    siteUrl: '',
    flutterwavePublicKey: '',
    cloudinaryUrl: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    smtpSender: '',
    smtpFrom: '',
    isAdmissionOpen: true,
    importantDates: {
      applicationOpens: 'Aug 15',
      applicationDeadline: 'Oct 30',
      orientationBegins: 'Nov 15'
    },
    fees: {
      registration: 10000,
      currency: 'NGN',
      tuition: {
        diploma: 100000,
        bachelor: 120000,
        master: 150000,
        doctorate: 180000
      }
    }
  });
  const [pendingEdits, setPendingEdits] = useState<Record<string, { departmentCode?: string, programType?: string }>>({});
  const [selectedDeptForCourses, setSelectedDeptForCourses] = useState<string | null>(null);
  const [deptCourses, setDeptCourses] = useState<any[]>([]);
  const [issueCertificateModal, setIssueCertificateModal] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{message: string, onConfirm: () => void} | null>(null);
  const [viewProfileModal, setViewProfileModal] = useState<any | null>(null);
  const [editStudentModal, setEditStudentModal] = useState<any | null>(null);
  const [newCertificate, setNewCertificate] = useState<{courseName: string, file: File | null, department?: string, price?: string}>({ courseName: '', file: null });

  // Academic Records states
  const [selectedStudentForAcademic, setSelectedStudentForAcademic] = useState<string | null>(null);
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<any[]>([]);
  const [newGrade, setNewGrade] = useState({ courseName: '', credits: 3, score: '', grade: '' });
  const [newAssignment, setNewAssignment] = useState({ courseName: '', assignmentName: '', status: 'pending', score: '' });
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [bulkEmailMessage, setBulkEmailMessage] = useState({ subject: '', body: '', target: 'all' as 'all' | 'students' | 'teachers' });
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [smtpDiagnostic, setSmtpDiagnostic] = useState<{
    configured: boolean, 
    warnings: string[],
    user?: string,
    from?: string,
    passLength?: number,
    passPreview?: string
  } | null>(null);

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const fetchStudents = async () => {
      // Use the new RPC function to securely grab users without policy looping
      const { data, error } = await supabase.rpc('admin_get_all_users');
      
      // Fallback just in case the RPC fails
      const finalData = data || (await supabase.from('users').select('*')).data;

      if (finalData) {
        const mappedStudents = finalData.map((s: any) => ({
          ...s,
          displayName: s.name || s.displayName || 'User',
          isApproved: s.is_approved,
          registrationNumber: s.registration_number,
          profileCompleted: s.profile_completed,
          departmentCode: s.department_code,
          programType: s.program_type,
          phoneNumber: s.phone_number,
          dateOfBirth: s.date_of_birth,
          gender: s.gender,
          nationality: s.nationality,
          stateOfOrigin: s.state_of_origin,
          baptismDate: s.baptism_date,
          learningMode: s.learning_mode,
          declarationOfFaith: s.declaration_of_faith,
          address: s.address,
          profileImageUrl: s.profile_image_url,
          baptismCertificateUrl: s.baptism_certificate_url,
          referenceLetter1Url: s.reference_letter1_url,
          referenceLetter2Url: s.reference_letter2_url,
          documentsUploaded: !!(s.profile_image_url && s.reference_letter1_url && s.reference_letter2_url && s.baptism_certificate_url && s.academic_credential_url)
        })).sort((a: any, b: any) => {
          // Sort pending students to the top
          if (a.isApproved !== b.isApproved) {
            return a.isApproved ? 1 : -1;
          }
          // Then sort by name
          return (a.displayName || '').localeCompare(b.displayName || '');
        });
        setStudents(mappedStudents);
      }
    };

    const fetchTeachers = async () => {
      const { data, error } = await supabase.rpc('admin_get_all_users');
      const finalData = data || (await supabase.from('users').select('*')).data;
      if (finalData) {
        setTeachers(finalData.filter((u: any) => u.role === 'teacher'));
      }
    };

    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase.from('departments').select('*');
        
        const defaultDeps = [
          { id: 'diploma', code: 'DIP', name: 'Diploma In Th' },
          { id: 'bachelor', code: 'BACH', name: 'Bachelor' },
          { id: 'masters', code: 'MAST', name: 'Masters' },
          { id: 'doctorate', code: 'DOC', name: 'Doctorate' }
        ];

        if (error || !data || data.length === 0) {
          // Initialize database with default departments if empty
          for (const dep of defaultDeps) {
            await supabase.from('departments').upsert(dep);
          }
          setDepartments(defaultDeps);
        } else {
          const fetchedDeps = data;
          
          // Check if we need to migrate from old defaults (Theology, etc.)
          const hasOldDeps = fetchedDeps.some(d => d.code === 'THEO' || d.code === 'DIV');
          if (hasOldDeps) {
            // Delete old deps
            for (const oldDep of fetchedDeps) {
              await supabase.from('departments').delete().eq('id', oldDep.id);
            }
            // Add new deps
            for (const dep of defaultDeps) {
              await supabase.from('departments').upsert(dep);
            }
            setDepartments(defaultDeps);
          } else {
            setDepartments(fetchedDeps);
          }
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        setDepartments([
          { id: 'diploma', code: 'DIP', name: 'Diploma In Th' },
          { id: 'bachelor', code: 'BACH', name: 'Bachelor' },
          { id: 'masters', code: 'MAST', name: 'Masters' },
          { id: 'doctorate', code: 'DOC', name: 'Doctorate' }
        ]);
      }
    };

    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').in('id', ['global', 'department_durations', 'hero_banners', 'testimonials']);
      if (data) {
        const globalSettings = data.find(s => s.id === 'global');
        const heroBannersRow = data.find(s => s.id === 'hero_banners');
        const testimonialsRow = data.find(s => s.id === 'testimonials');
        
        let parsedBanners: string[] = [];
        if (heroBannersRow && heroBannersRow.value) {
          try {
            parsedBanners = Array.isArray(heroBannersRow.value) ? heroBannersRow.value : JSON.parse(heroBannersRow.value as string);
          } catch (e) {}
        }

        let parsedTestimonials: any[] = [];
        if (testimonialsRow && testimonialsRow.value) {
          try {
            parsedTestimonials = Array.isArray(testimonialsRow.value) ? testimonialsRow.value : JSON.parse(testimonialsRow.value as string);
          } catch (e) {}
        }

        if (globalSettings) {
          const v = globalSettings.value || {};
          setSettings({
            logoUrl: globalSettings.logoUrl || globalSettings.logo_url || v.logo_url || '',
            rectorImageUrl: globalSettings.rectorImageUrl || globalSettings.rector_image_url || v.rector_image_url || globalSettings.rectorUrl || '',
            heroBgUrl: globalSettings.heroBgUrl || globalSettings.hero_bg_url || v.hero_bg_url || '',
            aboutImageUrl: globalSettings.aboutImageUrl || globalSettings.about_image_url || v.about_image_url || null,
            liveStreamUrl: globalSettings.liveStreamUrl || globalSettings.live_stream_url || v.live_stream_url || '',
            anthemUrl: globalSettings.anthemUrl || globalSettings.anthem_url || v.anthem_url || '',
            anthemTitle: globalSettings.anthemTitle || globalSettings.anthem_title || v.anthem_title || 'School Anthem',
            admissionFlyerUrl: globalSettings.admissionFlyerUrl || globalSettings.admission_flyer_url || v.admission_flyer_url || '',
            heroBanners: parsedBanners.length > 0 ? parsedBanners : (globalSettings.hero_banners || v.hero_banners || []),
            testimonials: parsedTestimonials,
            siteUrl: globalSettings.site_url || globalSettings.siteUrl || v.site_url || '',
            flutterwavePublicKey: globalSettings.flutterwave_public_key || v.flutterwave_public_key || '',
            cloudinaryUrl: v.cloudinary_url || '',
            smtpHost: v.smtp_host || '',
            smtpPort: v.smtp_port || '',
            smtpUser: v.smtp_user || '',
            smtpPass: v.smtp_pass || '',
            smtpSender: v.smtp_sender || 'Winning Gate Seminary',
            smtpFrom: v.smtp_from || '',
            isAdmissionOpen: globalSettings.is_admission_open ?? v.is_admission_open ?? true,
            importantDates: globalSettings.important_dates || v.important_dates || {
              applicationOpens: 'Aug 15',
              applicationDeadline: 'Oct 30',
              orientationBegins: 'Nov 15'
            },
            fees: {
              registration: globalSettings.fees?.registration || 10000,
              currency: globalSettings.fees?.currency || 'NGN',
              tuition: {
                diploma: globalSettings.fees?.tuition?.diploma || 100000,
                bachelor: globalSettings.fees?.tuition?.bachelor || 120000,
                master: globalSettings.fees?.tuition?.master || 150000,
                doctorate: globalSettings.fees?.tuition?.doctorate || 180000
              }
            }
          });
        }
        
        const durationsSettings = data.find(s => s.id === 'department_durations');
        if (durationsSettings && durationsSettings.value) {
          setDepartmentDurations(durationsSettings.value as Record<string, number>);
        }
      }
    };

    // Real-time listeners
    const studentsSubscription = supabase
      .channel('users-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        console.log('Users changed:', payload);
        fetchStudents();
      })
      .subscribe();

    const messagesSubscription = supabase
      .channel('mail-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mail' }, (payload) => {
        console.log('Mail changed:', payload);
        fetchMessages();
      })
      .subscribe();

    const fetchMessages = async () => {
      const { data } = await supabase.from('mail').select('*').order('created_at', { ascending: false });
      if (data) setMessages(data);
    };

    const fetchPayments = async () => {
      const { data } = await supabase
        .from('payments')
        .select(`
          *,
          user:users(id, name, email, registration_number)
        `)
        .order('timestamp', { ascending: false });
      
      if (data) setPayments(data);
    };

    const paymentsSubscription = supabase
      .channel('payments-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchPayments();
      })
      .subscribe();

    fetchStudents();
    fetchTeachers();
    fetchMessages();
    fetchDepartments();
    fetchSettings();
    fetchGallery();
    fetchPayments();
    
    // Check SMTP status
    fetch('/api/check-smtp')
      .then(res => res.json())
      .then(data => setSmtpDiagnostic(data))
      .catch(err => console.warn("SMTP diagnostic check skipped/unavailable:", err.message));

    setLoading(false);

    return () => {
      studentsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      paymentsSubscription.unsubscribe();
    };
  }, [profile]);

  useEffect(() => {
    if (!selectedStudentForAcademic) {
      setStudentGrades([]);
      setStudentAssignments([]);
      return;
    }
    const fetchAcademicData = async () => {
      const { data: gradesData } = await supabase.from('grades').select('*').eq('user_id', selectedStudentForAcademic);
      if (gradesData) setStudentGrades(gradesData);

      const { data: assignmentsData } = await supabase.from('assignments').select('*').eq('user_id', selectedStudentForAcademic);
      if (assignmentsData) setStudentAssignments(assignmentsData);
    };
    fetchAcademicData();
  }, [selectedStudentForAcademic]);

  const handleApprove = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const edit = pendingEdits[studentId] || {};
    const deptCode = edit.departmentCode || student.departmentCode;
    const programType = edit.programType || student.programType;

    if (!deptCode || !programType) {
      showToast("Please assign a department and program type first.");
      return;
    }
    
    try {
      // Level mapping for the registration number
      const ptLower = programType.toLowerCase();
      const levelCode = ptLower === 'diploma' ? 'DP' : ptLower === 'bachelor' ? 'BD' : ptLower === 'master' ? 'MD' : 'DD';
      const year = new Date().getFullYear().toString().slice(-2);
      const counterId = `${levelCode}-${year}`;
      
      let regNumber = '';

      // Supabase transaction equivalent using RPC or simple select/update
      // For simplicity, we'll do a select then upsert. In a real production app, use a Postgres function for atomic increment.
      const { data: counterData } = await supabase.from('settings').select('value').eq('id', `regCounter_${counterId}`).single();
      let currentCount = counterData?.value || 0;
      const newCount = currentCount + 1;
      
      await supabase.from('settings').upsert({ id: `regCounter_${counterId}`, value: newCount });
      
      const paddedCount = newCount.toString().padStart(4, '0');
      regNumber = `WGTS/${levelCode}/${year}/${paddedCount}`;
      
      await supabase.from('users').update({
        is_approved: true,
        department_code: deptCode,
        program_type: programType,
        registration_number: regNumber
      }).eq('id', studentId);
      
      showToast("Student approved and registration number generated successfully!");
      
      // Send admission email
      const department = departments.find(d => d.code === deptCode);
      if (student && student.email) {
        try {
          const response = await fetch('/api/send-admission-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: student.email,
              studentName: student.displayName || 'Student',
              programName: `${programType} in ${department ? department.name : 'Theology'}`,
              academicSession: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
              registrationNumber: regNumber
            })
          });

          if (!response.ok) {
            const errData = await response.json();
            console.error("Admission email API error:", errData.error);
            showToast(`Student approved, but email failed: ${errData.error}`, "error", 6000);
          } else {
            showToast("Student approved and admission email sent!", "success");
          }
        } catch (emailError) {
          console.error("Failed to send admission email:", emailError);
          showToast("Student approved, but an error occurred sending the email.", "error");
        }
      }

      // Refresh students
      const { data: newStudents } = await supabase.rpc('admin_get_all_users');
      const finalStudents = newStudents || (await supabase.from('users').select('*')).data;
      if (finalStudents) setStudents(finalStudents);
    } catch (error) {
      console.error("Error approving student:", error);
      showToast("An error occurred while approving the student. Please try again.");
    }
  };

  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudentModal) return;

    try {
      const { error } = await supabase.from('users').update({
        department_code: editStudentModal.departmentCode,
        program_type: editStudentModal.programType,
        level: editStudentModal.level,
        registration_number: editStudentModal.registrationNumber,
        date_registered: editStudentModal.dateRegistered
      }).eq('id', editStudentModal.id);

      if (error) throw error;

      showToast("Student details updated successfully!");
      setEditStudentModal(null);
      
      // Refresh students
      const { data: newStudents } = await supabase.rpc('admin_get_all_users');
      const finalStudents = newStudents || (await supabase.from('users').select('*')).data;
      if (finalStudents) setStudents(finalStudents);
    } catch (error) {
      console.error("Error updating student:", error);
      showToast("An error occurred while updating the student.");
    }
  };

  const handleMakeAdmin = async (studentId: string) => {
    setConfirmAction({
      message: "Are you sure you want to make this user an admin?",
      onConfirm: async () => {
        setConfirmAction(null);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const response = await fetch('/api/set-admin-claim', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ uid: studentId })
          });
          
          const data = await response.json();
          if (response.ok) {
            showToast("User successfully made an admin!");
            // Refresh students
            const { data: newStudents } = await supabase.rpc('admin_get_all_users');
            const finalStudents = newStudents || (await supabase.from('users').select('*')).data;
            if (finalStudents) setStudents(finalStudents);
          } else {
            showToast(`Failed to make admin: ${data.error}`);
          }
        } catch (error: any) {
          console.error("Error making admin:", error);
          showToast("An error occurred while making the user an admin.");
        }
      }
    });
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showToast("Adding teacher...");
      
      // Generate teacher reg number
      const year = new Date().getFullYear().toString().slice(-2);
      const { data: counterData } = await supabase.from('settings').select('value').eq('id', `teacherCounter_${year}`).single();
      let currentCount = counterData?.value || 0;
      const newCount = currentCount + 1;
      await supabase.from('settings').upsert({ id: `teacherCounter_${year}`, value: newCount });
      
      const paddedCount = newCount.toString().padStart(4, '0');
      const regNumber = `WGTS/TCH/${year}/${paddedCount}`;

      // Create teacher in users table
      const { data: insertedTeacher, error } = await supabase.from('users').insert({
        id: crypto.randomUUID(),
        name: newTeacher.name,
        email: newTeacher.email,
        role: 'teacher',
        registration_number: regNumber,
        department_code: newTeacher.department,
        is_approved: true
      }).select().single();

      if (error) {
        console.error("Teacher addition error details:", error);
        
        if (error.code === '42P01') {
          throw new Error('The "users" table does not exist. Please run the SQL in SCHEMA.md first.');
        }

        // RLS Error - Most likely current user is NOT an admin in the database
        if (error.message.includes('row-level security') || error.code === '42501') {
          const { data: { user } } = await supabase.auth.getUser();
          const { data: dbUser } = user ? await supabase.from('users').select('role').eq('id', user.id).single() : { data: null };
          
          if (!dbUser || dbUser.role !== 'admin') {
            throw new Error(`Access Denied: Your account role is "${dbUser?.role || 'unknown'}" in the database. You must be an "admin" to add teachers. See SCHEMA.md "Admin Troubleshooting" section.`);
          }
          
          throw new Error('Database security policy (RLS) is blocking the insert even though you are an admin. Please ensure you have run the latest version of the SQL in SCHEMA.md.');
        }
        
        throw new Error(error.message);
      }

      showToast(`Teacher added! Passkey: ${regNumber}`, "success", 10000);
      setNewTeacher({ name: '', email: '', department: '' });
      
      // Refresh teachers list
      const { data: allUsers } = await supabase.from('users').select('*');
      if (allUsers) {
        setTeachers(allUsers.filter((u: any) => u.role === 'teacher'));
      }
    } catch (error: any) {
      console.error("Error adding teacher:", error);
      showToast(error.message || "Failed to add teacher", "error");
    }
  };

  const handleResendAdmissionEmail = async (student: any) => {
    if (!student.email || !student.registrationNumber || !student.programType || !student.departmentCode) {
      showToast("Cannot send email: Student is missing required details (email, registration number, program type, or department).");
      return;
    }

    const department = departments.find(d => d.code === student.departmentCode);
    
    try {
      showToast("Sending admission email...");
      const response = await fetch('/api/send-admission-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: student.email,
          studentName: student.displayName || 'Student',
          programName: `${student.programType} in ${department ? department.name : 'Theology'}`,
          academicSession: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
          registrationNumber: student.registrationNumber
        })
      });

      if (response.ok) {
        showToast("Admission email sent successfully!");
      } else {
        const data = await response.json();
        showToast(`Failed to send email: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error sending admission email:", error);
      showToast("An error occurred while sending the email.");
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueCertificateModal || !newCertificate.courseName || !newCertificate.file || !newCertificate.department || !newCertificate.price) {
      showToast("Please provide all required fields.");
      return;
    }

    try {
      // Upload the certificate file
      if (newCertificate.file.size > 10 * 1024 * 1024) {
        showToast("Certificate file is too large! Please upload a file smaller than 10MB.", "error");
        return;
      }
      let downloadUrl = '';
      const processedFile = await compressImage(newCertificate.file);
      
      const fallbackToBase64 = async (f: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(f);
        });
      };

      try {
        const formData = new FormData();
        formData.append("file", processedFile);
        formData.append("folder", issueCertificateModal || "certificates");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          downloadUrl = data.url;
        } else {
          throw new Error(data.error || "Upload failed");
        }
      } catch (err) {
        console.warn("Cloudinary upload failed, attempting Base64 fallback...", err);
        downloadUrl = await fallbackToBase64(processedFile);
      }

      await supabase.from('certificates').insert({
        user_id: issueCertificateModal,
        course_name: newCertificate.courseName,
        department: newCertificate.department,
        price: Number(newCertificate.price),
        date_awarded: new Date().toISOString(),
        payment_status: 'pending',
        certificate_download_url: downloadUrl
      });

      setIssueCertificateModal(null);
      setNewCertificate({ courseName: '', file: null, department: '', price: '' });
      showToast("Certificate issued successfully!");
    } catch (error: any) {
      console.error("Error issuing certificate:", error);
      showToast(`Failed to issue certificate: ${error.message}`);
    }
  };

  const fetchDeptCourses = async (deptId: string) => {
    const { data } = await supabase.from('courses').select('*').eq('department_id', deptId);
    if (data) setDeptCourses(data);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptForCourses) return;

    await supabase.from('courses').insert({
      department_id: selectedDeptForCourses,
      course_name: newCourse.course_name,
      level: newCourse.level
    });

    setNewCourse({ course_name: '', level: '100' });
    fetchDeptCourses(selectedDeptForCourses);
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for uniqueness
    const codeExists = departments.some(d => d.code.toLowerCase() === newDepartment.code.toLowerCase());
    const nameExists = departments.some(d => d.name.toLowerCase() === newDepartment.name.toLowerCase());
    
    if (codeExists || nameExists) {
      showToast("A department with this name or code already exists. Department registration cannot be the same.");
      return;
    }

    await supabase.from('departments').insert({
      name: newDepartment.name,
      code: newDepartment.code
    });
    setNewDepartment({ name: '', code: '' });
    // Refresh
    const { data } = await supabase.from('departments').select('*');
    if (data) setDepartments(data);
  };

  const handleSaveDurations = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const originalText = btn.innerText;
    btn.innerText = 'Saving...';
    btn.disabled = true;
    try {
      await supabase.from('settings').upsert({
        id: 'department_durations',
        value: departmentDurations
      });
      showToast("Department class durations saved successfully!");
      btn.innerText = 'Saved!';
      btn.classList.add('bg-green-600', 'hover:bg-green-700', 'text-white');
      btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
      setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('bg-green-600', 'hover:bg-green-700', 'text-white');
        btn.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
        btn.disabled = false;
      }, 3000);
    } catch (error) {
      console.error("Error saving durations:", error);
      showToast("Failed to save durations.", "error");
      btn.innerText = originalText;
      btn.disabled = false;
    }
  };

  const handleSaveFees = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const originalText = btn.innerText;
    btn.innerText = 'Saving...';
    btn.disabled = true;
    try {
      const { error } = await supabase.from('settings').update({
        fees: settings.fees
      }).eq('id', 'global');
      if (error) {
        await supabase.from('settings').upsert({ id: 'global', fees: settings.fees });
      }
      showToast("Fee settings saved successfully!");
      btn.innerText = 'Saved Successfully!';
      btn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
      btn.classList.add('bg-green-600', 'hover:bg-green-700');
      setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('bg-green-600', 'hover:bg-green-700');
        btn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
        btn.disabled = false;
      }, 3000);
    } catch (error) {
      console.error("Error saving fees:", error);
      showToast("Failed to save fee settings.", "error");
      btn.innerText = 'Failed to Save';
      btn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
      btn.classList.add('bg-red-600', 'hover:bg-red-700');
      setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('bg-red-600', 'hover:bg-red-700');
        btn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
        btn.disabled = false;
      }, 3000);
    }
  };

  const handleBulkExternalUpload = async () => {
    const linksText = (document.getElementById('bulkLinks') as HTMLTextAreaElement)?.value;
    const year = (document.getElementById('bulkYear') as HTMLInputElement)?.value;
    const caption = (document.getElementById('bulkCaption') as HTMLInputElement)?.value;

    if (!linksText || !year) {
      showToast("Please provide links and a year.", "error");
      return;
    }

    const links = linksText.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));

    if (links.length === 0) {
      showToast("No valid links found. Links must start with http:// or https://", "error");
      return;
    }

    try {
      showToast(`Processing ${links.length} links...`);
      const inserts = links.map(link => ({
        year,
        caption: caption || `Class of ${year}`,
        image_url: link,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('gallery').insert(inserts);

      if (error) throw error;

      showToast(`Successfully added ${links.length} images to the gallery!`);
      const linksEl = document.getElementById('bulkLinks') as HTMLTextAreaElement;
      if (linksEl) linksEl.value = '';
      fetchGallery();
    } catch (error: any) {
      console.error("Error with bulk upload:", error);
      showToast(`Failed to add bulk images: ${error.message}`, "error");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'rectorImage' | 'aboutImage' | 'heroBg' | 'anthem' | 'admissionFlyer') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast(`File is too large! Please select a file smaller than 10MB.`, "error");
      return;
    }

    setUploadingType(type);
    try {
      let finalUrl = '';
      const processedFile = await compressImage(file);
      const fallbackToBase64 = async (f: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(f);
        });
      };

      try {
        const formData = new FormData();
        formData.append("file", processedFile);
        formData.append("folder", `settings/${type}`);
        if (type === 'anthem') formData.append("resource_type", "video");

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          finalUrl = data.url;
        } else {
          throw new Error(data.error || "Upload failed");
        }
      } catch (err: any) {
        console.warn(`Cloudinary upload failed for ${type}.`, err);
        if (type === 'anthem') {
           showToast("Audio upload failed: " + (err.message || "Unknown Cloudinary configuration error"), "error");
           setUploadingType(null);
           return;
        }
        console.warn("Using Base64 fallback.", err);
        finalUrl = await fallbackToBase64(processedFile);
      }

      if (!finalUrl) throw new Error("Failed to generate file URL.");

      if (type === 'anthem') {
        const { error } = await supabase.from('settings').upsert({
          id: 'anthem',
          value: JSON.stringify({ url: finalUrl, title: settings.anthemTitle || 'School Anthem' })
        });
        if (error) throw error;
        
        // Also save to global row
        await supabase.from('settings').update({
          anthem_url: finalUrl,
          anthem_title: settings.anthemTitle || 'School Anthem'
        }).eq('id', 'global');
      } else if (type === 'aboutImage') {
        const { error } = await supabase.from('settings').upsert({
          id: 'about',
          value: JSON.stringify({ url: finalUrl })
        });
        if (error) throw error;
      } else {
        const dbKey = type === 'logo' ? 'logo_url' : 
                      type === 'rectorImage' ? 'rector_image_url' : 
                      type === 'heroBg' ? 'hero_bg_url' :
                      type === 'admissionFlyer' ? 'admission_flyer_url' :
                      type;
  
        const { error } = await supabase.from('settings')
          .update({ [dbKey]: finalUrl })
          .eq('id', 'global');
          
        if (error) {
          const { error: upsertError } = await supabase.from('settings').upsert({
            id: 'global',
            [dbKey]: finalUrl
          });
          if (upsertError) throw upsertError;
        }
      }
      
      await refreshSettings();
      setSettings(prev => ({ ...prev, [`${type}Url`]: finalUrl }));
      showToast(`${type} uploaded successfully!`);
    } catch (error: any) {
      console.error("Upload error:", error);
      let errorMsg = error.message;
      if (errorMsg === 'Failed to fetch') {
        errorMsg = 'Failed to fetch (Check your internet connection or Supabase credentials)';
      }
      showToast(`Upload failed: ${errorMsg}`);
    } finally {
      setUploadingType(null);
    }
  };

  const handleBannersUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingType('heroBanners');
    try {
      const bannerUrls: string[] = [...(settings.heroBanners || [])];
      
      for (let i = 0; i < files.length; i++) {
        if (bannerUrls.length >= 4) break;
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          showToast(`File ${file.name} is too large (>10MB). Skipping.`, "error");
          continue;
        }
        const processedFile = await compressImage(file);
        
        let url = '';
        try {
          const formData = new FormData();
          formData.append("file", processedFile);
          formData.append("folder", "settings/banners");
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const data = await res.json();
          if (data.url) {
            url = data.url;
          } else {
            throw new Error(data.error || "Upload failed");
          }
        } catch (err) {
          console.warn("Cloudinary upload failed, using Base64 fallback.", err);
          url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(processedFile);
          });
        }
        bannerUrls.push(url);
      }

      const { error } = await supabase.from('settings').upsert({ id: 'hero_banners', value: JSON.stringify(bannerUrls) });
      if (error) throw error;
      
      await refreshSettings();
      setSettings(prev => ({ ...prev, heroBanners: bannerUrls }));
      showToast("Banners uploaded successfully!");
    } catch (error: any) {
      console.error("Banner upload error:", error);
      showToast(`Upload failed: ${error.message}`);
    } finally {
      setUploadingType(null);
    }
  };

  const removeBanner = async (index: number) => {
    try {
      const newBanners = settings.heroBanners?.filter((_, i) => i !== index) || [];
      const { error } = await supabase.from('settings').upsert({ id: 'hero_banners', value: JSON.stringify(newBanners) });
      if (error) throw error;
      
      await refreshSettings();
      setSettings(prev => ({ ...prev, heroBanners: newBanners }));
      showToast("Banner removed!");
    } catch (error: any) {
      showToast(`Action failed: ${error.message}`);
    }
  };

  const handleAddTestimonial = async () => {
    if (!newTestimonial.quote || !newTestimonial.author || !newTestimonial.role) {
      showToast("Please fill in quote, author, and role", "error");
      return;
    }
    try {
      const updatedTestimonials = [...(settings.testimonials || []), newTestimonial];
      const { error } = await supabase.from('settings').upsert({ id: 'testimonials', value: JSON.stringify(updatedTestimonials) });
      if (error) throw error;
      
      await refreshSettings();
      setSettings(prev => ({ ...prev, testimonials: updatedTestimonials }));
      setNewTestimonial({ quote: '', author: '', role: '', img: '' });
      showToast("Testimonial added!");
    } catch (error: any) {
      showToast(`Action failed: ${error.message}`, "error");
    }
  };

  const handleRemoveTestimonial = async (index: number) => {
    try {
      const updatedTestimonials = settings.testimonials?.filter((_, i) => i !== index) || [];
      const { error } = await supabase.from('settings').upsert({ id: 'testimonials', value: JSON.stringify(updatedTestimonials) });
      if (error) throw error;
      
      await refreshSettings();
      setSettings(prev => ({ ...prev, testimonials: updatedTestimonials }));
      showToast("Testimonial removed!");
    } catch (error: any) {
      showToast(`Action failed: ${error.message}`, "error");
    }
  };

  const handleTestimonialImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingType('testimonialImg');
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("File too large (>10MB).");
      const processedFile = await compressImage(file);
        
      let url = '';
      try {
        const formData = new FormData();
        formData.append("file", processedFile);
        formData.append("folder", "settings/testimonials");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) url = data.url;
        else throw new Error(data.error || "Upload failed");
      } catch (err) {
        url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(processedFile);
        });
      }
      setNewTestimonial(prev => ({ ...prev, img: url }));
      showToast("Testimonial image prepared.");
    } catch (error: any) {
      console.error(error);
      showToast("Upload failed: " + error.message, "error");
    } finally {
      setUploadingType(null);
    }
  };

  const handleAddBannerUrl = async () => {
    if (!newBannerUrl.trim()) return;
    if ((settings.heroBanners?.length || 0) >= 4) {
      showToast("Maximum of 4 banners allowed", 'error');
      return;
    }
    try {
      const newBanners = [...(settings.heroBanners || []), newBannerUrl.trim()];
      const { error } = await supabase.from('settings').upsert({ id: 'hero_banners', value: JSON.stringify(newBanners) });
      if (error) throw error;
      
      await refreshSettings();
      setSettings(prev => ({ ...prev, heroBanners: newBanners }));
      setNewBannerUrl('');
      showToast("Banner added from URL!");
    } catch (error: any) {
      showToast(`Action failed: ${error.message}`, 'error');
    }
  };

  const handleUrlSave = async (e: React.MouseEvent<HTMLButtonElement>, type: 'logo' | 'rectorImage' | 'aboutImage' | 'heroBg' | 'liveStream' | 'anthem' | 'admissionFlyer', url: string) => {
    const btn = e.currentTarget;
    const originalText = btn.innerText;
    btn.innerText = 'Saving...';
    btn.disabled = true;
    try {
      const formattedUrl = type === 'liveStream' || type === 'anthem' ? url : formatImageUrl(url);
      
      // Fetch latest value object to preserve other keys
      const { data: currentGlobal } = await supabase.from('settings').select('value').eq('id', 'global').maybeSingle();
      const updatedValue = { ...(currentGlobal?.value || {}) };
      
      const dbKey = type === 'logo' ? 'logo_url' : 
                    type === 'rectorImage' ? 'rector_image_url' : 
                    type === 'heroBg' ? 'hero_bg_url' : 
                    type === 'liveStream' ? 'live_stream_url' :
                    type === 'admissionFlyer' ? 'admission_flyer_url' :
                    type === 'aboutImage' ? 'about_image_url' :
                    type === 'anthem' ? 'anthem_url' :
                    type;

      updatedValue[dbKey] = formattedUrl;
      if (type === 'anthem') updatedValue.anthem_title = settings.anthemTitle || 'School Anthem';

      // Always update via value column for redundancy
      const { error } = await supabase.from('settings').upsert({
        id: 'global',
        [dbKey]: formattedUrl, // Try updating flat column if it exists
        value: updatedValue
      });
      
      if (error) {
        // If flat column assignment failed, try just updating the value object
        const { error: fallbackError } = await supabase.from('settings').upsert({
          id: 'global',
          value: updatedValue
        });
        if (fallbackError) throw fallbackError;
      }
      
      await refreshSettings();
      setSettings(prev => ({ ...prev, [`${type}Url`]: formattedUrl }));
      showToast(`${type} URL saved successfully!`);
      btn.innerText = 'Saved!';
      btn.classList.remove('bg-slate-900', 'hover:bg-slate-800');
      btn.classList.add('bg-green-600', 'hover:bg-green-700');
      setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('bg-green-600', 'hover:bg-green-700');
        btn.classList.add('bg-slate-900', 'hover:bg-slate-800');
        btn.disabled = false;
      }, 3000);
    } catch (error: any) {
      console.error("Save error:", error);
      let errorMsg = error.message;
      if (errorMsg === 'Failed to fetch') {
        errorMsg = 'Failed to fetch (Your firewall/ad-blocker might be blocking Supabase, or credentials are invalid)';
      } else if (errorMsg.includes('column') && errorMsg.includes('not found')) {
        errorMsg = `${errorMsg}. Please ensure you've applied the SQL migrations in SCHEMA.md to your Supabase project.`;
      }
      showToast(`Failed to save URL: ${errorMsg}`, "error");
      btn.innerText = 'Failed';
      btn.classList.remove('bg-slate-900', 'hover:bg-slate-800');
      btn.classList.add('bg-red-600', 'hover:bg-red-700');
      setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('bg-red-600', 'hover:bg-red-700');
        btn.classList.add('bg-slate-900', 'hover:bg-slate-800');
        btn.disabled = false;
      }, 3000);
    }
  };

  const handleManualPaymentUpdate = async (studentId: string, type: 'registration' | 'tuition', status: boolean) => {
    try {
      const field = type === 'registration' ? 'registration_fee_paid' : 'tuition_fee_paid';
      const { error } = await supabase.from('users').update({ [field]: status }).eq('id', studentId);
      
      if (error) throw error;
      
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} status updated successfully.`);
      
      // Refresh students
      const { data: newStudents } = await supabase.rpc('admin_get_all_users');
      const finalStudents = newStudents || (await supabase.from('users').select('*')).data;
      if (finalStudents) setStudents(finalStudents.map((s: any) => ({
        ...s,
        displayName: s.name || s.displayName || 'User',
        isApproved: s.is_approved,
        registrationNumber: s.registration_number,
        profileCompleted: s.profile_completed,
        departmentCode: s.department_code,
        programType: s.program_type,
        phoneNumber: s.phone_number,
        dateOfBirth: s.date_of_birth,
        gender: s.gender,
        nationality: s.nationality,
        stateOfOrigin: s.state_of_origin,
        baptismDate: s.baptism_date,
        learningMode: s.learning_mode,
        declarationOfFaith: s.declaration_of_faith,
        address: s.address,
        profileImageUrl: s.profile_image_url,
        baptismCertificateUrl: s.baptism_certificate_url,
        referenceLetter1Url: s.reference_letter1_url,
        referenceLetter2Url: s.reference_letter2_url,
        documentsUploaded: !!(s.profile_image_url && s.reference_letter1_url && s.reference_letter2_url && s.baptism_certificate_url && s.academic_credential_url)
      })));
    } catch (error: any) {
      console.error("Error updating manual payment:", error);
      showToast(`Failed to update payment status: ${error.message}`, "error");
    }
  };

  const fetchPayments = async () => {
    const { data } = await supabase
      .from('payments')
      .select(`
        *,
        user:users(id, name, email, registration_number)
      `)
      .order('timestamp', { ascending: false });
    
    if (data) setPayments(data);
  };

  const [financeSearch, setFinanceSearch] = useState('');
  const [newVideo, setNewVideo] = useState({ year: new Date().getFullYear().toString(), title: '', videoUrl: '' });
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [galleryVideos, setGalleryVideos] = useState<any[]>([]);

  const fetchGallery = async () => {
    const { data: images } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    const { data: videos } = await supabase.from('gallery_videos').select('*').order('created_at', { ascending: false });
    if (images) setGalleryImages(images);
    if (videos) setGalleryVideos(videos);
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from('gallery_videos').insert({
        year: newVideo.year,
        title: newVideo.title,
        video_url: newVideo.videoUrl
      });
      showToast('Video added successfully!');
      setNewVideo({ year: new Date().getFullYear().toString(), title: '', videoUrl: '' });
      fetchGallery();
    } catch (error: any) {
      showToast(`Failed to add video: ${error.message}`);
    }
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAcademic) return;
    await supabase.from('grades').insert({
      user_id: selectedStudentForAcademic,
      course_name: newGrade.courseName,
      credits: newGrade.credits,
      score: newGrade.score,
      grade: newGrade.grade
    });
    setNewGrade({ courseName: '', credits: 3, score: '', grade: '' });
    const { data } = await supabase.from('grades').select('*').eq('user_id', selectedStudentForAcademic);
    if (data) setStudentGrades(data);
    showToast("Grade added successfully!");
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAcademic) return;
    await supabase.from('assignments').insert({
      user_id: selectedStudentForAcademic,
      course_name: newAssignment.courseName,
      assignment_name: newAssignment.assignmentName,
      status: newAssignment.status,
      score: newAssignment.score
    });
    setNewAssignment({ courseName: '', assignmentName: '', status: 'pending', score: '' });
    const { data } = await supabase.from('assignments').select('*').eq('user_id', selectedStudentForAcademic);
    if (data) setStudentAssignments(data);
    showToast("Assignment added successfully!");
  };

  if (loading) return <div className="p-8 text-center">Loading admin panel...</div>;

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-12 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight mb-2">Admin Dashboard</h1>
            <p className="text-slate-500 font-medium tracking-wide">Manage students, courses, and system settings seamlessly.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full font-bold text-sm border border-yellow-100 shadow-sm flex items-center gap-2">
              <ShieldCheck size={16} /> Administrator
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 md:shrink-0 overflow-x-auto pb-4 md:pb-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 md:p-4 flex flex-row md:flex-col gap-2 min-w-max md:min-w-0">
              <button 
                onClick={() => setActiveTab('students')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'students' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Users size={20} /> Students
              </button>
              <button 
                onClick={() => setActiveTab('teachers')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'teachers' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Award size={20} /> Teachers
              </button>
              <button 
                onClick={() => setActiveTab('departments')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'departments' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Book size={20} /> Departments
              </button>
              <button 
                onClick={() => setActiveTab('courses')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'courses' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <FileText size={20} /> Courses
              </button>
              <button 
                onClick={() => setActiveTab('live')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'live' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Video size={20} /> Live Classes
              </button>
              <button 
                onClick={() => setActiveTab('gallery')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'gallery' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <ImageIcon size={20} /> Gallery & Media
              </button>
              <button 
                onClick={() => setActiveTab('blog')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'blog' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <FileText size={20} /> Blog Updates
              </button>
              <button 
                onClick={() => setActiveTab('finance')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'finance' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <CreditCard size={20} /> Finance
              </button>
              <button 
                onClick={() => setActiveTab('academic')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'academic' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Award size={20} /> Academic Records
              </button>
              <button 
                onClick={() => setActiveTab('messages')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'messages' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Mail size={20} /> Messages
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Settings size={20} /> Settings
              </button>
              <button 
                onClick={() => setActiveTab('diagnostic')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === 'diagnostic' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <ShieldCheck size={20} /> System Diagnostic
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-grow w-full md:min-w-0">
            {activeTab === 'diagnostic' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 md:p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 leading-none mb-1">System Diagnostic</h2>
                      <p className="text-sm text-slate-500 font-medium">Verify connection and database integrity</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Connection Status</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-600">Supabase URL</span>
                            <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200">
                              {(supabase as any).supabaseUrl?.replace(/https:\/\/([a-z0-9]+)\..*/, '$1.supabase.co')}
                            </code>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-600">Anon Key Loaded</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${ (supabase as any).supabaseKey && (supabase as any).supabaseKey !== 'placeholder-key' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              { (supabase as any).supabaseKey && (supabase as any).supabaseKey !== 'placeholder-key' ? 'YES (Valid JWT)' : 'NO (Placeholder)'}
                            </span>
                          </div>
                          <div className="pt-4">
                             <button 
                              onClick={async () => {
                                try {
                                  const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
                                  if (error) throw error;
                                  showToast(`Connection Test Successful! Found ${data} users.`, "success");
                                } catch (e: any) {
                                  console.error("Test error:", e);
                                  showToast(`Connection Fail: ${e.message}`, "error");
                                }
                              }}
                              className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all"
                             >
                               Run Connection Test
                             </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Database Integrity</h3>
                        <div className="space-y-4">
                          <button 
                            onClick={async () => {
                              try {
                                showToast("Running repair...", "success");
                                
                                // 1. Check if global row exists
                                const { data: existing, error: fetchError } = await supabase
                                  .from('settings')
                                  .select('*')
                                  .eq('id', 'global')
                                  .maybeSingle();

                                if (fetchError) throw fetchError;

                                if (!existing) {
                                  // Only insert if missing
                                  const { error: insertError } = await supabase.from('settings').insert({
                                    id: 'global',
                                    school_name: 'Winning Gate Christian Theological Seminary'
                                  });
                                  if (insertError) throw insertError;
                                  showToast("Created missing settings record", "success");
                                } else {
                                  // If exists, just ensure the name is there if empty
                                  if (!existing.school_name && !existing.schoolName) {
                                    await supabase.from('settings').update({ 
                                      school_name: 'Winning Gate Christian Theological Seminary' 
                                    }).eq('id', 'global');
                                  }
                                  showToast("Settings record verified", "success");
                                }

                                // 2. Test fetching all collections
                                const counts: any = {};
                                const tables = ['users', 'gallery', 'courses', 'departments', 'payments'];
                                for (const table of tables) {
                                  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
                                  counts[table] = error ? 'Error' : count;
                                }

                                alert(`Database Integrity Check Complete.\n\nSummary:\n- Settings (global): ${existing ? 'Verified' : 'Created'}\n${tables.map(t => `- ${t}: ${counts[t]} items`).join('\n')}\n\nRunning advanced sync...`);
                                
                                // Advanced fix: Sync specific rows to global row
                                const { data: anthemRow } = await supabase.from('settings').select('value').eq('id', 'anthem').maybeSingle();
                                if (anthemRow?.value) {
                                  const anthemData = typeof anthemRow.value === 'string' ? JSON.parse(anthemRow.value) : anthemRow.value;
                                  if (anthemData.url) {
                                    await supabase.from('settings').update({ 
                                      anthem_url: anthemData.url,
                                      anthem_title: anthemData.title || 'School Anthem'
                                    }).eq('id', 'global');
                                  }
                                }

                                const { data: aboutRow } = await supabase.from('settings').select('value').eq('id', 'about').maybeSingle();
                                if (aboutRow?.value) {
                                  const aboutData = typeof aboutRow.value === 'string' ? JSON.parse(aboutRow.value) : aboutRow.value;
                                  if (aboutData.url) {
                                    await supabase.from('settings').update({ 
                                      about_image_url: aboutData.url
                                    }).eq('id', 'global');
                                  }
                                }

                                await refreshSettings();
                                alert("Sync Complete: Anthem and About settings have been synchronized to the global row.");
                              } catch (e: any) {
                                console.error("Repair error:", e);
                                alert(`Check Failed: ${e.message}\n\nCheck if you have run the SQL in SCHEMA.md in your Supabase SQL Editor.`);
                              }
                            }}
                            className="w-full py-3 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                          >
                            <ShieldCheck size={16} /> Verify & Fix Database Integrity
                          </button>
                          <p className="text-[10px] text-slate-500 leading-relaxed italic">
                            This will ensure the 'global' settings row exists. Use this if your logo/hero background are not showing despite being uploaded.
                          </p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Raw Settings Inspector</h3>
                        <div className="space-y-4">
                           <button 
                            onClick={async () => {
                              const { data } = await supabase.from('settings').select('*');
                              console.log('Raw Settings:', data);
                              alert('Check browser console (F12) for RAW database dump. \n\nFound ' + (data?.length || 0) + ' rows in settings.');
                            }}
                            className="text-[10px] font-bold text-blue-600 hover:underline"
                           >
                              [Debug] Log Raw Settings to Console
                           </button>
                          <div className="bg-white p-3 rounded border border-slate-200 overflow-hidden">
                              <p className="text-[10px] font-black text-slate-400 mb-2 uppercase">Core System Fields</p>
                              <div className="space-y-1">
                                {[
                                  { label: 'Logo', key: 'logoUrl' },
                                  { label: 'Hero BG', key: 'heroBgUrl' },
                                  { label: 'Hero Banners', key: 'heroBanners' },
                                  { label: 'Anthem', key: 'anthemUrl' },
                                  { label: 'Admission Flyer', key: 'admissionFlyerUrl' }
                                ].map(field => (
                                  <div key={field.key} className="flex justify-between text-[10px]">
                                    <span className="font-mono text-slate-500">{field.label}:</span>
                                    <span className="font-bold">{(settings as any)[field.key] ? '✅ SET' : '❌ EMPTY'}</span>
                                  </div>
                                ))}
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 italic">OTP & Student Verification Diagnostics</h3>
                        <div className="space-y-4">
                          <p className="text-[10px] text-slate-500">Test the OTP delivery system (Email/Server). Note: Codes are logged to the dev server console if SMTP is not set.</p>
                          <div className="grid grid-cols-1 gap-2">
                             <button 
                              onClick={async () => {
                                const email = prompt("Enter student email to test CLASS OTP:");
                                if (!email) return;
                                try {
                                  const resp = await fetch('/api/send-class-otp', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ email, studentName: 'Admin Tester', regNumber: 'ADMIN-TEST-123' })
                                  });
                                  const data = await resp.json();
                                  alert(`Result: ${data.message || data.error}\n\nCheck browser console for details.`);
                                  console.log('OTP Test Result:', data);
                                } catch (e: any) {
                                  alert(`Error: ${e.message}`);
                                }
                              }}
                              className="w-full py-2 bg-yellow-600 text-white text-[10px] font-bold rounded-lg hover:bg-yellow-700 transition-all flex items-center justify-center gap-2"
                            >
                               <Video size={14} /> Send Test Class OTP
                             </button>
                             <button 
                              onClick={async () => {
                                const email = prompt("Enter student email to test DOWNLOAD OTP:");
                                if (!email) return;
                                try {
                                  const resp = await fetch('/api/send-download-otp', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ email, studentName: 'Admin Tester', certificateName: 'Diagnostic Sample' })
                                  });
                                  const data = await resp.json();
                                  alert(`Result: ${data.message || data.error}\n\nCheck browser console for details.`);
                                  console.log('OTP Test Result:', data);
                                } catch (e: any) {
                                  alert(`Error: ${e.message}`);
                                }
                              }}
                              className="w-full py-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                               <Award size={14} /> Send Test Student OTP
                             </button>
                          </div>
                          <div className="bg-white p-3 rounded border border-yellow-100">
                             <p className="text-[10px] font-black text-yellow-600 uppercase mb-1">Troubleshooting OTP</p>
                             <ul className="text-[9px] text-slate-500 list-disc ml-3 space-y-1">
                                <li>Ensure <b>SMTP_PASS</b> is a 16-character Gmail App Password.</li>
                                <li>Check if student email exists in <b>users</b> table.</li>
                                <li>OTP Map resets on server restart (Standard behavior for dev).</li>
                             </ul>
                          </div>
                        </div>
                      </div>

                    <div className="bg-slate-900 rounded-2xl p-6 text-white h-fit shadow-xl">
                      <h3 className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-4">Common Issues & Fixes</h3>
                      <div className="space-y-4 text-xs">
                        <div className="border-l-2 border-yellow-500/30 pl-4 py-1">
                          <p className="font-bold mb-1">Images not showing?</p>
                          <p className="text-slate-400">Ensure your <b>'image'</b> storage bucket is <b>Public</b> and the <b>'gallery'</b> table has <b>Public SELECT</b> access in Supabase.</p>
                        </div>
                        <div className="border-l-2 border-yellow-500/30 pl-4 py-1">
                          <p className="font-bold mb-1">'Table not found' errors?</p>
                          <p className="text-slate-400">Copy the SQL from <b>SCHEMA.md</b> in the code editor, go to Supabase Dashboard {"->"} SQL Editor, and <b>Run</b> it.</p>
                        </div>
                        <div className="border-l-2 border-yellow-500/30 pl-4 py-1">
                          <p className="font-bold mb-1">'Failed to fetch' on upload?</p>
                          <p className="text-slate-400">This usually means your Supabase URL/Key are incorrect, or your browser is blocking the request. Disable ad-blockers for this site.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'finance' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Finance & Revenue</h2>
                      <p className="text-sm text-slate-500">Monitor all transactions and revenue</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Total Revenue</p>
                        <p className="text-lg font-black text-green-700">
                          {settings.fees?.currency === 'USD' ? '$' : '₦'}
                          {payments.reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}
                        </p>
                      </div>
                      <button 
                        onClick={fetchPayments}
                        className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                        title="Refresh Payments"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registration Fees</span>
                        <ShieldCheck size={16} className="text-blue-500" />
                      </div>
                      <p className="text-xl font-bold text-slate-900">
                        {settings.fees?.currency === 'USD' ? '$' : '₦'}
                        {payments.filter(p => p.type === 'registration_fee').reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tuition Fees</span>
                        <GraduationCap size={16} className="text-yellow-600" />
                      </div>
                      <p className="text-xl font-bold text-slate-900">
                        {settings.fees?.currency === 'USD' ? '$' : '₦'}
                        {payments.filter(p => p.type === 'tuition_fee').reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Certificates</span>
                        <Award size={16} className="text-purple-500" />
                      </div>
                      <p className="text-xl font-bold text-slate-900">
                        {settings.fees?.currency === 'USD' ? '$' : '₦'}
                        {payments.filter(p => p.certificate_id).reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                    <button className="text-sm font-bold text-yellow-700 bg-yellow-50 px-4 py-2 rounded-lg">Transaction Log</button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                          <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                          <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ref / ID</th>
                          <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                          <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-4">
                              <p className="text-xs font-medium text-slate-900">
                                {new Date(payment.timestamp).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm font-bold text-slate-900">{payment.user?.name || 'Unknown'}</p>
                              <p className="text-xs text-slate-500 font-mono">{payment.user?.registration_number || 'No Reg No'}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-[10px] font-mono text-slate-400 uppercase">{payment.tx_ref || payment.transaction_id || payment.id.slice(0, 8)}</p>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                payment.type === 'registration_fee' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                payment.type === 'tuition_fee' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                payment.certificate_id ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                'bg-slate-50 text-slate-600 border-slate-100'
                              }`}>
                                {payment.type === 'registration_fee' ? 'Registration' :
                                 payment.type === 'tuition_fee' ? 'Tuition' :
                                 payment.certificate_id ? 'Certificate' : 'Other'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm font-black text-slate-900">
                                {payment.currency === 'USD' ? '$' : '₦'}
                                {payment.amount.toLocaleString()}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Student Payment Status</h2>
                      <p className="text-sm text-slate-500">Track and manually update payment status for individual students</p>
                    </div>
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search student..." 
                        value={financeSearch}
                        onChange={(e) => setFinanceSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-widest font-black">
                          <th className="py-4 px-4">Student</th>
                          <th className="py-4 px-4">Level</th>
                          <th className="py-4 px-4">Registration</th>
                          <th className="py-4 px-4">Tuition</th>
                          <th className="py-4 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students
                          .filter(s => s.role !== 'admin' && s.role !== 'teacher')
                          .filter(s => 
                            s.displayName.toLowerCase().includes(financeSearch.toLowerCase()) || 
                            s.email.toLowerCase().includes(financeSearch.toLowerCase())
                          )
                          .slice(0, 20)
                          .map((student) => (
                          <tr key={student.id} className="border-b border-slate-50">
                            <td className="py-4 px-4">
                              <p className="text-sm font-bold text-slate-900">{student.displayName}</p>
                              <p className="text-[10px] text-slate-500">{student.email}</p>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded">{student.level || 'N/A'}</span>
                            </td>
                            <td className="py-4 px-4">
                              {student.registration_fee_paid || student.registrationFeePaid ? (
                                <span className="flex items-center gap-1 text-green-600 text-[10px] font-bold">
                                  <CheckCircle size={12} /> PAID
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                                  <XCircle size={12} /> UNPAID
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {student.tuition_fee_paid || student.tuitionFeePaid ? (
                                <span className="flex items-center gap-1 text-green-600 text-[10px] font-bold">
                                  <CheckCircle size={12} /> PAID
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                                  <XCircle size={12} /> UNPAID
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleManualPaymentUpdate(student.id, 'registration', !(student.registration_fee_paid || student.registrationFeePaid))}
                                  className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${
                                    (student.registration_fee_paid || student.registrationFeePaid) 
                                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  }`}
                                >
                                  { (student.registration_fee_paid || student.registrationFeePaid) ? 'Mark Reg as Unpaid' : 'Mark Reg as Paid'}
                                </button>
                                <button 
                                  onClick={() => handleManualPaymentUpdate(student.id, 'tuition', !(student.tuition_fee_paid || student.tuitionFeePaid))}
                                  className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${
                                    (student.tuition_fee_paid || student.tuitionFeePaid) 
                                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  }`}
                                >
                                  { (student.tuition_fee_paid || student.tuitionFeePaid) ? 'Mark Tuition as Unpaid' : 'Mark Tuition as Paid'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'teachers' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Manage Teachers</h2>
                
                <form onSubmit={handleAddTeacher} className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={newTeacher.name}
                      onChange={e => setNewTeacher({...newTeacher, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                      placeholder="Teacher Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                    <input 
                      type="email" 
                      value={newTeacher.email}
                      onChange={e => setNewTeacher({...newTeacher, email: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                      placeholder="teacher@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                    <select 
                      value={newTeacher.department}
                      onChange={e => setNewTeacher({...newTeacher, department: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                      required
                    >
                      <option value="" disabled>Select Dept</option>
                      {departments.map(d => <option key={d.id} value={d.code}>{d.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors">
                    Add Teacher
                  </button>
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Passkey (Reg No)</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                        <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((teacher, idx) => (
                        <tr key={teacher.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-4 text-sm font-bold text-slate-400">
                            {idx + 1}.
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900">{teacher.name}</div>
                            <div className="text-xs text-slate-500">{teacher.email}</div>
                          </td>
                          <td className="py-4 px-4 font-mono text-sm text-yellow-700 font-bold">
                            <div className="flex items-center gap-2">
                              {teacher.registration_number}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(teacher.registration_number);
                                  showToast("Passkey copied to clipboard!", "success", 30000);
                                }}
                                className="text-yellow-600 bg-yellow-50 hover:bg-yellow-100 p-1.5 rounded-md transition-colors"
                                title="Copy Passkey (Stays for 30s)"
                              >
                                <Copy size={16} />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-600">
                            {teacher.department_code}
                          </td>
                          <td className="py-4 px-4">
                            <button 
                              onClick={() => {
                                setConfirmAction({
                                  message: `Are you sure you want to completely remove teacher ${teacher.name}? They will not be able to log in anymore.`,
                                  onConfirm: async () => {
                                    setConfirmAction(null);
                                    const { error: delError } = await supabase.from('users').delete().eq('id', teacher.id);
                                    
                                    if (delError) {
                                      console.error("Delete error:", delError);
                                      showToast(`Failed to remove teacher: ${delError.message}`, "error");
                                      return;
                                    }

                                    // Local filter for instant reactivity
                                    setTeachers(prev => prev.filter(t => t.id !== teacher.id));
                                    
                                    // Refresh teachers from DB to stay in sync
                                    const { data, error } = await supabase.rpc('admin_get_all_users');
                                    const finalData = data || (await supabase.from('users').select('*')).data;
                                    if (finalData) setTeachers(finalData.filter((u: any) => u.role === 'teacher'));
                                    
                                    showToast("Teacher removed successfully");
                                  }
                                });
                              }}
                              className="text-red-600 hover:text-red-700 text-xs font-bold"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {teachers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500 italic">No teachers added yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="space-y-6">
                {/* SMTP Diagnostic Warning */}
                {smtpDiagnostic && smtpDiagnostic.warnings.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-700">
                        <Mail size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-red-800">Email System Warning</h3>
                        <div className="mt-1 space-y-1">
                          {smtpDiagnostic.warnings.map((warning, idx) => (
                            <p key={idx} className="text-sm text-red-700 font-medium">• {warning}</p>
                          ))}
                          {smtpDiagnostic.user && (
                            <div className="mt-2 p-2 bg-slate-900 text-white rounded font-mono text-xs flex flex-col gap-1">
                              <div>USER: {smtpDiagnostic.user}</div>
                              {smtpDiagnostic.from && smtpDiagnostic.from !== smtpDiagnostic.user && (
                                <div className="text-yellow-400">FROM: {smtpDiagnostic.from}</div>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 mr-1">PASS:</span> 
                                {smtpDiagnostic.passPreview}
                                <span className={`px-2 py-0.5 rounded text-[10px] ${smtpDiagnostic.passLength === 16 ? 'bg-green-600' : 'bg-red-600'}`}>
                                  {smtpDiagnostic.passLength} characters
                                </span>
                                {smtpDiagnostic.passLength === 16 && (
                                  <span className="text-green-500 font-bold ml-1">
                                    ✓ LENGTH OK
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-slate-500 mt-1 italic">
                                * Password is intentionally masked in preview for security.
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 p-3 bg-white/60 rounded-lg border border-red-100 text-xs text-red-600 space-y-2">
                          <p className="font-bold underline">How to fix for Gmail Users:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-1">
                            <li>Go to <strong>myaccount.google.com</strong> and enable <strong>2-Step Verification</strong>.</li>
                            <li>Search for <strong>'App Passwords'</strong> in the search bar at the top.</li>
                            <li>Create a new password for <strong>'Mail'</strong> and <strong>'Other (Custom)'</strong>.</li>
                            <li>Copy that <strong>16-character code</strong> and save it in AI Studio (Settings &rarr; Secrets &rarr; SMTP_PASS).</li>
                          </ol>
                        </div>
                        <div className="mt-4 flex gap-4">
                          <button 
                            onClick={async () => {
                              try {
                                showToast("Testing connection...", "success");
                                const res = await fetch('/api/test-smtp-verify');
                                const result = await res.json();
                                if (result.success) {
                                  showToast(result.message, "success");
                                  const statusRes = await fetch('/api/check-smtp');
                                  const statusData = await statusRes.json();
                                  setSmtpDiagnostic(statusData);
                                } else {
                                  showToast(`Error: ${result.error}`, "error");
                                  if (result.hint) {
                                    alert(`SMTP HINT: ${result.hint}`);
                                  }
                                  console.error("SMTP Test Details:", result);
                                }
                              } catch (err: any) {
                                showToast("SMTP Verification check could not be completed.", "error");
                                console.warn("SMTP Verification Request failed:", err.message);
                              }
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                          >
                            Run Connection Test
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending Approvals Summary */}
                {students.filter(s => s.role !== 'admin' && s.role !== 'teacher' && !s.isApproved).length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700">
                        <Users size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-yellow-800">Pending Approvals</h3>
                        <p className="text-sm text-yellow-700">There are {students.filter(s => s.role !== 'admin' && s.role !== 'teacher' && !s.isApproved).length} students waiting for admission approval.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Student Management</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-3 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
                        <th className="py-3 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="py-3 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Reg Number</th>
                        <th className="py-3 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.filter(s => s.role !== 'admin' && s.role !== 'teacher').map((student, idx) => (
                        <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-4 px-4 text-sm font-bold text-slate-400">
                            {idx + 1}.
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-slate-900">{student.displayName}</p>
                            <p className="text-xs text-slate-500">{student.email}</p>
                            <button 
                              onClick={() => setViewProfileModal(student)}
                              className="text-xs text-blue-600 hover:underline mt-1"
                            >
                              View Profile
                            </button>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${student.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {student.isApproved ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono text-sm">
                            {student.registrationNumber || 'Pending'}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => setEditStudentModal(student)}
                                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
                              >
                                Edit Details
                              </button>
                            {(!student.isApproved || !student.registrationNumber) && (
                              <>
                                <select 
                                  className="text-sm border border-slate-200 rounded p-1"
                                  onChange={(e) => {
                                    setPendingEdits(prev => ({ ...prev, [student.id]: { ...prev[student.id], departmentCode: e.target.value } }));
                                  }}
                                  value={pendingEdits[student.id]?.departmentCode || student.departmentCode || ""}
                                >
                                  <option value="" disabled>Select Dept</option>
                                  {departments.map(d => <option key={d.id} value={d.code}>{d.name}</option>)}
                                </select>
                                <select 
                                  className="text-sm border border-slate-200 rounded p-1"
                                  onChange={(e) => {
                                    setPendingEdits(prev => ({ ...prev, [student.id]: { ...prev[student.id], programType: e.target.value } }));
                                  }}
                                  value={pendingEdits[student.id]?.programType || student.programType || ""}
                                >
                                  <option value="" disabled>Select Program</option>
                                  <option value="diploma">Diploma</option>
                                  <option value="bachelor">Bachelor</option>
                                  <option value="master">Master</option>
                                  <option value="doctorate">Doctorate</option>
                                </select>
                                {student.profileCompleted ? (
                                  <button 
                                    onClick={() => handleApprove(student.id)}
                                    className="bg-yellow-600 text-white text-xs px-3 py-1.5 rounded hover:bg-yellow-700 transition-colors"
                                  >
                                    {student.isApproved ? 'Generate Reg Number' : 'Approve & Generate Reg'}
                                  </button>
                                ) : (
                                  <button 
                                    disabled
                                    className="bg-slate-300 text-slate-500 text-xs px-3 py-1.5 rounded cursor-not-allowed"
                                    title="Student must complete their profile first"
                                  >
                                    Profile Incomplete
                                  </button>
                                )}
                                {!student.documentsUploaded && student.profileCompleted && (
                                  <p className="text-[10px] text-orange-600 font-medium mt-1">⚠️ Missing Documents</p>
                                )}
                              </>
                            )}
                            {(student.isApproved && student.registrationNumber) && (
                              <>
                                <button 
                                  onClick={() => handleResendAdmissionEmail(student)}
                                  className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
                                >
                                  Resend Admission Email
                                </button>
                                <button 
                                  onClick={() => setIssueCertificateModal(student.id)}
                                  className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded hover:bg-slate-800 transition-colors"
                                >
                                  Issue Certificate
                                </button>
                                {student.role !== 'admin' && (
                                  <>
                                    <button 
                                      onClick={() => handleMakeAdmin(student.id)}
                                      className="bg-red-600 text-white text-xs px-3 py-1.5 rounded hover:bg-red-700 transition-colors"
                                    >
                                      Make Admin
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                            {student.role !== 'admin' && (
                              <button 
                                onClick={() => {
                                  setConfirmAction({
                                    message: `Are you sure you want to delete ${student.displayName || 'this student'}? This will permanently remove their account and all associated data.`,
                                    onConfirm: async () => {
                                      setConfirmAction(null);
                                      const { error } = await supabase.from('users').delete().eq('id', student.id);
                                      if (error) {
                                        showToast(`Error deleting student: ${error.message}`, "error");
                                      } else {
                                        const { data: newStudents } = await supabase.rpc('admin_get_all_users');
                                        if (newStudents) setStudents(newStudents);
                                        showToast("Student/User deleted successfully");
                                      }
                                    }
                                  });
                                }}
                                className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 transition-colors mt-2"
                              >
                                Delete Student/User
                              </button>
                            )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            )}

            {activeTab === 'departments' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Departments</h2>
                
                <form onSubmit={handleAddDepartment} className="mb-8 flex gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex-grow">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                    <input 
                      type="text" 
                      value={newDepartment.name}
                      onChange={e => setNewDepartment({...newDepartment, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                      placeholder="e.g. Theology"
                      required
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Code</label>
                    <input 
                      type="text" 
                      value={newDepartment.code}
                      onChange={e => setNewDepartment({...newDepartment, code: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                      placeholder="e.g. TH"
                      required
                    />
                  </div>
                  <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors">
                    Add
                  </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departments.map((dept, idx) => (
                    <div 
                      key={dept.id} 
                      className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex items-center justify-between"
                    >
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 w-5 h-5 flex items-center justify-center bg-white border border-slate-200 rounded-full">{idx + 1}</span>
                            <span className="font-bold text-slate-900">{dept.name}</span>
                          </div>
                          <span className="bg-white text-slate-600 text-xs font-bold px-2 py-1 rounded uppercase border border-slate-200">{dept.code}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-500">PROGRAM DURATION (YEARS):</label>
                          <input 
                            type="number"
                            min="1"
                            max="10"
                            placeholder="e.g. 4"
                            className="px-2 py-1 border border-slate-200 rounded outline-none w-20 text-sm focus:border-yellow-600"
                            value={departmentDurations[dept.code] || ''}
                            onChange={(e) => setDepartmentDurations(prev => ({...prev, [dept.code]: parseInt(e.target.value) || ''}))}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {departments.length > 0 && (
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={handleSaveDurations}
                      className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                    >
                      Save Class Durations
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Courses</h2>
                
                {departments.length === 0 ? (
                  <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-100">
                    You need to add a Department first before you can add courses.
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleAddCourse} className="mb-8 flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="w-full md:w-48">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                        <select 
                          value={selectedDeptForCourses || ''}
                          onChange={e => {
                            setSelectedDeptForCourses(e.target.value);
                            fetchDeptCourses(e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                          required
                        >
                          <option value="" disabled>Select Dept</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="flex-grow w-full">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Course Name</label>
                        <input 
                          type="text" 
                          value={newCourse.course_name}
                          onChange={e => setNewCourse({...newCourse, course_name: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                          placeholder="e.g. Introduction to Theology"
                          required
                        />
                      </div>
                      <div className="w-full md:w-48">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Level</label>
                        <select 
                          value={newCourse.level}
                          onChange={e => setNewCourse({...newCourse, level: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                        >
                          <option value="100">100</option>
                          <option value="200">200</option>
                          <option value="300">300</option>
                          <option value="400">400</option>
                          <option value="500">500</option>
                          <option value="600">600</option>
                        </select>
                      </div>
                      <button type="submit" className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors w-full md:w-auto">
                        Add
                      </button>
                    </form>

                    {selectedDeptForCourses ? (
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                          Courses in {departments.find(d => d.id === selectedDeptForCourses)?.name}
                        </h3>
                        {deptCourses.length > 0 ? deptCourses.map((course, idx) => (
                          <div key={course.id} className="p-3 border border-slate-100 rounded-lg flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-slate-400">{idx + 1}.</span>
                              <span className="font-medium text-slate-900">{course.course_name}</span>
                            </div>
                            <span className="text-xs text-slate-500 uppercase tracking-wider">{course.level}</span>
                          </div>
                        )) : (
                          <p className="text-slate-500 text-sm italic">No courses added yet for this department.</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                        Select a department above to view and add courses.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'live' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Live Classes</h2>
                
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8">
                  <h3 className="font-bold text-slate-900 mb-2">Launch a Live Class</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Start a live video session for your students. Students automatically join a room based on their Level (e.g., <code>wgts-100-class</code>).
                  </p>
                  
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-grow w-full">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Class Session Name (e.g. Diploma-Class)</label>
                      <input 
                        type="text" 
                        id="liveClassNameInput"
                        placeholder="Type class name here..." 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                        defaultValue="General-Class"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const name = (document.getElementById('liveClassNameInput') as HTMLInputElement)?.value || 'General-Class';
                        navigate(`/class/${encodeURIComponent(name)}`);
                      }}
                      className="bg-yellow-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-yellow-700 transition-colors w-full md:w-auto flex items-center justify-center gap-2 shadow-md shadow-yellow-600/20"
                    >
                      <Video size={18} /> Start Class
                    </button>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">Quick Launch Templates</h4>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => navigate('/class/wgts-thl-diploma-class')}
                        className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50 transition-colors inline-block"
                      >
                        Theology Diploma
                      </button>
                      <button 
                        onClick={() => navigate('/class/wgts-thl-bachelor-class')}
                        className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50 transition-colors inline-block"
                      >
                        Theology Bachelor
                      </button>
                      <button 
                        onClick={() => navigate('/class/wgts-min-master-class')}
                        className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50 transition-colors inline-block"
                      >
                        Ministry Master
                      </button>
                      <button 
                        onClick={() => window.open('/class/wgts-chp-doctor-class', '_blank')}
                        className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50 transition-colors inline-block"
                      >
                        Chaplaincy Doctor
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                  <div className="mt-0.5 text-blue-600">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900">How it works</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      When you start a class, it opens a secure video conferencing room in a new tab. 
                      Students can join this room from their Student Dashboard by clicking the "Join Live Class" button.
                      Make sure to tell your students which class session name to join if you use a custom name.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Gallery & Media</h2>
                
                <div className="space-y-8">
                  <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                    <h3 className="font-bold text-slate-900 mb-4">Live Stream Configuration</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Add a YouTube or Vimeo link to embed a live stream on the Gallery page.
                    </p>
                    <div className="flex gap-2">
                      <input 
                        type="url" 
                        placeholder="e.g. https://www.youtube.com/watch?v=..." 
                        className="flex-grow px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                        value={settings.liveStreamUrl}
                        onChange={(e) => setSettings(prev => ({ ...prev, liveStreamUrl: e.target.value }))}
                      />
                      <button 
                        onClick={(e) => handleUrlSave(e, 'liveStream', settings.liveStreamUrl)}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                      >
                        Save URL
                      </button>
                    </div>
                  </div>

                  <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                    <h3 className="font-bold text-slate-900 mb-4">Add Graduation Video (YouTube/Vimeo)</h3>
                    <p className="text-sm text-slate-600 mb-4">For long videos (like a 15-minute montage), upload them to YouTube or Vimeo first, then paste the link here.</p>
                    <form onSubmit={handleAddVideo} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Graduation Year</label>
                          <input 
                            type="number" 
                            required
                            min="2000"
                            max="2100"
                            value={newVideo.year}
                            onChange={(e) => setNewVideo({...newVideo, year: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Video Title</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Class of 2024 Montage"
                            value={newVideo.title}
                            onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Video Link (URL)</label>
                          <input 
                            type="url" 
                            required
                            placeholder="https://youtube.com/watch?v=..."
                            value={newVideo.videoUrl}
                            onChange={(e) => setNewVideo({...newVideo, videoUrl: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                          />
                        </div>
                      </div>
                      <button type="submit" className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors">
                        Add Video
                      </button>
                    </form>
                  </div>

                  <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                    <h3 className="font-bold text-slate-900 mb-4">Upload Graduation Pictures</h3>
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center bg-blue-50 border border-blue-100 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800">
                          <ShieldCheck size={16} />
                          <p className="text-xs font-bold">Storage Status: Bucket 'image' {import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') ? 'is NOT configured' : 'is configured'}</p>
                        </div>
                        <p className="text-[10px] text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-100 italic">Fallback: Base64 enabled</p>
                      </div>

                      <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const year = (form.elements.namedItem('year') as HTMLInputElement).value;
                      const caption = (form.elements.namedItem('caption') as HTMLInputElement).value;
                      const fileInput = form.elements.namedItem('images') as HTMLInputElement;
                      const files = fileInput.files;
                      
                      if (!files || files.length === 0 || !year) return;
                      
                      const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                      const originalText = submitBtn.innerText;
                      submitBtn.innerText = `Uploading 0/${files.length}...`;
                      submitBtn.disabled = true;
                      
                      try {
                        let successCount = 0;
                        const fallbackToBase64 = async (f: File) => {
                          return new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(f);
                          });
                        };

                        for (let i = 0; i < files.length; i++) {
                          const file = files[i];
                          if (file.size > 10 * 1024 * 1024) {
                            showToast(`File ${file.name} is too large (>10MB). Skipping.`, "error");
                            continue;
                          }
                          const processedFile = await compressImage(file);
                          let finalUrl = '';

                          if (false) { // Skip supabase
                             // This won't run, left structurally same
                          }
                          try {
                            const formData = new FormData();
                            formData.append("file", processedFile);
                            formData.append("folder", `gallery/${year}`);
                            const res = await fetch("/api/upload", { method: "POST", body: formData });
                            const data = await res.json();
                            if (data.url) {
                              finalUrl = data.url;
                            } else {
                              throw new Error(data.error || "Upload failed");
                            }
                          } catch (err) {
                            console.warn("Cloudinary upload failed, attempting Base64 fallback...", err);
                            finalUrl = await fallbackToBase64(processedFile);
                          }

                          if (!finalUrl) throw new Error("Failed to generate file URL.");
                          
                          const { error: insertError } = await supabase.from('gallery').insert({
                            year,
                            caption,
                            image_url: finalUrl,
                            created_at: new Date().toISOString()
                          });
                          
                          if (insertError) {
                            console.error("Database Insert Error:", insertError);
                            throw new Error(`Database error: ${insertError.message}`);
                          }
                          
                          successCount++;
                          submitBtn.innerText = `Saving ${successCount}/${files.length} to DB...`;
                        }
                        
                        fetchGallery();
                        showToast(`Successfully uploaded ${successCount} images!`);
                        form.reset();
                      } catch (error: any) {
                        console.error('Full upload error context:', error);
                        showToast(`Upload error: ${error.message || 'Unknown error'}. Check console for details.`);
                      } finally {
                        submitBtn.innerText = originalText;
                        submitBtn.disabled = false;
                      }
                    }} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Graduation Year</label>
                          <input 
                            type="number" 
                            name="year"
                            required
                            min="2000"
                            max="2100"
                            defaultValue={new Date().getFullYear()}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Caption (Optional, applies to all)</label>
                          <input 
                            type="text" 
                            name="caption"
                            placeholder="e.g. Class of 2024"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Image Files (Select multiple)</label>
                          <input 
                            type="file" 
                            name="images"
                            accept="image/*"
                            multiple
                            required
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none bg-white"
                          />
                        </div>
                      </div>
                      <button type="submit" className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Upload Images
                      </button>
                    </form>

                    <div className="mt-12 p-6 border-2 border-dashed border-yellow-200 rounded-xl bg-yellow-50/30">
                      <div className="flex items-center gap-2 mb-4">
                        <Globe className="text-yellow-600" size={20} />
                        <h3 className="font-bold text-slate-900">Bulk External Images (Free Storage)</h3>
                      </div>
                      <p className="text-sm text-slate-600 mb-6">
                        Use this to save space! Upload your photos to <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-yellow-600 underline font-bold">ImgBB</a> or <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer" className="text-yellow-600 underline font-bold">Cloudinary</a>, then paste the <strong>Direct Image Links</strong> here (one per line).
                      </p>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Graduation Year</label>
                            <input 
                              type="number" 
                              id="bulkYear"
                              min="2000"
                              max="2100"
                              defaultValue={new Date().getFullYear()}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Album Caption (Optional)</label>
                            <input 
                              type="text" 
                              id="bulkCaption"
                              placeholder="e.g. Graduation Ceremony 2024"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none bg-white"
                            />
                          </div>
                        </div>
                        <textarea 
                          id="bulkLinks"
                          rows={6}
                          placeholder="https://i.ibb.co/image1.jpg&#10;https://i.ibb.co/image2.jpg"
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none font-mono bg-white"
                        />
                        <button 
                          onClick={handleBulkExternalUpload}
                          className="w-full md:w-auto bg-slate-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                        >
                          Process & Add to Album
                        </button>
                      </div>
                    </div>
                  </div>

                    <div className="mt-12 pt-12 border-t border-slate-200">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 leading-tight">Graduation Media Manager</h3>
                          <p className="text-xs text-slate-500">View and manage uploaded images and videos</p>
                        </div>
                        <button 
                          onClick={fetchGallery}
                          className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          Refresh Gallery
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Current Images */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <ImageIcon size={16} className="text-yellow-600" />
                            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Pictures ({galleryImages.length})</h4>
                          </div>
                          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {Object.entries(
                              galleryImages.reduce((acc: any, img) => {
                                const y = img.year || 'Unknown';
                                if (!acc[y]) acc[y] = [];
                                acc[y].push(img);
                                return acc;
                              }, {})
                            ).sort((a: any, b: any) => b[0].localeCompare(a[0])).map(([year, images]: [string, any]) => (
                              <div key={year} className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Class of {year}</h5>
                                <div className="space-y-2">
                                  {images.map((img: any) => (
                                    <div key={img.id} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                      <img src={formatImageUrl(img.image_url || img.imageUrl)} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                                      <div className="flex-grow min-w-0">
                                        <p className="text-[11px] font-bold text-slate-800 truncate">{img.caption || `Image`}</p>
                                      </div>
                                      <button 
                                        onClick={async () => {
                                          const { error } = await supabase.from('gallery').delete().eq('id', img.id);
                                          if (!error) {
                                            showToast("Image deleted");
                                            fetchGallery();
                                          } else {
                                            showToast("Failed to delete image", "error");
                                          }
                                        }}
                                        className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            {galleryImages.length === 0 && (
                              <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-slate-300">
                                <ImageIcon size={32} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-xs text-slate-400 font-medium">No pictures uploaded yet.</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Current Videos */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Video size={16} className="text-yellow-600" />
                            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Videos ({galleryVideos.length})</h4>
                          </div>
                          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {Object.entries(
                              galleryVideos.reduce((acc: any, vid) => {
                                const y = vid.year || 'Unknown';
                                if (!acc[y]) acc[y] = [];
                                acc[y].push(vid);
                                return acc;
                              }, {})
                            ).sort((a: any, b: any) => b[0].localeCompare(a[0])).map(([year, videos]: [string, any]) => (
                              <div key={year} className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Class of {year}</h5>
                                <div className="space-y-2">
                                  {videos.map((vid: any) => (
                                    <div key={vid.id} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                      <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
                                        <Video size={14} />
                                      </div>
                                      <div className="flex-grow min-w-0">
                                        <p className="text-[11px] font-bold text-slate-800 truncate">{vid.title}</p>
                                      </div>
                                      <button 
                                        onClick={async () => {
                                          const { error } = await supabase.from('gallery_videos').delete().eq('id', vid.id);
                                          if (!error) {
                                            showToast("Video deleted");
                                            fetchGallery();
                                          } else {
                                            showToast("Failed to delete video", "error");
                                          }
                                        }}
                                        className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            {galleryVideos.length === 0 && (
                              <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-slate-300">
                                <Video size={32} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-xs text-slate-400 font-medium">No videos added yet.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-6">
                {/* Send Bulk Announcement Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Megaphone size={20} className="text-yellow-600" />
                    Send Bulk Announcement
                  </h2>
                  <p className="text-sm text-slate-500 mb-6 italic">Send an email notification to all registered students, teachers, or everyone.</p>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Audience</label>
                        <select 
                          value={bulkEmailMessage.target}
                          onChange={(e) => setBulkEmailMessage(prev => ({ ...prev, target: e.target.value as any }))}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-yellow-600"
                        >
                          <option value="all">Everyone (Students & Teachers)</option>
                          <option value="students">Students Only</option>
                          <option value="teachers">Teachers Only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Subject</label>
                        <input 
                          type="text" 
                          placeholder="Announcing New Semester Courses..."
                          value={bulkEmailMessage.subject}
                          onChange={(e) => setBulkEmailMessage(prev => ({ ...prev, subject: e.target.value }))}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Message Body</label>
                      <textarea 
                        rows={4}
                        placeholder="Type your message here..."
                        value={bulkEmailMessage.body}
                        onChange={(e) => setBulkEmailMessage(prev => ({ ...prev, body: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-600 min-h-[120px]"
                      ></textarea>
                    </div>
                    <div className="flex justify-end">
                      <button 
                        disabled={isSendingBulk || !bulkEmailMessage.subject || !bulkEmailMessage.body}
                        onClick={async () => {
                          setIsSendingBulk(true);
                          try {
                            const recipients: string[] = [];
                            if (bulkEmailMessage.target === 'all' || bulkEmailMessage.target === 'students') {
                              students.forEach(s => { if (s.email) recipients.push(s.email); });
                            }
                            if (bulkEmailMessage.target === 'all' || bulkEmailMessage.target === 'teachers') {
                              teachers.forEach(t => { if (t.email) recipients.push(t.email); });
                            }

                            if (recipients.length === 0) {
                              showToast("No recipients found for the selected target.", "error");
                              return;
                            }

                            const response = await fetch('/api/send-bulk-email', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                emails: recipients,
                                subject: bulkEmailMessage.subject,
                                body: bulkEmailMessage.body
                              })
                            });

                            const result = await response.json();
                            if (result.success) {
                              showToast(result.message, "success");
                              setBulkEmailMessage({ subject: '', body: '', target: 'all' });
                            } else {
                              showToast(result.error || "Failed to send announcements", "error");
                            }
                          } catch (err: any) {
                            showToast(err.message, "error");
                          } finally {
                            setIsSendingBulk(false);
                          }
                        }}
                        className={`bg-yellow-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-700 transition-all shadow-md ${isSendingBulk ? 'opacity-50' : ''}`}
                      >
                        {isSendingBulk ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            Send Announcement
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Contact Messages</h2>
                  {messages.length > 0 && (
                    <button 
                      onClick={() => {
                        setConfirmAction({
                          message: "Are you sure you want to delete ALL messages? This cannot be undone.",
                          onConfirm: async () => {
                            setConfirmAction(null);
                            const { error } = await supabase.from('mail').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                            if (error) {
                              showToast("Failed to clear messages", "error");
                            } else {
                              setMessages([]);
                              showToast("All messages cleared!");
                            }
                          }
                        });
                      }}
                      className="text-xs bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-bold uppercase tracking-wider"
                    >
                      Clear All Messages
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {messages.length > 0 ? messages.map(msg => (
                    <div key={msg.id} className={`p-6 rounded-xl border ${msg.status === 'pending' ? 'bg-yellow-50 border-yellow-100' : 'bg-white border-slate-100'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-slate-900">{msg.subject}</h3>
                          <p className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${msg.status === 'pending' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-100 text-green-700'}`}>
                          {msg.status}
                        </span>
                      </div>
                      <div className="bg-white/50 p-4 rounded-lg text-sm text-slate-700 whitespace-pre-wrap mb-4 border border-slate-100">
                        {msg.body}
                      </div>
                      <div className="flex gap-2">
                        {msg.status === 'pending' && (
                          <button 
                            onClick={async () => {
                              await supabase.from('mail').update({ status: 'read' }).eq('id', msg.id);
                              const { data } = await supabase.from('mail').select('*').order('created_at', { ascending: false });
                              if (data) setMessages(data);
                            }}
                            className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded hover:bg-yellow-700 transition-colors"
                          >
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={() => {
                            // Robust email extraction - find any valid email in the body
                            const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
                            const emailMatch = msg.body.match(emailPattern);
                            const email = emailMatch ? emailMatch[1] : '';
                            if (email) {
                              window.location.href = `mailto:${email}?subject=Re: ${encodeURIComponent(msg.subject)}`;
                            } else {
                              showToast("Could not find a valid email address in the message text.", "error");
                            }
                          }}
                          className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
                        >
                          <Mail size={12} /> Reply
                        </button>
                        <button 
                          onClick={() => {
                            setConfirmAction({
                              message: "Are you sure you want to delete this message?",
                              onConfirm: async () => {
                                setConfirmAction(null);
                                await supabase.from('mail').delete().eq('id', msg.id);
                                const { data } = await supabase.from('mail').select('*').order('created_at', { ascending: false });
                                if (data) setMessages(data);
                                showToast("Message deleted");
                              }
                            });
                          }}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
                      No messages found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

            {activeTab === 'blog' && (
              <AdminBlog showToast={showToast} />
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h2 className="text-xl md:text-2xl font-display font-black text-slate-900 tracking-tight">System Settings</h2>
                    <p className="text-slate-500 text-sm">Configure school identity, admission portal, and external integrations.</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setSettingsTab('identity')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${settingsTab === 'identity' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Identity & Admission
                    </button>
                    <button 
                      onClick={() => setSettingsTab('integrations')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${settingsTab === 'integrations' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Integrations & API Keys
                    </button>
                  </div>
                </div>
                
                <div className="space-y-8">
                  {settingsTab === 'identity' ? (
                    <div className="space-y-8">
                      {/* Portal Status Section */}
                      <div className="p-6 border-2 border-yellow-100 rounded-xl bg-yellow-50/50">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${settings.isAdmissionOpen ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              <div className={`w-3 h-3 rounded-full ${settings.isAdmissionOpen ? 'bg-green-600' : 'bg-red-600'} animate-pulse`} />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">Admission Portal Control</h3>
                              <p className="text-sm text-slate-500">Currently: <span className={`font-bold ${settings.isAdmissionOpen ? 'text-green-600' : 'text-red-600'}`}>{settings.isAdmissionOpen ? 'OPEN' : 'CLOSED'}</span></p>
                            </div>
                          </div>
                          <button 
                            onClick={async () => {
                              const newStatus = !settings.isAdmissionOpen;
                              try {
                                const { error } = await supabase.from('settings')
                                  .update({ is_admission_open: newStatus })
                                  .eq('id', 'global');
                                  
                                if (error) {
                                  await supabase.from('settings').upsert({ id: 'global', is_admission_open: newStatus });
                                }
                                
                                setSettings(prev => ({ ...prev, isAdmissionOpen: newStatus }));
                                await refreshSettings();
                                showToast(newStatus ? "Admission Portal Opened" : "Admission Portal Closed", "success");
                              } catch (error) {
                                showToast("Failed to update status", "error");
                              }
                            }}
                            className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${settings.isAdmissionOpen ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
                          >
                            {settings.isAdmissionOpen ? 'Close Portal Immediately' : 'Open Admission Portal'}
                          </button>
                        </div>
                      </div>

                      <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                        <h3 className="font-bold text-slate-900 mb-4">Seminary Name</h3>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="e.g. Winning Gate Christian Theological Seminary" 
                            className="flex-grow px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                            value={settings.schoolName}
                            onChange={(e) => setSettings(prev => ({ ...prev, schoolName: e.target.value }))}
                          />
                          <button 
                            onClick={async (e) => {
                              const btn = e.currentTarget;
                              const originalText = btn.innerText;
                              btn.innerText = 'Saving...';
                              btn.disabled = true;
                              try {
                                const { data: currentGlobal } = await supabase.from('settings').select('value').eq('id', 'global').maybeSingle();
                                const v = { ...(currentGlobal?.value || {}) };
                                v.school_name = settings.schoolName;
                                
                                const { error } = await supabase.from('settings').upsert({
                                  id: 'global',
                                  schoolName: settings.schoolName,
                                  school_name: settings.schoolName,
                                  value: v
                                });
                                if (error) {
                                  // Fallback
                                  await supabase.from('settings').update({ value: v }).eq('id', 'global');
                                }
                                await refreshSettings();
                                showToast("School name updated!");
                                btn.innerText = 'Saved!';
                              } catch (err: any) {
                                showToast(`Error: ${err.message}`, "error");
                              } finally {
                                setTimeout(() => {
                                  btn.innerText = originalText;
                                  btn.disabled = false;
                                }, 3000);
                              }
                            }}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                          >
                            Save Name
                          </button>
                        </div>
                      </div>

                      <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                        <h3 className="font-bold text-slate-900 mb-4">Seminary Logo</h3>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                          <div className="w-24 h-24 shrink-0 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {settings.logoUrl ? (
                          <img 
                            src={formatImageUrl(settings.logoUrl)} 
                            alt="Logo" 
                            className="w-full h-full object-contain p-2" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">No Logo</span>
                        )}
                      </div>
                      <div className="flex-grow w-full space-y-3">
                        <label className={`cursor-pointer inline-flex bg-white border border-slate-200 hover:border-yellow-600 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors items-center gap-2 ${uploadingType === 'logo' ? 'opacity-50 cursor-wait' : ''}`}>
                          <Upload size={16} /> {uploadingType === 'logo' ? 'Uploading...' : 'Upload New Logo'}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} disabled={uploadingType === 'logo'} />
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text" 
                            placeholder="Or paste an image URL here..." 
                            className="flex-grow min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                            value={settings.logoUrl}
                            onChange={(e) => setSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                          />
                          <button 
                            onClick={(e) => handleUrlSave(e, 'logo', settings.logoUrl)}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
                          >
                            Save URL
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                    <h3 className="font-bold text-slate-900 mb-4">Rector Image</h3>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                      <div className="w-24 h-24 shrink-0 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {settings.rectorImageUrl ? (
                          <img 
                            src={formatImageUrl(settings.rectorImageUrl)} 
                            alt="Rector" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">No Image</span>
                        )}
                      </div>
                      <div className="flex-grow w-full space-y-3">
                        <label className={`cursor-pointer inline-flex bg-white border border-slate-200 hover:border-yellow-600 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors items-center gap-2 ${uploadingType === 'rectorImage' ? 'opacity-50 cursor-wait' : ''}`}>
                          <Upload size={16} /> {uploadingType === 'rectorImage' ? 'Uploading...' : 'Upload Rector Image'}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'rectorImage')} disabled={uploadingType === 'rectorImage'} />
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text" 
                            placeholder="Or paste an image URL here..." 
                            className="flex-grow min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                            value={settings.rectorImageUrl}
                            onChange={(e) => setSettings(prev => ({ ...prev, rectorImageUrl: e.target.value }))}
                          />
                          <button 
                            onClick={(e) => handleUrlSave(e, 'rectorImage', settings.rectorImageUrl)}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
                          >
                            Save URL
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                    <h3 className="font-bold text-slate-900 mb-4">About Us Campus Image</h3>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                      <div className="w-24 h-24 shrink-0 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {settings.aboutImageUrl ? (
                          <img 
                            src={formatImageUrl(settings.aboutImageUrl)} 
                            alt="Campus" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xs text-slate-400 text-center px-2">No Image<br/><span className="text-[10px]">Using Default</span></span>
                        )}
                      </div>
                      <div className="flex-grow w-full space-y-3">
                        <label className={`cursor-pointer inline-flex bg-white border border-slate-200 hover:border-yellow-600 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors items-center gap-2 ${uploadingType === 'aboutImage' ? 'opacity-50 cursor-wait' : ''}`}>
                          <Upload size={16} /> {uploadingType === 'aboutImage' ? 'Uploading...' : 'Upload About Image'}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'aboutImage')} disabled={uploadingType === 'aboutImage'} />
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text" 
                            placeholder="Or paste an image URL here..." 
                            className="flex-grow min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                            value={settings.aboutImageUrl || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, aboutImageUrl: e.target.value }))}
                          />
                          <button 
                            onClick={(e) => handleUrlSave(e, 'aboutImage', settings.aboutImageUrl || '')}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
                          >
                            Save URL
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-900">Admission Advert Flyers (Slideshow)</h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{settings.heroBanners?.length || 0}/4 Slots Used</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-6 italic">Upload up to 4 advert flyer images to be displayed as a cinematic slideshow in the admission advert section.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {[0, 1, 2, 3].map((idx) => (
                        <div key={idx} className="relative group">
                          <div className="aspect-[3/4] w-full bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                            {settings.heroBanners?.[idx] ? (
                              <>
                                <img 
                                  src={formatImageUrl(settings.heroBanners[idx])} 
                                  alt={`Banner ${idx + 1}`} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <button 
                                  onClick={() => removeBanner(idx)}
                                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                  title="Remove Banner"
                                >
                                  <X size={14} />
                                </button>
                                <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 backdrop-blur-sm p-1.5 text-[8px] font-bold text-white text-center">
                                  SLOT {idx + 1}
                                </div>
                              </>
                            ) : (
                              <div className="text-center p-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <ImageIcon size={18} className="text-slate-400" />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400">EMPTY SLOT {idx + 1}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col items-center gap-4 mt-6">
                      <label className={`cursor-pointer inline-flex bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all items-center gap-3 shadow-lg shadow-slate-900/20 ${uploadingType === 'heroBanners' ? 'opacity-50 cursor-wait' : ''}`}>
                        <Upload size={20} /> {uploadingType === 'heroBanners' ? 'Uploading Banners...' : 'Upload New Banners'}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          multiple 
                          onChange={handleBannersUpload} 
                          disabled={uploadingType === 'heroBanners' || (settings.heroBanners?.length || 0) >= 4} 
                        />
                      </label>
                      <div className="flex w-full max-w-md items-center gap-2">
                        <input 
                          type="text" 
                          placeholder="Or paste an image URL here..." 
                          className="flex-grow min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={newBannerUrl}
                          onChange={(e) => setNewBannerUrl(e.target.value)}
                          disabled={(settings.heroBanners?.length || 0) >= 4}
                        />
                        <button 
                          onClick={handleAddBannerUrl}
                          disabled={(settings.heroBanners?.length || 0) >= 4 || !newBannerUrl.trim()}
                          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                    <h3 className="font-bold text-slate-900 mb-4">Hero Background Image (Fallback)</h3>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                      <div className="w-48 h-24 shrink-0 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {settings.heroBgUrl ? (
                          <img 
                            src={formatImageUrl(settings.heroBgUrl)} 
                            alt="Hero Background" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">No Image</span>
                        )}
                      </div>
                      <div className="flex-grow w-full space-y-3">
                        <label className={`cursor-pointer inline-flex bg-white border border-slate-200 hover:border-yellow-600 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors items-center gap-2 ${uploadingType === 'heroBg' ? 'opacity-50 cursor-wait' : ''}`}>
                          <Upload size={16} /> {uploadingType === 'heroBg' ? 'Uploading...' : 'Upload Hero Image'}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'heroBg')} disabled={uploadingType === 'heroBg'} />
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text" 
                            placeholder="Or paste an image URL here..." 
                            className="flex-grow min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                            value={settings.heroBgUrl}
                            onChange={(e) => setSettings(prev => ({ ...prev, heroBgUrl: e.target.value }))}
                          />
                          <button 
                            onClick={(e) => handleUrlSave(e, 'heroBg', settings.heroBgUrl)}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
                          >
                            Save URL
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                    <h3 className="font-bold text-slate-900 mb-4">School Anthem (Audio)</h3>
                    <p className="text-xs text-slate-500 mb-4 italic">Add music to entertain visitors on the home page.</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Anthem Title</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="e.g. Winning Gate School Anthem" 
                            className="flex-grow px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                            value={settings.anthemTitle}
                            onChange={(e) => setSettings(prev => ({ ...prev, anthemTitle: e.target.value }))}
                          />
                          <button 
                            onClick={async () => {
                              try {
                                const { error } = await supabase.from('settings').upsert({ id: 'anthem', value: JSON.stringify({ url: settings.anthemUrl, title: settings.anthemTitle }) });
                                if (error) throw error;
                                
                                // Also update global row
                                await supabase.from('settings').update({
                                  anthem_title: settings.anthemTitle
                                }).eq('id', 'global');
                                
                                await refreshSettings();
                                showToast("Anthem title saved!");
                              } catch (e: any) {
                                showToast(`Save failed: ${e.message}`, "error");
                              }
                            }}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                          >
                            Save Title
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="w-48 h-12 shrink-0 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden p-2">
                          {settings.anthemUrl ? (
                            <audio controls className="h-full w-full">
                              <source src={settings.anthemUrl} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          ) : (
                            <span className="text-[10px] text-slate-400">No Audio File</span>
                          )}
                        </div>
                        <div className="flex-grow w-full space-y-3">
                          <label className={`cursor-pointer inline-flex bg-white border border-slate-200 hover:border-yellow-600 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors items-center gap-2 ${uploadingType === 'anthem' ? 'opacity-50 cursor-wait' : ''}`}>
                            <Upload size={16} /> {uploadingType === 'anthem' ? 'Uploading...' : 'Upload Anthem MP3'}
                            <input type="file" className="hidden" accept="audio/*" onChange={(e) => handleImageUpload(e, 'anthem')} disabled={uploadingType === 'anthem'} />
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                              type="text" 
                              placeholder="Or paste an audio URL here..." 
                              className="flex-grow min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                              value={settings.anthemUrl}
                              onChange={(e) => setSettings(prev => ({ ...prev, anthemUrl: e.target.value }))}
                            />
                            <button 
                              onClick={(e) => handleUrlSave(e, 'anthem', settings.anthemUrl)}
                              className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                              Save URL
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                    <h3 className="font-bold text-slate-900 mb-4">Important Dates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Application Opens</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.importantDates?.applicationOpens || ''}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            importantDates: { ...prev.importantDates, applicationOpens: e.target.value } 
                          }))}
                          placeholder="e.g. Aug 15"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.importantDates?.applicationDeadline || ''}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            importantDates: { ...prev.importantDates, applicationDeadline: e.target.value } 
                          }))}
                          placeholder="e.g. Oct 30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Orientation Begins</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.importantDates?.orientationBegins || ''}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            importantDates: { ...prev.importantDates, orientationBegins: e.target.value } 
                          }))}
                          placeholder="e.g. Nov 15"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button 
                        id="saveDatesBtn"
                        onClick={async () => {
                          const btn = document.getElementById('saveDatesBtn');
                          if (btn) {
                            btn.innerText = 'Saving...';
                            btn.classList.add('opacity-50', 'cursor-not-allowed');
                          }
                          try {
                            const { error } = await supabase.from('settings').update({ important_dates: settings.importantDates }).eq('id', 'global');
                            if (error) await supabase.from('settings').upsert({ id: 'global', important_dates: settings.importantDates });
                            if (btn) {
                              btn.innerText = 'Saved Successfully!';
                              btn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-yellow-600', 'hover:bg-yellow-700');
                              btn.classList.add('bg-green-600', 'hover:bg-green-700');
                              setTimeout(() => {
                                btn.innerText = 'Save Important Dates';
                                btn.classList.remove('bg-green-600', 'hover:bg-green-700');
                                btn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
                              }, 3000);
                            }
                          } catch (error) {
                            console.error("Error saving dates:", error);
                            if (btn) {
                              btn.innerText = 'Failed to Save';
                              btn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-yellow-600', 'hover:bg-yellow-700');
                              btn.classList.add('bg-red-600', 'hover:bg-red-700');
                              setTimeout(() => {
                                btn.innerText = 'Save Important Dates';
                                btn.classList.remove('bg-red-600', 'hover:bg-red-700');
                                btn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
                              }, 3000);
                            }
                          }
                        }}
                        className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors duration-300"
                      >
                        Save Important Dates
                      </button>
                    </div>
                  </div>

                  <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-900">Student Testimonials</h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{settings.testimonials?.length || 0} Added</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-6 italic">Manage student testimonials displayed on the home page. If you leave this empty, the default testimonials will be shown.</p>

                    <div className="space-y-6 mb-8">
                      {settings.testimonials?.map((t, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 relative group" id={`testimonial-${idx}`}>
                          <button 
                            onClick={() => handleRemoveTestimonial(idx)}
                            className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove Testimonial"
                          >
                            <X size={14} />
                          </button>
                          <div className="flex gap-4">
                            <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                              {t.img ? (
                                <img src={formatImageUrl(t.img)} alt="Author" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><UserIcon size={24} className="text-slate-300" /></div>
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <h5 className="font-bold text-slate-900 text-sm truncate">{t.author}</h5>
                              <p className="text-yellow-600 text-[10px] font-bold uppercase tracking-wider mb-2">{t.role}</p>
                              <p className="text-slate-600 text-xs italic line-clamp-2">"{t.quote}"</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-900 mb-4">Add New Testimonial</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 shrink-0 bg-slate-50 border border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden">
                              {newTestimonial.img ? (
                                <img src={formatImageUrl(newTestimonial.img)} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon size={20} className="text-slate-300" />
                              )}
                            </div>
                            <div>
                              <label className={`cursor-pointer inline-flex bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all items-center gap-2 ${uploadingType === 'testimonialImg' ? 'opacity-50 cursor-wait' : ''}`}>
                                <Upload size={14} /> {uploadingType === 'testimonialImg' ? 'Uploading...' : 'Upload Picture'}
                                <input type="file" className="hidden" accept="image/*" onChange={handleTestimonialImgUpload} disabled={uploadingType === 'testimonialImg'} />
                              </label>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Author Name</label>
                            <input 
                              type="text" 
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                              value={newTestimonial.author}
                              onChange={(e) => setNewTestimonial(prev => ({ ...prev, author: e.target.value }))}
                              placeholder="e.g. Pastor John Doe"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role / Class</label>
                            <input 
                              type="text" 
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                              value={newTestimonial.role}
                              onChange={(e) => setNewTestimonial(prev => ({ ...prev, role: e.target.value }))}
                              placeholder="e.g. Alumnus, Class of 2023"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col h-full">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Testimonial Quote</label>
                          <textarea 
                            className="flex-grow w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none resize-none"
                            value={newTestimonial.quote}
                            onChange={(e) => setNewTestimonial(prev => ({ ...prev, quote: e.target.value }))}
                            placeholder="Write the student's impact story here..."
                            rows={5}
                          />
                        </div>
                      </div>
                      <button 
                        onClick={handleAddTestimonial}
                        className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                      >
                        Add Testimonial
                      </button>
                    </div>
                  </div>

                  <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-slate-900">Fee Settings ({settings.fees?.currency || 'NGN'})</h3>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction Currency:</label>
                        <select 
                          className="px-3 py-1 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.fees?.currency || 'NGN'}
                          onChange={(e) => setSettings(prev => ({ ...prev, fees: { ...prev.fees, currency: e.target.value } }))}
                        >
                          <option value="NGN">NGN (Naira)</option>
                          <option value="USD">USD (Dollar)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Registration Fee</label>
                        <input 
                          type="number" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.fees?.registration || 0}
                          onChange={(e) => setSettings(prev => ({ ...prev, fees: { ...prev.fees, registration: Number(e.target.value) } }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Diploma Tuition</label>
                        <input 
                          type="number" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.fees?.tuition?.diploma || 0}
                          onChange={(e) => setSettings(prev => ({ ...prev, fees: { ...prev.fees, tuition: { ...prev.fees.tuition, diploma: Number(e.target.value) } } }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bachelor Tuition</label>
                        <input 
                          type="number" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.fees?.tuition?.bachelor || 0}
                          onChange={(e) => setSettings(prev => ({ ...prev, fees: { ...prev.fees, tuition: { ...prev.fees.tuition, bachelor: Number(e.target.value) } } }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Master Tuition</label>
                        <input 
                          type="number" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.fees?.tuition?.master || 0}
                          onChange={(e) => setSettings(prev => ({ ...prev, fees: { ...prev.fees, tuition: { ...prev.fees.tuition, master: Number(e.target.value) } } }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Doctorate Tuition</label>
                        <input 
                          type="number" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.fees?.tuition?.doctorate || 0}
                          onChange={(e) => setSettings(prev => ({ ...prev, fees: { ...prev.fees, tuition: { ...prev.fees.tuition, doctorate: Number(e.target.value) } } }))}
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button 
                        onClick={handleSaveFees}
                        className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                      >
                        Save Fee Settings
                      </button>
                    </div>
                  </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                        <h3 className="font-bold text-slate-900 mb-4">Integration & Function Keys</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Flutterwave Public Key</label>
                        <input 
                          type="password" 
                          className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.flutterwavePublicKey || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, flutterwavePublicKey: e.target.value }))}
                          placeholder="[Hidden for security - enter new key to replace]"
                        />
                        <p className="text-xs text-slate-500 mt-1">Used for student admission fee payments.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Production Site URL</label>
                        <input 
                          type="text" 
                          className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.siteUrl || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                          placeholder="e.g. https://your-site.com"
                        />
                        <p className="text-xs text-slate-500 mt-1">Used for payment redirects and email links.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cloudinary URL / Connection String</label>
                        <input 
                          type="password" 
                          className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.cloudinaryUrl || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, cloudinaryUrl: e.target.value }))}
                          placeholder="[Hidden for security - enter new url to replace]"
                        />
                        <p className="text-xs text-slate-500 mt-1">Found in your Cloudinary API keys section (e.g. <code>cloudinary://...</code>).</p>
                        <button 
                          onClick={async () => {
                            try {
                              showToast("Testing Cloudinary...", "success");
                              const resp = await fetch('/api/test-cloudinary');
                              const data = await resp.json();
                              if (data.success) {
                                showToast("Cloudinary Connected!", "success");
                                alert(`Cloudinary working perfectly!\nCloud: ${data.cloudName}`);
                              } else {
                                alert(`Cloudinary Test Failed: ${data.error}`);
                              }
                            } catch (e: any) {
                              alert(`Test error: ${e.message}`);
                            }
                          }}
                          className="mt-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                        >
                          <Cloud size={12} /> Test Connection
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 border-t border-slate-200 pt-6">
                      <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Globe size={16} className="text-yellow-600" /> Email (SMTP) Configuration
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Host</label>
                          <input 
                            type="text" 
                            className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                            value={settings.smtpHost || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                            placeholder="e.g. smtp.gmail.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Port</label>
                          <input 
                            type="text" 
                            className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                            value={settings.smtpPort || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                            placeholder="e.g. 587 or 465"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">SMTP User (Email)</label>
                          <input 
                            type="text" 
                            className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                            value={settings.smtpUser || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                            placeholder="your-email@gmail.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Password / App Password</label>
                          <input 
                            type="password" 
                            className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                            value={settings.smtpPass || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, smtpPass: e.target.value }))}
                            placeholder="[Hidden for security]"
                          />
                          <p className="text-xs text-slate-500 mt-1">For Gmail, use a 16-character App Password.</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Sender Name</label>
                          <input 
                            type="text" 
                            className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                            value={settings.smtpSender || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, smtpSender: e.target.value }))}
                            placeholder="e.g. Winning Gate Seminary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">From Email Address</label>
                          <input 
                            type="text" 
                            className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                            value={settings.smtpFrom || ''}
                            onChange={(e) => setSettings(prev => ({ ...prev, smtpFrom: e.target.value }))}
                            placeholder="e.g. info@winninggateseminary.com.ng"
                          />
                        </div>
                      </div>

                      {/* Test Connection UI */}
                      <div className="mt-8 pt-6 border-t border-slate-200">
                        <div className="bg-yellow-50/30 p-4 rounded-lg border border-yellow-100">
                          <h4 className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                             Test SMTP Connection
                          </h4>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                              <input 
                                type="email" 
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-600 bg-white"
                                placeholder="Recipient email address (e.g. your own email)"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                              />
                            </div>
                            <button 
                              onClick={async () => {
                                const btn = document.activeElement as HTMLButtonElement;
                                const originalText = btn.innerText;
                                btn.innerText = 'Testing...';
                                btn.disabled = true;
                                try {
                                  // Refresh from DB first to get latest (if user just saved)
                                  const response = await fetch('/api/test-smtp-verify');
                                  const data = await response.json();
                                  if (data.success) {
                                    alert(`SMTP Verification Success: ${data.message}`);
                                    btn.innerText = 'Verified!';
                                    btn.classList.add('bg-green-600');
                                  } else {
                                    alert(`SMTP Verification Failed: ${data.error}\n\nHint: ${data.hint || ''}`);
                                    btn.innerText = 'Setup Error';
                                    btn.classList.add('bg-red-600');
                                  }
                                } catch(e: any) {
                                  alert(`Error: ${e.message}`);
                                } finally {
                                  setTimeout(() => {
                                    btn.innerText = originalText;
                                    btn.disabled = false;
                                    btn.classList.remove('bg-green-600', 'bg-red-600');
                                  }, 5000);
                                }
                              }}
                              className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                               <ShieldCheck size={16} /> Test Connection
                            </button>
                            <button
                              onClick={handleTestEmail}
                              disabled={isTestingEmail}
                              className={`px-4 py-2 bg-yellow-600 text-white text-sm font-bold rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm ${isTestingEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {isTestingEmail ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Mail size={16} />
                                  Send Test Email
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 italic">
                            Note: If you just updated settings, click <strong>Save Integration Keys</strong> below before testing.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button 
                        id="saveIntegrationSettingsBtn"
                        onClick={async () => {
                          const btn = document.getElementById('saveIntegrationSettingsBtn');
                          if (btn) {
                            btn.innerText = 'Saving...';
                            btn.classList.add('opacity-50', 'cursor-not-allowed');
                          }
                          try {
                            const { data: existingData } = await supabase.from('settings').select('value, flutterwave_public_key').eq('id', 'global').maybeSingle();
                            const newValue = { ...(existingData?.value || {}) };
                            let updatedValue = false;
                            
                            if (settings.flutterwavePublicKey && settings.flutterwavePublicKey.trim() !== '') {
                              newValue.flutterwave_public_key = settings.flutterwavePublicKey;
                              updatedValue = true;
                            }
                            if (settings.siteUrl && settings.siteUrl.trim() !== '') {
                              newValue.site_url = settings.siteUrl;
                              updatedValue = true;
                            }
                            if (settings.cloudinaryUrl && settings.cloudinaryUrl.trim() !== '') {
                              newValue.cloudinary_url = settings.cloudinaryUrl;
                              updatedValue = true;
                            }
                            if (settings.smtpHost && settings.smtpHost.trim() !== '') {
                              newValue.smtp_host = settings.smtpHost;
                              updatedValue = true;
                            }
                            if (settings.smtpPort && settings.smtpPort.trim() !== '') {
                              newValue.smtp_port = settings.smtpPort;
                              updatedValue = true;
                            }
                            if (settings.smtpUser && settings.smtpUser.trim() !== '') {
                              newValue.smtp_user = settings.smtpUser;
                              updatedValue = true;
                            }
                            if (settings.smtpPass && settings.smtpPass.trim() !== '') {
                              newValue.smtp_pass = settings.smtpPass;
                              updatedValue = true;
                            }
                            if (settings.smtpSender && settings.smtpSender.trim() !== '') {
                               newValue.smtp_sender = settings.smtpSender;
                               updatedValue = true;
                            }
                            if (settings.smtpFrom && settings.smtpFrom.trim() !== '') {
                               newValue.smtp_from = settings.smtpFrom;
                               updatedValue = true;
                            }

                            if (updatedValue) {
                              let error;
                              
                              if (existingData) {
                                const res = await supabase.from('settings').update({ value: newValue }).eq('id', 'global');
                                error = res.error;
                              } else {
                                const res = await supabase.from('settings').insert({ id: 'global', value: newValue });
                                error = res.error;
                              }
                              if (error) throw error;
                            }
                            
                            // Clear only sensitive inputs
                            setSettings(prev => ({
                              ...prev,
                              smtpPass: '',
                              cloudinaryUrl: '',
                            }));
                            
                            if (btn) {
                              btn.innerText = 'Saved Successfully!';
                              btn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-yellow-600', 'hover:bg-yellow-700');
                              btn.classList.add('bg-green-600', 'hover:bg-green-700');
                              setTimeout(() => {
                                btn.innerText = 'Save Integration Keys';
                                btn.classList.remove('bg-green-600', 'hover:bg-green-700');
                                btn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
                                // Refetch to hide again
                                refreshSettings();
                              }, 3000);
                            }
                          } catch (error) {
                            console.error("Error saving integration settings:", error);
                            if (btn) {
                              btn.innerText = 'Failed to Save';
                              btn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-yellow-600', 'hover:bg-yellow-700');
                              btn.classList.add('bg-red-600', 'hover:bg-red-700');
                              setTimeout(() => {
                                btn.innerText = 'Save Integration Keys';
                                btn.classList.remove('bg-red-600', 'hover:bg-red-700');
                                btn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
                              }, 3000);
                            }
                          }
                        }}
                        className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors duration-300"
                      >
                        Save Integration Keys
                      </button>
                    </div>
                  </div>

                  <div className="p-6 border border-red-100 rounded-xl bg-red-50/30">
                    <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                      <ShieldCheck size={18} /> Password & Security
                    </h3>
                    <div className="flex flex-col md:flex-row items-end gap-4">
                      <div className="flex-grow space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Change Admin Password</label>
                        <input 
                          type="password" 
                          placeholder="Enter new secure password..." 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-600 outline-none"
                          id="new-admin-password"
                        />
                      </div>
                      <button 
                        onClick={async () => {
                          const passwordInput = document.getElementById('new-admin-password') as HTMLInputElement;
                          const password = passwordInput?.value;
                          if (!password || password.length < 6) return showToast('Password must be at least 6 characters', 'error');
                          const { error } = await supabase.auth.updateUser({ password });
                          if (error) showToast(error.message, 'error');
                          else {
                            showToast('Admin password updated successfully!');
                            if (passwordInput) passwordInput.value = '';
                          }
                        }}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                      >
                        Update Password
                      </button>
                    </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Academic Records</h2>
                
                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Student</label>
                  <select 
                    value={selectedStudentForAcademic || ''}
                    onChange={(e) => setSelectedStudentForAcademic(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                  >
                    <option value="" disabled>-- Select a Student --</option>
                    {students.filter(s => s.isApproved).map(student => (
                      <option key={student.id} value={student.id}>
                        {student.displayName} ({student.registrationNumber || 'No Reg Num'})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStudentForAcademic && (
                  <div className="space-y-8">
                    {/* Add Grade Form */}
                    <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Award size={18} className="text-yellow-600" />
                        Add Course Grade
                      </h3>
                      <form onSubmit={handleAddGrade} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Course Name</label>
                          <input 
                            type="text" 
                            value={newGrade.courseName}
                            onChange={e => setNewGrade({...newGrade, courseName: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Credits</label>
                          <input 
                            type="number" 
                            value={newGrade.credits}
                            onChange={e => setNewGrade({...newGrade, credits: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                            required
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Score (0-100)</label>
                          <input 
                            type="number" 
                            value={newGrade.score}
                            onChange={e => setNewGrade({...newGrade, score: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Grade (A-F)</label>
                          <input 
                            type="text" 
                            value={newGrade.grade}
                            onChange={e => setNewGrade({...newGrade, grade: e.target.value.toUpperCase()})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                            maxLength={2}
                          />
                        </div>
                        <div className="md:col-span-5 flex justify-end mt-2">
                          <button type="submit" className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors">
                            Save Grade
                          </button>
                        </div>
                      </form>

                      {studentGrades.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-bold text-slate-700 mb-2">Current Grades</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-white text-slate-500">
                                <tr>
                                  <th className="px-3 py-2">Course</th>
                                  <th className="px-3 py-2">Credits</th>
                                  <th className="px-3 py-2">Score</th>
                                  <th className="px-3 py-2">Grade</th>
                                </tr>
                              </thead>
                              <tbody>
                                {studentGrades.map(g => (
                                  <tr key={g.id} className="border-t border-slate-200">
                                    <td className="px-3 py-2 font-medium">{g.courseName}</td>
                                    <td className="px-3 py-2">{g.credits}</td>
                                    <td className="px-3 py-2">{g.score || '-'}</td>
                                    <td className="px-3 py-2 font-bold">{g.grade || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add Assignment Form */}
                    <div className="p-6 border border-slate-100 rounded-xl bg-slate-50">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Book size={18} className="text-yellow-600" />
                        Add Assignment Record
                      </h3>
                      <form onSubmit={handleAddAssignment} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Course Name</label>
                          <input 
                            type="text" 
                            value={newAssignment.courseName}
                            onChange={e => setNewAssignment({...newAssignment, courseName: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assignment Name</label>
                          <input 
                            type="text" 
                            value={newAssignment.assignmentName}
                            onChange={e => setNewAssignment({...newAssignment, assignmentName: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                          <select 
                            value={newAssignment.status}
                            onChange={e => setNewAssignment({...newAssignment, status: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="submitted">Submitted</option>
                            <option value="graded">Graded</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Score</label>
                          <input 
                            type="text" 
                            value={newAssignment.score}
                            onChange={e => setNewAssignment({...newAssignment, score: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                            placeholder="e.g. 85/100"
                          />
                        </div>
                        <div className="md:col-span-4 flex justify-end mt-2">
                          <button type="submit" className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors">
                            Save Assignment
                          </button>
                        </div>
                      </form>

                      {studentAssignments.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-bold text-slate-700 mb-2">Current Assignments</h4>
                          <ul className="space-y-2">
                            {studentAssignments.map(a => (
                              <li key={a.id} className="bg-white p-3 border border-slate-200 rounded-lg flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-sm">{a.assignmentName}</p>
                                  <p className="text-xs text-slate-500">{a.courseName}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-bold uppercase px-2 py-1 bg-slate-100 rounded-full">{a.status}</span>
                                  {a.score && <p className="text-sm font-bold mt-1">{a.score}</p>}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Profile Modal */}
      {viewProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setViewProfileModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <ArrowLeft size={24} />
                </button>
                <h3 className="text-xl font-bold text-slate-900">Student Profile Preview</h3>
              </div>
              <button onClick={() => setViewProfileModal(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden">
                  {viewProfileModal.profileImageUrl ? (
                    <img src={viewProfileModal.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Users size={24} />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900">{viewProfileModal.displayName}</h4>
                  <p className="text-sm text-slate-500">{viewProfileModal.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Phone</p>
                  <p className="text-sm font-medium">{viewProfileModal.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Date of Birth</p>
                  <p className="text-sm font-medium">{viewProfileModal.dateOfBirth || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Gender</p>
                  <p className="text-sm font-medium">{viewProfileModal.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Nationality</p>
                  <p className="text-sm font-medium">{viewProfileModal.nationality || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">State of Origin</p>
                  <p className="text-sm font-medium">{viewProfileModal.stateOfOrigin || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Baptism Date</p>
                  <p className="text-sm font-medium">{viewProfileModal.baptismDate || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Learning Mode</p>
                  <p className="text-sm font-medium capitalize">{viewProfileModal.learningMode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Class Language</p>
                  <p className="text-sm font-medium capitalize">{viewProfileModal.classLanguage || 'English'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Profile Status</p>
                  <p className="text-sm font-medium">
                    {viewProfileModal.profileCompleted ? (
                      <span className="text-green-600">Completed</span>
                    ) : (
                      <span className="text-yellow-600">Incomplete</span>
                    )}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Declaration of Faith</p>
                  <p className="text-sm font-medium">{viewProfileModal.declarationOfFaith || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Address</p>
                  <p className="text-sm font-medium">{viewProfileModal.address || 'N/A'}</p>
                </div>
                {viewProfileModal.baptismCertificateUrl && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Baptism Certificate</p>
                    <a href={viewProfileModal.baptismCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-yellow-600 hover:underline flex items-center gap-1">
                      <Download size={14} /> Download Document
                    </a>
                  </div>
                )}
                {viewProfileModal.referenceLetter1Url && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Reference Letter 1</p>
                    <a href={viewProfileModal.referenceLetter1Url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-yellow-600 hover:underline flex items-center gap-1">
                      <Download size={14} /> Download PDF
                    </a>
                  </div>
                )}
                {viewProfileModal.referenceLetter2Url && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Reference Letter 2</p>
                    <a href={viewProfileModal.referenceLetter2Url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-yellow-600 hover:underline flex items-center gap-1">
                      <Download size={14} /> Download PDF
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button 
                onClick={() => setViewProfileModal(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Back
              </button>
            </div>
          </div>
        </div>
      )}

      {issueCertificateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Issue Certificate</h3>
            <p className="text-sm text-slate-600 mb-6">
              Issuing certificate to: <span className="font-bold">{students.find(s => s.id === issueCertificateModal)?.displayName}</span>
            </p>
            
            <form onSubmit={handleIssueCertificate}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Course / Programme Name</label>
                <input 
                  type="text" 
                  value={newCertificate.courseName}
                  onChange={e => setNewCertificate({ ...newCertificate, courseName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                  placeholder="e.g. Bachelor of Divinity"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Upload Certificate File (PDF/Image)</label>
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={e => setNewCertificate({ ...newCertificate, file: e.target.files ? e.target.files[0] : null })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                <select 
                  value={newCertificate.department || ''}
                  onChange={e => setNewCertificate({ ...newCertificate, department: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                  required
                >
                  <option value="" disabled>Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.code}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Certificate Price (NGN)</label>
                <input 
                  type="number" 
                  value={newCertificate.price || ''}
                  onChange={e => setNewCertificate({ ...newCertificate, price: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none"
                  placeholder="e.g. 5000"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIssueCertificateModal(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                >
                  Issue Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Confirm Action</h2>
            <p className="text-slate-600 mb-6">{confirmAction.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAction.onConfirm}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 transition-all duration-300 ${toastMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}
