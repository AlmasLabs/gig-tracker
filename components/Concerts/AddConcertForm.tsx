'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useTranslation } from '@/app/context/LanguageContext'
import { Calendar, Music, MapPin, Loader2 } from 'lucide-react'

interface AddConcertFormProps {
  onAdded: () => void;
  initialData?: any;
}

export default function AddConcertForm({ onAdded, initialData }: AddConcertFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false)
  
  // States for skjemaet
  const [artistName, setArtistName] = useState(initialData?.artist_name || '')
  const [venueName, setVenueName] = useState(initialData?.venue_name || '')
  const [concertDate, setConcertDate] = useState(initialData?.concert_date || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Debug: Sjekker om Supabase-klienten er satt opp
    console.log("Forsøker lagring til:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    try {
      const concertData = {
        artist_name: artistName,
        venue_name: venueName,
        concert_date: concertDate,
      }

      let result;

      if (initialData?.id) {
        // OPPDATER eksisterende
        result = await supabase
          .from('concerts')
          .update(concertData)
          .eq('id', initialData.id);
      } else {
        // LEGG TIL ny
        result = await supabase
          .from('concerts')
          .insert([concertData]);
      }

      if (result.error) {
        console.error("SUPABASE FEILMELDING:", result.error.message);
        alert("Kunne ikke lagre i databasen: " + result.error.message);
      } else {
        console.log("Suksess!");
        alert(initialData ? "Endring lagret!" : "Konsert lagt til!");
        onAdded();
      }
    } catch (err) {
      console.error("Uventet feil:", err);
      alert("En uventet feil oppstod. Sjekk konsollen.");
    } finally {
      setLoading(false);
    }
  }

  // DIAGNOSE-SJEKK: Denne vil kun vises i "Console" i nettleseren din (F12)
  if (typeof window !== 'undefined') {
    console.log("--- VERCEL DIAGNOSE ---");
    console.log("Google Maps Key funnet:", !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    console.log("Supabase URL funnet:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Supabase Key funnet:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log("URL i bruk:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("------------------------");
  }

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 p-8 rounded-3xl border border-white/5 shadow-2xl animate-in zoom-in-95 duration-300">
      <h2 className="text-2xl font-black italic uppercase mb-8 text-white tracking-tighter">
        {initialData ? t.forms.edit_title : t.forms.add_title}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ARTIST */}
        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 mb-2">
            {t.forms.artist_label}
          </label>
          <div className="relative">
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder={t.forms.artist_placeholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pr-12 text-white focus:border-fuchsia-500 outline-none transition-all"
              required
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-focus-within:text-fuchsia-500 transition-colors">
              <Music size={18} />
            </div>
          </div>
        </div>

        {/* VENUE */}
        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 mb-2">
            {t.forms.venue_label}
          </label>
          <div className="relative">
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder={t.forms.venue_placeholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pr-12 text-white focus:border-fuchsia-500 outline-none transition-all"
              required
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-focus-within:text-fuchsia-500 transition-colors">
              <MapPin size={18} />
            </div>
          </div>
        </div>

        {/* DATE */}
        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 mb-2">
            {t.forms.date_label}
          </label>
          <div className="relative">
            <input
              type="date"
              value={concertDate}
              onChange={(e) => setConcertDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pr-12 text-white 
                         focus:border-fuchsia-500 outline-none transition-all 
                         [color-scheme:dark]
                         [&::-webkit-calendar-picker-indicator]:opacity-0
                         [&::-webkit-calendar-picker-indicator]:absolute
                         [&::-webkit-calendar-picker-indicator]:right-3
                         [&::-webkit-calendar-picker-indicator]:w-8
                         [&::-webkit-calendar-picker-indicator]:h-8
                         [&::-webkit-calendar-picker-indicator]:cursor-pointer
                         [&::-webkit-calendar-picker-indicator]:z-10"
              required
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-fuchsia-500 group-focus-within:text-fuchsia-400 transition-colors">
              <Calendar size={18} />
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="pt-4 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={onAdded}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest p-4 rounded-xl transition-all"
          >
            {t.forms.cancel}
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-black uppercase tracking-widest p-4 rounded-xl transition-all shadow-lg shadow-fuchsia-500/20 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? t.forms.loading : (initialData ? t.forms.submit_edit : t.forms.submit_add)}
          </button>
        </div>
      </form>
    </div>
  )
}