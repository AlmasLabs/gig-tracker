'use client'
import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, MapPin, Calendar, Music, AlertCircle } from 'lucide-react'

interface ImageModalProps {
  images: string[]
  onClose: () => void
  initialIndex?: number
  title?: string
  venue?: string
  date?: string
  concertId?: string
}

export default function ImageModal({ images, onClose, initialIndex = 0, title, venue, date, concertId }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [setlist, setSetlist] = useState<string[]>([])
  const [loadingSetlist, setLoadingSetlist] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lukk modal med Escape-tasten
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // Hent settliste
  useEffect(() => {
    if (title && date) {
      const fetchSetlist = async () => {
        setLoadingSetlist(true)
        setError(null)
        
        try {
          // 1. Rens datoen (fjern tid hvis den finnes: 2024-03-20T00:00:00 -> 2024-03-20)
          const dateOnly = date.includes('T') ? date.split('T')[0] : date;
          
          // 2. Formater til DD-MM-YYYY
          const parts = dateOnly.split('-');
          if (parts.length !== 3) {
            console.error("Uventet datoformat:", date);
            setLoadingSetlist(false);
            return;
          }
          
          const [y, m, d] = parts;
          const formattedDate = `${d}-${m}-${y}`;
          
          console.log(`DEBUG: Henter settliste for ${title} på dato ${formattedDate}`);
          
          const res = await fetch(`/api/setlist?artist=${encodeURIComponent(title)}&date=${formattedDate}`)
          
          if (!res.ok) {
            throw new Error(`API svarte med status ${res.status}`);
          }
          
          const data = await res.json()
          
          if (data && data.sets && Array.isArray(data.sets.set) && data.sets.set.length > 0) {
            const allSongs: string[] = data.sets.set.flatMap((s: any) => {
              if (!s.song) return [];
              return s.song
                .filter((sn: any) => !sn.tape) 
                .map((sn: any) => sn.name);
            });
            
            if (allSongs.length === 0) {
              setError("Ingen sanger registrert på denne datoen.");
            } else {
              setSetlist(allSongs);
            }
          } else {
            setSetlist([]);
            setError("Fant ingen match på Setlist.fm.");
          }
        } catch (err) {
          console.error("Settliste-feil:", err);
          setError("Kunne ikke koble til tjenesten.");
        } finally {
          setLoadingSetlist(false)
        }
      }
      fetchSetlist()
    }
  }, [title, date])

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10" onClick={onClose}>
      
      {/* LUKK-KNAPP */}
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 z-[1001] text-white/50 hover:text-white transition-colors p-2 bg-slate-900 rounded-full border border-white/10"
      >
        <X size={28} />
      </button>

      {/* NAVIGASJON */}
      {images.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1) }}
            className="absolute left-4 z-[1001] p-4 bg-slate-900/50 rounded-full text-white hover:bg-fuchsia-600 transition-all border border-white/10"
          >
            <ChevronLeft size={32} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev === images.length - 1 ? 0 : prev + 1) }}
            className="absolute right-4 z-[1001] p-4 bg-slate-900/50 rounded-full text-white hover:bg-fuchsia-600 transition-all border border-white/10"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      <div className="relative max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 items-start" onClick={(e) => e.stopPropagation()}>
        
        {/* BILDE-SEKSJON */}
        <div className="md:col-span-2 flex flex-col items-center">
          <div className="relative w-full flex justify-center bg-black/20 rounded-xl p-2 border border-white/5">
            <img 
              src={images[currentIndex]} 
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl" 
              alt={title} 
            />
          </div>
          
          <div className="mt-6 text-center">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">{title}</h2>
            <div className="flex justify-center gap-6 mt-3">
               <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
                 <MapPin size={14} className="text-fuchsia-500" /> {venue}
               </p>
               <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
                 <Calendar size={14} className="text-fuchsia-500" /> {date?.split('T')[0]}
               </p>
            </div>
          </div>
        </div>

        {/* SETLISTE-SEKSJON */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 h-[65vh] flex flex-col backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Music size={18} className="text-fuchsia-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Setlist</h3>
            </div>
            {setlist.length > 0 && (
              <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                {setlist.length} sanger
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {loadingSetlist ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-fuchsia-500 border-t-transparent rounded-full" />
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Henter fra setlist.fm...</p>
              </div>
            ) : setlist.length > 0 ? (
              setlist.map((song, i) => (
                <div key={i} className="text-[12px] text-slate-300 border-b border-white/5 pb-2 flex gap-4 hover:text-fuchsia-400 transition-colors group cursor-default">
                  <span className="text-fuchsia-600/50 font-black w-4 group-hover:text-fuchsia-500">{i + 1}</span>
                  <span className="font-semibold tracking-tight">{song}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <AlertCircle size={24} className="text-slate-700 mb-2" />
                <p className="text-[11px] text-slate-500 uppercase font-bold leading-tight italic">
                  {error || "Ingen settliste funnet"}
                </p>
              </div>
            )}
          </div>

          {/* ATTRIBUTION */}
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <a 
              href="https://www.setlist.fm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group inline-flex flex-col items-center gap-1"
            >
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter group-hover:text-slate-400 transition-colors">
                Setlist provided by
              </span>
              <span className="text-[11px] text-slate-300 font-black uppercase tracking-tighter group-hover:text-fuchsia-500 transition-all">
                setlist.fm
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}