'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useTranslation } from '@/app/context/LanguageContext'
import { Calendar, Music, MapPin, Loader2 } from 'lucide-react'
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api'

// Vi definerer hvilke Google-biblioteker vi trenger
const libraries: ("places")[] = ["places"];

interface AddConcertFormProps {
  onAdded: () => void;
  initialData?: any;
}

export default function AddConcertForm({ onAdded, initialData }: AddConcertFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // States for skjemaet
  const [artistName, setArtistName] = useState(initialData?.artist_name || '')
  const [venueName, setVenueName] = useState(initialData?.venue_name || '')
  const [concertDate, setConcertDate] = useState(initialData?.concert_date || '')
  const [address, setAddress] = useState(initialData?.address || '')
  const [coordinates, setCoordinates] = useState({
    lat: initialData?.lat || 0,
    lng: initialData?.lng || 0
  })

  // Laster Google Maps skriptet
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
  })

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      const loc = place.geometry?.location;
      
      setVenueName(place.name || '');
      setAddress(place.formatted_address || '');
      if (loc) {
        setCoordinates({
          lat: loc.lat(),
          lng: loc.lng()
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const concertData = {
        artist_name: artistName,
        venue_name: venueName,
        concert_date: concertDate,
        address: address || venueName,
        lat: coordinates.lat,
        lng: coordinates.lng,
      }

      let result;
      if (initialData?.id) {
        result = await supabase.from('concerts').update(concertData).eq('id', initialData.id);
      } else {
        result = await supabase.from('concerts').insert([concertData]);
      }

      if (result.error) {
        alert("Feil: " + result.error.message);
      } else {
        alert("Lagret!");
        onAdded();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 p-8 rounded-3xl border border-white/5 shadow-2xl">
      <h2 className="text-2xl font-black italic uppercase mb-8 text-white tracking-tighter">
        {initialData ? t.forms.edit_title : t.forms.add_title}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ARTIST */}
        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 mb-2">Artist</label>
          <input
            type="text"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-fuchsia-500"
            required
          />
        </div>

        {/* VENUE / STED (Nå med Google Autocomplete) */}
        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 mb-2">Sted</label>
          <div className="relative">
            {isLoaded ? (
              <Autocomplete
                onLoad={(ref) => (autocompleteRef.current = ref)}
                onPlaceChanged={onPlaceChanged}
              >
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-fuchsia-500"
                  placeholder="Søk etter konsertsted..."
                  required
                />
              </Autocomplete>
            ) : (
              <input disabled className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white opacity-50" value="Laster kart..." />
            )}
            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
          </div>
        </div>

        {/* DATE */}
        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 mb-2">Dato</label>
          <input
            type="date"
            value={concertDate}
            onChange={(e) => setConcertDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-fuchsia-500 [color-scheme:dark]"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black uppercase p-4 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {initialData ? "Lagre endringer" : "Legg til konsert"}
        </button>
      </form>
    </div>
  )
}