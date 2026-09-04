'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useHotelEngineering } from '@/lib/store';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Plus,
  Building,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  ArrowRight,
  Search,
  Wrench,
  AlertCircle,
  User,
  Eye,
  Camera,
} from 'lucide-react';
import { TicketDetailModal } from '@/components/work-orders/TicketDetailModal';

export default function ExecutivePortalPage() {
  const { workOrders, currentUser, settings } = useHotelEngineering();
  const [activeTab, setActiveTab] = useState<'ALL' | 'NEW' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);

  // Filter requests (if executive, show all or their department requests)
  const filteredOrders = workOrders.filter(w => {
    // Tab filter
    if (activeTab === 'NEW' && w.status !== 'NEW' && w.status !== 'ACCEPTED') return false;
    if (activeTab === 'IN_PROGRESS' && w.status !== 'IN_PROGRESS' && w.status !== 'WAITING') return false;
    if (activeTab === 'COMPLETED' && w.status !== 'COMPLETED' && w.status !== 'CLOSED') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        w.workOrderNumber.toLowerCase().includes(q) ||
        w.title.toLowerCase().includes(q) ||
        w.location.toLowerCase().includes(q) ||
        (w.roomNumber && w.roomNumber.toLowerCase().includes(q)) ||
        w.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const newCount = workOrders.filter(w => w.status === 'NEW' || w.status === 'ACCEPTED').length;
  const inProgressCount = workOrders.filter(w => w.status === 'IN_PROGRESS' || w.status === 'WAITING').length;
  const completedCount = workOrders.filter(w => w.status === 'COMPLETED' || w.status === 'CLOSED').length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Welcome & Quick Action Card */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-blue-500/30 px-3 py-1 rounded-full text-xs font-bold text-blue-200 border border-blue-400/30">
            <span>Department: {currentUser.department}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Hello, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 max-w-xl leading-relaxed">
            Report any guestroom maintenance issues, equipment defects, or public area breakdowns directly to the Engineering Team.
          </p>
        </div>

        <Link
          href="/executive/report"
          className="px-6 py-3.5 rounded-2xl bg-white text-blue-900 hover:bg-blue-50 font-black text-sm shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-5 h-5 text-blue-600" />
          <span>REPORT A PROBLEM</span>
        </Link>
      </div>

      {/* 4 Status KPI Tab Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`card-base p-4 text-left transition-all cursor-pointer ${
            activeTab === 'ALL'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-400 uppercase">All My Requests</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{workOrders.length}</div>
        </button>

        <button
          onClick={() => setActiveTab('NEW')}
          className={`card-base p-4 text-left transition-all cursor-pointer ${
            activeTab === 'NEW'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-400 uppercase">Waiting Acceptance</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{newCount}</div>
        </button>

        <button
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={`card-base p-4 text-left transition-all cursor-pointer ${
            activeTab === 'IN_PROGRESS'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-400 uppercase">In Progress</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{inProgressCount}</div>
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`card-base p-4 text-left transition-all cursor-pointer ${
            activeTab === 'COMPLETED'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-400 uppercase">Completed / Closed</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card-base flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by Room number, WO# (e.g. WO-2026-0045), or issue description..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full text-xs font-medium focus:outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="card-base p-12 text-center space-y-3">
            <Building className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No maintenance requests found</h3>
            <p className="text-xs text-slate-400">Tap the Report a Problem button to submit a request</p>
          </div>
        ) : (
          filteredOrders.map(wo => {
            const isCompletedOrClosed = wo.status === 'COMPLETED' || wo.status === 'CLOSED';
            const isStarted = ['IN_PROGRESS', 'WAITING', 'COMPLETED', 'CLOSED'].includes(wo.status);
            const isAccepted = ['ACCEPTED', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'CLOSED'].includes(wo.status);

            return (
              <div
                key={wo.id}
                className="card-base p-5 space-y-4 hover:border-blue-300 transition-all shadow-sm"
              >
                {/* Header: WO#, Property, Location, Priority, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-sm text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      {wo.workOrderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        wo.hotelName === 'Rockwell'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : (wo.hotelName === 'NEVA' || wo.hotelName === 'Neva')
                          ? 'bg-teal-100 text-teal-800 border-teal-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      🏨 {wo.hotelName || 'ME Colombo'}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      📍 {wo.location} {wo.roomNumber ? `• Room ${wo.roomNumber}` : ''}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">({wo.category})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={wo.priority} size="sm" />
                    <StatusBadge status={wo.status} size="sm" />
                    {wo.photoUrl && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        <Camera className="w-3 h-3" /> Photo
                      </span>
                    )}
                  </div>
                </div>

                {/* Issue Title, Description & Photo Thumbnail */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-base font-black text-slate-900 leading-snug">{wo.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{wo.description}</p>
                  </div>
                  {wo.photoUrl && (
                    <div
                      onClick={() => setSelectedWorkOrder(wo)}
                      className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 cursor-pointer hover:opacity-90 shadow-xs relative group"
                      title="Click to view work order & attached photo"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={wo.photoUrl}
                        alt="Defect photo"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Waiting reason or work done notes if present */}
                {wo.status === 'WAITING' && wo.waitingReason && (
                  <div className="p-3 bg-fuchsia-50 rounded-xl border border-fuchsia-200 text-xs text-fuchsia-900 space-y-0.5">
                    <span className="font-bold uppercase text-[10px] text-fuchsia-700">
                      ⏳ Reason on Hold:
                    </span>
                    <p className="font-medium">{wo.waitingReason}</p>
                  </div>
                )}

                {wo.workDone && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-0.5">
                    <span className="font-bold uppercase text-[10px] text-emerald-700">
                      ✓ Work Performed by Engineering:
                    </span>
                    <p className="font-medium">{wo.workDone}</p>
                    {wo.completionNote && (
                      <p className="text-[11px] text-emerald-800 italic">{wo.completionNote}</p>
                    )}
                  </div>
                )}

                {/* 5-Stage Visual Progress Timeline (Requirement 15) */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                    <span className="font-bold uppercase text-[10px] text-slate-400">Live Progress Status</span>
                    {wo.assignedTechnicianName && (
                      <span>
                        Assigned Tech: <strong>{wo.assignedTechnicianName}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between relative px-2">
                    <div className="absolute left-4 right-4 top-2.5 h-0.5 bg-slate-200 z-0" />
                    
                    {/* Stage 1: Reported */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 mt-1">Reported</span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(wo.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Stage 2: Accepted */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isAccepted
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {isAccepted ? '✓' : '2'}
                      </div>
                      <span className={`text-[10px] mt-1 ${isAccepted ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                        Accepted
                      </span>
                      {wo.acceptedAt && (
                        <span className="text-[9px] text-slate-400">
                          {new Date(wo.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {/* Stage 3: In Progress */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isStarted
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {isStarted ? '✓' : '3'}
                      </div>
                      <span className={`text-[10px] mt-1 ${isStarted ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                        In Progress
                      </span>
                      {wo.startedAt && (
                        <span className="text-[9px] text-slate-400">
                          {new Date(wo.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {/* Stage 4: Completed */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isCompletedOrClosed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {isCompletedOrClosed ? '✓' : '4'}
                      </div>
                      <span className={`text-[10px] mt-1 ${isCompletedOrClosed ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                        Completed
                      </span>
                      {wo.completedAt && (
                        <span className="text-[9px] text-slate-400">
                          {new Date(wo.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {/* Stage 5: Closed */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          wo.status === 'CLOSED'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {wo.status === 'CLOSED' ? '✓' : '5'}
                      </div>
                      <span className={`text-[10px] mt-1 ${wo.status === 'CLOSED' ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                        Closed
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setSelectedWorkOrder(wo)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Details & History →</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Universal Ticket Detail Modal */}
      {selectedWorkOrder && (
        <TicketDetailModal
          workOrder={workOrders.find(w => w.id === selectedWorkOrder.id) || selectedWorkOrder}
          onClose={() => setSelectedWorkOrder(null)}
        />
      )}
    </div>
  );
}
