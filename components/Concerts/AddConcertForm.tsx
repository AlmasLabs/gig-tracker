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
    
    // Her legger du inn din eksisterende Supabase-logikk (insert/update)
    // Etter suksess:
    // alert(initialData ? t.forms.success_edit : t.forms.success_add)
    
    setLoading(false)
    onAdded()
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
        {/* DATE */}
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
                 /* Vi fjerner appearance-none og showPicker fra selve inputen */
                 
                 /* Vi gjør det innebygde ikonet usynlig, men lar det ligge KUN over vårt lilla ikon */
                 [&::-webkit-calendar-picker-indicator]:opacity-0
                 [&::-webkit-calendar-picker-indicator]:absolute
                 [&::-webkit-calendar-picker-indicator]:right-3
                 [&::-webkit-calendar-picker-indicator]:w-8
                 [&::-webkit-calendar-picker-indicator]:h-8
                 [&::-webkit-calendar-picker-indicator]:cursor-pointer
                 [&::-webkit-calendar-picker-indicator]:z-10"
      required
    />
    
    {/* VÅRT LILLA IKON - Ligger nå "under" det usynlige, klikkbare området */}
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-fuchsia-500 group-focus-within:text-fuchsia-400 transition-colors">
      <Calendar size={18} />
    </div>
  </div>
</div>
        {/* BUTTONS */}
        <div className="pt-4 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={onAdded} // Eller en dedikert onCancel props
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