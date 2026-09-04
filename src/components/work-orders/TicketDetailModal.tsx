'use client';

import React, { useState } from 'react';
import { WorkOrder, Priority, WorkOrderStatus } from '@/lib/types';
import { useHotelEngineering } from '@/lib/store';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  X,
  Wrench,
  CheckCircle2,
  Play,
  Pause,
  Clock,
  UserCheck,
  Building,
  Check,
  AlertTriangle,
  History,
  Send,
  FileText,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface TicketDetailModalProps {
  workOrder: WorkOrder | null;
  onClose: () => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ workOrder, onClose }) => {
  const {
    technicians,
    currentUser,
    acceptWorkOrder,
    assignTechnician,
    startWork,
    setWaiting,
    resumeWork,
    completeWork,
    closeWorkOrder,
    enableAudio,
  } = useHotelEngineering();

  const { showToast } = useToast();

  const [selectedTechId, setSelectedTechId] = useState(
    workOrder?.assignedTechnicianId || (technicians[0]?.id || '')
  );

  const [showWaitingForm, setShowWaitingForm] = useState(false);
  const [waitingReason, setWaitingReason] = useState('Waiting for replacement spare parts delivery');

  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [workDoneText, setWorkDoneText] = useState('Repaired and verified operational.');
  const [techNoteText, setTechNoteText] = useState('All functions tested in working order.');

  const [showCloseForm, setShowCloseForm] = useState(false);
  const [closeNoteText, setCloseNoteText] = useState('Quality inspection verified and approved.');

  if (!workOrder) return null;

  const handleAssign = () => {
    if (!selectedTechId) return;
    const tech = technicians.find((t) => t.id === selectedTechId);
    assignTechnician(workOrder.id, selectedTechId, tech?.name || 'Assigned Technician');
    showToast(`Technician ${tech?.name} assigned to ${workOrder.workOrderNumber}`, 'success');
  };

  const handleAccept = () => {
    enableAudio();
    acceptWorkOrder(workOrder.id, currentUser.name);
    showToast(`Work Order ${workOrder.workOrderNumber} Accepted!`, 'success');
  };

  const handleStart = () => {
    startWork(workOrder.id);
    showToast(`Work started on ${workOrder.workOrderNumber}`, 'success');
  };

  const handleWaiting = () => {
    if (!waitingReason.trim()) return;
    setWaiting(workOrder.id, waitingReason);
    setShowWaitingForm(false);
    showToast(`Status updated to WAITING for ${workOrder.workOrderNumber}`, 'warning');
  };

  const handleResume = () => {
    resumeWork(workOrder.id);
    showToast(`Work resumed on ${workOrder.workOrderNumber}`, 'success');
  };

  const handleComplete = () => {
    if (!workDoneText.trim()) return;
    completeWork(workOrder.id, workDoneText, techNoteText);
    setShowCompleteForm(false);
    showToast(`Work Order ${workOrder.workOrderNumber} marked COMPLETED!`, 'success');
  };

  const handleClose = () => {
    closeWorkOrder(workOrder.id, closeNoteText);
    setShowCloseForm(false);
    showToast(`Work Order ${workOrder.workOrderNumber} permanently CLOSED & Verified.`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-scale-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100/80 text-blue-700">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black text-slate-700">
                  {workOrder.workOrderNumber || workOrder.id}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  🏨 {workOrder.hotelName || 'ME Colombo'}
                </span>
                <PriorityBadge priority={workOrder.priority} />
                <StatusBadge status={workOrder.status} />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5 line-clamp-1">
                {workOrder.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800">
          {/* Defect Information Card */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Property</span>
              <p className="text-xs font-bold text-blue-700 mt-0.5">{workOrder.hotelName || 'ME Colombo'}</p>
            </div>
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
              <span className="text-[10px] font-bold text-slate-400 uppercase">Department</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{workOrder.departmentName}</p>
            </div>
          </div>

          {/* Problem Description */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Problem Description
            </label>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {workOrder.description}
            </div>
          </div>

          {/* Assigned Technician Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Assigned Technician</span>
                <p className="text-xs font-bold text-slate-800">
                  {workOrder.assignedTechnicianName || 'Unassigned'}
                </p>
              </div>
            </div>

            {currentUser.role !== 'EXECUTIVE' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Tech --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.specialization})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssign}
                  className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all"
                >
                  Assign
                </button>
              </div>
            )}
          </div>

          {/* Work Done Info (If Finished) */}
          {(workOrder.status === 'COMPLETED' || workOrder.status === 'CLOSED') && (
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Work Done & Resolution Summary
              </div>
              <p className="text-xs text-slate-700">{workOrder.workDone || 'Repaired and operational'}</p>
              {workOrder.completionNote && (
                <p className="text-[11px] text-slate-500 italic">Note: {workOrder.completionNote}</p>
              )}
            </div>
          )}

          {/* Modal Forms for Waiting, Complete, Close */}
          {showWaitingForm && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3 animate-fade-in">
              <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                <Pause className="w-4 h-4 text-amber-600" />
                Specify Reason for Delay / Waiting for Parts:
              </span>
              <input
                type="text"
                value={waitingReason}
                onChange={(e) => setWaitingReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-amber-300 bg-white"
                placeholder="e.g. Waiting for AC capacitor delivery..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowWaitingForm(false)}
                  className="text-xs px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWaiting}
                  className="text-xs px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg"
                >
                  Confirm Hold
                </button>
              </div>
            </div>
          )}

          {showCompleteForm && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3 animate-fade-in">
              <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Work Completion & Repair Details:
              </span>
              <textarea
                rows={2}
                value={workDoneText}
                onChange={(e) => setWorkDoneText(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-white"
                placeholder="Describe the repair actions taken..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCompleteForm(false)}
                  className="text-xs px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleComplete}
                  className="text-xs px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  Submit & Complete
                </button>
              </div>
            </div>
          )}

          {showCloseForm && (
            <div className="p-4 bg-slate-100 rounded-xl border border-slate-300 space-y-3 animate-fade-in">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-slate-700" />
                Supervisor Final Sign-Off & Verification:
              </span>
              <input
                type="text"
                value={closeNoteText}
                onChange={(e) => setCloseNoteText(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                placeholder="Supervisor verification note..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCloseForm(false)}
                  className="text-xs px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClose}
                  className="text-xs px-4 py-1.5 bg-slate-900 hover:bg-black text-white font-bold rounded-lg"
                >
                  Confirm Close
                </button>
              </div>
            </div>
          )}

          {/* Action Button Bar for Engineering */}
          {currentUser.role !== 'EXECUTIVE' && !showWaitingForm && !showCompleteForm && !showCloseForm && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2.5">
              {workOrder.status === 'NEW' && (
                <button
                  onClick={handleAccept}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Check className="w-4 h-4" />
                  Accept & Acknowledge
                </button>
              )}

              {workOrder.status === 'ACCEPTED' && (
                <button
                  onClick={handleStart}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Play className="w-4 h-4" />
                  Start Work (Begin Repair)
                </button>
              )}

              {workOrder.status === 'IN_PROGRESS' && (
                <>
                  <button
                    onClick={() => setShowCompleteForm(true)}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Completed
                  </button>
                  <button
                    onClick={() => setShowWaitingForm(true)}
                    className="py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Pause className="w-4 h-4" />
                    Waiting for Parts
                  </button>
                </>
              )}

              {workOrder.status === 'WAITING' && (
                <button
                  onClick={handleResume}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  Resume Work Now
                </button>
              )}

              {workOrder.status === 'COMPLETED' && (
                <button
                  onClick={() => setShowCloseForm(true)}
                  className="flex-1 py-3 px-4 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Check className="w-4 h-4" />
                  Supervisor Sign-Off & Close
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>Reported by: <strong>{workOrder.reportedBy}</strong></span>
          <span>Time: {new Date(workOrder.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};
