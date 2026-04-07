'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useTranslation } from '@/app/context/LanguageContext'
import { Calendar, Music, MapPin, Loader2, Image as ImageIcon, Upload, X } from 'lucide-react'
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api'

const libraries: ("places")[] = ["places"];

interface AddConcertFormProps {
  onAdded: () => void;
  initialData?: any;
}

export default function AddConcertForm({ onAdded, initialData }: AddConcertFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // States for flere bilder
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>(() => {
    if (!initialData?.event_img_url) return [];
    return Array.isArray(initialData.event_img_url) ? initialData.event_img_url : [initialData.event_img_url];
  })
  const [previews, setPreviews] = useState<string[]>([])

  // States for tekstfelter - concertDate formateres til YYYY-MM-DD
  const [artistName, setArtistName] = useState(initialData?.artist_name || '')
  const [venueName, setVenueName] = useState(initialData?.venue_name || '')
  const [concertDate, setConcertDate] = useState(() => {
    if (!initialData?.concert_date) return '';
    // Sørger for at datoen er i formatet YYYY-MM-DD (kutter ISO-tid)
    return initialData.concert_date.substring(0, 10);
  })
  const [address, setAddress] = useState(initialData?.address || '')
  const [coordinates, setCoordinates] = useState({
    lat: initialData?.lat || 0,
    lng: initialData?.lng || 0
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  // Oppdaterer feltene hvis initialData endres (f.eks. når modalen åpnes)
  useEffect(() => {
    if (initialData) {
      setArtistName(initialData.artist_name || '');
      setVenueName(initialData.venue_name || '');
      setConcertDate(initialData.concert_date ? initialData.concert_date.substring(0, 10) : '');
      setAddress(initialData.address || '');
      setExistingImages(Array.isArray(initialData.event_img_url) ? initialData.event_img_url : (initialData.event_img_url ? [initialData.event_img_url] : []));
    }
  }, [initialData]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setImageFiles(prev => [...prev, ...filesArray])
      const newPreviews = filesArray.map(file => URL.createObjectURL(file))
      setPreviews(prev => [...prev, ...newPreviews])
    }
  }

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('concert-photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('concert-photos')
        .getPublicUrl(fileName)

      return urlData.publicUrl
    })

    return Promise.all(uploadPromises)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const newImageUrls = await uploadImages(imageFiles)
      const allImages = [...existingImages, ...newImageUrls]

      const concertData = {
        artist_name: artistName,
        venue_name: venueName,
        concert_date: concertDate,
        address: address || venueName,
        lat: coordinates.lat,
        lng: coordinates.lng,
        event_img_url: allImages,
        user_id: userId,
      }

      let result;
      if (initialData?.id) {
        result = await supabase.from('concerts').update(concertData).eq('id', initialData.id);
      } else {
        result = await supabase.from('concerts').insert([concertData]);
      }

      if (result.error) throw result.error
      
      alert("Suksess! Konserten er lagret.");
      onAdded();
    } catch (err: any) {
      alert("Feil: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 p-8 rounded-3xl border border-white/5 shadow-2xl">
      <h2 className="text-2xl font-black italic uppercase mb-8 text-white tracking-tighter">
        {initialData ? "Rediger konsert" : "Legg til konsert"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* BILDE-GALLERI */}
        <div className="space-y-4">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 italic">Bilder / Galleri</label>
          <div className="grid grid-cols-3 gap-4">
            {existingImages.map((url, i) => (
              <div key={`exist-${i}`} className="relative h-24 bg-slate-950 rounded-xl overflow-hidden border border-white/10">
                <img src={url} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 bg-red-600 p-1 rounded-full text-white"><X size={12}/></button>
              </div>
            ))}
            {previews.map((url, i) => (
              <div key={`new-${i}`} className="relative h-24 bg-slate-950 rounded-xl overflow-hidden border border-fuchsia-500/30">
                <img src={url} className="w-full h-full object-cover opacity-70" />
                <button type="button" onClick={() => removeNewImage(i)} className="absolute top-1 right-1 bg-red-600 p-1 rounded-full text-white"><X size={12}/></button>
              </div>
            ))}
            <label className="flex flex-col items-center justify-center h-24 bg-slate-950 border-2 border-dashed border-slate-800 rounded-xl hover:border-fuchsia-500/50 transition-all cursor-pointer group">
              <Upload size={20} className="text-slate-500 group-hover:text-fuchsia-500" />
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
        </div>

        {/* ARTIST */}
        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 mb-2 italic">Artist</label>
          <input
            type="text"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-fuchsia-500"
            required
          />
        </div>

        {/* STED */}
        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 mb-2 italic">Sted</label>
          <div className="relative">
            {isLoaded ? (
              <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)} onPlaceChanged={() => {
                const place = autocompleteRef.current?.getPlace();
                if (place) {
                  setVenueName(place.name || '');
                  setAddress(place.formatted_address || '');
                  const loc = place.geometry?.location;
                  if (loc) setCoordinates({ lat: loc.lat(), lng: loc.lng() });
                }
              }}>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-fuchsia-500"
                  placeholder="Søk sted..."
                  required
                />
              </Autocomplete>
            ) : (
              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-500">Laster kart...</div>
            )}
            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
          </div>
        </div>

        {/* DATO */}
        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 mb-2 italic">Dato</label>
          <div className="relative">
            <input
              type="date"
              value={concertDate}
              onChange={(e) => setConcertDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-fuchsia-500 [color-scheme:dark]"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black uppercase p-5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/20"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
          {initialData ? "Oppdater Konsert" : "Publiser Konsert"}
        </button>
      </form>
    </div>
  )
}