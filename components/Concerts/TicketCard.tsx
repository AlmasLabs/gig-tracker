'use client'
import { Calendar, MapPin, Edit2, Trash2, ImageIcon } from 'lucide-react'
import { useState } from 'react'
import ImageModal from './ImageModal'

// Hjelpefunksjon som returnerer landskode (no, se, us osv)
const getCountryCode = (address: string) => {
  if (!address) return null;
  
  const parts = address.split(',');
  const country = parts[parts.length - 1].trim().toLowerCase();

  const countryMap: { [key: string]: string } = {
    'norway': 'no', 'norge': 'no',
    'sweden': 'se', 'sverige': 'se',
    'denmark': 'dk', 'danmark': 'dk',
    'germany': 'de', 'tyskland': 'de',
    'uk': 'gb', 'united kingdom': 'gb', 'storbritannia': 'gb',
    'usa': 'us', 'united states': 'us',
    'france': 'fr', 'frankrike': 'fr',
    'italy': 'it', 'italia': 'it',
    'spain': 'es', 'spania': 'es',
    'netherlands': 'nl', 'nederland': 'nl',
    'belgium': 'be', 'belgia': 'be',
    'finland': 'fi', 'suomi': 'fi'
  };

  return countryMap[country] || null;
};

interface TicketProps {
  concert: any
  onEdit?: (concert: any) => void
  onDelete?: (id: string | number) => void
}

export default function TicketCard({ concert, onEdit, onDelete }: TicketProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const images = Array.isArray(concert.event_img_url) ? concert.event_img_url : [];
  const hasImages = images.length > 0;

  const dateObj = new Date(concert.concert_date)
  
  const formattedDateForCard = !isNaN(dateObj.getTime()) 
    ? dateObj.toLocaleDateString('nb-NO', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
    : "UKJENT DATO"

  const isPast = !isNaN(dateObj.getTime()) && dateObj < new Date()
  const countryCode = getCountryCode(concert.address)

  return (
    <>
      <div className="relative flex bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:border-fuchsia-500 transition-all group h-32 w-full text-white">
        
        {/* 1. BAKGRUNNSBILDE */}
        {hasImages && (
          <div 
            onClick={() => setIsModalOpen(true)}
            className="absolute inset-0 w-full h-full cursor-zoom-in z-0"
          >
            <img 
              src={images[0]} 
              alt={concert.artist_name} 
              className="w-full h-full object-cover opacity-20 group-hover:opacity-40 grayscale group-hover:grayscale-0 transition-all duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
            
            {images.length > 1 && (
              <div className="absolute bottom-2 right-14 bg-fuchsia-600/90 text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-tighter z-20 shadow-lg">
                <ImageIcon size={10} className="inline mr-1" /> +{images.length - 1}
              </div>
            )}
          </div>
        )}

        {/* 2. STATUS-LINJE */}
        <div className={`w-3 ${isPast ? 'bg-fuchsia-600' : 'bg-fuchsia-400/30'} flex-shrink-0 relative z-10`} />

        {/* 3. HOVEDINNHOLD */}
        <div 
          className="p-4 flex flex-col gap-1 w-full relative z-10 justify-between cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-black text-2xl italic tracking-tighter uppercase leading-none truncate pr-16 group-hover:text-fuchsia-400 transition-colors">
              {concert.artist_name || 'Ukjent Artist'}
            </h3>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-300 text-xs">
              <MapPin size={13} className="text-fuchsia-500 flex-shrink-0" />
              <span className="truncate flex items-center gap-2">
                {/* FLAG-LOGIKK: Bruker bilde i stedet for emoji */}
                {countryCode ? (
                  <img 
                    src={`https://flagcdn.com/w20/${countryCode}.png`}
                    alt={countryCode}
                    className="w-4 h-auto rounded-[1px] shadow-sm border border-white/10 inline-block"
                  />
                ) : (
                  <span className="text-[10px]">🌍</span>
                )}
                {concert.venue_name || 'Ukjent Sted'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold tracking-tight">
              <Calendar size={13} className="text-fuchsia-500 flex-shrink-0" />
              <span>{formattedDateForCard}</span>
            </div>
          </div>
        </div>

        {/* 4. KNAPPER */}
        <div className="absolute top-2 right-3 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          {onEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(concert); }} 
              className="p-2 bg-slate-950/80 rounded-lg text-slate-400 hover:text-fuchsia-400 border border-slate-800 hover:border-fuchsia-500 transition-all"
              title="Rediger"
            >
              <Edit2 size={14} />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(concert.id); }} 
              className="p-2 bg-slate-950/80 rounded-lg text-slate-400 hover:text-red-500 border border-slate-800 hover:border-red-500 transition-all"
              title="Slett"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 5. BILDE-MODAL */}
      {isModalOpen && (
        <ImageModal 
          images={images} 
          onClose={() => setIsModalOpen(false)}
          title={concert.artist_name}
          venue={concert.venue_name}
          date={concert.concert_date} 
        />
      )}
    </>
  )
}