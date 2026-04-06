'use client'
import { useState } from 'react'
import { GoogleMap, MarkerF, InfoWindowF } from '@react-google-maps/api'
import { Calendar, MapPin, ImageIcon } from 'lucide-react'
import ImageModal from '../Concerts/ImageModal'

const containerStyle = { width: '100%', height: '100%', borderRadius: '12px' }
const center = { lat: 59.91, lng: 10.75 }

export default function ConcertMap({ concerts }: { concerts: any[] }) {
  const [selectedConcert, setSelectedConcert] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Hjelpefunksjon for bilde-logikk
  const getImages = (concert: any) => {
    return Array.isArray(concert?.event_img_url) ? concert.event_img_url : []
  }

  return (
    <>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={4}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          styles: [
            { "elementType": "geometry", "stylers": [{ "color": "#2b3544" }] },
            { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
            { "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca3af" }] },
            { "elementType": "labels.text.stroke", "stylers": [{ "color": "#111827" }] },
            {
              "featureType": "administrative.locality",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#d946ef" }] 
            },
            {
              "featureType": "road",
              "elementType": "geometry",
              "stylers": [{ "color": "#334155" }]
            },
            {
              "featureType": "road.highway",
              "elementType": "geometry",
              "stylers": [{ "color": "#475569" }]
            },
            {
              "featureType": "poi.park",
              "elementType": "geometry",
              "stylers": [{ "color": "#1e293b" }]
            }
          ]
        }}
      >
        {concerts.map((concert) => (
          <MarkerF
            key={concert.id}
            position={{ lat: Number(concert.lat), lng: Number(concert.lng) }}
            onClick={() => setSelectedConcert(concert)}
          />
        ))}

        {selectedConcert && (
          <InfoWindowF
            position={{ lat: Number(selectedConcert.lat), lng: Number(selectedConcert.lng) }}
            onCloseClick={() => setSelectedConcert(null)}
          >
            <div className="p-1 max-w-[200px] text-slate-900 font-sans">
              {/* Klikkbart bilde-teaser */}
              {getImages(selectedConcert).length > 0 && (
                <div 
                  className="relative mb-2 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setIsModalOpen(true)}
                >
                  <img 
                    src={getImages(selectedConcert)[0]} 
                    className="w-full h-24 object-cover" 
                    alt={selectedConcert.artist_name}
                  />
                  {getImages(selectedConcert).length > 1 && (
                    <div className="absolute bottom-1 right-1 bg-fuchsia-600 text-white text-[8px] px-1 rounded font-bold">
                      <ImageIcon size={8} className="inline mr-0.5" /> +{getImages(selectedConcert).length - 1}
                    </div>
                  )}
                </div>
              )}

              <h4 className="font-black uppercase italic text-sm text-fuchsia-600 leading-none">
                {selectedConcert.artist_name}
              </h4>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-600 font-bold">
                <MapPin size={10} className="text-fuchsia-500" /> {selectedConcert.venue_name}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                <Calendar size={10} className="text-fuchsia-500" /> 
                {new Date(selectedConcert.concert_date).toLocaleDateString('nb-NO', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
              
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-2 w-full py-1 bg-slate-100 hover:bg-fuchsia-50 text-[9px] uppercase font-black text-slate-600 hover:text-fuchsia-600 rounded transition-colors border border-slate-200"
              >
                Se detaljer & bilder
              </button>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* MODALEN som faktisk viser settlisten */}
      {isModalOpen && selectedConcert && (
        <ImageModal 
  images={getImages(selectedConcert)} 
  onClose={() => setIsModalOpen(false)}
  title={selectedConcert.artist_name}
  venue={selectedConcert.venue_name}
  // Denne linjen sørger for at vi sender YYYY-MM-DD uansett format:
  date={new Date(selectedConcert.concert_date).toISOString().split('T')[0]} 
/>
      )}
    </>
  )
}