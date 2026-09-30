import React, { useState } from 'react';
import { X, Calendar, DollarSign, Briefcase, Video, Eye, Send, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { Room, RoomApplication, User, TourType } from '../types';

interface ApplicationModalProps {
  room: Room | null;
  currentUser: User;
  onClose: () => void;
  onSubmit: (appData: Omit<RoomApplication, 'id' | 'createdAt' | 'status'>) => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  room,
  currentUser,
  onClose,
  onSubmit
}) => {
  if (!room) return null;

  // Close modal on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const [moveInDate, setMoveInDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [leaseMonths, setLeaseMonths] = useState<number>(room.minLeaseMonths || 12);
  const [occupation, setOccupation] = useState('Professional / Consultant');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(room.price * 3);
  const [bio, setBio] = useState(currentUser.bio || 'Responsible, quiet tenant. Non-smoker, reliable on monthly commitments.');
  const [tourType, setTourType] = useState<TourType>('inperson');
  const [tourDate, setTourDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [tenantPhone, setTenantPhone] = useState(currentUser.phone || '+233 24 000 0000');

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      roomId: room.id,
      roomTitle: room.title,
      roomImage: room.images[0] || '',
      roomPrice: room.price,
      roomCity: `${room.neighborhood}, ${room.city}`,
      landlordId: room.landlordId,
      tenantId: currentUser.id,
      tenantName: currentUser.name,
      tenantEmail: currentUser.email,
      tenantPhone,
      moveInDate,
      leaseMonths,
      occupation,
      monthlyIncome,
      bio,
      tourDate,
      tourType
    });
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative flex flex-col w-full max-w-xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/50">
          <div>
            <h3 className="text-base font-extrabold text-white">Rental Lease Application</h3>
            <p className="text-xs text-slate-400">Direct transmission to property manager</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h4 className="text-lg font-bold text-white">Application Successfully Submitted!</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your application and tour request for <strong className="text-emerald-400">{room.title}</strong> have been recorded. You can track status and message the landlord directly in your Tenant Hub.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Property Summary Strip */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <img
                src={room.images[0]}
                alt={room.title}
                className="h-14 w-14 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{room.title}</h4>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-emerald-400" />
                  {room.neighborhood}, {room.city}
                </p>
                <p className="text-xs font-extrabold text-emerald-400 mt-0.5">
                  GH₵ {room.price.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">/ month</span>
                </p>
              </div>
            </div>

            {/* Move-in Planning */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                  Target Move-in Date
                </label>
                <input
                  type="date"
                  required
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Lease Duration
                </label>
                <select
                  value={leaseMonths}
                  onChange={(e) => setLeaseMonths(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value={6}>6 Months (Short lease)</option>
                  <option value={12}>12 Months (Standard annual)</option>
                  <option value={24}>24 Months (Long term)</option>
                </select>
              </div>
            </div>

            {/* Financial & Background */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                  Current Occupation
                </label>
                <input
                  type="text"
                  required
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Software Engineer, Banker, Student"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                  Estimated Monthly Income (GH₵)
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Contact Phone / WhatsApp
              </label>
              <input
                type="text"
                required
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
                placeholder="+233 24 123 4567"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Tour Request Options */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <span className="text-xs font-bold text-slate-200 block">Inspection & Tour Preference</span>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTourType('inperson')}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                    tourType === 'inperson'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  Physical Tour
                </button>

                <button
                  type="button"
                  onClick={() => setTourType('virtual')}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                    tourType === 'virtual'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <Video className="h-4 w-4" />
                  Virtual Video Call
                </button>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-medium text-slate-400">Preferred Tour Date</label>
                <input
                  type="date"
                  value={tourDate}
                  onChange={(e) => setTourDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Introductory Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Personal Introduction to Landlord
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the landlord about your lifestyle, cleanliness, and why you are a great match for this room..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all"
              >
                <Send className="h-4 w-4 stroke-[2.5]" />
                Submit Formal Application
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
