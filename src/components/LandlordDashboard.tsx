import React, { useState } from 'react';
import { 
  Building2, Plus, Users, CalendarCheck, TrendingUp, Check, X, 
  Trash2, Pause, Play, Eye, Sparkles, Upload, Image as ImageIcon, 
  ShieldCheck, MapPin, DollarSign, Clock, CheckCircle2, MessageSquare, ChevronRight, ChevronLeft
} from 'lucide-react';
import { Room, RoomApplication, User, RoomStatus } from '../types';
import { optimizeImage, formatBytes } from '../utils/imageOptimizer';

interface LandlordDashboardProps {
  rooms: Room[];
  applications: RoomApplication[];
  currentUser: User;
  onCreateRoom: (room: Omit<Room, 'id' | 'createdAt'>) => Promise<Room>;
  onUpdateRoomStatus: (id: string, status: RoomStatus) => void;
  onDeleteRoom: (id: string) => void;
  onUpdateAppStatus: (appId: string, status: RoomApplication['status'], tourDate?: string) => void;
  onOpenMessageWithTenant: (tenantId: string, tenantName: string, roomId: string) => void;
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
}

const GHANA_AMENITIES = [
  'Standby Generator',
  'Poly Tank Reservoir',
  'Air Conditioning',
  'Wi-Fi',
  '24/7 Security',
  'Furnished',
  'Parking',
  'Kitchen Access',
  'Laundry Facility',
  'CCTV Surveillance',
  'Prepaid Electricity Meter',
  'Balcony'
];

export const LandlordDashboard: React.FC<LandlordDashboardProps> = ({
  rooms,
  applications,
  currentUser,
  onCreateRoom,
  onUpdateRoomStatus,
  onDeleteRoom,
  onUpdateAppStatus,
  onOpenMessageWithTenant,
  isWizardOpen,
  setIsWizardOpen
}) => {
  // Filter for this landlord
  const myRooms = rooms.filter(r => r.landlordId === currentUser.id);
  const myApps = applications.filter(a => a.landlordId === currentUser.id);

  // Metrics
  const activeListingsCount = myRooms.filter(r => r.status === 'active').length;
  const pendingRequestsCount = myApps.filter(a => a.status === 'pending').length;
  const scheduledToursCount = myApps.filter(a => a.status === 'tour_scheduled').length;
  const projectedMonthlyRevenue = myRooms.reduce((sum, r) => sum + r.price, 0);

  // Tab inside landlord dashboard
  const [activeTab, setActiveTab] = useState<'listings' | 'applicants'>('listings');

  // Wizard state (4 steps)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [newTitle, setNewTitle] = useState('');
  const [newRoomType, setNewRoomType] = useState<Room['roomType']>('Self-Contained');
  const [newCity, setNewCity] = useState('Accra');
  const [newNeighborhood, setNewNeighborhood] = useState('East Legon');
  const [newAddress, setNewAddress] = useState('');
  const [newPrice, setNewPrice] = useState<number>(2500);
  const [newDeposit, setNewDeposit] = useState<number>(2500);
  const [newMinLease, setNewMinLease] = useState<number>(12);
  const [newAvailableDate, setNewAvailableDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newBillsIncluded, setNewBillsIncluded] = useState(true);
  const [newAmenities, setNewAmenities] = useState<string[]>(['Standby Generator', 'Poly Tank Reservoir', 'Wi-Fi', '24/7 Security']);
  const [newRules, setNewRules] = useState<string>('No indoor smoking\nQuiet hours after 10:00 PM\nRespect shared compound cleanliness');
  const [newDescription, setNewDescription] = useState('');
  
  // Photos with compression metadata
  const [uploadedPhotos, setUploadedPhotos] = useState<{ url: string; originalSize: number; compressedSize: number }[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [wizardError, setWizardError] = useState('');

  // Handle Photo Upload with HTML5 Canvas compression via imageOptimizer.ts
  const handlePhotoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    setWizardError('');

    try {
      const remainingSlots = 8 - uploadedPhotos.length;
      const fileList = Array.from(files).slice(0, remainingSlots);

      for (const file of fileList) {
        const result = await optimizeImage(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.82 });
        setUploadedPhotos(prev => [
          ...prev,
          {
            url: result.dataUrl,
            originalSize: result.originalSize,
            compressedSize: result.compressedSize
          }
        ]);
      }
    } catch (err: any) {
      setWizardError(`Photo optimization error: ${err.message}`);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCreateListing = async () => {
    if (!newTitle.trim()) {
      setWizardError('Please provide a listing title.');
      return;
    }

    const rulesArray = newRules
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const photos = uploadedPhotos.length > 0
      ? uploadedPhotos.map(p => p.url)
      : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'];

    try {
      await onCreateRoom({
        landlordId: currentUser.id,
        landlordName: currentUser.name,
        landlordEmail: currentUser.email,
        title: newTitle,
        description: newDescription || 'Modern, clean residential accommodation in a prime neighbourhood with guaranteed utility backup.',
        price: Number(newPrice),
        deposit: Number(newDeposit),
        roomType: newRoomType,
        city: newCity,
        neighborhood: newNeighborhood,
        address: newAddress || `${newNeighborhood}, ${newCity}`,
        images: photos,
        amenities: newAmenities,
        billsIncluded: newBillsIncluded,
        availableDate: newAvailableDate,
        minLeaseMonths: Number(newMinLease),
        rules: rulesArray,
        status: 'active'
      });

      // Reset
      setIsWizardOpen(false);
      setWizardStep(1);
      setNewTitle('');
      setUploadedPhotos([]);
    } catch (err: any) {
      setWizardError(err.message || 'Failed to create room');
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Landlord Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Property Management Portal
          </h1>
          <p className="text-xs text-slate-400">
            Welcome back, <strong className="text-white">{currentUser.name}</strong>. Monitor listings, review tenant lease inquiries, and schedule inspections.
          </p>
        </div>

        <button
          onClick={() => {
            setWizardStep(1);
            setIsWizardOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Create New Listing
        </button>
      </div>

      {/* Metric Cards (Section 4C) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Listings</span>
            <Building2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{activeListingsCount}</p>
          <span className="text-[11px] text-slate-500">{myRooms.length} total properties</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Pending Requests</span>
            <Users className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400">{pendingRequestsCount}</p>
          <span className="text-[11px] text-slate-500">Requires review</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Scheduled Tours</span>
            <CalendarCheck className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-cyan-400">{scheduledToursCount}</p>
          <span className="text-[11px] text-slate-500">In-person & Virtual</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Projected Monthly Rent</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-400">GH₵ {projectedMonthlyRevenue.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500">Across your catalog</span>
        </div>
      </div>

      {/* Tabs Switcher: Listings vs Applicants */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('listings')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'listings'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="h-4 w-4" />
          My Listed Properties ({myRooms.length})
        </button>

        <button
          onClick={() => setActiveTab('applicants')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'applicants'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="h-4 w-4" />
          Applicant Review Board ({myApps.length})
          {pendingRequestsCount > 0 && (
            <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-black text-slate-950">
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content: Listings */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {myRooms.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-white">No properties published yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                List your room, master bedroom, self-contained unit or entire apartment to receive verified tenant requests.
              </p>
              <button
                onClick={() => setIsWizardOpen(true)}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
              >
                Launch Listing Creation Wizard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myRooms.map((room) => (
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
                      <span className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        room.status === 'active'
                          ? 'bg-emerald-500/90 text-slate-950'
                          : room.status === 'rented'
                          ? 'bg-blue-500/90 text-white'
                          : 'bg-amber-500/90 text-slate-950'
                      }`}>
                        {room.status}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{room.roomType}</span>
                      <h4 className="text-sm font-bold text-white line-clamp-1 mt-0.5">{room.title}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                        {room.neighborhood}, {room.city}
                      </p>
                    </div>

                    <div className="flex items-baseline justify-between rounded-xl bg-slate-950/70 p-2.5 border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400">Monthly Rent</span>
                        <p className="text-sm font-extrabold text-emerald-400">GH₵ {room.price.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400">Deposit</span>
                        <p className="text-xs font-bold text-white">GH₵ {room.deposit.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Status Controller (Section 4C) */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {room.status === 'active' ? (
                        <button
                          onClick={() => onUpdateRoomStatus(room.id, 'paused')}
                          className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20"
                          title="Pause listing"
                        >
                          <Pause className="h-3 w-3" /> Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateRoomStatus(room.id, 'active')}
                          className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20"
                          title="Activate listing"
                        >
                          <Play className="h-3 w-3" /> Activate
                        </button>
                      )}

                      <button
                        onClick={() => onUpdateRoomStatus(room.id, 'rented')}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          room.status === 'rented'
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        Mark Rented
                      </button>
                    </div>

                    <button
                      onClick={() => onDeleteRoom(room.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete listing"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Applicants Review Board */}
      {activeTab === 'applicants' && (
        <div className="space-y-4">
          {myApps.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center text-slate-400">
              <Users className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <p className="text-sm font-bold text-white">No active tenant applications yet</p>
              <p className="text-xs text-slate-500 mt-1">
                When prospective tenants apply for your properties, their financial verification, occupation, and tour requests will show here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myApps.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={app.roomImage}
                      alt={app.roomTitle}
                      className="h-16 w-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{app.tenantName}</h4>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          app.status === 'accepted'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : app.status === 'tour_scheduled'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : app.status === 'declined'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400">
                        Applied for: <strong className="text-slate-200">{app.roomTitle}</strong> ({app.roomCity})
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
                        <span>💼 {app.occupation}</span>
                        <span>💰 Income: <strong className="text-emerald-400">GH₵ {app.monthlyIncome.toLocaleString()}</strong>/mo</span>
                        <span>📅 Target move-in: {app.moveInDate} ({app.leaseMonths} mos lease)</span>
                        {app.tourDate && (
                          <span className="text-cyan-400 font-semibold">
                            🕒 Tour ({app.tourType}): {app.tourDate}
                          </span>
                        )}
                      </div>

                      {app.bio && (
                        <p className="text-xs text-slate-400 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 mt-1 max-w-2xl">
                          "{app.bio}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Landlord Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                    <button
                      onClick={() => onOpenMessageWithTenant(app.tenantId, app.tenantName, app.roomId)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-600"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                      Chat Tenant
                    </button>

                    {app.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onUpdateAppStatus(app.id, 'tour_scheduled', app.tourDate || new Date().toISOString().split('T')[0])}
                          className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20"
                        >
                          <CalendarCheck className="h-3.5 w-3.5" />
                          Confirm Tour
                        </button>

                        <button
                          onClick={() => onUpdateAppStatus(app.id, 'accepted')}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                          Accept Lease
                        </button>

                        <button
                          onClick={() => onUpdateAppStatus(app.id, 'declined')}
                          className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
                        >
                          <X className="h-3.5 w-3.5" />
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Listing Creation Wizard Modal (Section 4C: 4-Step Form) */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Wizard Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/50">
              <div>
                <h3 className="text-base font-extrabold text-white">Create Room / Property Listing</h3>
                <p className="text-xs text-slate-400">Step {wizardStep} of 4: {
                  wizardStep === 1 ? 'Location & Basic Info' :
                  wizardStep === 2 ? 'Pricing & Lease Terms' :
                  wizardStep === 3 ? 'Amenities & Policies' : 'Photos & Description'
                }</p>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="h-1.5 w-full bg-slate-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(wizardStep / 4) * 100}%` }}
              />
            </div>

            {wizardError && (
              <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2.5 text-xs font-semibold text-rose-300">
                {wizardError}
              </div>
            )}

            {/* Wizard Form Body */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* STEP 1: Basic Info & Location */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Listing Headline / Title *</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Modern Self-Contained Studio with Standby Generator"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Room Accommodation Type</label>
                      <select
                        value={newRoomType}
                        onChange={(e) => setNewRoomType(e.target.value as Room['roomType'])}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="Self-Contained">Self-Contained</option>
                        <option value="Single Room">Single Room</option>
                        <option value="Master Bedroom">Master Bedroom</option>
                        <option value="Entire Apartment">Entire Apartment</option>
                        <option value="Studio">Studio</option>
                        <option value="Shared Room">Shared Room</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">City in Ghana</label>
                      <select
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="Accra">Accra</option>
                        <option value="Kumasi">Kumasi</option>
                        <option value="Takoradi">Takoradi</option>
                        <option value="Tema">Tema</option>
                        <option value="Cape Coast">Cape Coast</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Neighborhood / Suburb</label>
                      <input
                        type="text"
                        value={newNeighborhood}
                        onChange={(e) => setNewNeighborhood(e.target.value)}
                        placeholder="e.g. East Legon, Cantonments, Osu, Ayeduase"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Street / Landmark Address</label>
                      <input
                        type="text"
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        placeholder="e.g. Near American House, Boundary Road"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Pricing & Terms */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Monthly Rent (GH₵) *</label>
                      <input
                        type="number"
                        min={100}
                        max={50000}
                        value={newPrice}
                        onChange={(e) => setNewPrice(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Refundable Security Deposit (GH₵)</label>
                      <input
                        type="number"
                        min={0}
                        value={newDeposit}
                        onChange={(e) => setNewDeposit(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Minimum Lease Commitment</label>
                      <select
                        value={newMinLease}
                        onChange={(e) => setNewMinLease(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      >
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months (1 Year Standard)</option>
                        <option value={24}>24 Months (2 Years)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Available Move-in Date</label>
                      <input
                        type="date"
                        value={newAvailableDate}
                        onChange={(e) => setNewAvailableDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Bills Included Checkbox */}
                  <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBillsIncluded}
                      onChange={(e) => setNewBillsIncluded(e.target.checked)}
                      className="h-4 w-4 rounded accent-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">Utilities Bundled in Rent</span>
                      <span className="text-[11px] text-slate-400">Includes water, waste management, Wi-Fi or electricity</span>
                    </div>
                  </label>
                </div>
              )}

              {/* STEP 3: Amenities & House Rules */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-2">Available Amenities (Select all that apply)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {GHANA_AMENITIES.map((item) => {
                        const checked = newAmenities.includes(item);
                        return (
                          <button
                            type="button"
                            key={item}
                            onClick={() => {
                              if (checked) {
                                setNewAmenities(newAmenities.filter(a => a !== item));
                              } else {
                                setNewAmenities([...newAmenities, item]);
                              }
                            }}
                            className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium text-left transition-all ${
                              checked
                                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                                : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                              checked ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-700'
                            }`}>
                              {checked && '✓'}
                            </span>
                            <span className="truncate">{item}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-slate-300">House Rules & Policies (One per line)</label>
                    <textarea
                      rows={3}
                      value={newRules}
                      onChange={(e) => setNewRules(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Photos (Client Canvas Optimizer) & Description */}
              {wizardStep === 4 && (
                <div className="space-y-5">
                  {/* Photo Uploader with HTML5 Canvas Compression Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <ImageIcon className="h-4 w-4 text-emerald-400" />
                        Property Photos (Up to 8)
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {uploadedPhotos.length} / 8 photos
                      </span>
                    </div>

                    <div className="rounded-2xl border-2 border-dashed border-slate-700/80 bg-slate-950/50 p-6 text-center hover:border-emerald-500/60 transition-colors">
                      <input
                        type="file"
                        id="photo-upload"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoFiles}
                        className="hidden"
                        disabled={uploadedPhotos.length >= 8 || isCompressing}
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer block space-y-2">
                        <Upload className="mx-auto h-8 w-8 text-emerald-400" />
                        <div className="text-xs font-semibold text-slate-200">
                          {isCompressing ? 'Compressing high-res photos via Canvas...' : 'Click to select photos from phone or computer'}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Photos are automatically scaled to lightweight 1400px assets to eliminate quota overflow.
                        </p>
                      </label>
                    </div>

                    {/* Compressed photo thumbnails with byte savings */}
                    {uploadedPhotos.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        {uploadedPhotos.map((photo, idx) => (
                          <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 group">
                            <img src={photo.url} alt="upload" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-1 text-[9px] text-white transition-opacity">
                              <span>Saved {Math.round((1 - photo.compressedSize / photo.originalSize) * 100)}%</span>
                              <span>{formatBytes(photo.compressedSize)}</span>
                              <button
                                type="button"
                                onClick={() => setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== idx))}
                                className="mt-1 rounded bg-rose-500 px-1 text-[8px] text-white font-bold"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Property Description</label>
                    <textarea
                      rows={4}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Detail features, proximity to roads or transit, standby plant capability, water consistency, security conditions..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Navigation Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/60">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
              ) : (
                <div />
              )}

              {wizardStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep === 1 && !newTitle.trim()) {
                      setWizardError('Please enter a listing title before continuing.');
                      return;
                    }
                    setWizardError('');
                    setWizardStep((prev) => (prev + 1) as any);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                >
                  Next Step <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateListing}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95"
                >
                  <Sparkles className="h-4 w-4" />
                  Publish Property Listing
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
