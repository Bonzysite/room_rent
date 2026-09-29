import React, { useState } from 'react';
import { 
  Compass, Layers, Clock, CheckCircle2, XCircle, CalendarCheck, 
  MessageSquare, ArrowUpRight, ShieldCheck, MapPin, Building2, Zap, Droplets 
} from 'lucide-react';
import { Room, RoomApplication, User } from '../types';

interface TenantApplicationsViewProps {
  rooms: Room[];
  applications: RoomApplication[];
  currentUser: User;
  onSelectRoom: (room: Room) => void;
  onApplyRoom: (room: Room) => void;
  onOpenMessageWithLandlord: (landlordId: string, landlordName: string, roomId: string) => void;
}

export const TenantApplicationsView: React.FC<TenantApplicationsViewProps> = ({
  rooms,
  applications,
  currentUser,
  onSelectRoom,
  onApplyRoom,
  onOpenMessageWithLandlord
}) => {
  const [subTab, setSubTab] = useState<'applications' | 'catalog'>('applications');

  // Tenant's submitted applications
  const myApplications = applications.filter(a => a.tenantId === currentUser.id);

  // Active listings for discovery
  const activeRooms = rooms.filter(r => r.status === 'active');

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/40 p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
              <Layers className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Tenant Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Renters Control Center
          </h1>
          <p className="text-xs text-slate-400">
            Track your rental submissions, verify inspection schedules, and chat directly with verified homeowners.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 rounded-2xl border border-slate-800 bg-slate-950/80 p-1.5 self-start sm:self-auto">
          <button
            onClick={() => setSubTab('applications')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              subTab === 'applications'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            My Applications ({myApplications.length})
          </button>
          <button
            onClick={() => setSubTab('catalog')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              subTab === 'catalog'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            Available Houses & Rooms
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: My Applications Tracker (Section 4D) */}
      {subTab === 'applications' && (
        <div className="space-y-4">
          {myApplications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center text-slate-400">
              <Clock className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-white">No active lease applications submitted</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Explore verified rooms in Accra or Kumasi and submit an application to schedule a walkthrough.
              </p>
              <button
                onClick={() => setSubTab('catalog')}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
              >
                Browse Available Properties
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myApplications.map((app) => {
                const room = rooms.find(r => r.id === app.roomId);

                return (
                  <div
                    key={app.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={app.roomImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80'}
                        alt={app.roomTitle}
                        className="h-20 w-20 rounded-2xl object-cover shrink-0 border border-slate-800"
                      />
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{app.roomTitle}</h3>
                          
                          {/* Status Badge */}
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            app.status === 'accepted'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : app.status === 'tour_scheduled'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : app.status === 'declined'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {app.status === 'accepted' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                            {app.status === 'tour_scheduled' && <CalendarCheck className="h-3 w-3 text-cyan-400" />}
                            {app.status === 'declined' && <XCircle className="h-3 w-3 text-rose-400" />}
                            {app.status === 'pending' && <Clock className="h-3 w-3 text-amber-400" />}
                            {app.status.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                          {app.roomCity} • <strong className="text-emerald-400">GH₵ {app.roomPrice.toLocaleString()}</strong>/month
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                          <span>Target Move-in: <strong>{app.moveInDate}</strong></span>
                          <span>Lease: <strong>{app.leaseMonths} months</strong></span>
                          {app.tourDate && (
                            <span className="text-cyan-300 font-semibold bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                              Tour ({app.tourType}): {app.tourDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => onOpenMessageWithLandlord(app.landlordId, room?.landlordName || 'Landlord', app.roomId)}
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Chat Landlord
                      </button>

                      {room && (
                        <button
                          onClick={() => onSelectRoom(room)}
                          className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white"
                        >
                          View Details
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: Available Houses & Rooms Catalog (Section 4D) */}
      {subTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Showing active properties with verified landlord contact previews
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeRooms.map((room) => (
              <div
                key={room.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4 justify-between space-y-4 hover:border-slate-700 transition-all"
              >
                <div className="space-y-3">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-950">
                    <img
                      src={room.images[0]}
                      alt={room.title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                      {room.roomType}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{room.title}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-emerald-400" />
                      {room.neighborhood}, {room.city}
                    </p>
                  </div>

                  {/* Landlord Contact Preview */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-950/70 p-2.5 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <div>
                        <span className="text-white font-semibold block">{room.landlordName}</span>
                        <span className="text-[10px] text-slate-500">Verified Landlord</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400">GH₵ {room.price.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 block">/mo</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectRoom(room)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
                  >
                    Inspect
                  </button>

                  <button
                    onClick={() => onApplyRoom(room)}
                    className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    Quick Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
