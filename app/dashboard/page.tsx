'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api'
import { BarChart3, Music, LogOut, ChevronDown, Check, User, MessageSquare, X, Send, Settings } from 'lucide-react'
import AddConcertForm from '@/components/Concerts/AddConcertForm'
import TicketCard from '@/components/Concerts/TicketCard'
import ImageModal from '@/components/Concerts/ImageModal'
import StatsView from '@/components/Stats/StatsView'
import { useTranslation } from "@/app/context/LanguageContext";

const libraries: ("places")[] = ["places"];

const getCountryCode = (address: string) => {
  if (!address) return null;
  const parts = address.split(',');
  const country = parts[parts.length - 1].trim().toLowerCase();
  const countryMap: { [key: string]: string } = {
    'norway': 'no', 'norge': 'no', 'sweden': 'se', 'sverige': 'se',
    'denmark': 'dk', 'danmark': 'dk', 'germany': 'de', 'tyskland': 'de',
    'uk': 'gb', 'united kingdom': 'gb', 'storbritannia': 'gb',
    'usa': 'us', 'united states': 'us', 'france': 'fr', 'frankrike': 'fr',
    'italy': 'it', 'italia': 'it', 'spain': 'es', 'spania': 'es',
    'netherlands': 'nl', 'nederland': 'nl'
  };
  return countryMap[country] || null;
};

const mapOptions = {
  disableDefaultUI: false,
  fullscreenControl: true,
  streetViewControl: true,
  mapTypeControl: false,
  zoomControl: true,
  styles: [
    { "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#cbd5e1" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0f172a" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
    { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] }
  ]
};

export default function Dashboard() {
  const { t, locale, setLocale } = useTranslation();
  const router = useRouter()
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
  })

  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [isSendingFeedback, setIsSendingFeedback] = useState(false)

  const [username, setUsername] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [concerts, setConcerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'share' | 'stats'>('list')
  const [selectedConcert, setSelectedConcert] = useState<any>(null)
  const [editingConcert, setEditingConcert] = useState<any>(null)

  const ADMIN_ID = "909efde9-653a-4fce-a026-10a7a984e109"; 

  useEffect(() => {
    const getInitialData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return; }
      
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, preferred_language')
        .eq('id', session.user.id)
        .maybeSingle()
      
      setUsername(profile?.username || "Ny Bruker")
      if (profile?.preferred_language) setLocale(profile.preferred_language);

      await fetchConcerts(session.user.id)
      setLoading(false)
    }
    getInitialData()
  }, [router, setLocale])

  const fetchConcerts = async (userId: string) => {
    const { data, error } = await supabase
      .from('concerts')
      .select('*')
      .eq('user_id', userId)
      .order('concert_date', { ascending: false })
    if (!error && data) setConcerts(data)
  }

  const handleLogout = async () => {
    if (window.confirm(t.common.logout_confirm)) {
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    
    setIsSendingFeedback(true);
    try {
      // 1. Lagre i Supabase
      const { error } = await supabase
        .from('feedback')
        .insert([{ 
          user_id: userId, 
          username: username,
          message: feedbackText.trim() 
        }]);

      if (error) throw error;

      // 2. Send e-postvarsling via Formspree
      await fetch("https://formspree.io/f/mwvwarln", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `GIG-TRACKER: Feedback fra ${username}`,
          user: username,
          message: feedbackText.trim()
        })
      });

      const successMsg = t?.common?.feedback_success || "Takk for tilbakemeldingen!";
      alert(successMsg);

      setFeedbackText('');
      setIsFeedbackOpen(false);
    } catch (err) {
      const errorMsg = t?.common?.feedback_error || "Kunne ikke sende meldingen.";
      alert(errorMsg);
      console.error("Feedback error:", err);
    } finally {
      setIsSendingFeedback(false);
    }
  }

  if (loading || !isLoaded) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-fuchsia-500 font-black italic animate-pulse uppercase tracking-widest text-sm">
      {t?.common?.loading || "LOADING..."}
    </div>
  )

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-6 pb-24 font-sans">
      
      {/* TOPBAR */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-10 pt-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none text-fuchsia-500">GIG-TRACKER</h1>
          <p className="text-[8px] uppercase tracking-[0.4em] text-slate-600 font-bold mt-1">Live Archive</p>
        </div>

        <div className="relative z-50">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-1.5 pr-4 rounded-full shadow-xl transition-all hover:border-slate-700"
          >
            <div className="w-8 h-8 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-500">
              <User size={18} />
            </div>
            <p className="text-[10px] font-black uppercase hidden sm:block">{username}</p>
            <ChevronDown size={14} className={`text-slate-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-0" onClick={() => setIsProfileOpen(false)} />
              <div className="absolute right-0 mt-3 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/30">
                  <p className="text-[9px] font-black text-slate-500 uppercase">{t.common.authenticated}</p>
                  <p className="text-xs font-bold truncate">{username}</p>
                </div>
                <div className="p-1">
                  <button onClick={() => { setLocale('no'); setIsProfileOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase ${locale === 'no' ? 'text-fuchsia-500 bg-fuchsia-500/5' : 'text-slate-400 hover:bg-slate-800'}`}>
                    <div className="flex items-center gap-2">
                      <img src="https://flagcdn.com/w20/no.png" className="w-4 h-auto rounded-sm" alt="NO" /> Norsk
                    </div>
                    {locale === 'no' && <Check size={12} />}
                  </button>
                  <button onClick={() => { setLocale('en'); setIsProfileOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase ${locale === 'en' ? 'text-fuchsia-500 bg-fuchsia-500/5' : 'text-slate-400 hover:bg-slate-800'}`}>
                    <div className="flex items-center gap-2">
                      <img src="https://flagcdn.com/w20/gb.png" className="w-4 h-auto rounded-sm" alt="EN" /> English
                    </div>
                    {locale === 'en' && <Check size={12} />}
                  </button>
                  
                  <div className="my-1 border-t border-slate-800" />
                  
                  <button onClick={() => { setIsFeedbackOpen(true); setIsProfileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase text-slate-300 hover:bg-slate-800 transition-colors">
                    <MessageSquare size={14} className="text-fuchsia-500" /> {t.common.feedback}
                  </button>

                  {userId === ADMIN_ID && (
                    <button 
                      onClick={() => { router.push('/admin/feedback'); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase text-fuchsia-400 hover:bg-fuchsia-500/10 transition-colors"
                    >
                      <Settings size={14} /> Admin Panel
                    </button>
                  )}

                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase text-red-400 hover:bg-red-500/10">
                    <LogOut size={14} /> {t.common.logout}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* FEEDBACK MODAL */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsFeedbackOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl text-center">
            <button onClick={() => setIsFeedbackOpen(false)} className="absolute right-6 top-6 text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-xl font-black italic uppercase text-fuchsia-500 mb-2 tracking-tighter">
              {t.common.feedback}
            </h2>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-6">
              {t.common.feedback_prompt}
            </p>
            <textarea 
              autoFocus
              className="w-full h-32 bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm outline-none focus:border-fuchsia-500 transition-all resize-none mb-6 text-white"
              placeholder={t?.common?.feedback_placeholder || "..."}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
            <button 
              onClick={submitFeedback}
              disabled={isSendingFeedback || !feedbackText.trim()}
              className="w-full bg-fuchsia-600 p-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all text-white"
            >
              {isSendingFeedback ? '...' : <><Send size={14}/> {t?.common?.feedback_send || "SEND"}</>}
            </button>
          </div>
        </div>
      )}

      {/* NAVIGASJON */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <NavCard active={activeTab === 'list'} onClick={() => setActiveTab('list')} emoji="🎸" title={t.nav.gigs} sub={t.nav.archive} />
        <NavCard active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 size={24} />} title={t.nav.stats} sub={t.nav.stats_sub} />
        <NavCard active={activeTab === 'share'} onClick={() => setActiveTab('share')} emoji="🔗" title={t.nav.share} sub={t.nav.share_sub} />
        <NavCard active={activeTab === 'add'} onClick={() => setActiveTab('add')} emoji="+" title={t.nav.add} sub={t.nav.add_sub} highlight />
      </div>

      <div className="max-w-4xl mx-auto">
        {activeTab === 'list' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {concerts.length > 0 && (
              <div className="rounded-3xl overflow-hidden border border-slate-800 h-[400px] shadow-2xl relative">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat: Number(concerts[0].lat), lng: Number(concerts[0].lng) }}
                  zoom={5}
                  options={mapOptions}
                >
                  {concerts.map(concert => (
                    <MarkerF 
                      key={concert.id} 
                      position={{ lat: Number(concert.lat), lng: Number(concert.lng) }} 
                      onClick={() => setSelectedConcert(concert)}
                      icon={{ 
                        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z", 
                        fillColor: "#d946ef", fillOpacity: 1, strokeWeight: 2, strokeColor: "#ffffff", scale: 1.5, anchor: new google.maps.Point(12, 22)
                      }}
                    />
                  ))}
                  {selectedConcert && (
                    <InfoWindowF position={{ lat: Number(selectedConcert.lat), lng: Number(selectedConcert.lng) }} onCloseClick={() => setSelectedConcert(null)}>
                      <div className="p-2 min-w-[200px] text-slate-900 bg-white">
                        {Array.isArray(selectedConcert.event_img_url) && selectedConcert.event_img_url.length > 0 ? (
                          <div className="mb-3 rounded-lg overflow-hidden h-32 w-full bg-slate-50 cursor-pointer relative" onClick={() => setIsMapModalOpen(true)}>
                            <img src={selectedConcert.event_img_url[0]} className="w-full h-full object-cover" alt={selectedConcert.artist_name} />
                          </div>
                        ) : (
                          <div className="mb-3 h-32 w-full bg-slate-100 rounded-lg flex items-center justify-center text-slate-300"><Music size={24} /></div>
                        )}
                        <h3 className="font-black uppercase italic text-sm mb-1">{selectedConcert.artist_name}</h3>
                        <p className="text-[10px] font-bold text-fuchsia-600 uppercase">{selectedConcert.venue_name}</p>
                      </div>
                    </InfoWindowF>
                  )}
                </GoogleMap>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              {concerts.map((concert) => (
                <TicketCard 
                  key={concert.id} 
                  concert={concert} 
                  onEdit={(c) => { setEditingConcert(c); setActiveTab('add'); }} 
                  onDelete={async (id) => { 
                    if(confirm(locale === 'no' ? "Slette?" : "Delete?")) { 
                      await supabase.from('concerts').delete().eq('id', id); 
                      fetchConcerts(userId || ""); 
                    } 
                  }} 
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stats' && <StatsView concerts={concerts} />}
        {activeTab === 'add' && (
          <AddConcertForm 
            initialData={editingConcert} 
            onAdded={async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) await fetchConcerts(session.user.id);
              setEditingConcert(null); setActiveTab('list');
            }} 
          />
        )}
      </div>

      {isMapModalOpen && selectedConcert && (
        <ImageModal 
          images={Array.isArray(selectedConcert.event_img_url) ? selectedConcert.event_img_url : []} 
          onClose={() => setIsMapModalOpen(false)} 
          title={selectedConcert.artist_name} venue={selectedConcert.venue_name} date={selectedConcert.concert_date} 
        />
      )}
    </main>
  )
}

function NavCard({ active, onClick, emoji, icon, title, sub, highlight }: any) {
  return (
    <div onClick={onClick} className={`p-6 bg-slate-900 rounded-2xl border transition-all cursor-pointer ${active ? 'border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.1)]' : 'border-slate-800 hover:border-slate-600'}`}>
      <div className={`text-2xl mb-3 ${highlight && !active ? 'text-fuchsia-500' : 'text-white'}`}>{emoji || icon}</div>
      <h3 className={`font-black uppercase tracking-tight mb-1 text-[11px] ${highlight && !active ? 'text-fuchsia-500' : 'text-white'}`}>{title}</h3>
      <p className={`text-[9px] uppercase font-bold tracking-widest ${highlight && !active ? 'text-fuchsia-500/50' : 'text-slate-500'}`}>{sub}</p>
    </div>
  )
}