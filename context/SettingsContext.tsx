import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BusinessSettings, BusinessHour } from '../types';

interface SettingsContextData {
  settings: BusinessSettings | null;
  businessHours: BusinessHour[];
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextData | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [settingsRes, hoursRes] = await Promise.all([
          supabase.from('business_settings').select('*').single(),
          supabase.from('business_hours').select('*').order('id'),
        ]);

        if (settingsRes.error) throw new Error(`Error fetching settings: ${settingsRes.error.message}`);
        if (hoursRes.error) throw new Error(`Error fetching business hours: ${hoursRes.error.message}`);

        setSettings(settingsRes.data as BusinessSettings);
        setBusinessHours(hoursRes.data as BusinessHour[]);
      } catch (error) {
        console.error("Failed to fetch initial app data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, businessHours, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
