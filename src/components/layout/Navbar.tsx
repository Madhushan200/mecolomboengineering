'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useHotelEngineering } from '@/lib/store';
import {
  Wrench,
  Building,
  Shield,
  Volume2,
  VolumeX,
  UserCheck,
  LogOut,
  BarChart3,
  Settings,
  Bell,
  CheckCircle2,
  PlusCircle,
  Menu,
  X,
  Plus,
  FileText,
} from 'lucide-react';
import { useToast } from '../ui/Toast';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    settings,
    currentUser,
    users,
    switchUser,
    hasUnacceptedNewOrders,
    isMuted,
    toggleMute,
    enableAudio,
    isCloudConnected,
    lastCloudSync,
  } = useHotelEngineering();
  const { showToast } = useToast();

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If on login page, don't show navbar
  if (pathname === '/login') return null;

  const isAdmin = currentUser.role === 'ADMIN';
  const isExecutive = currentUser.role === 'EXECUTIVE';
  const isEngineering = currentUser.role === 'ENGINEERING' || currentUser.role === 'TECHNICIAN';

  const handleSwitch = (userId: string) => {
    switchUser(userId);
    const u = users.find(x => x.id === userId);
    if (u) {
      showToast(`Switched view to ${u.name} (${u.role})`, 'success');
      if (u.role === 'EXECUTIVE') {
        router.push('/executive');
      } else if (u.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/engineering');
      }
    }
    setShowRoleModal(false);
  };

  // Role-based Nav Links
  let navLinks: { label: string; href: string; icon: any; badge: string | null }[] = [];

  if (isAdmin) {
    // Admin sees everything
    navLinks = [
      { label: 'Admin Setup', href: '/admin', icon: Settings, badge: null },
      { label: 'Engineering Command', href: '/engineering', icon: Wrench, badge: hasUnacceptedNewOrders ? 'ALERT' : null },
      { label: 'Staff Portal', href: '/executive', icon: Building, badge: null },
      { label: 'Daily Reports', href: '/reports', icon: BarChart3, badge: null },
    ];
  } else if (isExecutive) {
    // Staff / Executive sees ONLY their dashboard and report problem
    navLinks = [
      { label: 'My Requests', href: '/executive', icon: FileText, badge: null },
      { label: 'Report Problem', href: '/executive/report', icon: PlusCircle, badge: null },
    ];
  } else if (isEngineering) {
    // Engineering sees ONLY Engineering Command and Daily Reports
    navLinks = [
      { label: 'Engineering Command', href: '/engineering', icon: Wrench, badge: hasUnacceptedNewOrders ? 'ALERT' : null },
      { label: 'Daily Shift Reports', href: '/reports', icon: BarChart3, badge: null },
    ];
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Hotel Identity */}
          <Link
            href={isExecutive ? '/executive' : isEngineering ? '/engineering' : '/admin'}
            className="flex items-center gap-2.5"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0 border border-slate-200/80 bg-slate-900 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Ceyvista Engineering Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 tracking-tight block leading-tight">
                {settings.hotelName || 'Ceyvista Engineering'}
              </span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">
                {isExecutive
                  ? `Staff Portal • ${currentUser.department}`
                  : isEngineering
                  ? 'Duty Engineering Portal'
                  : 'System Administration'}
              </span>
            </div>
          </Link>

          {/* Center: Role-Specific Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            {navLinks.map(link => {
              const isActive = pathname === link.href || (link.href !== '/executive' && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => enableAudio()}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* Supabase Live Cloud Status Badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                isCloudConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={
                isCloudConnected
                  ? `Supabase Live Sync Active • Last synced: ${lastCloudSync ? lastCloudSync.toLocaleTimeString() : 'Just now'}`
                  : 'Supabase Offline Mode'
              }
            >
              <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="hidden md:inline">{isCloudConnected ? 'Supabase Live' : 'Offline Mode'}</span>
            </div>

            {/* Audio Alert Toggle ONLY for Engineering & Admin */}
            {(isEngineering || isAdmin) && (
              <button
                onClick={() => {
                  enableAudio();
                  toggleMute();
                }}
                className={`p-2 rounded-xl text-xs font-bold transition-colors border cursor-pointer ${
                  hasUnacceptedNewOrders && !isMuted
                    ? 'bg-red-50 text-red-600 border-red-300 animate-pulse'
                    : isMuted
                    ? 'bg-slate-100 text-slate-400 border-slate-200'
                    : 'bg-blue-50 text-blue-600 border-blue-200'
                }`}
                title={isMuted ? 'Engineering sound alerts are muted' : 'Engineering sound alerts active'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            {/* Quick Report Button if in Executive portal */}
            {isExecutive && (
              <Link
                href="/executive/report"
                className="hidden sm:inline-flex btn-primary text-xs py-1.5 px-3 shadow-blue-500/10 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Report Issue</span>
              </Link>
            )}

            {/* User Profile Badge (Admin can click to switch personas; staff/eng see static badge) */}
            {isAdmin ? (
              <button
                onClick={() => setShowRoleModal(true)}
                className="p-1.5 pl-2.5 pr-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-xs font-semibold text-purple-900 transition-colors flex items-center gap-2 border border-purple-200 cursor-pointer"
                title="Admin: Click to switch testing persona"
              >
                <div className="w-6 h-6 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {currentUser.name[0]}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-bold text-[11px] leading-none text-purple-950">{currentUser.name}</div>
                  <div className="text-[9px] text-purple-700 font-bold uppercase mt-0.5">
                    {currentUser.role} (ADMIN)
                  </div>
                </div>
              </button>
            ) : (
              <div className="p-1.5 pl-2.5 pr-3 rounded-xl bg-slate-100 text-xs font-semibold text-slate-800 flex items-center gap-2 border border-slate-200/80">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {currentUser.name[0]}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-bold text-[11px] leading-none text-slate-900">{currentUser.name}</div>
                  <div className="text-[9px] text-blue-600 font-bold uppercase mt-0.5">
                    {currentUser.department}
                  </div>
                </div>
              </div>
            )}

            {/* Logout */}
            <Link
              href="/login"
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Role Switcher Dialog ONLY for Administrator */}
      {isAdmin && showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Administrator Role Switcher</h3>
                <p className="text-xs text-slate-500">Preview portal as different hotel staff members</p>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSwitch(u.id)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    currentUser.id === u.id
                      ? 'bg-blue-50 border-blue-300 font-bold text-blue-900'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[10px] text-slate-500">{u.department} ({u.username || u.email.split('@')[0]})</div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      u.role === 'EXECUTIVE'
                        ? 'bg-purple-100 text-purple-700'
                        : u.role === 'ENGINEERING'
                        ? 'bg-blue-100 text-blue-700'
                        : u.role === 'TECHNICIAN'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
