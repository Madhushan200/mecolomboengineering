'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHotelEngineering } from '@/lib/store';
import { initialUsers } from '@/lib/initial-data';
import {
  Wrench,
  ArrowRight,
  Smartphone,
  Lock,
  User,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { settings, users, setCurrentUser, enableAudio } = useHotelEngineering();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('mecolomboadmin');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    enableAudio();

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Direct Administrator Authentication
    if (
      (cleanId === 'mecolomboadmin' || cleanId === 'mecolomboadmin@mecolombo.com' || cleanId === 'admin') &&
      cleanPass === 'adminme1234'
    ) {
      const adminUser = users.find(u => u.role === 'ADMIN') || initialUsers[0];
      setCurrentUser(adminUser);
      showToast('Welcome Administrator!', 'success');
      router.push('/admin');
      return;
    }

    // 2. Search against registered users
    const pool = [...users, ...initialUsers];
    const matchedUser = pool.find(u => {
      const uName = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const expectedPass = u.password;
      const idMatch = uName === cleanId || uEmail === cleanId || uEmail.startsWith(`${cleanId}@`);
      const passMatch = cleanPass === expectedPass;
      return idMatch && passMatch;
    });

    if (matchedUser) {
      if (matchedUser.active === false) {
        showToast('This account has been disabled. Please contact your administrator.', 'error');
        setIsSubmitting(false);
        return;
      }

      setCurrentUser(matchedUser);
      showToast(`Welcome back, ${matchedUser.name}!`, 'success');

      if (matchedUser.role === 'ADMIN') {
        router.push('/admin');
      } else if (matchedUser.role === 'EXECUTIVE') {
        router.push('/executive');
      } else {
        router.push('/engineering');
      }
    } else {
      showToast('Invalid Login ID or password. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/30 mb-3 border border-white/15 bg-slate-900 animate-scale-up">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Ceyvista Engineering Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {settings.hotelName || 'Ceyvista Engineering'}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-blue-400 font-bold tracking-widest uppercase">
          Hotel Engineering Reporting Portal
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Secure work order reporting, live sound alerts, and maintenance tracking
        </p>
      </div>

      {/* Main Login Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-2 z-10 space-y-5">
        <div className="card-base p-6 sm:p-8 bg-slate-900/90 backdrop-blur-xl border-slate-800 shadow-2xl text-white space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <span>Portal Sign In</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your login ID / username and password to continue
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Username / Login ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Enter your username"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full text-xs font-bold pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full text-xs font-bold pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl font-black text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'SIGN IN TO PORTAL'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Authorized Hotel Personnel Only</span>
          </div>
        </div>

        {/* Mobile / PWA App Install Note */}
        <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/80 text-center space-y-1">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Install as Mobile App (Android APK / iOS)</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Install the Android APK or tap &ldquo;Add to Home screen&rdquo; for standalone mobile app access.
          </p>
        </div>
      </div>
    </div>
  );
}
