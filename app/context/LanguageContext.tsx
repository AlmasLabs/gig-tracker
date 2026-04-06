'use client'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import no from '@/locales/no.json'
import en from '@/locales/en.json'

const translations: any = { no, en }
const LanguageContext = createContext<any>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<'no' | 'en'>('en')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // FAIL-SAFE: Hvis ingenting skjer på 2 sekunder, tving frem siden
    const backupTimer = setTimeout(() => {
      if (!isMounted) {
        console.warn("LanguageContext: Forced mount after timeout");
        setIsMounted(true);
      }
    }, 2000);

    const initLanguage = async () => {
      try {
        console.log("LanguageContext: Initializing...");
        
        // 1. Sjekk LocalStorage (raskest)
        const saved = localStorage.getItem('language')
        if (saved === 'no' || saved === 'en') {
          setLocaleState(saved);
        }

        // 2. Sjekk Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('preferred_language')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile?.preferred_language) {
            setLocaleState(profile.preferred_language as 'no' | 'en');
          }
        }
      } catch (e) {
        console.error("LanguageContext Error:", e);
      } finally {
        console.log("LanguageContext: Ready");
        setIsMounted(true);
        clearTimeout(backupTimer);
      }
    };

    initLanguage();
    return () => clearTimeout(backupTimer);
  }, [isMounted]);

  const setLocale = useCallback(async (newLocale: 'no' | 'en') => {
    setLocaleState(newLocale);
    localStorage.setItem('language', newLocale);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('profiles').update({ preferred_language: newLocale }).eq('id', session.user.id);
    }
  }, []);

  const t = translations[locale] || translations['en'];

  // Hvis vi returnerer null her mens isMounted er false, 
  // vil Next.js ofte "henge" hvis layout.tsx ikke håndterer det.
  return (
    <LanguageContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}