'use client';

import React, { useState } from 'react';
import { WorkOrder, Priority, WorkOrderStatus } from '@/lib/types';
import { useHotelEngineering } from '@/lib/store';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ImageUploader } from '@/components/ui/ImageUploader';
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
  Camera,
  Eye,
  Trash2,
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
    deleteWorkOrder,
    enableAudio,
  } = useHotelEngineering();

  const { showToast } = useToast();

  const [selectedTechId, setSelectedTechId] = useState(
    workOrder?.assignedTechnicianId || (technicians[0]?.id || '')
  );

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [showWaitingForm, setShowWaitingForm] = useState(false);
  const [waitingReason, setWaitingReason] = useState('Waiting for replacement spare parts delivery');

  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [workDoneText, setWorkDoneText] = useState('Repaired and verified operational.');
  const [techNoteText, setTechNoteText] = useState('All functions tested in working order.');
  const [afterPhotoUrl, setAfterPhotoUrl] = useState('');

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
    completeWork(workOrder.id, workDoneText, techNoteText, afterPhotoUrl || undefined);
    setShowCompleteForm(false);
    showToast(`Work Order ${workOrder.workOrderNumber} marked COMPLETED!`, 'success');
  };

  const handleClose = () => {
    closeWorkOrder(workOrder.id, closeNoteText);
    setShowCloseForm(false);
    showToast(`Work Order ${workOrder.workOrderNumber} permanently CLOSED & Verified.`, 'success');
  };

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to permanently delete ticket ${workOrder.workOrderNumber}? This action cannot be undone.`
      )
    ) {
      deleteWorkOrder(workOrder.id, workOrder.workOrderNumber);
      showToast(`Ticket ${workOrder.workOrderNumber} deleted successfully.`, 'info');
      onClose();
    }
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
          <div className="flex items-center gap-2">
            {currentUser.role === 'ADMIN' && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 px-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Admin: Permanently delete ticket"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete Ticket</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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

          {/* Photos Section: Initial Defect & Repair Photos */}
          {(workOrder.photoUrl || workOrder.afterPhotoUrl) && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Attached Photos
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {workOrder.photoUrl && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        Defect Photo (Before)
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewImage(workOrder.photoUrl || null)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                      >
                        <Eye className="w-3 h-3" />
                        Full View
                      </button>
                    </div>
                    <div 
                      onClick={() => setPreviewImage(workOrder.photoUrl || null)}
                      className="relative h-36 rounded-lg overflow-hidden bg-slate-200 border border-slate-300/80 cursor-pointer group shadow-xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={workOrder.photoUrl}
                        alt="Defect photo"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                        <Eye className="w-4 h-4" /> Click to zoom
                      </div>
                    </div>
                  </div>
                )}

                {workOrder.afterPhotoUrl && (
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Proof of Repair (After)
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewImage(workOrder.afterPhotoUrl || null)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
                      >
                        <Eye className="w-3 h-3" />
                        Full View
                      </button>
                    </div>
                    <div 
                      onClick={() => setPreviewImage(workOrder.afterPhotoUrl || null)}
                      className="relative h-36 rounded-lg overflow-hidden bg-slate-200 border border-emerald-300 cursor-pointer group shadow-xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={workOrder.afterPhotoUrl}
                        alt="Proof of repair"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                        <Eye className="w-4 h-4" /> Click to zoom
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                className="w-full text-xs p-2.5 rounded-lg border border-amber-300 bg-white font-medium text-slate-800"
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
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3.5 animate-fade-in">
              <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Work Completion & Repair Verification:
              </span>
              
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Actions Taken to Resolve:
                </label>
                <textarea
                  rows={2}
                  value={workDoneText}
                  onChange={(e) => setWorkDoneText(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-white font-medium text-slate-800"
                  placeholder="Describe the repair actions taken..."
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Technician Quality Note (Optional):
                </label>
                <input
                  type="text"
                  value={techNoteText}
                  onChange={(e) => setTechNoteText(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-emerald-300 bg-white font-medium text-slate-800"
                  placeholder="e.g. Tested temperature output at 18°C, fan operating normally"
                />
              </div>

              {/* Real Image Uploader for Proof of Repair */}
              <div className="pt-2 border-t border-emerald-200/70">
                <ImageUploader
                  label="Attach Proof of Repair Photo (Optional / Camera)"
                  description="Take a live photo of the repaired equipment or pick from gallery"
                  value={afterPhotoUrl}
                  onChange={setAfterPhotoUrl}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200">
                <button
                  type="button"
                  onClick={() => setShowCompleteForm(false)}
                  className="text-xs px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleComplete}
                  className="text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Submit & Complete Repair
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
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
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

      {/* Full-Screen Image Preview Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <Camera className="w-4 h-4 text-blue-400" />
                <span>Photo Inspection • {workOrder.workOrderNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto max-h-[80vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt="Full size preview"
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
