import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { 
  UserCheck, Shield, Phone, Mail, CheckCircle2, 
  RotateCcw, Sparkles, Building2, Layers, LogOut, Camera 
} from 'lucide-react';
import { optimizeImage } from '../utils/imageOptimizer';

interface ProfileViewProps {
  currentUser: User;
  onUpdateProfile: (updated: Partial<User>) => void;
  onResetSeedData: () => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateProfile,
  onResetSeedData,
  onLogout
}) => {
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(currentUser.name);
    setPhone(currentUser.phone || '');
    setBio(currentUser.bio || '');
    setAvatar(currentUser.avatar || '');
  }, [currentUser]);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const optimized = await optimizeImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.85 });
        setAvatar(optimized.dataUrl);
      } catch (err) {
        console.error('Failed to optimize avatar photo:', err);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ name, phone, bio, avatar });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const isLandlord = currentUser.role === 'landlord';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Hidden File Input for Avatar Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarFileSelect}
        className="hidden"
      />

      {/* Profile Card Header */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center gap-5">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative group cursor-pointer"
          title="Click to upload new profile photo"
        >
          <img
            src={avatar || currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.name)}`}
            alt={currentUser.name}
            className="h-20 w-20 rounded-2xl object-cover ring-4 ring-emerald-500/30 group-hover:brightness-90 transition-all"
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <span className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-slate-950 ${
            isLandlord ? 'bg-amber-400' : 'bg-emerald-400'
          }`}>
            ✓
          </span>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-extrabold text-white">{currentUser.name}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isLandlord 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-slate-400">{currentUser.email}</p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-200 hover:text-white hover:border-emerald-500 transition-all"
            >
              <Camera className="h-3.5 w-3.5 text-emerald-400" />
              Upload Profile Photo
            </button>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Account Credentials & Contact</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              Ghana Phone / WhatsApp Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233 24 123 4567"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Bio / Background Note</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Profile updated successfully!
            </span>
          ) : (
            <div />
          )}

          <button
            type="submit"
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Reset Demo State Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-slate-300 block">Reset Demo State</span>
          <span className="text-[11px] text-slate-500">Restore default Ghana properties, landlords, and sample chats.</span>
        </div>

        <button
          type="button"
          onClick={onResetSeedData}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Data
        </button>
      </div>
    </div>
  );
};
