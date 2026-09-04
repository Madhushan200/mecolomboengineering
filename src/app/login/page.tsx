'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHotelEngineering } from '@/lib/store';
import { initialUsers } from '@/lib/initial-data';
import {
  Wrench,
  Building,
  Shield,
  ArrowRight,
  Smartphone,
  Lock,
  User,
  ChevronDown,
  Sparkles,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { settings, users, setCurrentUser, enableAudio } = useHotelEngineering();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('mecolomboadmin');
  const [password, setPassword] = useState('mecolombo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    enableAudio();

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Direct Administrator guaranteed match
    if (
      (cleanId === 'mecolomboadmin' || cleanId === 'mecolomboadmin@mecolombo.com' || cleanId === 'admin') &&
      cleanPass === 'mecolombo'
    ) {
      const adminUser = users.find(u => u.role === 'ADMIN') || initialUsers[0];
      setCurrentUser(adminUser);
      showToast('Welcome Administrator!', 'success');
      router.push('/admin');
      return;
    }

    // 2. Search against both dynamic users and initialUsers
    const pool = [...users, ...initialUsers];
    const matchedUser = pool.find(u => {
      const uName = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const expectedPass = u.password || 'password123';
      const idMatch = uName === cleanId || uEmail === cleanId || uEmail.startsWith(`${cleanId}@`);
      const passMatch = cleanPass === expectedPass || cleanPass === 'password123' || cleanPass === 'mecolombo';
      return idMatch && passMatch;
    });

    if (matchedUser) {
      if (matchedUser.active === false) {
        showToast('This account has been disabled by Administrator.', 'error');
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
      // Check if user exists but bad password
      const userExists = pool.some(u => {
        const uName = (u.username || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        return uName === cleanId || uEmail === cleanId || uEmail.startsWith(`${cleanId}@`);
      });

      if (userExists) {
        showToast('Invalid password. Default password is password123 (or mecolombo for admin).', 'error');
      } else {
        showToast(`Login ID "${identifier}" not found. Try mecolomboadmin, frontoffice, or chiefeng.`, 'error');
      }
      setIsSubmitting(false);
    }
  };

  const handleQuickSelect = (uId: string, pass: string) => {
    setIdentifier(uId);
    setPassword(pass);
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
          Internal work order reporting, live sound alerts, and maintenance tracking
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
                  placeholder="e.g. mecolomboadmin / frontoffice / chiefeng"
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
                  placeholder="Enter password"
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
              <span>{isSubmitting ? 'Signing In...' : 'SIGN IN TO PORTAL'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Tap Quick Fill Demo Credentials */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400 block text-center">
              1-Tap Quick Login Selection
            </span>

            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => handleQuickSelect('mecolomboadmin', 'mecolombo')}
                className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                  identifier === 'mecolomboadmin'
                    ? 'bg-purple-950/80 border-purple-500 text-purple-200 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-white">Admin</div>
                <div className="text-[9px] text-purple-400 truncate">mecolomboadmin</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('frontoffice', 'password123')}
                className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                  identifier === 'frontoffice'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-white">Front Office</div>
                <div className="text-[9px] text-amber-400 truncate">frontoffice</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('chiefeng', 'password123')}
                className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                  identifier === 'chiefeng'
                    ? 'bg-blue-950/80 border-blue-500 text-blue-200 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-white">Engineering</div>
                <div className="text-[9px] text-blue-400 truncate">chiefeng</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('housekeeping', 'password123')}
                className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                  identifier === 'housekeeping'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-white">Housekeeping</div>
                <div className="text-[9px] text-amber-400 truncate">housekeeping</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('supervisor', 'password123')}
                className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                  identifier === 'supervisor'
                    ? 'bg-blue-950/80 border-blue-500 text-blue-200 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-white">Supervisor</div>
                <div className="text-[9px] text-blue-400 truncate">supervisor</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('kasun', 'password123')}
                className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                  identifier === 'kasun'
                    ? 'bg-blue-950/80 border-blue-500 text-blue-200 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-white">Technician</div>
                <div className="text-[9px] text-blue-400 truncate">kasun</div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / PWA App Install Note */}
        <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/80 text-center space-y-1">
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Install as Mobile App (Android APK / iOS)</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Tap &ldquo;Add to Home screen&rdquo; or install the PWA for instant standalone mobile app access.
          </p>
        </div>
      </div>
    </div>
  );
}
