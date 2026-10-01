import React, { useState, useMemo } from 'react';
import { Room } from '../types';
import { 
  MapPin, ShieldCheck, Zap, Droplets, ArrowRight, 
  Building2, Compass, Layers, Plus, Minus, Navigation 
} from 'lucide-react';

interface MapExplorerProps {
  rooms: Room[];
  selectedCity: string;
  onSelectRoom: (room: Room) => void;
  onApplyRoom: (room: Room) => void;
}

// Preset Ghana City Coordinates
const CITY_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  'Accra': { lat: 5.6037, lng: -0.1870, zoom: 12 },
  'Kumasi': { lat: 6.6885, lng: -1.6244, zoom: 12 },
  'Takoradi': { lat: 4.8872, lng: -1.7586, zoom: 13 },
  'Tema': { lat: 5.6700, lng: -0.0100, zoom: 13 },
  'Cape Coast': { lat: 5.1053, lng: -1.2466, zoom: 13 },
  'Tamale': { lat: 9.4008, lng: -0.8393, zoom: 12 },
  'All Cities': { lat: 6.5000, lng: -1.0000, zoom: 7 }
};

// Default neighbourhood coordinate map for Ghana properties
const NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  'East Legon': { lat: 5.6358, lng: -0.1601 },
  'Cantonments': { lat: 5.5786, lng: -0.1742 },
  'Osu': { lat: 5.5560, lng: -0.1818 },
  'Airport Residential': { lat: 5.6025, lng: -0.1775 },
  'Spintex': { lat: 5.6267, lng: -0.1031 },
  'Dzorwulu': { lat: 5.6083, lng: -0.1983 },
  'Dansoman': { lat: 5.5483, lng: -0.2608 },
  'Madina': { lat: 5.6672, lng: -0.1652 },
  'Ahodwo': { lat: 6.6667, lng: -1.6167 },
  'KNUST Campus': { lat: 6.6744, lng: -1.5716 },
  'Nhyiaeso': { lat: 6.6800, lng: -1.6250 },
  'Bantama': { lat: 6.7000, lng: -1.6333 },
  'Beach Road': { lat: 4.8872, lng: -1.7586 },
  'Anaji': { lat: 4.9200, lng: -1.7650 }
};

export const MapExplorer: React.FC<MapExplorerProps> = ({
  rooms,
  selectedCity,
  onSelectRoom,
  onApplyRoom
}) => {
  const [activeCity, setActiveCity] = useState<string>(selectedCity || 'All Cities');
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(rooms[0] || null);
  const [mapLayer, setMapLayer] = useState<'m' | 'k' | 'h'>('m'); // m = Roadmap, k = Satellite, h = Hybrid

  // Filter rooms by city selection
  const cityRooms = useMemo(() => {
    if (activeCity === 'All Cities') return rooms;
    return rooms.filter(r => r.city.toLowerCase() === activeCity.toLowerCase());
  }, [rooms, activeCity]);

  // Center coordinates
  const currentCityCoords = CITY_COORDINATES[activeCity] || CITY_COORDINATES['All Cities'];

  // Helper to get coordinates for a room
  const getRoomCoords = (room: Room) => {
    if (room.lat && room.lng) return { lat: room.lat, lng: room.lng };
    if (NEIGHBORHOOD_COORDS[room.neighborhood]) return NEIGHBORHOOD_COORDS[room.neighborhood];
    return currentCityCoords;
  };

  // Determine active query for Google Maps embed
  const activeMapQuery = useMemo(() => {
    if (selectedRoom) {
      if (selectedRoom.lat && selectedRoom.lng) {
        return `${selectedRoom.lat},${selectedRoom.lng}`;
      }
      return `${selectedRoom.neighborhood}, ${selectedRoom.city}, Ghana`;
    }
    if (activeCity !== 'All Cities') {
      return `${activeCity}, Ghana`;
    }
    return `Accra, Ghana`;
  }, [selectedRoom, activeCity]);

  // Google Maps Embed URL
  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(activeMapQuery)}&t=${mapLayer}&z=14&ie=UTF8&iwloc=&output=embed`;

  // Direct Google Maps Mobile/Desktop App Navigation URL
  const getGoogleMapsNavUrl = (room: Room) => {
    if (room.lat && room.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${room.lat},${room.lng}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${room.address || room.neighborhood}, ${room.city}, Ghana`)}`;
  };

  return (
    <div className="space-y-4">
      
      {/* Map City & Region Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google Maps" 
            className="h-4 w-4 shrink-0" 
          />
          <span className="text-xs font-bold text-white">Google Maps Ghana Property Explorer</span>
          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
            {cityRooms.length} Pinned Properties
          </span>
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {Object.keys(CITY_COORDINATES).map((city) => (
            <button
              key={city}
              onClick={() => {
                setActiveCity(city);
                const matching = rooms.filter(r => city === 'All Cities' || r.city.toLowerCase() === city.toLowerCase());
                if (matching.length > 0) setSelectedRoom(matching[0]);
              }}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all whitespace-nowrap ${
                activeCity === city
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800/80 hover:text-white'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Visualization & Details Panel Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Google Maps Visualizer Viewport */}
        <div className="lg:col-span-2 flex flex-col space-y-3">
          
          {/* Map Layer Selector Toolbar */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-2 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span className="font-bold text-white truncate max-w-[200px] sm:max-w-none">
                {selectedRoom ? `${selectedRoom.title} (${selectedRoom.neighborhood})` : `${activeCity} Region`}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setMapLayer('m')}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                  mapLayer === 'm' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white bg-slate-900'
                }`}
              >
                Roadmap
              </button>
              <button
                onClick={() => setMapLayer('k')}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                  mapLayer === 'k' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white bg-slate-900'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setMapLayer('h')}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                  mapLayer === 'h' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white bg-slate-900'
                }`}
              >
                Hybrid
              </button>
            </div>
          </div>

          {/* Embedded Interactive Google Map Iframe Container */}
          <div className="relative h-[400px] sm:h-[460px] w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
            <iframe
              title="Google Maps Location View"
              src={googleMapEmbedUrl}
              className="h-full w-full border-0 filter brightness-95 contrast-105"
              loading="lazy"
              allowFullScreen
            />

            {/* Quick Property Selector Pins Bar Overlay */}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-2 overflow-x-auto p-2 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-800">
              {cityRooms.map((room) => {
                const isSelected = selectedRoom?.id === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 border ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[110px]">{room.neighborhood}</span>
                    <span className="font-extrabold text-[11px]">GH₵ {room.price.toLocaleString()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Room Details Preview Card Panel */}
        <div className="lg:col-span-1">
          {selectedRoom ? (
            <div className="h-full rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-4">
              
              <div className="space-y-3">
                {/* Photo & Badge */}
                <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-slate-800">
                  <img
                    src={selectedRoom.images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'}
                    alt={selectedRoom.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 rounded-full bg-slate-950/80 border border-slate-800 px-2.5 py-1 text-[10px] font-extrabold text-emerald-400 backdrop-blur">
                    {selectedRoom.roomType}
                  </div>
                  <div className="absolute bottom-2 right-2 rounded-xl bg-emerald-500 px-3 py-1 text-xs font-black text-slate-950 shadow-md">
                    GH₵ {selectedRoom.price.toLocaleString()} <span className="text-[9px] font-normal">/mo</span>
                  </div>
                </div>

                {/* Title & Location */}
                <div>
                  <h3 className="text-base font-extrabold text-white leading-snug line-clamp-1">
                    {selectedRoom.title}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    {selectedRoom.neighborhood}, {selectedRoom.city}
                  </p>
                </div>

                {/* Amenities Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedRoom.amenities.includes('Standby Generator') && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      <Zap className="h-3 w-3 text-amber-400" /> Generator
                    </span>
                  )}
                  {selectedRoom.amenities.includes('Poly Tank Reservoir') && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                      <Droplets className="h-3 w-3 text-cyan-400" /> Poly Tank
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" /> Verified Homeowner
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {selectedRoom.description}
                </p>

                {/* Google Maps GPS Direct Button */}
                <a
                  href={getGoogleMapsNavUrl(selectedRoom)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 py-2 px-3 text-xs font-bold text-emerald-300 transition-all w-full"
                >
                  <Navigation className="h-3.5 w-3.5 text-emerald-400" />
                  Open Turn-by-Turn GPS on Google Maps App
                </a>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => onSelectRoom(selectedRoom)}
                  className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-white transition-all text-center"
                >
                  View Details
                </button>

                <button
                  onClick={() => onApplyRoom(selectedRoom)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-xs font-bold text-slate-950 transition-all shadow-md shadow-emerald-500/20"
                >
                  Schedule Tour
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full rounded-3xl border border-dashed border-slate-800 p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <Compass className="h-10 w-10 text-slate-600 mb-1" />
              <p className="text-xs font-bold text-white">Select a property pin</p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Click any property button on Google Maps to preview details and schedule tours.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
