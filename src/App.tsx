import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { FilterBar, FilterState } from './components/FilterBar';
import { RoomCard } from './components/RoomCard';
import { RoomDetailModal } from './components/RoomDetailModal';
import { ApplicationModal } from './components/ApplicationModal';
import { Login } from './components/Login';
import { LandlordDashboard } from './components/LandlordDashboard';
import { TenantApplicationsView } from './components/TenantApplicationsView';
import { MessagesView } from './components/MessagesView';
import { ProfileView } from './components/ProfileView';

import { Room, RoomApplication, Conversation, Message, User, UserRole, RoomStatus } from './types';
import { api } from './utils/api';
import { auth, DEMO_USERS } from './utils/auth';
import { storage } from './utils/storage';

import { 
  ShieldCheck, Zap, Droplets, Heart, Sparkles, Building2, 
  MapPin, CheckCircle2, ArrowRight, Compass 
} from 'lucide-react';

export const App: React.FC = () => {
  // Global Database State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [applications, setApplications] = useState<RoomApplication[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Theme Mode State (Dark / Light)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => storage.getTheme());

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    storage.setTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      showToast(`Switched display mode to ${next === 'dark' ? 'Dark' : 'Light'} theme`);
      return next;
    });
  };

  // User & Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Load persisted user if available
  useEffect(() => {
    const stored = auth.getUser();
    if (stored) setCurrentUser(stored);
  }, []);

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<'browse' | 'landlord' | 'tenant-hub' | 'saved' | 'messages' | 'profile'>('browse');

  // Wishlist
  const [savedRoomIds, setSavedRoomIds] = useState<string[]>(() => storage.getFavorites());

  // Modals
  const [selectedRoomForDetail, setSelectedRoomForDetail] = useState<Room | null>(null);
  const [selectedRoomForApp, setSelectedRoomForApp] = useState<Room | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Active chat conversation
  const [activeConversationId, setActiveConversationId] = useState<string>('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter & Search Engine State (Section 4A)
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedCity: 'All Cities',
    selectedRoomType: 'All Types',
    maxPrice: 25000,
    billsIncludedOnly: false,
    sortBy: 'recommended'
  });

  // Bootstrap initial data & background polling for real-time messaging sync
  useEffect(() => {
    let isSubscribed = true;

    async function syncData() {
      try {
        const fullData = await api.getFullData();
        if (isSubscribed) {
          setRooms(fullData.rooms || []);
          setApplications(fullData.applications || []);
          setConversations(fullData.conversations || []);
          setMessages(fullData.messages || []);
        }
      } catch (err) {
        console.error('Failed to sync app data:', err);
      } finally {
        if (isSubscribed) setIsLoading(false);
      }
    }

    syncData();

    // Poll every 3 seconds so landlords & tenants see new texts instantly
    const timer = setInterval(() => {
      syncData();
    }, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(timer);
    };
  }, []);

  // Filter & Sorting computation
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Status check
      if (room.status !== 'active') return false;

      // Search Query (title, neighborhood, city, amenities)
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = room.title.toLowerCase().includes(q);
        const matchesNeigh = room.neighborhood.toLowerCase().includes(q);
        const matchesCity = room.city.toLowerCase().includes(q);
        const matchesAmenity = room.amenities.some(a => a.toLowerCase().includes(q));
        if (!matchesTitle && !matchesNeigh && !matchesCity && !matchesAmenity) {
          return false;
        }
      }

      // City filter
      if (filters.selectedCity !== 'All Cities') {
        if (room.city.toLowerCase() !== filters.selectedCity.toLowerCase()) {
          return false;
        }
      }

      // Room Type filter
      if (filters.selectedRoomType !== 'All Types') {
        if (room.roomType !== filters.selectedRoomType) {
          return false;
        }
      }

      // Max price
      if (room.price > filters.maxPrice) {
        return false;
      }

      // Bills Included
      if (filters.billsIncludedOnly && !room.billsIncluded) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price-asc') return a.price - b.price;
      if (filters.sortBy === 'price-desc') return b.price - a.price;
      if (filters.sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0; // recommended
    });
  }, [rooms, filters]);

  // Wishlist computation
  const savedRooms = useMemo(() => {
    return rooms.filter(r => savedRoomIds.includes(r.id));
  }, [rooms, savedRoomIds]);

  // Unread messages count
  const unreadMessagesCount = useMemo(() => {
    if (!currentUser) return 0;
    return messages.filter(m => !m.read && m.senderId !== currentUser.id).length;
  }, [messages, currentUser]);

  // Handlers
  const handleLoginUser = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'landlord') {
      setCurrentTab('landlord');
    } else {
      setCurrentTab('tenant-hub');
    }
    showToast(`Welcome back, ${user.name}! Connected as ${user.role}.`);
  };

  const handleLogout = () => {
    auth.logout();
    setCurrentUser(null);
    setCurrentTab('browse');
    showToast('Signed out successfully.');
  };

  const handleToggleFavorite = (roomId: string) => {
    const updated = storage.toggleFavorite(roomId);
    setSavedRoomIds(updated);
    const added = updated.includes(roomId);
    showToast(added ? 'Room saved to your wishlist!' : 'Room removed from wishlist');
  };

  // Strict Role Navigation & Access Guard
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'landlord' && currentTab === 'tenant-hub') {
      setCurrentTab('landlord');
    } else if (currentUser.role === 'tenant' && currentTab === 'landlord') {
      setCurrentTab('browse');
    }
  }, [currentUser, currentTab]);

  const handleUpdateProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated: User = { ...currentUser, ...updates };
    setCurrentUser(updated);
    auth.setUser(updated);
    showToast('Profile information successfully saved');
  };

  const handleCreateRoom = async (roomData: Omit<Room, 'id' | 'createdAt'>) => {
    const created = await api.createRoom(roomData);
    setRooms(prev => [created, ...prev]);
    showToast('Your property listing has been successfully published!');
    return created;
  };

  const handleUpdateRoomStatus = async (id: string, status: RoomStatus) => {
    const updated = await api.updateRoom(id, { status });
    setRooms(prev => prev.map(r => r.id === id ? updated : r));
    showToast(`Property status updated to "${status}"`);
  };

  const handleDeleteRoom = async (id: string) => {
    if (confirm('Are you sure you want to remove this property listing?')) {
      await api.deleteRoom(id);
      setRooms(prev => prev.filter(r => r.id !== id));
      showToast('Property listing removed');
    }
  };

  const handleSubmitApplication = async (appData: Omit<RoomApplication, 'id' | 'createdAt' | 'status'>) => {
    if (!currentUser) return;
    const newApp = await api.submitApplication(appData);
    setApplications(prev => [newApp, ...prev]);

    // Automatically initiate a conversation between tenant and landlord
    const initialText = `Hello ${newApp.roomTitle} Landlord! I have submitted an official application. I look forward to connecting regarding the inspection.`;
    const conv = await api.startConversation({
      participants: [currentUser.id, newApp.landlordId],
      roomId: newApp.roomId,
      initialMessage: initialText,
      senderName: currentUser.name
    });

    setConversations(prev => {
      const exists = prev.some(c => c.id === conv.id);
      return exists ? prev : [conv, ...prev];
    });

    showToast('Application transmitted! Chat thread established.');
  };

  const handleUpdateAppStatus = async (appId: string, status: RoomApplication['status'], tourDate?: string) => {
    const updated = await api.updateApplicationStatus(appId, status, tourDate);
    setApplications(prev => prev.map(a => a.id === appId ? updated : a));
    showToast(`Applicant status marked as "${status.replace('_', ' ')}"`);
  };

  const handleSendMessage = async (conversationId: string, text: string) => {
    if (!currentUser) return;
    const newMsg = await api.sendMessage({
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text
    });
    setMessages(prev => [...prev, newMsg]);
    setConversations(prev => prev.map(c => {
      if (c.id === conversationId) {
        return { ...c, lastMessage: text, updatedAt: newMsg.timestamp };
      }
      return c;
    }));
  };

  const handleOpenMessageWithContact = async (partnerId: string, _partnerName: string, roomId: string) => {
    if (!currentUser) return;
    let conv = conversations.find(c => c.roomId === roomId && c.participants.includes(partnerId) && c.participants.includes(currentUser.id));
    if (!conv) {
      conv = await api.startConversation({
        participants: [currentUser.id, partnerId],
        roomId,
        initialMessage: `Hi, I am reaching out regarding this property listing.`,
        senderName: currentUser.name
      });
      setConversations(prev => [conv!, ...prev]);
    }
    setActiveConversationId(conv.id);
    setCurrentTab('messages');
  };

  const handleResetSeedData = async () => {
    if (confirm('Reset application data to initial demo properties and Ghanaian locations?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLoginUser} />;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="h-4 w-4" />
          {toastMessage}
        </div>
      )}

      {/* Primary Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        savedCount={savedRoomIds.length}
        unreadCount={unreadMessagesCount}
        onOpenCreateWizard={() => {
          setIsWizardOpen(true);
        }}
      />

      {/* Main Page Body */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 pt-6 pb-24 md:pb-8 sm:px-6 lg:px-8">
        
        {/* VIEW 1: Browse / Discovery (Section 4A) */}
        {currentTab === 'browse' && (
          <div className="space-y-8">
            
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/60 p-6 sm:p-10 shadow-2xl">
              <div className="relative z-10 max-w-4xl space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white p-1.5 shadow-xl ring-2 ring-emerald-500/40 shrink-0">
                    <img src="/logo.png" alt="Roomshare Ghana Logo" className="h-full w-full object-contain" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                      <span>100% Title-Verified Rentals in Ghana</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                      Find verified rooms, flats & homes <span className="gradient-text-emerald">all over Ghana</span>
                    </h1>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                  Discover residential accommodation across Accra, Kumasi, Takoradi, Tema, Cape Coast & Tamale. Rent directly from verified property owners with zero agency extortion, transparent GH₵ pricing, and standby generator & poly tank guarantees.
                </p>

                {/* Key Value Prop Pills */}
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 rounded-full bg-slate-900/90 border border-slate-800 px-3 py-1.5 shadow-sm">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span>Standby Generator Backups</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-slate-900/90 border border-slate-800 px-3 py-1.5 shadow-sm">
                    <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Poly Tank Water Reservoirs</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-slate-900/90 border border-slate-800 px-3 py-1.5 shadow-sm">
                    <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Direct Homeowner Contact</span>
                  </div>
                </div>

                {/* 3-Step User Friendly Quick Start Banner */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2.5 rounded-2xl bg-slate-950/60 p-3 border border-slate-800/80">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold text-xs shrink-0">1</span>
                    <div>
                      <strong className="text-white block font-bold">1. Filter Rooms</strong>
                      <span className="text-[11px] text-slate-400">Select city & power backup</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-2xl bg-slate-950/60 p-3 border border-slate-800/80">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 font-extrabold text-xs shrink-0">2</span>
                    <div>
                      <strong className="text-white block font-bold">2. Schedule Tour</strong>
                      <span className="text-[11px] text-slate-400">Propose physical or video visit</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-2xl bg-slate-950/60 p-3 border border-slate-800/80">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-extrabold text-xs shrink-0">3</span>
                    <div>
                      <strong className="text-white block font-bold">3. Chat Directly</strong>
                      <span className="text-[11px] text-slate-400">WhatsApp / Direct Inbox</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative background glow */}
              <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            </div>

            {/* Filter Bar Component (Section 4A) */}
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              totalResults={filteredRooms.length}
            />

            {/* Rooms Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 rounded-2xl bg-slate-900/50 animate-pulse border border-slate-800" />
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center text-slate-400 space-y-3">
                <Compass className="mx-auto h-12 w-12 text-slate-600" />
                <h3 className="text-base font-bold text-white">No rooms matching current criteria</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting the maximum price slider or clearing filters to view available properties.
                </p>
                <button
                  onClick={() => setFilters({
                    searchQuery: '',
                    selectedCity: 'All Cities',
                    selectedRoomType: 'All Types',
                    maxPrice: 25000,
                    billsIncludedOnly: false,
                    sortBy: 'recommended'
                  })}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    isFavorite={savedRoomIds.includes(room.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onSelect={(r) => setSelectedRoomForDetail(r)}
                    onApply={(r) => setSelectedRoomForApp(r)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Landlord Portal & Command Center (Section 4C) */}
        {currentTab === 'landlord' && (
          <LandlordDashboard
            rooms={rooms}
            applications={applications}
            currentUser={currentUser}
            onCreateRoom={handleCreateRoom}
            onUpdateRoomStatus={handleUpdateRoomStatus}
            onDeleteRoom={handleDeleteRoom}
            onUpdateAppStatus={handleUpdateAppStatus}
            onOpenMessageWithTenant={(tenantId, tenantName, roomId) => {
              handleOpenMessageWithContact(tenantId, tenantName, roomId);
            }}
            isWizardOpen={isWizardOpen}
            setIsWizardOpen={setIsWizardOpen}
          />
        )}

        {/* VIEW 3: Tenant Hub (Section 4D) */}
        {currentTab === 'tenant-hub' && (
          <TenantApplicationsView
            rooms={rooms}
            applications={applications}
            currentUser={currentUser}
            onSelectRoom={(r) => setSelectedRoomForDetail(r)}
            onApplyRoom={(r) => setSelectedRoomForApp(r)}
            onOpenMessageWithLandlord={(landlordId, landlordName, roomId) => {
              handleOpenMessageWithContact(landlordId, landlordName, roomId);
            }}
          />
        )}

        {/* VIEW 4: Saved Rooms / Wishlist */}
        {currentTab === 'saved' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                <h1 className="text-2xl font-bold text-white">Your Saved Wishlist</h1>
              </div>
              <p className="text-xs text-slate-400">
                Bookmarked properties you are interested in touring or applying for.
              </p>
            </div>

            {savedRooms.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center text-slate-400">
                <Heart className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                <h3 className="text-base font-bold text-white">No properties bookmarked yet</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Click the heart icon on any property card to save it here for quick comparison.
                </p>
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  Explore Rooms
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    isFavorite={true}
                    onToggleFavorite={handleToggleFavorite}
                    onSelect={(r) => setSelectedRoomForDetail(r)}
                    onApply={(r) => setSelectedRoomForApp(r)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: Real-Time Messaging Inbox (Section 4E) */}
        {currentTab === 'messages' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-white">Direct Messaging Inbox</h1>
                <p className="text-xs text-slate-400">
                  Instant peer-to-peer communication between tenants and landlords.
                </p>
              </div>
            </div>

            <MessagesView
              conversations={conversations}
              messages={messages}
              rooms={rooms}
              currentUser={currentUser}
              onSendMessage={handleSendMessage}
              onSelectRoom={(r) => setSelectedRoomForDetail(r)}
              activeConversationId={activeConversationId}
              setActiveConversationId={setActiveConversationId}
            />
          </div>
        )}

        {/* VIEW 6: Profile & Auth Gate */}
        {currentTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            onResetSeedData={handleResetSeedData}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Modal 1: Room Detail Modal (Section 4B) */}
      <RoomDetailModal
        room={selectedRoomForDetail}
        onClose={() => setSelectedRoomForDetail(null)}
        isFavorite={selectedRoomForDetail ? savedRoomIds.includes(selectedRoomForDetail.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onApply={(r) => {
          setSelectedRoomForDetail(null);
          setSelectedRoomForApp(r);
        }}
        onMessageLandlord={(r) => {
          setSelectedRoomForDetail(null);
          handleOpenMessageWithContact(r.landlordId, r.landlordName, r.id);
        }}
      />

      {/* Modal 2: Application Submission Modal (Section 4F) */}
      <ApplicationModal
        room={selectedRoomForApp}
        currentUser={currentUser}
        onClose={() => setSelectedRoomForApp(null)}
        onSubmit={handleSubmitApplication}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-900 bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Roomshare Ghana Logo" className="h-8 w-8 object-contain rounded-lg bg-white p-0.5" />
            <div className="text-left">
              <span className="font-extrabold text-white text-sm block leading-tight">Roomshare Ghana</span>
              <p className="text-[11px] text-slate-400">Accra, Kumasi, Takoradi & Tema Residential Rentals</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Verified Residential Accommodation</span>
            <span>•</span>
            <span className="font-semibold text-emerald-400 uppercase tracking-wider">
              Account Role: {currentUser.role}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
