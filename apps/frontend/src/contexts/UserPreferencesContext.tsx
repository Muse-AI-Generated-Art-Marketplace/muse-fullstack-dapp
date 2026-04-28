import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type Currency = 'XLM' | 'USD' | 'EUR';
export type Language = 'en' | 'es' | 'fr' | 'de';

interface UserPreferences {
  theme: Theme;
  currency: Currency;
  language: Language;
}

interface UserPreferencesContextType extends UserPreferences {
  setTheme: (theme: Theme) => void;
  setCurrency: (currency: Currency) => void;
  setLanguage: (language: Language) => void;
}

const STORAGE_KEY = 'muse_user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  currency: 'XLM',
  language: 'en',
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

/**
 * Context provider that manages and persists user preferences like theme, currency, and language.
 * It utilizes localStorage for cross-session persistence and updates the DOM for theme changes.
 */
export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    
    const saved = localStorage.getItem(STORAGE_KEY);
    try {
      return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Failed to parse user preferences from localStorage:', error);
      return DEFAULT_PREFERENCES;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    
    // Apply theme to the document element for Tailwind CSS or global styles
    const root = window.document.documentElement;
    const isDark = preferences.theme === 'dark' || 
      (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    root.classList.toggle('dark', isDark);
  }, [preferences]);

  const setTheme = (theme: Theme) => setPreferences((p) => ({ ...p, theme }));
  const setCurrency = (currency: Currency) => setPreferences((p) => ({ ...p, currency }));
  const setLanguage = (language: Language) => setPreferences((p) => ({ ...p, language }));

  return (
    <UserPreferencesContext.Provider 
      value={{ ...preferences, setTheme, setCurrency, setLanguage }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};
