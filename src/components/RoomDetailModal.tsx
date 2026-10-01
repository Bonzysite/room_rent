import React, { useState } from 'react';
import { 
  X, MapPin, ShieldCheck, Heart, Calendar, Clock, DollarSign, 
  Wifi, Zap, Droplets, Car, Wind, Utensils, Lock, Sparkles, 
  CheckCircle, MessageSquare, AlertCircle, Share2, Navigation
} from 'lucide-react';
import { Room } from '../types';

interface RoomDetailModalProps {
  room: Room | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (roomId: string) => void;
  onApply: (room: Room) => void;
  onMessageLandlord: (room: Room) => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  room,
  onClose,
  isFavorite,
  onToggleFavorite,
  onApply,
  onMessageLandlord
}) => {
  if (!room) return null;

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Close modal on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const images = room.images && room.images.length > 0 ? room.images : [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
  ];

  const phoneClean = room.landlordPhone ? room.landlordPhone.replace(/[^0-9]/g, '') : '233244128990';
  const whatsappUrl = `https://wa.me/${phoneClean}?text=${encodeURIComponent(`Hi ${room.landlordName}, I am inquiring about "${room.title}" listed for GH₵ ${room.price.toLocaleString()}/mo on RoomShare Ghana.`)}`;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getAmenityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('wi-fi') || lower.includes('wifi') || lower.includes('internet')) return <Wifi className="h-4 w-4 text-emerald-400" />;
    if (lower.includes('generator') || lower.includes('plant') || lower.includes('power')) return <Zap className="h-4 w-4 text-amber-400" />;
    if (lower.includes('poly tank') || lower.includes('reservoir') || lower.includes('water')) return <Droplets className="h-4 w-4 text-cyan-400" />;
    if (lower.includes('air conditioning') || lower.includes('ac')) return <Wind className="h-4 w-4 text-blue-400" />;
    if (lower.includes('parking') || lower.includes('garage')) return <Car className="h-4 w-4 text-purple-400" />;
    if (lower.includes('kitchen')) return <Utensils className="h-4 w-4 text-rose-400" />;
    if (lower.includes('security') || lower.includes('guard')) return <Lock className="h-4 w-4 text-emerald-400" />;
    return <Sparkles className="h-4 w-4 text-emerald-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
              {room.roomType}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              {room.neighborhood}, {room.city}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/40 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Share listing link"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onToggleFavorite(room.id)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/40 text-slate-300 hover:text-rose-400 hover:border-slate-700 transition-colors"
              title="Save to wishlist"
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Main Photo Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-950 border border-slate-800">
              <img
                src={images[activePhotoIndex]}
                alt={room.title}
                className="h-full w-full object-cover transition-all duration-300"
              />
              <div className="absolute bottom-3 right-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur-md border border-slate-700">
                Photo {activePhotoIndex + 1} of {images.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIndex(i)}
                    className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl border transition-all ${
                      i === activePhotoIndex
                        ? 'border-emerald-500 ring-2 ring-emerald-500/40'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${i}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Key Specs Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                {room.title}
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                {room.address}, {room.neighborhood}, {room.city}
              </p>

              {/* Key Specs Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-[11px] text-slate-400 block font-medium">Monthly Rent</span>
                  <p className="text-base font-extrabold text-emerald-400">GH₵ {room.price.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-500">{room.billsIncluded ? 'Bills Bundled' : 'Bills Excluded'}</span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-[11px] text-slate-400 block font-medium">Security Deposit</span>
                  <p className="text-base font-extrabold text-white">GH₵ {room.deposit.toLocaleString()}</p>
                  <span className="text-[10px] text-slate-500">Refundable at exit</span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-[11px] text-slate-400 block font-medium">Min Lease</span>
                  <p className="text-base font-extrabold text-teal-400">{room.minLeaseMonths} Months</p>
                  <span className="text-[10px] text-slate-500">Standard agreement</span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-[11px] text-slate-400 block font-medium">Available From</span>
                  <p className="text-base font-extrabold text-amber-400">
                    {new Date(room.availableDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <span className="text-[10px] text-slate-500">Immediate move-in</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Property Overview</h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {room.description}
                </p>
              </div>

              {/* Amenities Grid */}
              <div className="space-y-3 pt-3">
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Included Amenities & Services</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {room.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-xs font-semibold text-slate-200"
                    >
                      {getAmenityIcon(amenity)}
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* House Rules */}
              {room.rules && room.rules.length > 0 && (
                <div className="space-y-2.5 pt-3">
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">House Policies & Code</h4>
                  <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    {room.rules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Google Maps Property Location Section */}
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="https://www.google.com/favicon.ico" alt="Google Maps" className="h-4 w-4" />
                    <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Google Maps Location</h4>
                  </div>
                  <a
                    href={room.lat && room.lng ? `https://www.google.com/maps/dir/?api=1&destination=${room.lat},${room.lng}` : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${room.address || room.neighborhood}, ${room.city}, Ghana`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:underline"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Get Directions on Google Maps
                  </a>
                </div>

                <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-md">
                  <iframe
                    title={`Google Maps ${room.title}`}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(room.lat && room.lng ? `${room.lat},${room.lng}` : `${room.neighborhood}, ${room.city}, Ghana`)}&t=m&z=15&ie=UTF8&iwloc=&output=embed`}
                    className="h-full w-full border-0 filter brightness-95 contrast-105"
                    loading="lazy"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>

            {/* Right Sticky Column: Landlord Card & Action Box */}
            <div className="space-y-4">
              
              {/* Landlord Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(room.landlordName)}`}
                      alt={room.landlordName}
                      className="h-12 w-12 rounded-xl object-cover ring-2 ring-emerald-500/30"
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-slate-950 font-bold">
                      ✓
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{room.landlordName}</h4>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                      <ShieldCheck className="h-3 w-3" /> Identity & Title Verified
                    </p>
                    <p className="text-[10px] text-slate-400">{room.landlordEmail}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-900/90 p-3 text-xs text-slate-300 border border-slate-800">
                  <span className="font-semibold text-slate-200 block mb-1">RoomShare Guarantee</span>
                  Zero scam policy. Payments are protected until in-person handover and agreement execution.
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onMessageLandlord(room)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Chat Inbox
                  </button>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </div>

              {/* Direct Booking/Application Action Card */}
              <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-5 space-y-4 shadow-xl">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Monthly Total</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-emerald-400">GH₵ {room.price.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                  <div className="flex justify-between">
                    <span>Rent per month</span>
                    <span className="font-bold text-white">GH₵ {room.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refundable Deposit</span>
                    <span className="font-bold text-white">GH₵ {room.deposit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Agency / Finder Fee</span>
                    <span>GH₵ 0.00 (Free)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onApply(room)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all"
                >
                  Start Rental Application
                </button>

                <p className="text-center text-[10px] text-slate-400">
                  Takes 2 minutes • Schedule in-person or video tour
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
