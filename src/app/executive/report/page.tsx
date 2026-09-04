'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHotelEngineering } from '@/lib/store';
import { LocationOption, CategoryOption, Priority, HotelProperty } from '@/lib/types';
import { suggestSimplePriority } from '@/lib/priority-engine';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { ImageUploader } from '@/components/ui/ImageUploader';
import {
  Wrench,
  ArrowLeft,
  Send,
  Camera,
  CheckCircle2,
  Sparkles,
  Building,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function ReportProblemPage() {
  const router = useRouter();
  const { createWorkOrder, currentUser, enableAudio } = useHotelEngineering();
  const { showToast } = useToast();

  const [selectedHotel, setSelectedHotel] = useState<HotelProperty>('ME Colombo');
  const [location, setLocation] = useState<LocationOption>('Guest Room');
  const [roomNumber, setRoomNumber] = useState('305');
  const [category, setCategory] = useState<CategoryOption>('AC');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [guestAffected, setGuestAffected] = useState(true);

  // Success state
  const [submittedWo, setSubmittedWo] = useState<{ id: string; workOrderNumber: string; hotelName?: string } | null>(
    null
  );

  // Automatic Priority Suggestion (Requirement 5)
  const prioritySuggestion = useMemo(() => {
    return suggestSimplePriority({
      location,
      roomNumber: location === 'Guest Room' ? roomNumber : undefined,
      category,
      title,
      description,
      guestAffected,
    });
  }, [location, roomNumber, category, title, description, guestAffected]);

  const [overridePriority, setOverridePriority] = useState<Priority | null>(null);
  const finalPriority = overridePriority || prioritySuggestion.suggestedPriority;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter a short problem title', 'error');
      return;
    }

    if (location === 'Guest Room' && !roomNumber.trim()) {
      showToast('Please enter the guest room number', 'error');
      return;
    }

    enableAudio();

    const created = createWorkOrder({
      hotelName: selectedHotel,
      reportedBy: currentUser.name,
      reportedById: currentUser.id,
      departmentName: currentUser.department,
      location,
      roomNumber: location === 'Guest Room' ? roomNumber.trim() : undefined,
      category,
      title: title.trim(),
      description: description.trim() || title.trim(),
      photoUrl: photoUrl.trim() || undefined,
      guestAffected,
      priority: finalPriority,
      suggestedPriority: prioritySuggestion.suggestedPriority,
      priorityRationale: prioritySuggestion.rationale,
    });

    setSubmittedWo({ id: created.id, workOrderNumber: created.workOrderNumber, hotelName: selectedHotel });
    showToast(`Request ${created.workOrderNumber} (${selectedHotel}) submitted successfully!`, 'success');
  };

  // If submitted successfully, show confirmation screen
  if (submittedWo) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 animate-scale-up text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Request Sent to Engineering
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              🏨 {submittedWo.hotelName || 'ME Colombo'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Request Submitted Successfully!
          </h2>
          <div className="p-4 bg-slate-900 text-white rounded-2xl font-mono text-xl font-black tracking-widest inline-block shadow-md">
            {submittedWo.workOrderNumber}
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            The engineering room sound chime has been triggered for <strong>{submittedWo.hotelName || 'ME Colombo'}</strong>. An engineer will accept and assign a technician shortly.
          </p>
        </div>

        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/executive"
            className="btn-primary py-3 px-6 text-xs font-bold"
          >
            <span>View My Requests</span>
          </Link>

          <button
            onClick={() => {
              setSubmittedWo(null);
              setTitle('');
              setDescription('');
            }}
            className="btn-secondary py-3 px-6 text-xs font-bold"
          >
            <span>Report Another Issue</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Back Link */}
      <Link
        href="/executive"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Portal</span>
      </Link>

      {/* Form Container */}
      <div className="card-base p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            <span>Report a Maintenance Issue</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fill in the details below. Takes less than 1 minute to alert Engineering.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Hotel / Property Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-600" />
              <span>1. Select Hotel / Property *</span>
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(['ME Colombo', 'Rockwell', 'NEVA'] as HotelProperty[]).map(hotel => (
                <button
                  key={hotel}
                  type="button"
                  onClick={() => setSelectedHotel(hotel)}
                  className={`py-3 px-3 rounded-xl font-bold border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    selectedHotel === hotel
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-base">🏨</span>
                  <span className="font-black tracking-tight">{hotel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Location Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              2. Where is the problem located? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value as LocationOption)}
                  className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Guest Room">Guest Room</option>
                  <option value="Lobby">Lobby</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Rooftop">Rooftop Lounge & Bar</option>
                  <option value="Pool">Poolside & Spa</option>
                  <option value="Office">Office & Admin</option>
                  <option value="Staff Area">Staff Canteen / Lockers</option>
                  <option value="Public Area">Public Restrooms / Corridors</option>
                  <option value="Other">Other Area</option>
                </select>
              </div>

              {location === 'Guest Room' && (
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Enter Room # (e.g. 305, 212)"
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-blue-300 bg-blue-50/40 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-blue-400"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Category Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              3. Maintenance Category *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
              {(
                [
                  'AC',
                  'Water',
                  'Plumbing',
                  'Electrical',
                  'Lighting',
                  'Equipment',
                  'Furniture',
                  'Civil',
                  'Other',
                ] as CategoryOption[]
              ).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2.5 px-3 rounded-xl font-bold border transition-all text-center ${
                    category === cat
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Short Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                4. Short Problem Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AC not cooling / Water leak under sink / TV remote no power"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                5. Description / Details (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Provide any additional helpful notes for the technician..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* 6. Real Photo Upload */}
            <div className="pt-1">
              <ImageUploader
                label="6. Attach Defect Photo (Optional)"
                sublabel="Take a photo with your camera or choose an image from device"
                value={photoUrl}
                onChange={setPhotoUrl}
              />
            </div>
          </div>

          {/* 7. Guest Affected Flag */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-slate-900 block">7. Is a guest currently affected?</span>
              <span className="text-[11px] text-slate-500">In-house guestroom comfort or active customer area</span>
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setGuestAffected(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  guestAffected ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setGuestAffected(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  !guestAffected ? 'bg-slate-800 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* 5. Automatic Priority Suggestion Banner (Requirement 5) */}
          <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black uppercase text-blue-900">
                  Automatic Suggested Priority
                </span>
              </div>
              <PriorityBadge priority={finalPriority} size="sm" />
            </div>
            <p className="text-xs text-blue-800 font-medium">{prioritySuggestion.rationale}</p>
          </div>

          {/* Large Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-5 h-5" />
              <span>REPORT TO ENGINEERING</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
