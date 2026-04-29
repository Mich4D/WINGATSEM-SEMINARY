import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';
import { Users, Book, Settings, FileText, CheckCircle, XCircle, Upload, Download, Video, Image as ImageIcon, ArrowLeft, Award, Mail, X, GraduationCap, Copy, ShieldCheck, CreditCard, Search, DollarSign, ExternalLink, Globe } from 'lucide-react';

import { formatImageUrl } from '../utils/formatImage';
import AdminBlog from '../components/AdminBlog';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { refreshSettings } = useSettings();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  
  const showToast = (text: string, type: 'success' | 'error' = 'success', duration: number = 3000) => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), duration);
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
  const [liveClassDept, setLiveClassDept] = useState('General');
  const [liveClassLevel, setLiveClassLevel] = useState('100');
  const [settings, setSettings] = useState({ 
    logoUrl: '', 
    rectorImageUrl: '', 
    heroBgUrl: '', 
    liveStreamUrl: '',
    anthemUrl: '',
    anthemTitle: 'School Anthem',
    flutterwavePublicKey: '',
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
      const { data } = await supabase.from('settings').select('*').in('id', ['global', 'department_durations']);
      if (data) {
        const globalSettings = data.find(s => s.id === 'global');
        if (globalSettings) {
          setSettings({
            logoUrl: globalSettings.logoUrl || globalSettings.logo_url || '',
            rectorImageUrl: globalSettings.rectorImageUrl || globalSettings.rector_image_url || globalSettings.rectorUrl || '',
            heroBgUrl: globalSettings.heroBgUrl || globalSettings.hero_bg_url || '',
            liveStreamUrl: globalSettings.liveStreamUrl || globalSettings.live_stream_url || '',
            anthemUrl: globalSettings.anthemUrl || globalSettings.anthem_url || '',
            anthemTitle: globalSettings.anthemTitle || globalSettings.anthem_title || 'School Anthem',
            flutterwavePublicKey: globalSettings.flutterwave_public_key || globalSettings.flutterwavePublicKey || '',
            isAdmissionOpen: globalSettings.is_admission_open ?? true,
            importantDates: globalSettings.important_dates || {
              applicationOpens: 'Aug 15',
              applicationDeadline: 'Oct 30',
              orientationBegins: 'Nov 15'
            },
            fees: globalSettings.fees || {
              registration: 10000,
              tuition: {
                diploma: 100000,
                bachelor: 120000,
                master: 150000,
                doctorate: 180000
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
      .catch(err => console.error("SMTP diagnostic failed:", err));

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
      // Generate teacher reg number
      const year = new Date().getFullYear().toString().slice(-2);
      const { data: counterData } = await supabase.from('settings').select('value').eq('id', `teacherCounter_${year}`).single();
      let currentCount = counterData?.value || 0;
      const newCount = currentCount + 1;
      await supabase.from('settings').upsert({ id: `teacherCounter_${year}`, value: newCount });
      
      const paddedCount = newCount.toString().padStart(4, '0');
      const regNumber = `WGTS/TCH/${year}/${paddedCount}`;

      // Extremely robust ID generator
      const teacherId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
        ? crypto.randomUUID() 
        : 'xxxxxxxx-xxxx-4000-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });

      if (!teacherId) throw new Error("Failed to generate a valid teacher ID");

      // Create teacher in users table
      const { error } = await supabase.from('users').insert({
        id: teacherId,
        name: newTeacher.name,
        email: newTeacher.email,
        role: 'teacher',
        registration_number: regNumber,
        department_code: newTeacher.department,
        is_approved: true
      });

      if (error) {
        console.error("Teacher addition error details:", error);
        if (error.message.includes('row-level security') || error.code === '42501') {
          throw new Error('Database security policy (RLS) is blocking the insert. Please run the SQL fix in the Supabase SQL Editor.');
        }
        if (error.message.includes('NOT NULL') || error.message.includes('not-null')) {
          throw new Error(`Database Error: ${error.message}. This usually means a column like "id" is missing a default or is not being correctly passed. Diagnostic: ID=${teacherId}`);
        }
        throw error;
      }

      showToast(`Teacher added! Passkey: ${regNumber}`);
      setNewTeacher({ name: '', email: '', department: '' });
      
      // Refresh teachers
      const { data, error: tErr } = await supabase.rpc('admin_get_all_users');
      const finalData = data || (await supabase.from('users').select('*')).data;
      if (finalData) setTeachers(finalData.filter((u: any) => u.role === 'teacher'));
    } catch (error: any) {
      console.error("Error adding teacher:", error);
      showToast(`Failed to add teacher: ${error.message}`, "error");
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
      const filePath = `${issueCertificateModal}/${Date.now()}_${newCertificate.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('App_files')
        .upload(filePath, newCertificate.file);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl: downloadUrl } } = supabase.storage
        .from('App_files')
        .getPublicUrl(filePath);

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
      await supabase.from('settings').upsert({
        id: 'global',
        fees: settings.fees
      });
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'rectorImage' | 'aboutImage' | 'heroBg' | 'anthem') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingType(type);
    try {
      let finalUrl = '';
      const fallbackToBase64 = async (f: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(f);
        });
      };

      if (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') || !import.meta.env.VITE_SUPABASE_URL) {
        console.warn("Supabase not configured. Falling back to Base64 dataset upload.");
        finalUrl = await fallbackToBase64(file);
      } else {
        const filePath = `${type}_${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('App_files')
          .upload(filePath, file);
          
        if (uploadError) {
          if (uploadError.message === 'Failed to fetch' || uploadError.message.includes('fetch')) {
            console.warn("Network/CORS error on storage. Falling back to Base64.", uploadError);
            finalUrl = await fallbackToBase64(file);
          } else {
            throw uploadError;
          }
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('App_files')
            .getPublicUrl(filePath);
          finalUrl = publicUrl;
        }
      }

      if (!finalUrl) throw new Error("Failed to generate file URL.");

      if (type === 'anthem') {
        const { error } = await supabase.from('settings').upsert({
          id: 'anthem',
          value: JSON.stringify({ url: finalUrl, title: settings.anthemTitle || 'School Anthem' })
        });
        if (error) throw error;
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
                      type;
  
        const { error } = await supabase.from('settings').upsert({
          id: 'global',
          [dbKey]: finalUrl
        });
        if (error) throw error;
      }
      
      await refreshSettings();
      setSettings(prev => ({ ...prev, [`${type}Url`]: finalUrl }));
      showToast(`${type} uploaded successfully!`);
    } catch (error: any) {
      console.error("Upload error:", error);
      showToast(`Upload failed: ${error.message}`);
    } finally {
      setUploadingType(null);
    }
  };

  const handleUrlSave = async (e: React.MouseEvent<HTMLButtonElement>, type: 'logo' | 'rectorImage' | 'aboutImage' | 'heroBg' | 'liveStream' | 'anthem', url: string) => {
    const btn = e.currentTarget;
    const originalText = btn.innerText;
    btn.innerText = 'Saving...';
    btn.disabled = true;
    try {
      const formattedUrl = type === 'liveStream' || type === 'anthem' ? url : formatImageUrl(url);
      
      if (type === 'anthem') {
        const { error } = await supabase.from('settings').upsert({
          id: 'anthem',
          value: JSON.stringify({ url: formattedUrl, title: settings.anthemTitle || 'School Anthem' })
        });
        if (error) throw error;
      } else if (type === 'aboutImage') {
        const { error } = await supabase.from('settings').upsert({
          id: 'about',
          value: JSON.stringify({ url: formattedUrl })
        });
        if (error) throw error;
      } else {
        const dbKey = type === 'logo' ? 'logo_url' : 
                      type === 'rectorImage' ? 'rector_image_url' : 
                      type === 'heroBg' ? 'hero_bg_url' : 
                      type === 'liveStream' ? 'live_stream_url' :
                      type;
  
        const { error } = await supabase.from('settings').upsert({
          id: 'global',
          [dbKey]: formattedUrl
        });
        if (error) throw error;
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
      showToast(`Failed to save URL: ${error.message}`, "error");
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
        <div className="mb-10">
          <h1 className="text-3xl font-serif font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">Manage students, courses, and settings.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col gap-2">
              <button 
                onClick={() => setActiveTab('students')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'students' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Users size={20} /> Students
              </button>
              <button 
                onClick={() => setActiveTab('teachers')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'teachers' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Award size={20} /> Teachers
              </button>
              <button 
                onClick={() => setActiveTab('departments')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'departments' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Book size={20} /> Departments
              </button>
              <button 
                onClick={() => setActiveTab('courses')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'courses' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <FileText size={20} /> Courses
              </button>
              <button 
                onClick={() => setActiveTab('live')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'live' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Video size={20} /> Live Classes
              </button>
              <button 
                onClick={() => setActiveTab('gallery')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'gallery' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <ImageIcon size={20} /> Gallery & Media
              </button>
              <button 
                onClick={() => setActiveTab('blog')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'blog' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <FileText size={20} /> Blog Updates
              </button>
              <button 
                onClick={() => setActiveTab('finance')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'finance' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <CreditCard size={20} /> Finance
              </button>
              <button 
                onClick={() => setActiveTab('academic')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'academic' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Award size={20} /> Academic Records
              </button>
              <button 
                onClick={() => setActiveTab('messages')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'messages' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Mail size={20} /> Messages
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'settings' ? 'bg-yellow-50 text-yellow-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Settings size={20} /> Settings
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-grow w-full md:min-w-0">
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
                          {settings.fees.currency === 'USD' ? '$' : '₦'}
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
                        {settings.fees.currency === 'USD' ? '$' : '₦'}
                        {payments.filter(p => p.type === 'registration_fee').reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tuition Fees</span>
                        <GraduationCap size={16} className="text-yellow-600" />
                      </div>
                      <p className="text-xl font-bold text-slate-900">
                        {settings.fees.currency === 'USD' ? '$' : '₦'}
                        {payments.filter(p => p.type === 'tuition_fee').reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Certificates</span>
                        <Award size={16} className="text-purple-500" />
                      </div>
                      <p className="text-xl font-bold text-slate-900">
                        {settings.fees.currency === 'USD' ? '$' : '₦'}
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
                              } catch (err) {
                                showToast("Request failed", "error");
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
                          <p className="text-xs font-bold">Storage Status: Bucket 'App_files' {import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') ? 'is NOT configured' : 'is configured'}</p>
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
                          let finalUrl = '';

                          if (import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') || !import.meta.env.VITE_SUPABASE_URL) {
                            console.warn("Supabase not configured. Falling back to Base64.");
                            finalUrl = await fallbackToBase64(file);
                          } else {
                            // Sanitize filename to prevent character issues
                            const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
                            const filePath = `gallery/${year}/${Date.now()}_${safeName}`;
                            const { error: uploadError } = await supabase.storage
                              .from('App_files')
                              .upload(filePath, file);
                              
                             if (uploadError) {
                              console.error("Supabase Storage Error Details:", {
                                message: uploadError.message,
                                status: (uploadError as any).status,
                                name: uploadError.name,
                                bucket: 'App_files',
                                path: filePath
                              });
                              console.warn("Storage upload failed, attempting Base64 fallback...");
                              finalUrl = await fallbackToBase64(file);
                            } else {
                              const { data: { publicUrl } } = supabase.storage
                                .from('App_files')
                                .getPublicUrl(filePath);
                              finalUrl = publicUrl;
                            }
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
                                          if (confirm("Permanently delete this image?")) {
                                            const { error } = await supabase.from('gallery').delete().eq('id', img.id);
                                            if (!error) {
                                              showToast("Image deleted");
                                              fetchGallery();
                                            }
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
                                          if (confirm("Permanently delete this video?")) {
                                            const { error } = await supabase.from('gallery_videos').delete().eq('id', vid.id);
                                            if (!error) {
                                              showToast("Video deleted");
                                              fetchGallery();
                                            }
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
                            // Extract email from "Email: user@example.com"
                            const emailMatch = msg.body.match(/Email:\s*([^\s]+)/);
                            const email = emailMatch ? emailMatch[1] : '';
                            if (email) {
                              window.location.href = `mailto:${email}?subject=Re: ${encodeURIComponent(msg.subject)}`;
                            } else {
                              showToast("Could not find sender email in the message.", "error");
                            }
                          }}
                          className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors"
                        >
                          Reply
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
            )}

            {activeTab === 'blog' && (
              <AdminBlog showToast={showToast} />
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Global Settings</h2>
                
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
                            await supabase.from('settings').upsert({ id: 'global', is_admission_open: newStatus });
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
                    <h3 className="font-bold text-slate-900 mb-4">Hero Background Image</h3>
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
                    <h3 className="font-bold text-slate-900 mb-4">Payment Settings</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Flutterwave Public Key</label>
                        <input 
                          type="text" 
                          className="w-full min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.flutterwavePublicKey || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, flutterwavePublicKey: e.target.value }))}
                          placeholder="FLWPUBK_TEST-..."
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button 
                        id="savePaymentSettingsBtn"
                        onClick={async () => {
                          const btn = document.getElementById('savePaymentSettingsBtn');
                          if (btn) {
                            btn.innerText = 'Saving...';
                            btn.classList.add('opacity-50', 'cursor-not-allowed');
                          }
                          try {
                            await supabase.from('settings').upsert({ id: 'global', flutterwave_public_key: settings.flutterwavePublicKey });
                            if (btn) {
                              btn.innerText = 'Saved Successfully!';
                              btn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-yellow-600', 'hover:bg-yellow-700');
                              btn.classList.add('bg-green-600', 'hover:bg-green-700');
                              setTimeout(() => {
                                btn.innerText = 'Save Payment Settings';
                                btn.classList.remove('bg-green-600', 'hover:bg-green-700');
                                btn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
                              }, 3000);
                            }
                          } catch (error) {
                            console.error("Error saving payment settings:", error);
                            if (btn) {
                              btn.innerText = 'Failed to Save';
                              btn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-yellow-600', 'hover:bg-yellow-700');
                              btn.classList.add('bg-red-600', 'hover:bg-red-700');
                              setTimeout(() => {
                                btn.innerText = 'Save Payment Settings';
                                btn.classList.remove('bg-red-600', 'hover:bg-red-700');
                                btn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
                              }, 3000);
                            }
                          }
                        }}
                        className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors duration-300"
                      >
                        Save Payment Settings
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
                            await supabase.from('settings').upsert({ id: 'global', important_dates: settings.importantDates });
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
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-slate-900">Fee Settings ({settings.fees.currency || 'NGN'})</h3>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction Currency:</label>
                        <select 
                          className="px-3 py-1 bg-white border border-slate-200 rounded text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.fees.currency || 'NGN'}
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
                          value={settings.fees.registration}
                          onChange={(e) => setSettings(prev => ({ ...prev, fees: { ...prev.fees, registration: Number(e.target.value) } }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Diploma Tuition</label>
                        <input 
                          type="number" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.fees.tuition.diploma}
                          onChange={(e) => setSettings(prev => ({ ...prev, fees: { ...prev.fees, tuition: { ...prev.fees.tuition, diploma: Number(e.target.value) } } }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bachelor Tuition</label>
                        <input 
                          type="number" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.fees.tuition.bachelor}
                          onChange={(e) => setSettings(prev => ({ ...prev, fees: { ...prev.fees, tuition: { ...prev.fees.tuition, bachelor: Number(e.target.value) } } }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Master Tuition</label>
                        <input 
                          type="number" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.fees.tuition.master}
                          onChange={(e) => setSettings(prev => ({ ...prev, fees: { ...prev.fees, tuition: { ...prev.fees.tuition, master: Number(e.target.value) } } }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Doctorate Tuition</label>
                        <input 
                          type="number" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-600 outline-none"
                          value={settings.fees.tuition.doctorate}
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
