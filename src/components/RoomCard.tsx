import React, { useState } from 'react';
import { Heart, MapPin, ShieldCheck, Zap, Droplets, Wifi, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Room } from '../types';

interface RoomCardProps {
  room: Room;
  isFavorite: boolean;
  onToggleFavorite: (roomId: string) => void;
  onSelect: (room: Room) => void;
  onApply: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onApply
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = room.images && room.images.length > 0 ? room.images : [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
  ];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const hasGenerator = room.amenities.some(a => a.toLowerCase().includes('generator'));
  const hasPolyTank = room.amenities.some(a => a.toLowerCase().includes('poly tank') || a.toLowerCase().includes('water'));
  const hasWifi = room.amenities.some(a => a.toLowerCase().includes('wi-fi') || a.toLowerCase().includes('wifi'));

  return (
    <div 
      onClick={() => onSelect(room)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg hover:shadow-2xl hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all duration-300 cursor-pointer"
    >
      {/* Photo Media Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
        <img
          src={images[activeImageIndex]}
          alt={room.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Subtle dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Room Type Tag */}
          <span className="rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 backdrop-blur-md border border-emerald-500/30 shadow-md">
            {room.roomType}
          </span>

          {/* Favorite Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(room.id);
            }}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-rose-400 hover:scale-110 active:scale-95 transition-all shadow-md"
            aria-label={isFavorite ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Photo Slider Controls (visible on hover) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeImageIndex ? 'w-4 bg-emerald-400' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Location badge on bottom photo */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-medium text-slate-200 bg-slate-950/80 px-2.5 py-0.5 rounded-full backdrop-blur-md border border-slate-700/40">
          <MapPin className="h-3 w-3 text-emerald-400" />
          <span>{room.neighborhood}, {room.city}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-4 justify-between">
        <div>
          {/* Ghana-Specific Power & Water Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {hasGenerator && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/20">
                <Zap className="h-3 w-3 fill-amber-400 text-amber-400" /> Plant Backup
              </span>
            )}
            {hasPolyTank && (
              <span className="inline-flex items-center gap-1 rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/20">
                <Droplets className="h-3 w-3 text-cyan-400" /> Poly Tank
              </span>
            )}
            {hasWifi && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/20">
                <Wifi className="h-3 w-3 text-emerald-400" /> Wi-Fi
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="line-clamp-2 text-sm font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
            {room.title}
          </h3>

          {/* Landlord verification strip */}
          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1 font-medium text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              {room.landlordName}
            </span>
            <span>•</span>
            <span>{room.minLeaseMonths} mo min lease</span>
          </div>
        </div>

        {/* Pricing & Actions Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-emerald-400">
                GH₵ {room.price.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">/mo</span>
            </div>
            {room.billsIncluded ? (
              <span className="text-[10px] font-semibold text-teal-400">Bills bundled</span>
            ) : (
              <span className="text-[10px] text-slate-400">Excludes utilities</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onApply(room);
              }}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(room);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
