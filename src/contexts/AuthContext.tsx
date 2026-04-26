import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'student' | 'admin' | 'teacher';
  isApproved: boolean;
  level?: string;
  departmentCode?: string;
  registrationNumber?: string;
  profileImageUrl?: string;
  referenceLetter1Url?: string;
  referenceLetter2Url?: string;
  baptismCertificateUrl?: string;
  academicCredentialUrl?: string;
  dateRegistered?: any;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  stateOfOrigin?: string;
  city?: string;
  declarationOfFaith?: string;
  baptismDate?: string;
  churchName?: string;
  churchPosition?: string;
  learningMode?: 'physical' | 'online';
  profileCompleted?: boolean;
  programType?: string;
  classLanguage?: string;
  academicHistory?: any;
  academic_history?: any;
  country?: string;
  registrationFeePaid?: boolean;
  tuitionFeePaid?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (value: boolean) => void;
  signOut: () => Promise<void>;
  loginWithPasskey: (passkey: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isPasswordRecovery: false,
  setIsPasswordRecovery: () => {},
  signOut: async () => {},
  loginWithPasskey: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Fallback timeout to prevent infinite loading screen
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Check for teacher passkey first
    const savedPasskey = localStorage.getItem('teacher_passkey');
    if (savedPasskey) {
      loginWithPasskey(savedPasskey).catch(() => {
        localStorage.removeItem('teacher_passkey');
      });
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error && error.message.includes('Refresh Token Not Found')) {
        console.warn('Invalid refresh token found, signing out...');
        supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('CRITICAL: PASSWORD_RECOVERY detected globally');
        setIsPasswordRecovery(true);
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const fetchProfile = async (currentUser: User) => {
    console.log('Fetching profile for user:', currentUser.id, currentUser.email);
    try {
      const userEmail = currentUser.email?.toLowerCase() || '';
      const isHardcodedAdmin = userEmail === 'wingatsem@gmail.com';

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.warn('Profile fetch error (might not exist yet):', error.message);
      }

      if (data) {
        console.log('Profile found:', data.role);
        const userProfile: UserProfile = {
          uid: currentUser.id,
          displayName: data.name || data.displayName || 'User',
          email: data.email || currentUser.email,
          role: data.role as 'student' | 'admin' | 'teacher',
          isApproved: data.is_approved ?? (data.role === 'admin' || data.role === 'teacher'),
          level: data.level,
          departmentCode: data.department_code,
          registrationNumber: data.registration_number,
          profileImageUrl: data.selfie_url || data.profile_image_url,
          referenceLetter1Url: data.reference_letter1_url,
          referenceLetter2Url: data.reference_letter2_url,
          baptismCertificateUrl: data.baptism_certificate_url,
          academicCredentialUrl: data.academic_credential_url,
          dateRegistered: data.date_registered,
          phoneNumber: data.phone_number,
          address: data.address,
          dateOfBirth: data.date_of_birth,
          gender: data.gender,
          nationality: data.nationality,
          stateOfOrigin: data.state_of_origin,
          city: data.city,
          declarationOfFaith: data.declaration_of_faith,
          baptismDate: data.baptism_date,
          churchName: data.church_name,
          churchPosition: data.church_position,
          learningMode: data.learning_mode,
          profileCompleted: data.profile_completed,
          programType: data.program_type,
          classLanguage: data.class_language,
          academicHistory: data.academic_history,
          registrationFeePaid: data.registration_fee_paid,
          tuitionFeePaid: data.tuition_fee_paid,
        };

        if (isHardcodedAdmin && (userProfile.role !== 'admin' || !userProfile.isApproved)) {
          console.log('Auto-upgrading hardcoded admin');
          userProfile.role = 'admin';
          userProfile.isApproved = true;
          await supabase.from('users').update({ role: 'admin', is_approved: true }).eq('id', currentUser.id);
        }

        setProfile(userProfile);
      } else {
        console.log('Profile not found, creating default...');
        // Create default profile if it doesn't exist
        const newProfile = {
          id: currentUser.id,
          name: currentUser.user_metadata?.full_name || 'New User',
          email: currentUser.email || '',
          role: isHardcodedAdmin ? 'admin' : 'student',
          is_approved: isHardcodedAdmin ? true : false,
        };
        
        const { error: insertError } = await supabase.from('users').upsert([newProfile]);
        if (insertError) {
          console.error('Error creating/updating default profile:', insertError);
          if (insertError.message.includes('row-level security')) {
            console.warn('RLS error: Ensure you have an INSERT policy for the users table.');
          }
        } else {
          console.log('Default profile created/updated');
        }
        
        setProfile({
          uid: currentUser.id,
          displayName: newProfile.name,
          email: newProfile.email,
          role: newProfile.role as 'student' | 'admin' | 'teacher',
          isApproved: newProfile.is_approved,
        });
      }
    } catch (error) {
      console.error('Unexpected error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginWithPasskey = async (passkey: string) => {
    try {
      const cleanPasskey = passkey.trim();
      console.log('Attempting passkey login with:', cleanPasskey);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('registration_number', cleanPasskey)
        .eq('role', 'teacher')
        .single();

      if (error) {
        console.error('Supabase error during passkey login:', error);
        throw new Error('Invalid passkey or not a teacher account.');
      }

      if (!data) {
        console.error('No teacher found with passkey:', cleanPasskey);
        throw new Error('Invalid passkey or not a teacher account.');
      }

      console.log('Teacher login successful:', data.email);

      const userProfile: UserProfile = {
        uid: data.id,
        displayName: data.name || 'Teacher',
        email: data.email || '',
        role: 'teacher',
        isApproved: true,
        registrationNumber: data.registration_number,
        departmentCode: data.department_code
      };

      setProfile(userProfile);
      localStorage.setItem('teacher_passkey', passkey);
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error('Passkey login error:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    localStorage.removeItem('teacher_passkey');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsPasswordRecovery(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isPasswordRecovery, setIsPasswordRecovery, signOut, loginWithPasskey }}>
      {children}
    </AuthContext.Provider>
  );
};
