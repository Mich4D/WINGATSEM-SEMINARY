import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface ImportantDates {
  applicationOpens: string;
  applicationDeadline: string;
  orientationBegins: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  img: string;
}

interface Settings {
  logoUrl: string | null;
  schoolName: string;
  heroBgUrl?: string | null;
  heroBanners?: string[];
  testimonials?: Testimonial[];
  rectorImageUrl?: string | null;
  aboutImageUrl?: string | null;
  liveStreamUrl?: string | null;
  anthemUrl?: string | null;
  anthemTitle?: string | null;
  admissionFlyerUrl?: string | null;
  siteUrl?: string | null;
  flutterwavePublicKey?: string | null;
  cloudinaryUrl?: string | null;
  isAdmissionOpen: boolean;
  importantDates: ImportantDates | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<Settings>({
  logoUrl: null,
  schoolName: 'Winning Gate Christian Theological Seminary',
  heroBgUrl: null,
  heroBanners: [],
  testimonials: [],
  rectorImageUrl: null,
  aboutImageUrl: null,
  liveStreamUrl: null,
  anthemUrl: null,
  anthemTitle: 'School Anthem',
  admissionFlyerUrl: null,
  siteUrl: null,
  flutterwavePublicKey: null,
  cloudinaryUrl: null,
  isAdmissionOpen: true,
  importantDates: null,
  loading: true,
  refreshSettings: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Omit<Settings, 'loading' | 'refreshSettings'>>(() => {
    try {
      const cached = localStorage.getItem('wgts_settings');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return {
      logoUrl: null,
      schoolName: 'Winning Gate Christian Theological Seminary',
      heroBgUrl: null,
      heroBanners: [],
      testimonials: [],
      rectorImageUrl: null,
      aboutImageUrl: null,
      liveStreamUrl: null,
      anthemUrl: null,
      anthemTitle: 'School Anthem',
      admissionFlyerUrl: null,
      siteUrl: null,
      flutterwavePublicKey: null,
      cloudinaryUrl: null,
      isAdmissionOpen: true,
      importantDates: null,
    };
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data: globalData } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();
        
      const { data: anthemRow } = await supabase
        .from('settings')
        .select('value')
        .eq('id', 'anthem')
        .maybeSingle();
        
      const { data: aboutRow } = await supabase
        .from('settings')
        .select('value')
        .eq('id', 'about')
        .maybeSingle();

      const { data: bannersRow } = await supabase
        .from('settings')
        .select('value')
        .eq('id', 'hero_banners')
        .maybeSingle();

      const { data: testimonialsRow } = await supabase
        .from('settings')
        .select('value')
        .eq('id', 'testimonials')
        .maybeSingle();

      let anthemData = null;
      if (anthemRow && anthemRow.value) {
        try {
          anthemData = typeof anthemRow.value === 'string' ? JSON.parse(anthemRow.value) : anthemRow.value;
        } catch (e) {}
      }
      
      let aboutData = null;
      if (aboutRow && aboutRow.value) {
        try {
          aboutData = typeof aboutRow.value === 'string' ? JSON.parse(aboutRow.value) : aboutRow.value;
        } catch (e) {}
      }

      let parsedBanners: string[] = [];
      if (bannersRow && bannersRow.value) {
        try {
          parsedBanners = Array.isArray(bannersRow.value) ? bannersRow.value : JSON.parse(bannersRow.value as string);
        } catch (e) {}
      }

      let parsedTestimonials: Testimonial[] = [];
      if (testimonialsRow && testimonialsRow.value) {
        try {
          parsedTestimonials = Array.isArray(testimonialsRow.value) ? testimonialsRow.value : JSON.parse(testimonialsRow.value as string);
        } catch (e) {}
      }
        
      if (globalData) {
        const newSettings = {
          logoUrl: globalData.logoUrl || globalData.logo_url || null,
          schoolName: globalData.schoolName || globalData.school_name || 'Winning Gate Christian Theological Seminary',
          heroBgUrl: globalData.heroBgUrl || globalData.hero_bg_url || null,
          heroBanners: parsedBanners.length > 0 ? parsedBanners : (globalData.hero_banners || []),
          testimonials: parsedTestimonials,
          rectorImageUrl: globalData.rectorImageUrl || globalData.rector_image_url || globalData.rectorUrl || null,
          aboutImageUrl: aboutData?.url || globalData.aboutImageUrl || globalData.about_image_url || null,
          liveStreamUrl: globalData.liveStreamUrl || globalData.live_stream_url || null,
          anthemUrl: anthemData?.url || globalData.anthemUrl || globalData.anthem_url || null,
          anthemTitle: anthemData?.title || globalData.anthemTitle || globalData.anthem_title || 'School Anthem',
          admissionFlyerUrl: globalData.admissionFlyerUrl || globalData.admission_flyer_url || null,
          siteUrl: globalData.site_url || globalData.siteUrl || globalData.value?.site_url || null,
          flutterwavePublicKey: globalData.flutterwave_public_key || globalData.flutterwavePublicKey || globalData.value?.flutterwave_public_key || null,
          cloudinaryUrl: globalData.cloudinary_url || globalData.cloudinaryUrl || globalData.value?.cloudinary_url || null,
          smtpHost: globalData.smtp_host || globalData.smtpHost || globalData.value?.smtp_host || null,
          smtpPort: globalData.smtp_port || globalData.smtpPort || globalData.value?.smtp_port || null,
          smtpUser: globalData.smtp_user || globalData.smtpUser || globalData.value?.smtp_user || null,
          smtpPass: globalData.smtp_pass || globalData.smtpPass || globalData.value?.smtp_pass || null,
          smtpSender: globalData.smtp_sender || globalData.smtpSender || globalData.value?.smtp_sender || null,
          smtpFrom: globalData.smtp_from || globalData.smtpFrom || globalData.value?.smtp_from || null,
          isAdmissionOpen: globalData.is_admission_open ?? true,
          importantDates: globalData.important_dates || null,
          fees: globalData.fees || null,
        };
        console.log('Settings fetched successfully:', newSettings);
        setSettings(newSettings);
        try {
          localStorage.setItem('wgts_settings', JSON.stringify(newSettings));
        } catch (storageError) {
          console.warn('Failed to cache settings in localStorage (quota exceeded or unavailable):', storageError);
        }
      } else {
        console.warn('No settings found in database (ID: global). If this is a new project, please save settings in Admin Dashboard.');
        // If we have cached settings, keep them, otherwise we stay at defaults
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ ...settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
