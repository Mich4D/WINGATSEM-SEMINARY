import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, Book, FileText, CheckCircle, Award, Video, ExternalLink, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');

  // Academic Records states
  const [selectedStudentForAcademic, setSelectedStudentForAcademic] = useState<string | null>(null);
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<any[]>([]);
  const [newGrade, setNewGrade] = useState({ courseName: '', credits: 3, score: '', grade: '' });
  const [newAssignment, setNewAssignment] = useState({ courseName: '', assignmentName: '', status: 'pending', score: '', dueDate: new Date().toISOString().split('T')[0] });
  const [bulkAssignment, setBulkAssignment] = useState({ courseName: '', assignmentName: '', programType: 'bachelor', dueDate: new Date().toISOString().split('T')[0] });
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (profile && profile.role !== 'teacher' && profile.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('users').select('*').eq('role', 'student');
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchAcademicRecords = async (studentId: string) => {
    try {
      const { data: gradesData } = await supabase.from('grades').select('*').eq('student_id', studentId);
      const { data: assignmentsData } = await supabase.from('assignments').select('*').eq('student_id', studentId);
      
      setStudentGrades(gradesData || []);
      setStudentAssignments(assignmentsData || []);
    } catch (error) {
      console.error("Error fetching academic records:", error);
    }
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAcademic) return;
    
    try {
      const { error } = await supabase.from('grades').insert([{
        student_id: selectedStudentForAcademic,
        course_name: newGrade.courseName,
        credits: newGrade.credits,
        score: newGrade.score,
        grade: newGrade.grade,
        semester: 'Fall 2023', // Default or dynamic
        year: new Date().getFullYear().toString()
      }]);

      if (error) throw error;
      
      showToast("Grade added successfully!");
      setNewGrade({ courseName: '', credits: 3, score: '', grade: '' });
      fetchAcademicRecords(selectedStudentForAcademic);
    } catch (error) {
      console.error("Error adding grade:", error);
      showToast("Failed to add grade.", "error");
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAcademic) return;
    
    try {
      const { error } = await supabase.from('assignments').insert([{
        student_id: selectedStudentForAcademic,
        course_name: newAssignment.courseName,
        assignment_name: newAssignment.assignmentName,
        status: newAssignment.status,
        score: newAssignment.score || null,
        due_date: new Date(newAssignment.dueDate).toISOString()
      }]);

      if (error) throw error;
      
      showToast("Assignment added successfully!");
      setNewAssignment({ courseName: '', assignmentName: '', status: 'pending', score: '', dueDate: new Date().toISOString().split('T')[0] });
      fetchAcademicRecords(selectedStudentForAcademic);
    } catch (error) {
      console.error("Error adding assignment:", error);
      showToast("Failed to add assignment.", "error");
    }
  };

  const handleBulkAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudents = students.filter(s => s.is_approved && s.program_type?.toLowerCase() === bulkAssignment.programType.toLowerCase());
    
    if (targetStudents.length === 0) {
      showToast(`No approved students found in the ${bulkAssignment.programType} program.`, "error");
      return;
    }

    try {
      setLoading(true);
      const assignmentsToInsert = targetStudents.map(student => ({
        student_id: student.id,
        course_name: bulkAssignment.courseName,
        assignment_name: bulkAssignment.assignmentName,
        status: 'pending',
        due_date: new Date(bulkAssignment.dueDate).toISOString()
      }));

      const { error } = await supabase.from('assignments').insert(assignmentsToInsert);

      if (error) throw error;
      
      showToast(`Assignment set for all ${targetStudents.length} students in ${bulkAssignment.programType} program!`);
      setBulkAssignment({ courseName: '', assignmentName: '', programType: 'bachelor', dueDate: new Date().toISOString().split('T')[0] });
      setIsBulkMode(false);
    } catch (error) {
      console.error("Error setting bulk assignments:", error);
      showToast("Failed to set bulk assignments.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar & Header Toggle */}
      <div className="md:hidden bg-slate-900 absolute top-0 left-0 right-0 z-20 px-4 py-3 flex justify-between items-center text-white">
        <h2 className="text-lg font-bold text-yellow-500">Teacher Portal</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('students')}
            className={`p-2 rounded-lg ${activeTab === 'students' ? 'bg-yellow-600' : 'bg-slate-800'}`}
            title="Students"
          >
            <Users size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('grading')}
            className={`p-2 rounded-lg ${activeTab === 'grading' ? 'bg-yellow-600' : 'bg-slate-800'}`}
            title="Grading"
          >
            <Award size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('assignments')}
            className={`p-2 rounded-lg ${activeTab === 'assignments' ? 'bg-yellow-600' : 'bg-slate-800'}`}
            title="Assignments"
          >
            <FileText size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('class')}
            className={`p-2 rounded-lg ${activeTab === 'class' ? 'bg-yellow-600' : 'bg-slate-800'}`}
            title="Go to Class"
          >
            <Video size={20} />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-yellow-500">Teacher Portal</h2>
          <p className="text-xs text-slate-400 mt-1">{profile.displayName}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('students')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'students' ? 'bg-yellow-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Users size={18} />
            My Students
          </button>
          <button 
            onClick={() => setActiveTab('grading')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'grading' ? 'bg-yellow-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Award size={18} />
            Grading
          </button>
          <button 
            onClick={() => setActiveTab('assignments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'assignments' ? 'bg-yellow-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <FileText size={18} />
            Assignments
          </button>
          <button 
            onClick={() => setActiveTab('class')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'class' ? 'bg-yellow-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Video size={18} />
            Go to Class
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 p-4 md:p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">
            {activeTab === 'students' && 'Students Overview'}
            {activeTab === 'grading' && 'Academic Grading'}
            {activeTab === 'assignments' && 'Assignment Management'}
            {activeTab === 'class' && 'Virtual Classroom'}
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'students' && (
                <div className="space-y-6">
                  {/* Quick Class Join */}
                  <div className="bg-yellow-600 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold">Classroom Quick Access</h2>
                      <p className="text-yellow-100 opacity-90">Ready to start your session? Jump directly into a classroom.</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('class')}
                      className="bg-white text-yellow-700 px-6 py-3 rounded-xl font-bold hover:bg-yellow-50 transition-all flex items-center gap-2"
                    >
                      Process to Virtual Class <ArrowRight size={18} />
                    </button>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">Enrolled Students</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase w-12 text-center">#</th>
                          <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase">Student</th>
                          <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase">Reg Number</th>
                          <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase">Program</th>
                          <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase">Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.filter(s => s.is_approved || s.isApproved).map((student, idx) => (
                          <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-4 px-6 text-xs font-bold text-slate-400 text-center">
                              {idx + 1}.
                            </td>
                            <td className="py-4 px-6">
                              <p className="font-bold text-slate-900">{student.name || student.displayName}</p>
                              <p className="text-xs text-slate-500">{student.email}</p>
                            </td>
                            <td className="py-4 px-6 font-mono text-sm">{student.registrationNumber || student.registration_number || 'N/A'}</td>
                            <td className="py-4 px-6 text-sm capitalize">{student.programType || student.program_type || 'N/A'}</td>
                            <td className="py-4 px-6 text-sm">{student.level ? `${student.level} Level` : 'N/A'}</td>
                          </tr>
                        ))}
                        {students.filter(s => s.is_approved || s.isApproved).length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-500">No approved students found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

              {activeTab === 'grading' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Student List for Grading */}
                  <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                      <h3 className="font-bold text-slate-900">Select Student</h3>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2">
                      {students.filter(s => s.is_approved || s.isApproved).map((student, idx) => (
                        <button
                          key={student.id}
                          onClick={() => {
                            setSelectedStudentForAcademic(student.id);
                            fetchAcademicRecords(student.id);
                          }}
                          className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${selectedStudentForAcademic === student.id ? 'bg-yellow-50 border border-yellow-200' : 'hover:bg-slate-50 border border-transparent'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0">{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                               <p className="font-bold text-slate-900 text-sm truncate">{student.name || student.displayName}</p>
                               <p className="text-xs text-slate-500 truncate">{student.registration_number}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grading Panel */}
                  <div className="lg:col-span-2">
                    {selectedStudentForAcademic ? (
                      <div className="space-y-6">
                        {/* Add Grade Form */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Award size={18} className="text-yellow-600" />
                            Add Course Grade
                          </h3>
                          <form onSubmit={handleAddGrade} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Course Name</label>
                              <input 
                                type="text" required
                                value={newGrade.courseName} onChange={e => setNewGrade({...newGrade, courseName: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Credits</label>
                              <input 
                                type="number" required
                                value={newGrade.credits} onChange={e => setNewGrade({...newGrade, credits: Number(e.target.value)})}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Score (0-100)</label>
                              <input 
                                type="number" required min="0" max="100"
                                value={newGrade.score} onChange={e => setNewGrade({...newGrade, score: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Grade (A, B, C...)</label>
                              <input 
                                type="text" required maxLength={2}
                                value={newGrade.grade} onChange={e => setNewGrade({...newGrade, grade: e.target.value.toUpperCase()})}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm uppercase"
                              />
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                              <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
                                Save Grade
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                        <Book size={48} className="text-slate-300 mb-4" />
                        <p className="text-lg font-medium text-slate-900 mb-2">No Student Selected</p>
                        <p className="text-sm">Select a student from the list to view and manage their academic records.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'assignments' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Student List for Assignments */}
                  <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900">Select Student</h3>
                      <button 
                        onClick={() => {
                          setIsBulkMode(!isBulkMode);
                          setSelectedStudentForAcademic(null);
                        }}
                        className={`text-xs px-2 py-1 rounded transition-colors ${isBulkMode ? 'bg-yellow-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                      >
                        {isBulkMode ? 'Individual Mode' : 'Bulk Mode'}
                      </button>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2">
                      {students.filter(s => s.is_approved || s.isApproved).map((student, idx) => (
                        <button
                          key={student.id}
                          onClick={() => {
                            setIsBulkMode(false);
                            setSelectedStudentForAcademic(student.id);
                            fetchAcademicRecords(student.id);
                          }}
                          className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${selectedStudentForAcademic === student.id ? 'bg-yellow-50 border border-yellow-200' : 'hover:bg-slate-50 border border-transparent'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0">{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-sm truncate">{student.displayName || student.name}</p>
                              <p className="text-xs text-slate-500 truncate">{student.registration_number}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Assignment Panel */}
                  <div className="lg:col-span-2">
                    {isBulkMode ? (
                      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                            <Users size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">Set Bulk Assignment</h3>
                            <p className="text-sm text-slate-500">Assign a task to all students in a specific program at once.</p>
                          </div>
                        </div>

                        <form onSubmit={handleBulkAssignment} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Target Program</label>
                              <select 
                                value={bulkAssignment.programType}
                                onChange={e => setBulkAssignment({...bulkAssignment, programType: e.target.value})}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
                              >
                                <option value="diploma">Diploma Students</option>
                                <option value="bachelor">Bachelor Students</option>
                                <option value="master">Master Students</option>
                                <option value="doctor">Doctorate Students</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                              <input 
                                type="date" required
                                value={bulkAssignment.dueDate}
                                onChange={e => setBulkAssignment({...bulkAssignment, dueDate: e.target.value})}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-slate-700 mb-2">Course Name</label>
                              <input 
                                type="text" required
                                placeholder="e.g. Systematic Theology I"
                                value={bulkAssignment.courseName}
                                onChange={e => setBulkAssignment({...bulkAssignment, courseName: e.target.value})}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-slate-700 mb-2">Assignment Title/Description</label>
                              <textarea 
                                required rows={3}
                                placeholder="Describe the assignment requirements..."
                                value={bulkAssignment.assignmentName}
                                onChange={e => setBulkAssignment({...bulkAssignment, assignmentName: e.target.value})}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none resize-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-4">
                            <button 
                              type="submit"
                              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
                            >
                              Set Assignment for Program <ArrowRight size={18} />
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : selectedStudentForAcademic ? (
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText size={18} className="text-blue-600" />
                            Add Individual Assignment
                          </h3>
                          <form onSubmit={handleAddAssignment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Course Name</label>
                              <input 
                                type="text" required
                                value={newAssignment.courseName} onChange={e => setNewAssignment({...newAssignment, courseName: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Assignment Name</label>
                              <input 
                                type="text" required
                                value={newAssignment.assignmentName} onChange={e => setNewAssignment({...newAssignment, assignmentName: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
                              <input 
                                type="date" required
                                value={newAssignment.dueDate} onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                              <select 
                                value={newAssignment.status} onChange={e => setNewAssignment({...newAssignment, status: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                              >
                                <option value="pending">Pending</option>
                                <option value="submitted">Submitted</option>
                                <option value="graded">Graded</option>
                              </select>
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                              <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
                                Save Assignment
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                        <FileText size={48} className="text-slate-300 mb-4" />
                        <p className="text-lg font-medium text-slate-900 mb-2">No Student Selected</p>
                        <p className="text-sm">Select a student from the list or switch to <b>Bulk Mode</b> to set assignments.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'class' && (
                <div className="space-y-8">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                    <Video size={64} className="text-yellow-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Virtual Classroom</h2>
                    <p className="text-slate-600 mb-8 max-w-md mx-auto">
                      Access your live virtual classroom to interact with students in real-time. Select a program level below to enter the specific classroom.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                      {[
                        { id: 'diploma', name: 'Diploma Class', color: 'bg-blue-600' },
                        { id: 'bachelor', name: 'Bachelor Class', color: 'bg-green-600' },
                        { id: 'master', name: 'Master Class', color: 'bg-purple-600' },
                        { id: 'doctor', name: 'Doctorate Class', color: 'bg-red-600' }
                      ].map((cls) => (
                        <button
                          key={cls.id}
                          onClick={() => navigate(`/class/${cls.id}`)}
                          className="flex flex-col items-center p-6 bg-white border border-slate-200 rounded-xl hover:border-yellow-500 hover:shadow-md transition-all group"
                        >
                          <div className={`w-12 h-12 ${cls.color} text-white rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                            <Video size={24} />
                          </div>
                          <span className="font-bold text-slate-900">{cls.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-100">
                      <p className="text-sm text-slate-500 mb-4">Or enter your assigned department classroom:</p>
                      <button 
                        onClick={() => navigate(`/class/${profile.departmentCode || 'general'}`)}
                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto"
                      >
                        Enter {profile.departmentCode ? `${profile.departmentCode} ` : ''}Classroom <ExternalLink size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 transition-all duration-300 ${toastMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}
