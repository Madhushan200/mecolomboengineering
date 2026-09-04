'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useHotelEngineering } from '@/lib/store';
import { Priority, WorkOrderStatus } from '@/lib/types';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SoundAlertBanner } from '@/components/ui/SoundAlertBanner';
import {
  Wrench,
  Search,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  AlertOctagon,
  ArrowRight,
  UserCheck,
  Filter,
  Check,
  Plus,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

import { TicketDetailModal } from '@/components/work-orders/TicketDetailModal';

export default function EngineeringPortalPage() {
  const router = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null;
  const {
    workOrders,
    acceptWorkOrder,
    currentUser,
    enableAudio,
    technicians,
    assignTechnician,
  } = useHotelEngineering();
  const { showToast } = useToast();

  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);

  React.useEffect(() => {
    if (currentUser?.role === 'EXECUTIVE') {
      router?.replace('/executive');
    }
  }, [currentUser, router]);

  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Top KPIs
  const newCount = workOrders.filter(w => w.status === 'NEW').length;
  const acceptedCount = workOrders.filter(w => w.status === 'ACCEPTED').length;
  const inProgressCount = workOrders.filter(w => w.status === 'IN_PROGRESS').length;
  const waitingCount = workOrders.filter(w => w.status === 'WAITING').length;
  const completedTodayCount = workOrders.filter(w => w.status === 'COMPLETED' || w.status === 'CLOSED').length;

  // P1 Emergency Requests (Requirement 32)
  const p1Emergencies = workOrders.filter(
    w => w.priority === 'P1' && w.status !== 'CLOSED' && w.status !== 'COMPLETED'
  );

  // Filtered List
  const filteredWorkOrders = workOrders.filter(wo => {
    // Priority filter
    if (['P1', 'P2', 'P3', 'P4'].includes(selectedFilter) && wo.priority !== selectedFilter) {
      return false;
    }

    // Status filter
    if (selectedFilter === 'NEW' && wo.status !== 'NEW') return false;
    if (selectedFilter === 'ACCEPTED' && wo.status !== 'ACCEPTED') return false;
    if (selectedFilter === 'IN_PROGRESS' && wo.status !== 'IN_PROGRESS') return false;
    if (selectedFilter === 'WAITING' && wo.status !== 'WAITING') return false;
    if (selectedFilter === 'COMPLETED' && wo.status !== 'COMPLETED' && wo.status !== 'CLOSED') {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        wo.workOrderNumber.toLowerCase().includes(q) ||
        wo.title.toLowerCase().includes(q) ||
        wo.location.toLowerCase().includes(q) ||
        (wo.roomNumber && wo.roomNumber.toLowerCase().includes(q)) ||
        wo.departmentName.toLowerCase().includes(q) ||
        wo.category.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const handleAccept = (woId: string, woNum: string) => {
    enableAudio();
    acceptWorkOrder(woId, currentUser.name);
    showToast(`Work Order ${woNum} accepted! Status moved to ACCEPTED.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* 1. Audible Sound Alert Banner if unaccepted tickets exist */}
      <SoundAlertBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-blue-600">
            Duty Command & Dispatch
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            <span>Engineering Work Order Command</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time incoming alerts, priority triaging, technician dispatch, and repair status
          </p>
        </div>

        <Link
          href="/executive/report"
          className="btn-primary text-xs py-2 px-4 shadow-blue-500/10 gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Engineering Log</span>
        </Link>
      </div>

      {/* 2. Top 5 KPI Cards (Requirement 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setSelectedFilter('NEW')}
          className={`card-base p-4 text-center cursor-pointer transition-all ${
            selectedFilter === 'NEW'
              ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/30'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            NEW REQUESTS
          </div>
          <div className="text-2xl font-black text-red-600 mt-1">{newCount}</div>
          <div className="text-[10px] text-red-600 font-bold mt-0.5">
            {newCount > 0 ? 'Requires Acceptance' : 'None pending'}
          </div>
        </div>

        <div
          onClick={() => setSelectedFilter('ACCEPTED')}
          className={`card-base p-4 text-center cursor-pointer transition-all ${
            selectedFilter === 'ACCEPTED'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            ACCEPTED
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{acceptedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Ready for tech</div>
        </div>

        <div
          onClick={() => setSelectedFilter('IN_PROGRESS')}
          className={`card-base p-4 text-center cursor-pointer transition-all ${
            selectedFilter === 'IN_PROGRESS'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            IN PROGRESS
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{inProgressCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Work active</div>
        </div>

        <div
          onClick={() => setSelectedFilter('WAITING')}
          className={`card-base p-4 text-center cursor-pointer transition-all ${
            selectedFilter === 'WAITING'
              ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/20 bg-fuchsia-50/30'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            WAITING (HOLD)
          </div>
          <div className="text-2xl font-black text-fuchsia-600 mt-1">{waitingCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Parts / Access</div>
        </div>

        <div
          onClick={() => setSelectedFilter('COMPLETED')}
          className={`card-base p-4 text-center cursor-pointer transition-all sm:col-span-1 col-span-2 ${
            selectedFilter === 'COMPLETED'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            COMPLETED TODAY
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{completedTodayCount}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Finished</div>
        </div>
      </div>

      {/* 3. 🚨 P1 EMERGENCY SPOTLIGHT SECTION (Requirement 32) */}
      {p1Emergencies.length > 0 && (
        <div className="p-4 sm:p-5 bg-red-50 rounded-3xl border-2 border-red-400 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-red-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
              <h3 className="text-sm font-black text-red-900 uppercase tracking-wide flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-red-600" />
                <span>🚨 Active P1 Emergency Requests ({p1Emergencies.length})</span>
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase bg-red-200 text-red-900 px-2 py-0.5 rounded">
              High Priority Attention
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {p1Emergencies.map(p1 => (
              <div
                key={p1.id}
                className="p-3.5 bg-white rounded-2xl border border-red-300 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded">
                        {p1.workOrderNumber}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        🏨 {p1.hotelName || 'ME Colombo'}
                      </span>
                    </div>
                    <StatusBadge status={p1.status} size="sm" />
                  </div>
                  <h4 className="font-black text-slate-900 text-sm mt-1">{p1.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                    📍 {p1.location} {p1.roomNumber ? `• Room ${p1.roomNumber}` : ''} • {p1.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500">
                    From: <strong>{p1.departmentName}</strong>
                  </span>
                  {p1.status === 'NEW' ? (
                    <button
                      onClick={() => handleAccept(p1.id, p1.workOrderNumber)}
                      className="btn-primary text-xs py-1.5 px-3 bg-red-600 hover:bg-red-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ACCEPT NOW</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedWorkOrder(p1)}
                      className="btn-secondary text-xs py-1.5 px-3 cursor-pointer hover:bg-slate-200"
                    >
                      <span>Manage Ticket →</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Filter Toolbar & Search */}
      <div className="card-base p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search work order number (WO-2026-0045), room 305, problem, or location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { id: 'ALL', label: 'All Requests' },
            { id: 'NEW', label: `New (${newCount})` },
            { id: 'ACCEPTED', label: `Accepted (${acceptedCount})` },
            { id: 'IN_PROGRESS', label: `In Progress (${inProgressCount})` },
            { id: 'WAITING', label: `Waiting (${waitingCount})` },
            { id: 'COMPLETED', label: `Completed (${completedTodayCount})` },
            { id: 'P1', label: '🔴 P1 Emergency' },
            { id: 'P2', label: '🟠 P2 High' },
            { id: 'P3', label: '🟡 P3 Normal' },
            { id: 'P4', label: '🟢 P4 Planned' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedFilter === f.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Work Orders List */}
      <div className="space-y-3">
        {filteredWorkOrders.length === 0 ? (
          <div className="card-base p-12 text-center text-xs text-slate-400">
            No work orders matching your current filter.
          </div>
        ) : (
          filteredWorkOrders.map(wo => {
            const isNew = wo.status === 'NEW';

            return (
              <div
                key={wo.id}
                className={`card-base p-5 space-y-4 hover:border-blue-300 transition-all ${
                  isNew ? 'border-l-4 border-l-red-500 bg-red-50/10' : ''
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                      {wo.workOrderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        wo.hotelName === 'Rockwell'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : wo.hotelName === 'Neva'
                          ? 'bg-teal-100 text-teal-800 border-teal-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      🏨 {wo.hotelName || 'ME Colombo'}
                    </span>
                    <PriorityBadge priority={wo.priority} size="sm" />
                    <StatusBadge status={wo.status} size="sm" />
                    <span className="text-xs font-bold text-slate-800">
                      📍 {wo.location} {wo.roomNumber ? `• Room ${wo.roomNumber}` : ''}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400">
                    Reported by: <strong>{wo.reportedBy}</strong> ({wo.departmentName}) •{' '}
                    {new Date(wo.reportedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* Problem Title & Details */}
                <div>
                  <h3 className="text-sm font-black text-slate-900">{wo.title}</h3>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{wo.description}</p>
                </div>

                {/* Bottom Controls Row */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 text-slate-500">
                    <span>
                      Technician:{' '}
                      <strong className="text-slate-900">
                        {wo.assignedTechnicianName || 'Unassigned'}
                      </strong>
                    </span>
                    {wo.waitingReason && (
                      <span className="text-fuchsia-700 font-bold truncate max-w-xs">
                        • Hold: {wo.waitingReason}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 1-Click Accept Button if NEW */}
                    {isNew && (
                      <button
                        onClick={() => handleAccept(wo.id, wo.workOrderNumber)}
                        className="btn-primary text-xs py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 font-black"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>ACCEPT</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedWorkOrder(wo)}
                      className="btn-secondary text-xs py-1.5 px-3.5 font-bold cursor-pointer hover:bg-slate-200"
                    >
                      <span>View & Manage →</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Universal Interactive Ticket Detail & Action Modal */}
      {selectedWorkOrder && (
        <TicketDetailModal
          workOrder={workOrders.find(w => w.id === selectedWorkOrder.id) || selectedWorkOrder}
          onClose={() => setSelectedWorkOrder(null)}
        />
      )}
    </div>
  );
}
