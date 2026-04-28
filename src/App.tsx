import { ReactNode, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Global gate to catch password recovery links
const RecoveryGate = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If we land anywhere with a recovery hash or search param, force redirect to /login
    const hasRecovery = (window as any).__IS_PASSWORD_RECOVERY || 
                       window.location.hash.includes('type=recovery') || 
                       window.location.hash.includes('access_token=') || 
                       location.search.includes('type=recovery') || 
                       location.search.includes('error_code=');
    
    if (hasRecovery) {
      if (location.pathname !== '/login') {
        console.log('Recovery param detected, redirecting to login page');
        navigate('/login' + location.search + window.location.hash);
      }
    }
  }, [location, navigate]);

  return null;
};
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Programmes from './pages/Programmes';
import Admissions from './pages/Admissions';
import Contact from './pages/Contact';
import Gallery from './pages/Gallery';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherLogin from './pages/TeacherLogin';
import StaffPortal from './pages/StaffPortal';
import BootstrapAdmin from './pages/BootstrapAdmin';
import OnlineClass from './pages/OnlineClass';
import LiveEvent from './pages/LiveEvent';
import VerifyStudent from './pages/VerifyStudent';
import Footer from './components/Footer';
import { SettingsProvider } from './contexts/SettingsContext';

const PrivateRoute = ({ children, roles }: { children: ReactNode, roles?: ('student' | 'admin' | 'teacher')[] }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600 mb-4"></div>
      <p className="text-slate-600 font-medium">Loading...</p>
    </div>
  );

  if (!user && !profile) return <Navigate to="/" />;

  if (roles && profile && !roles.includes(profile.role)) {
    // If they are an admin trying to access student dashboard, send to admin
    if (profile?.role === 'admin') return <Navigate to="/admin" />;
    // If they are a student trying to access admin dashboard, send to student
    if (profile?.role === 'student') return <Navigate to="/dashboard" />;
    // If they are a teacher trying to access admin dashboard, send to teacher
    if (profile?.role === 'teacher') return <Navigate to="/teacher" />;
    
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <RecoveryGate />
          <Routes>
            {/* Full-screen routes without Navbar/Footer */}
            <Route path="/staff-portal" element={<StaffPortal />} />
            <Route path="/teacher-login" element={<TeacherLogin />} />
            <Route 
              path="/class/:classId" 
              element={
                <PrivateRoute roles={['admin', 'teacher', 'student']}>
                  <OnlineClass />
                </PrivateRoute>
              } 
            />
            
            {/* Routes with Navbar/Footer */}
            <Route path="*" element={
              <div className="min-h-screen flex flex-col bg-slate-50">
                <Navbar />
                <main className="flex-grow pt-[88px] md:pt-[104px]">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/programmes" element={<Programmes />} />
                    <Route path="/admissions" element={<Admissions />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/live" element={<LiveEvent />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/bootstrap" element={<BootstrapAdmin />} />
                    <Route path="/verify" element={<VerifyStudent />} />
                    <Route 
                      path="/dashboard" 
                      element={
                        <PrivateRoute roles={['student']}>
                          <StudentDashboard />
                        </PrivateRoute>
                      } 
                    />
                    <Route 
                      path="/admin" 
                      element={
                        <PrivateRoute roles={['admin']}>
                          <AdminDashboard />
                        </PrivateRoute>
                      } 
                    />
                    <Route 
                      path="/teacher" 
                      element={
                        <PrivateRoute roles={['teacher']}>
                          <TeacherDashboard />
                        </PrivateRoute>
                      } 
                    />
                  </Routes>
                </main>
                <Footer />
              </div>
            } />
          </Routes>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}
