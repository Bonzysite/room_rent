import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { DEMO_USERS, auth } from '../utils/auth';
import { api } from '../utils/api';
import { Home, CheckCircle2, ShieldCheck, Mail, Lock, User as UserIcon, Phone, FileText, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginRole, setLoginRole] = useState<UserRole>('tenant');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('tenant');
  const [regPhone, setRegPhone] = useState('');
  const [regBio, setRegBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const emailToUse = loginEmail.trim() 
        ? loginEmail.trim() 
        : (loginRole === 'landlord' ? 'kwame.mensah@roomshare.gh' : 'emmanuel.owusu@techaccra.com');
      
      // Query database for user details before granting access
      const user = await api.authenticateUserFromDb(emailToUse, loginRole);

      auth.setUser(user);
      onLogin(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setErrorMsg('Please enter your full name and email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: regName.trim(),
        email: regEmail.toLowerCase().trim(),
        role: regRole,
        phone: regPhone.trim() || '+233 24 000 0000',
        bio: regBio.trim() || (regRole === 'landlord' ? 'Verified property manager' : 'Tenant seeking accommodation'),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(regName)}`,
        createdAt: new Date().toISOString()
      };

      // Write new user to database before granting access
      const registeredUser = await api.registerUserInDb(newUser);

      auth.setUser(registeredUser);
      onLogin(registeredUser);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your entries.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/70 p-4 sm:p-6">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-2xl">
        
        {/* Top Header */}
        <div className="border-b border-slate-800/80 bg-slate-950/60 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Home className="h-6 w-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Room<span className="text-emerald-400">Share</span> Ghana
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Verified Residential Rentals • Landlord & Tenant Access Control
          </p>

          {/* Login vs Register Mode Tabs */}
          <div className="mt-6 flex rounded-2xl border border-slate-800 bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                mode === 'login'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In to Account
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                mode === 'register'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register New Profile
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="border-b border-rose-500/20 bg-rose-500/10 px-6 py-2.5 text-xs font-semibold text-rose-300 text-center">
            {errorMsg}
          </div>
        )}

        {/* MODE 1: LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-5">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">Select Access Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLoginRole('tenant')}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all ${
                    loginRole === 'tenant'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold block">Tenant Mode</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Find rooms & apply</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLoginRole('landlord')}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all ${
                    loginRole === 'landlord'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold block">Landlord Mode</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">List & manage properties</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-emerald-400" /> Email Address
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder={loginRole === 'landlord' ? 'kwame.mensah@roomshare.gh' : 'emmanuel.owusu@techaccra.com'}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-400" /> Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
            >
              {loading ? <CheckCircle2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {loginRole === 'landlord' ? 'Sign In to Landlord Portal' : 'Sign In to Tenant Hub'}
            </button>
          </form>
        ) : (
          /* MODE 2: REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Account Role Type *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRegRole('tenant')}
                  className={`rounded-xl border p-2.5 text-xs font-bold transition-all ${
                    regRole === 'tenant'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400'
                  }`}
                >
                  Tenant Profile
                </button>
                <button
                  type="button"
                  onClick={() => setRegRole('landlord')}
                  className={`rounded-xl border p-2.5 text-xs font-bold transition-all ${
                    regRole === 'landlord'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400'
                  }`}
                >
                  Landlord Profile
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Kofi Annan"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="kofi@roomshare.gh"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Password *</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Ghana Phone Number</label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+233 24 123 4567"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Short Bio / Profession</label>
              <textarea
                rows={2}
                value={regBio}
                onChange={(e) => setRegBio(e.target.value)}
                placeholder="e.g. Property owner hosting 3 flats in Cantonments / Software engineer looking for room"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all mt-2"
            >
              {loading ? <CheckCircle2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Complete Registration & Enter
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
