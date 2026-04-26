import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface ImportantDates {
  applicationOpens: string;
  applicationDeadline: string;
  orientationBegins: string;
}

interface Settings {
  logoUrl: string | null;
  schoolName: string;
  heroBgUrl?: string | null;
  rectorImageUrl?: string | null;
  liveStreamUrl?: string | null;
  anthemUrl?: string | null;
  anthemTitle?: string | null;
  isAdmissionOpen: boolean;
  importantDates: ImportantDates | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<Settings>({
  logoUrl: null,
  schoolName: 'Winning Gate Christian Theological Seminary',
  heroBgUrl: null,
  rectorImageUrl: null,
  liveStreamUrl: null,
  anthemUrl: null,
  anthemTitle: 'School Anthem',
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
      rectorImageUrl: null,
      liveStreamUrl: null,
      anthemUrl: null,
      anthemTitle: 'School Anthem',
      isAdmissionOpen: true,
      importantDates: null,
    };
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data: globalData, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .single();
        
      const { data: anthemRow } = await supabase
        .from('settings')
        .select('value')
        .eq('id', 'anthem')
        .single();

      let anthemData = null;
      if (anthemRow && anthemRow.value) {
        try {
          anthemData = typeof anthemRow.value === 'string' ? JSON.parse(anthemRow.value) : anthemRow.value;
        } catch (e) {}
      }
        
      if (globalData) {
        const newSettings = {
          logoUrl: globalData.logoUrl || globalData.logo_url || null,
          schoolName: globalData.schoolName || globalData.school_name || 'Winning Gate Christian Theological Seminary',
          heroBgUrl: globalData.heroBgUrl || globalData.hero_bg_url || null,
          rectorImageUrl: globalData.rectorImageUrl || globalData.rector_image_url || globalData.rectorUrl || null,
          liveStreamUrl: globalData.liveStreamUrl || globalData.live_stream_url || null,
          anthemUrl: anthemData?.url || globalData.anthemUrl || globalData.anthem_url || null,
          anthemTitle: anthemData?.title || globalData.anthemTitle || globalData.anthem_title || 'School Anthem',
          isAdmissionOpen: globalData.is_admission_open ?? true,
          importantDates: globalData.important_dates || null,
        };
        setSettings(newSettings);
        localStorage.setItem('wgts_settings', JSON.stringify(newSettings));
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
