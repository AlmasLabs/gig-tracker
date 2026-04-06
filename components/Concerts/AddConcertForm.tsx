'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useTranslation } from '@/app/context/LanguageContext'
import { Calendar, Music, MapPin, Loader2, Image as ImageIcon, Upload } from 'lucide-react'
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
  
  // States for skjemaet
  const [artistName, setArtistName] = useState(initialData?.artist_name || '')
  const [venueName, setVenueName] = useState(initialData?.venue_name || '')
  const [concertDate, setConcertDate] = useState(initialData?.concert_date || '')
  const [address, setAddress] = useState(initialData?.address || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null)
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

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
  })

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      const loc = place.geometry?.location;
      if (place.name) setVenueName(place.name);
      if (place.formatted_address) setAddress(place.formatted_address);
      if (loc) {
        setCoordinates({ lat: loc.lat(), lng: loc.lng() });
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `concert-photos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('concert-photos')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('concert-photos').getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      let imageUrl = imagePreview

      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const concertData = {
        artist_name: artistName,
        venue_name: venueName,
        concert_date: concertDate,
        address: address || venueName,
        lat: coordinates.lat,
        lng: coordinates.lng,
        image_url: imageUrl,
        user_id: userId,
      }

      let result;
      if (initialData?.id) {
        result = await supabase.from('concerts').update(concertData).eq('id', initialData.id);
      } else {
        result = await supabase.from('concerts').insert([concertData]);
      }

      if (result.error) throw result.error
      
      alert("Suksess! Alt er lagret.");
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
        {initialData ? t.forms.edit_title : t.forms.add_title}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* BILDEOPPLASTING */}
        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 mb-2">Bilde</label>
          <div className="relative h-40 w-full bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl overflow-hidden group-hover:border-fuchsia-500/50 transition-all">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <ImageIcon size={32} className="mb-2" />
                <span className="text-xs uppercase font-bold tracking-widest">Last opp bilde</span>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
          </div>
        </div>

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

        {/* STED */}
        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500 mb-2">Sted</label>
          <div className="relative">
            {isLoaded ? (
              <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)} onPlaceChanged={onPlaceChanged}>
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
              <input disabled className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white opacity-50" value="Laster..." />
            )}
            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
          </div>
        </div>

        {/* DATO */}
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
          {loading ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
          {initialData ? "Lagre" : "Publiser konsert"}
        </button>
      </form>
    </div>
  )
}