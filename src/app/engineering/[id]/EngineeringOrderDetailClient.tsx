'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useHotelEngineering } from '@/lib/store';
import { Priority, WorkOrderStatus } from '@/lib/types';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Wrench,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  AlertTriangle,
  UserCheck,
  Building,
  History,
  Check,
  Camera,
  X,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function EngineeringOrderDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const {
    workOrders,
    technicians,
    currentUser,
    acceptWorkOrder,
    assignTechnician,
    startWork,
    setWaiting,
    resumeWork,
    completeWork,
    closeWorkOrder,
    deleteWorkOrder,
  } = useHotelEngineering();

  const toast = useToast();

  const workOrder = workOrders.find((w) => w.id === id);

  const [selectedTechId, setSelectedTechId] = useState(
    workOrder?.assignedTechnicianId || (technicians[0]?.id || '')
  );

  // Modals
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [waitingReason, setWaitingReason] = useState('Waiting for replacement spare parts delivery');

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [workDoneText, setWorkDoneText] = useState('Repaired and tested operational.');
  const [techNoteText, setTechNoteText] = useState('All functions verified working smoothly.');
  const [afterPhotoUrl, setAfterPhotoUrl] = useState('');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeNoteText, setCloseNoteText] = useState('Verified by supervisor. Quality approved.');

  if (!workOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <Wrench className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Work Order Not Found</h2>
          <p className="text-slate-500 text-sm mt-1">
            Work order <code className="bg-slate-100 px-2 py-0.5 rounded">{id}</code> does not exist or has been deleted.
          </p>
          <Link
            href="/engineering"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Engineering Board
          </Link>
        </div>
      </div>
    );
  }

  const handleAssign = () => {
    if (!selectedTechId) return;
    const tech = technicians.find((t) => t.id === selectedTechId);
    assignTechnician(workOrder.id, selectedTechId, tech?.name || 'Assigned Technician');
    toast.success('Technician assigned successfully');
  };

  const handleAccept = () => {
    acceptWorkOrder(workOrder.id);
    toast.success('Work Order Accepted & Acknowledged');
  };

  const handleStart = () => {
    startWork(workOrder.id);
    toast.success('Work timer started');
  };

  const handleWaiting = () => {
    if (!waitingReason.trim()) return;
    setWaiting(workOrder.id, waitingReason);
    setShowWaitingModal(false);
    toast.warning('Work Order status set to Waiting');
  };

  const handleResume = () => {
    resumeWork(workOrder.id);
    toast.success('Work resumed');
  };

  const handleComplete = () => {
    if (!workDoneText.trim()) return;
    completeWork(workOrder.id, workDoneText, techNoteText, afterPhotoUrl || undefined);
    setShowCompleteModal(false);
    toast.success('Work Order marked Completed & sent to Supervisor');
  };

  const handleClose = () => {
    closeWorkOrder(workOrder.id, closeNoteText);
    setShowCloseModal(false);
    toast.success('Work Order verified and permanently CLOSED');
  };

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to permanently delete ticket ${workOrder.workOrderNumber || workOrder.id}? This action cannot be undone.`
      )
    ) {
      deleteWorkOrder(workOrder.id, workOrder.workOrderNumber);
      toast.info(`Ticket ${workOrder.workOrderNumber || workOrder.id} deleted successfully`);
      router.push('/engineering');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/engineering"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-500">{workOrder.id}</span>
              <PriorityBadge priority={workOrder.priority} />
              <StatusBadge status={workOrder.status} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{workOrder.title}</h1>
          </div>
        </div>

        {currentUser.role === 'ADMIN' && (
          <button
            type="button"
            onClick={handleDelete}
            className="p-2.5 px-4 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            title="Admin: Permanently delete ticket"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Ticket</span>
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Info Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Defect & Location Information
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{workOrder.location}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Room #</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{workOrder.roomNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{workOrder.category}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Guest Affected</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {workOrder.guestAffected ? 'YES ⚠️' : 'No'}
                </p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400">Problem Description</label>
              <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-1.5 leading-relaxed">
                {workOrder.description}
              </p>
            </div>
          </div>

          {/* Resolution Card if Completed/Closed */}
          {(workOrder.status === 'COMPLETED' || workOrder.status === 'CLOSED') && (
            <div className="bg-emerald-50/80 rounded-2xl p-6 border border-emerald-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Work Done & Resolution Summary
              </h3>
              <div>
                <span className="font-bold uppercase text-[10px] text-emerald-700">Work Performed:</span>
                <p className="text-xs text-slate-800 font-medium mt-1">{workOrder.workDone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Engineering Action Control
            </h3>

            {/* If NEW */}
            {workOrder.status === 'NEW' && (
              <div className="space-y-3">
                <button
                  onClick={handleAccept}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  Acknowledge & Accept Work Order
                </button>
              </div>
            )}

            {/* If ACCEPTED */}
            {workOrder.status === 'ACCEPTED' && (
              <div className="space-y-3">
                <button
                  onClick={handleStart}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  Start Work (Begin Timer)
                </button>
              </div>
            )}

            {/* If IN_PROGRESS */}
            {workOrder.status === 'IN_PROGRESS' && (
              <div className="space-y-2.5">
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Work Done & Complete
                </button>

                <button
                  onClick={() => setShowWaitingModal(true)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Pause className="w-4 h-4" />
                  Hold / Waiting for Spare Parts
                </button>
              </div>
            )}

            {/* If WAITING */}
            {workOrder.status === 'WAITING' && (
              <div className="space-y-2.5">
                <button
                  onClick={handleResume}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4" />
                  Resume Work Now
                </button>
              </div>
            )}

            {/* If COMPLETED */}
            {workOrder.status === 'COMPLETED' && (
              <button
                onClick={() => setShowCloseModal(true)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Check className="w-4 h-4" />
                Supervisor Close & Verify
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
