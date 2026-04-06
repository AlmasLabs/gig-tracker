'use client'
import { Trophy, MapPin, Activity } from 'lucide-react'
import { useTranslation } from "@/app/context/LanguageContext";

interface StatsViewProps {
  concerts: any[]
}

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
    'netherlands': 'nl', 'nederland': 'nl'
  };
  return countryMap[country] || null;
};

export default function StatsView({ concerts }: StatsViewProps) {
  const { t } = useTranslation();

  // 1. Logikk for Topp 5 Artister
  const artistCounts = concerts.reduce((acc: any, c) => {
    const name = c.artist_name || t.common.unknown_artist;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const topArtists = Object.entries(artistCounts)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxArtistCount = topArtists[0]?.count || 1;

  // 2. Logikk for Topp 3 Spillesteder
  const venueCounts = concerts.reduce((acc: any, c) => {
    const venueKey = c.venue_name || t.common.unknown_venue;
    if (!acc[venueKey]) {
      acc[venueKey] = { count: 0, address: c.address };
    }
    acc[venueKey].count += 1;
    return acc;
  }, {});

  const topVenues = Object.entries(venueCounts)
    .map(([name, data]: [string, any]) => ({ name, count: data.count, address: data.address }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // 3. Konserter per år
  const yearCounts = concerts.reduce((acc: any, c) => {
    const year = new Date(c.concert_date).getFullYear();
    if (!isNaN(year)) acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});

  const sortedYears = Object.entries(yearCounts)
    .sort(([a], [b]) => Number(b) - Number(a));

  return (
    <div className="mt-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* HEAVY ROTATION (TOPP ARTISTER) */}
        <div className="md:col-span-2 bg-slate-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-fuchsia-500/20 rounded-lg text-fuchsia-500">
                <Trophy size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white italic">
                {t.stats_view.heavy_rotation}
              </h3>
            </div>
          </div>
          
          <div className="space-y-6">
            {topArtists.map((artist, i) => (
              <div key={i} className="group">
                <div className="flex justify-between items-end mb-2 px-1">
                  <span className="text-lg font-black italic uppercase tracking-tighter text-slate-200 group-hover:text-fuchsia-400 transition-colors">
                    {artist.name}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {artist.count} {t.stats_view.gigs_unit}
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-950/50 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(217,70,239,0.3)]"
                    style={{ width: `${(artist.count / maxArtistCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECOND HOMES (TOPP STEDER) */}
        <div className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-fuchsia-500/20 rounded-lg text-fuchsia-500">
              <MapPin size={20} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white italic">
              {t.stats_view.second_homes}
            </h3>
          </div>
          
          <div className="space-y-4">
            {topVenues.map((venue, i) => {
              const code = getCountryCode(venue.address);
              return (
                <div key={i} className="flex flex-col p-4 bg-slate-950/40 border border-white/5 rounded-2xl hover:border-fuchsia-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest">
                        {venue.count} {t.stats_view.visits}
                      </span>
                      {code && (
                        <img 
                          src={`https://flagcdn.com/w40/${code}.png`} 
                          alt="flag" 
                          className="w-4 h-auto rounded-[1px] opacity-80 group-hover:opacity-100 transition-opacity border border-white/10"
                        />
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                      {venue.name}
                    </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TIMELINE (KONSERTER PER ÅR) */}
      <div className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-fuchsia-500/20 rounded-lg text-fuchsia-500">
            <Activity size={20} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white italic">
            {t.stats_view.timeline}
          </h3>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {sortedYears.map(([year, count]) => (
            <div key={year} className="flex-shrink-0 flex flex-col items-center bg-slate-950/60 border border-white/5 rounded-2xl p-6 min-w-[100px] hover:border-fuchsia-500/50 transition-all">
              <span className="text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">{year}</span>
              <span className="text-4xl font-black italic text-fuchsia-500 leading-none tracking-tighter">{String(count)}</span>
              <span className="text-[8px] font-bold text-slate-600 mt-2 uppercase">
                {t.stats_view.gigs_unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}