'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api'
import TicketCard from '@/components/Concerts/TicketCard'
import ImageModal from '@/components/Concerts/ImageModal'

const libraries: ("places")[] = ["places"];

const mapOptions = {
  disableDefaultUI: false,
  fullscreenControl: true,
  streetViewControl: true,
  mapTypeControl: false,
  styles: [
    { "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#cbd5e1" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0f172a" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
  ]
};

export default function ShareProfile() {
  const params = useParams()
  // 1. Vi dekoder URL-en og bytter ut bindestreker med mellomrom for å finne riktig navn i DB
  const rawUsername = params.username ? decodeURIComponent(params.username as string) : ''
  const decodedUsername = rawUsername.replace(/-/g, ' ')

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
  })

  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [concerts, setConcerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConcert, setSelectedConcert] = useState<any>(null)
  const [profileExists, setProfileExists] = useState(true)
  const [actualUsername, setActualUsername] = useState('') // For å vise navnet slik det er lagret i DB

  useEffect(() => {
    const fetchPublicProfile = async () => {
      if (!decodedUsername) return;

      // 2. Vi bruker .ilike for å være case-insensitive
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', decodedUsername)
        .maybeSingle()

      if (profile) {
        setActualUsername(profile.username)
        const { data: concertData } = await supabase
          .from('concerts')
          .select('*')
          .eq('user_id', profile.id)
          .order('concert_date', { ascending: false })
        
        if (concertData) setConcerts(concertData)
        setProfileExists(true)
      } else {
        setProfileExists(false)
      }
      setLoading(false)
    }

    fetchPublicProfile()
  }, [decodedUsername])

  if (loading || !isLoaded) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-fuchsia-500 border-t-transparent rounded-full" />
    </div>
  )

  if (!profileExists) return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <h1 className="text-4xl font-black uppercase italic mb-4">404 / Ingen profil funnet</h1>
        <p className="text-slate-500 uppercase text-[10px] tracking-widest font-bold">Brukernavnet "{decodedUsername}" finnes ikke.</p>
    </div>
  )

  const uniqueCities = new Set(concerts.map(c => {
      const parts = c.address?.split(',') || [];
      return parts.length >= 2 ? parts[parts.length - 2].trim() : c.venue_name;
  })).size;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8 pb-24 font-sans">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <p className="text-[10px] uppercase tracking-[0.5em] text-fuchsia-500 font-black mb-2 italic">Public Collection</p>
        <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none break-words">
          {actualUsername || decodedUsername}
        </h1>
        <div className="h-1 w-20 bg-fuchsia-600 mx-auto mt-6 shadow-[0_0_15px_rgba(217,70,239,0.5)]" />
      </div>

      {/* Stats Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 mb-12 text-center">
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
          <p className="text-3xl font-black italic leading-none mb-1">{concerts.length}</p>
          <p className="text-[8px] uppercase font-bold text-slate-500 tracking-widest">Gigs</p>
        </div>
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
          <p className="text-3xl font-black italic leading-none mb-1">{uniqueCities || 0}</p>
          <p className="text-[8px] uppercase font-bold text-slate-500 tracking-widest">Cities</p>
        </div>
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
          <p className="text-3xl font-black italic leading-none mb-1">
            {concerts.filter(c => Array.isArray(c.event_img_url) && c.event_img_url.length > 0).length}
          </p>
          <p className="text-[8px] uppercase font-bold text-slate-500 tracking-widest">Photos</p>
        </div>
      </div>

      {/* Map Section */}
      {concerts.length > 0 && (
        <div className="max-w-4xl mx-auto mb-12 rounded-3xl overflow-hidden border border-slate-800 h-[400px] shadow-2xl relative">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={{ lat: Number(concerts[0].lat), lng: Number(concerts[0].lng) }}
            zoom={4}
            options={mapOptions}
          >
            {concerts.map(concert => (
              <MarkerF 
                key={concert.id} 
                position={{ lat: Number(concert.lat), lng: Number(concert.lng) }} 
                onClick={() => setSelectedConcert(concert)}
                icon={{
                  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                  fillColor: "#d946ef",
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: "#ffffff",
                  scale: 1.3,
                  anchor: new google.maps.Point(12, 22)
                }}
              />
            ))}

            {selectedConcert && (
              <InfoWindowF
                position={{ lat: Number(selectedConcert.lat), lng: Number(selectedConcert.lng) }}
                onCloseClick={() => setSelectedConcert(null)}
              >
                <div className="p-2 min-w-[150px] max-w-[200px] text-slate-900 font-sans">
                  {Array.isArray(selectedConcert.event_img_url) && selectedConcert.event_img_url.length > 0 && (
                    <div 
                      className="mb-2 rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity relative"
                      onClick={() => setIsMapModalOpen(true)}
                    >
                      <img 
                        src={selectedConcert.event_img_url[0]} 
                        alt={selectedConcert.artist_name}
                        className="w-full h-20 object-cover"
                      />
                      {selectedConcert.event_img_url.length > 1 && (
                        <div className="absolute top-1 right-1 bg-fuchsia-600 text-white text-[8px] px-1 rounded font-bold">
                          +{selectedConcert.event_img_url.length - 1}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <h3 className="text-xs font-black uppercase leading-tight">
                    {selectedConcert.artist_name}
                  </h3>
                  <p className="text-[10px] text-slate-600 italic mt-1 font-medium">
                    {selectedConcert.venue_name}
                  </p>
                  <p className="text-[9px] text-fuchsia-600 font-bold mt-1 uppercase tracking-tighter">
                    {new Date(selectedConcert.concert_date).toLocaleDateString('no-NO', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        </div>
      )}

      {/* Archive Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {concerts.map((concert) => (
          <TicketCard key={concert.id} concert={concert} isPublicView={true} /> 
        ))}
      </div>

      {/* Galleri-modal trigget fra kartet */}
      {isMapModalOpen && selectedConcert && (
        <ImageModal 
          images={selectedConcert.event_img_url} 
          onClose={() => setIsMapModalOpen(false)} 
          title={selectedConcert.artist_name}
          venue={selectedConcert.venue_name}
          date={new Date(selectedConcert.concert_date).toLocaleDateString('nb-NO', { 
            day: 'numeric', month: 'long', year: 'numeric' 
          })}
        />
      )}
    </main>
  )
}