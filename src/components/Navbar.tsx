import React, { useState } from 'react';
import { Home, Compass, PlusCircle, Bookmark, MessageSquare, UserCheck, Shield, ChevronDown, Layers, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentTab: 'browse' | 'landlord' | 'tenant-hub' | 'saved' | 'messages' | 'profile';
  onSelectTab: (tab: 'browse' | 'landlord' | 'tenant-hub' | 'saved' | 'messages' | 'profile') => void;
  currentUser: User;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  savedCount: number;
  unreadCount: number;
  onOpenCreateWizard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  theme,
  onToggleTheme,
  savedCount,
  unreadCount,
  onOpenCreateWizard,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLandlord = currentUser.role === 'landlord';

  const handlePostRoomClick = () => {
    if (isLandlord) {
      onSelectTab('landlord');
      onOpenCreateWizard();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div 
          onClick={() => onSelectTab('browse')}
          className="flex cursor-pointer items-center gap-3 group"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-700 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Home className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-slate-950 shadow">
              GH
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Room<span className="text-emerald-400">Share</span>
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-400 border border-emerald-500/20">
                GHANA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Verified Residential Rentals</p>
          </div>
        </div>

        {/* Center Navigation Links (Strictly Role Gated) */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 p-1.5 backdrop-blur">
          <button
            onClick={() => onSelectTab('browse')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              currentTab === 'browse'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Compass className="h-4 w-4" />
            Browse Rooms
          </button>

          {/* Tenants ONLY see Tenant Hub */}
          {!isLandlord && (
            <button
              onClick={() => onSelectTab('tenant-hub')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                currentTab === 'tenant-hub'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="h-4 w-4" />
              Tenant Hub
            </button>
          )}

          {/* Landlords ONLY see Landlord Portal */}
          {isLandlord && (
            <button
              onClick={() => onSelectTab('landlord')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                currentTab === 'landlord'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Shield className="h-4 w-4" />
              Landlord Portal
            </button>
          )}

          <button
            onClick={() => onSelectTab('saved')}
            className={`relative flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
              currentTab === 'saved'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bookmark className="h-4 w-4" />
            Saved
            {savedCount > 0 && (
              <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                currentTab === 'saved' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500 text-slate-950'
              }`}>
                {savedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('messages')}
            className={`relative flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
              currentTab === 'messages'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Messages
            {unreadCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-slate-950 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right CTA, Theme Toggle & Hamburger Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-amber-400 hover:border-emerald-500 hover:bg-slate-800 transition-all shadow-md"
            title={`Switch to ${theme === 'dark' ? 'Light Mode' : 'Dark Mode'}`}
            aria-label="Toggle theme mode"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-emerald-400" />}
          </button>

          {/* Post a Room CTA (Landlords Only) */}
          {isLandlord && (
            <button
              onClick={handlePostRoomClick}
              className="hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <PlusCircle className="h-4 w-4 stroke-[2.5]" />
              Post a Room
            </button>
          )}

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-emerald-500 transition-all"
            aria-label="Toggle Mobile Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-emerald-400" /> : <Menu className="h-5 w-5 text-emerald-400" />}
          </button>

          {/* User Profile Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1.5 pr-3 hover:border-slate-700 transition-all"
            >
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`}
                alt={currentUser.name}
                className="h-8 w-8 rounded-lg object-cover ring-2 ring-emerald-500/40"
              />
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-white leading-tight">{currentUser.name}</p>
                <div className="flex items-center gap-1">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${isLandlord ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                    {currentUser.role} Account
                  </span>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <div className="p-3 border-b border-slate-800/60">
                  <p className="text-xs font-bold text-white">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-800/60 p-2">
                    <span className="text-[11px] text-slate-300">Account Type</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      isLandlord ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => onSelectTab('profile')}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800/80 hover:text-emerald-400 transition-colors"
                  >
                    <UserCheck className="h-4 w-4 text-teal-400" />
                    Manage Profile & Account
                  </button>

                  <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors mt-1 border-t border-slate-800/60 pt-2"
                  >
                    <LogOut className="h-4 w-4 text-rose-400" />
                    Sign Out & Exit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-Down Hamburger Navigation Drawer */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden border-t border-slate-800/80 bg-slate-950/95 p-4 space-y-3 backdrop-blur-2xl animate-in slide-in-from-top duration-200 shadow-2xl"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="space-y-1">
            <button
              onClick={() => onSelectTab('browse')}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                currentTab === 'browse'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'text-slate-200 bg-slate-900/60 border border-slate-800/80'
              }`}
            >
              <span className="flex items-center gap-2">
                <Compass className="h-4 w-4" />
                Browse Rooms
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Explore Listings</span>
            </button>

            {!isLandlord && (
              <button
                onClick={() => onSelectTab('tenant-hub')}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                  currentTab === 'tenant-hub'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                    : 'text-slate-200 bg-slate-900/60 border border-slate-800/80'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Tenant Control Hub
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Applications</span>
              </button>
            )}

            {isLandlord && (
              <button
                onClick={() => onSelectTab('landlord')}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                  currentTab === 'landlord'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                    : 'text-slate-200 bg-slate-900/60 border border-slate-800/80'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Landlord Portal
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Manage Properties</span>
              </button>
            )}

            <button
              onClick={() => onSelectTab('saved')}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                currentTab === 'saved'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'text-slate-200 bg-slate-900/60 border border-slate-800/80'
              }`}
            >
              <span className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Saved Wishlist
              </span>
              {savedCount > 0 && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  {savedCount} Saved
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('messages')}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                currentTab === 'messages'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'text-slate-200 bg-slate-900/60 border border-slate-800/80'
              }`}
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages Inbox
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-slate-950 animate-pulse">
                  {unreadCount} New
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('profile')}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                currentTab === 'profile'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'text-slate-200 bg-slate-900/60 border border-slate-800/80'
              }`}
            >
              <span className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Manage Profile & Account
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase">{currentUser.role}</span>
            </button>
          </div>

          {isLandlord && (
            <button
              onClick={handlePostRoomClick}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all mt-2"
            >
              <PlusCircle className="h-4 w-4 stroke-[2.5]" />
              Post a New Property Listing
            </button>
          )}
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Strictly Role Gated) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-2 py-2 flex items-center justify-around">
        <button
          onClick={() => onSelectTab('browse')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
            currentTab === 'browse' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Compass className="h-5 w-5" />
          Browse
        </button>

        {!isLandlord && (
          <button
            onClick={() => onSelectTab('tenant-hub')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
              currentTab === 'tenant-hub' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            <Layers className="h-5 w-5" />
            Tenant Hub
          </button>
        )}

        {isLandlord && (
          <button
            onClick={() => onSelectTab('landlord')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
              currentTab === 'landlord' ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            <Shield className="h-5 w-5" />
            Landlord
          </button>
        )}

        <button
          onClick={() => onSelectTab('messages')}
          className={`relative flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
            currentTab === 'messages' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <MessageSquare className="h-5 w-5" />
          Inbox
          {unreadCount > 0 && (
            <span className="absolute top-0 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-950">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('saved')}
          className={`relative flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
            currentTab === 'saved' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Bookmark className="h-5 w-5" />
          Saved
        </button>
      </div>
    </header>
  );
};

