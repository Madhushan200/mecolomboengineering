import { supabase, isSupabaseConfigured } from './supabase';
import { WorkOrder, UserProfile, Department, Technician, SystemSettings } from './types';
import { isValidUUID, generateUUID } from './uuid';

const CLOUDFLARE_API_BASE =
  process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://me-engineering-api.madhushan875.workers.dev';

// Convert camelCase WorkOrder to snake_case DB record
export function toDbWorkOrder(wo: WorkOrder) {
  let dbDescription = wo.description || '';
  const hotel = wo.hotelName || 'ME Colombo';
  if (!dbDescription.startsWith('[Property:')) {
    dbDescription = `[Property: ${hotel}]\n${dbDescription}`.trim();
  }

  return {
    id: isValidUUID(wo.id) ? wo.id : generateUUID(),
    work_order_number: wo.workOrderNumber,
    hotel_name: hotel,
    reported_by: wo.reportedBy,
    reported_by_id: isValidUUID(wo.reportedById) ? wo.reportedById : null,
    department_id: isValidUUID(wo.departmentId) ? wo.departmentId : null,
    department_name: wo.departmentName,
    location: wo.location,
    room_number: wo.roomNumber || null,
    category: wo.category,
    title: wo.title,
    description: dbDescription || null,
    photo_url: wo.photoUrl || null,
    after_photo_url: wo.afterPhotoUrl || null,
    guest_affected: wo.guestAffected ? 1 : 0,
    priority: wo.priority,
    suggested_priority: wo.suggestedPriority || null,
    status: wo.status,
    assigned_technician_id: isValidUUID(wo.assignedTechnicianId) ? wo.assignedTechnicianId : null,
    assigned_technician_name: wo.assignedTechnicianName || null,
    reported_at: wo.reportedAt,
    accepted_at: wo.acceptedAt || null,
    started_at: wo.startedAt || null,
    waiting_at: wo.waitingAt || null,
    completed_at: wo.completedAt || null,
    closed_at: wo.closedAt || null,
    accepted_by: wo.acceptedBy || null,
    closed_by: wo.closedBy || null,
    waiting_reason: wo.waitingReason || null,
    work_done: wo.workDone || null,
    completion_note: wo.completionNote || null,
  };
}

// Convert snake_case DB record to camelCase WorkOrder
export function fromDbWorkOrder(row: any, history: any[] = []): WorkOrder {
  let hotelName = row.hotel_name || 'ME Colombo';
  let cleanDescription = row.description || '';

  const propertyMatch = cleanDescription.match(/^\[Property:\s*([^\]]+)\]\s*\n?/i);
  if (propertyMatch) {
    hotelName = propertyMatch[1].trim();
    cleanDescription = cleanDescription.replace(/^\[Property:\s*([^\]]+)\]\s*\n?/i, '').trim();
  }

  if (hotelName.toLowerCase() === 'neva') {
    hotelName = 'NEVA';
  }

  // Safely parse history
  const safeHistory = (history || []).map(h => ({
    id: h.id || generateUUID(),
    workOrderId: h.work_order_id || h.workOrderId || row.id,
    status: h.status || 'NEW',
    timestamp: h.timestamp || h.created_at || row.created_at || new Date().toISOString(),
    actorName: h.actor_name || h.actorName || row.reported_by || 'Staff',
    note: h.note || '',
  }));

  if (safeHistory.length === 0) {
    safeHistory.push({
      id: generateUUID(),
      workOrderId: row.id,
      status: row.status || 'NEW',
      timestamp: row.created_at || row.reported_at || new Date().toISOString(),
      actorName: row.reported_by || 'Staff',
      note: 'Request recorded in system',
    });
  }

  return {
    id: row.id || generateUUID(),
    workOrderNumber: row.work_order_number || row.workOrderNumber,
    hotelName: hotelName,
    reportedBy: row.reported_by || row.reportedBy || 'Staff',
    reportedById: row.reported_by_id || row.reportedById || null,
    departmentId: row.department_id || row.departmentId || null,
    departmentName: row.department_name || row.departmentName || 'Engineering',
    location: row.location || '',
    roomNumber: row.room_number || row.roomNumber || null,
    category: row.category || 'General',
    title: row.title || 'Maintenance Request',
    description: cleanDescription,
    photoUrl: row.photo_url || row.photoUrl || null,
    afterPhotoUrl: row.after_photo_url || row.afterPhotoUrl || null,
    guestAffected: Boolean(row.guest_affected || row.guestAffected),
    priority: row.priority || 'P3',
    suggestedPriority: row.suggested_priority || row.suggestedPriority || null,
    status: row.status || 'NEW',
    assignedTechnicianId: row.assigned_technician_id || row.assignedTechnicianId || null,
    assignedTechnicianName: row.assigned_technician_name || row.assignedTechnicianName || null,
    reportedAt: row.reported_at || row.reportedAt || row.created_at || new Date().toISOString(),
    acceptedAt: row.accepted_at || row.acceptedAt || null,
    startedAt: row.started_at || row.startedAt || null,
    waitingAt: row.waiting_at || row.waitingAt || null,
    completedAt: row.completed_at || row.completedAt || null,
    closedAt: row.closed_at || row.closedAt || null,
    acceptedBy: row.accepted_by || row.acceptedBy || null,
    closedBy: row.closed_by || row.closedBy || null,
    waitingReason: row.waiting_reason || row.waitingReason || null,
    workDone: row.work_done || row.workDone || null,
    completionNote: row.completion_note || row.completionNote || null,
    createdAt: row.created_at || row.createdAt || row.reported_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || row.reported_at || new Date().toISOString(),
    history: safeHistory,
  };
}

// Push a new/updated work order to Cloudflare D1
export async function syncWorkOrderToSupabase(wo: WorkOrder) {
  try {
    const dbRecord = toDbWorkOrder(wo);
    const res = await fetch(`${CLOUDFLARE_API_BASE}/api/work-orders/${encodeURIComponent(dbRecord.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbRecord),
    });

    if (!res.ok && res.status === 404) {
      await fetch(`${CLOUDFLARE_API_BASE}/api/work-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbRecord),
      });
    }
  } catch (err) {
    console.warn('Cloudflare Worker syncWorkOrder notice:', err);
  }
}

// Fetch all work orders and histories from Cloudflare D1
export async function fetchWorkOrdersFromSupabase(): Promise<WorkOrder[] | null> {
  try {
    const res = await fetch(`${CLOUDFLARE_API_BASE}/api/work-orders`);
    if (!res.ok) return null;
    const woData = await res.json();
    if (!woData || !Array.isArray(woData)) return [];

    return woData.map(row => fromDbWorkOrder(row, row.status_history || []));
  } catch (err) {
    console.warn('Cloudflare Worker fetchWorkOrders notice:', err);
    return null;
  }
}

// Delete a work order from Cloudflare D1
export async function deleteWorkOrderFromSupabase(id: string, workOrderNumber?: string): Promise<boolean> {
  try {
    const target = id || workOrderNumber;
    if (!target) return false;
    const res = await fetch(`${CLOUDFLARE_API_BASE}/api/work-orders/${encodeURIComponent(target)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('Cloudflare Worker deleteWorkOrder notice:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// USER PROFILES LIVE CLOUD SYNC
// ---------------------------------------------------------------------------

export function toDbUserProfile(user: UserProfile) {
  const credentialsPayload = JSON.stringify({
    username: (user.username || user.email.split('@')[0]).trim().toLowerCase(),
    password: user.password || '',
    phone: user.phone || '',
  });

  return {
    id: isValidUUID(user.id) ? user.id : generateUUID(),
    name: user.name.trim(),
    email: user.email.trim().toLowerCase(),
    role: user.role,
    department: user.department || 'Administration',
    phone: credentialsPayload,
    active: user.active !== false ? 1 : 0,
    updated_at: new Date().toISOString(),
  };
}

export function fromDbUserProfile(row: any): UserProfile {
  let username = (row.email || '').split('@')[0].toLowerCase();
  let password = '';
  let phone = '';

  if (row.phone) {
    try {
      const parsed = JSON.parse(row.phone);
      if (parsed.username) username = parsed.username.toLowerCase();
      if (parsed.password) password = parsed.password;
      if (parsed.phone) phone = parsed.phone;
    } catch {
      phone = row.phone;
    }
  }

  return {
    id: row.id,
    name: row.name,
    username: username,
    email: row.email,
    password: password,
    role: row.role,
    department: row.department,
    phone: phone,
    active: row.active !== 0 && row.active !== false,
  };
}

export async function syncUserProfileToSupabase(user: UserProfile): Promise<boolean> {
  try {
    const dbRecord = toDbUserProfile(user);
    const res = await fetch(`${CLOUDFLARE_API_BASE}/api/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbRecord),
    });
    return res.ok;
  } catch (err) {
    console.warn('Cloudflare Worker syncProfile notice:', err);
    return false;
  }
}

export async function deleteUserProfileFromSupabase(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${CLOUDFLARE_API_BASE}/api/profiles/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function fetchUserProfilesFromSupabase(): Promise<UserProfile[] | null> {
  try {
    const res = await fetch(`${CLOUDFLARE_API_BASE}/api/profiles`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(fromDbUserProfile);
  } catch (err) {
    return null;
  }
}
