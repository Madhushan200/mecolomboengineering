import { supabase, isSupabaseConfigured } from './supabase';
import { WorkOrder, UserProfile, Department, Technician, SystemSettings } from './types';
import { isValidUUID, generateUUID } from './uuid';

// Convert camelCase WorkOrder to snake_case DB record
export function toDbWorkOrder(wo: WorkOrder) {
  // Store hotel prefix in description if not already present, ensuring full cross-device sync without requiring DB schema migration
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
    guest_affected: wo.guestAffected,
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

  return {
    id: row.id,
    workOrderNumber: row.work_order_number,
    hotelName: hotelName,
    reportedBy: row.reported_by,
    reportedById: row.reported_by_id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    location: row.location,
    roomNumber: row.room_number,
    category: row.category,
    title: row.title,
    description: cleanDescription,
    photoUrl: row.photo_url,
    afterPhotoUrl: row.after_photo_url,
    guestAffected: Boolean(row.guest_affected),
    priority: row.priority,
    suggestedPriority: row.suggested_priority,
    status: row.status,
    assignedTechnicianId: row.assigned_technician_id,
    assignedTechnicianName: row.assigned_technician_name,
    reportedAt: row.reported_at || row.created_at,
    acceptedAt: row.accepted_at,
    startedAt: row.started_at,
    waitingAt: row.waiting_at,
    completedAt: row.completed_at,
    closedAt: row.closed_at,
    acceptedBy: row.accepted_by,
    closedBy: row.closed_by,
    waitingReason: row.waiting_reason,
    workDone: row.work_done,
    completionNote: row.completion_note,
    createdAt: row.created_at || row.reported_at,
    updatedAt: row.updated_at || row.reported_at,
    history: history.map(h => ({
      id: h.id,
      workOrderId: h.work_order_id,
      status: h.status,
      timestamp: h.timestamp || h.created_at,
      actorName: h.actor_name,
      note: h.note,
    })),
  };
}

// Push a new/updated work order to Supabase
export async function syncWorkOrderToSupabase(wo: WorkOrder) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const dbRecord = toDbWorkOrder(wo);
    const { error } = await supabase.from('work_orders').upsert(dbRecord, { onConflict: 'work_order_number' });
    if (error) {
      console.error('Supabase upsert error:', error);
    }

    // Sync latest status history
    if (wo.history && wo.history.length > 0) {
      const latestHistory = wo.history[0];
      const histId = isValidUUID(latestHistory.id) ? latestHistory.id : generateUUID();
      const targetWoId = isValidUUID(wo.id) ? wo.id : dbRecord.id;

      await supabase.from('work_order_status_history').upsert({
        id: histId,
        work_order_id: targetWoId,
        status: latestHistory.status,
        timestamp: latestHistory.timestamp,
        actor_name: latestHistory.actorName,
        note: latestHistory.note || null,
      });
    }
  } catch (err) {
    console.error('Supabase work_order sync exception:', err);
  }
}

// Fetch all work orders and histories from Supabase
export async function fetchWorkOrdersFromSupabase(): Promise<WorkOrder[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data: woData, error: woError } = await supabase
      .from('work_orders')
      .select('*')
      .order('reported_at', { ascending: false });

    if (woError) {
      console.error('Error fetching work orders:', woError);
      return null;
    }
    if (!woData || woData.length === 0) return [];

    const { data: historyData } = await supabase
      .from('work_order_status_history')
      .select('*')
      .order('timestamp', { ascending: false });

    return woData.map(row => {
      const matchedHistory = (historyData || []).filter(h => h.work_order_id === row.id);
      return fromDbWorkOrder(row, matchedHistory);
    });
  } catch (err) {
    console.error('Exception fetching work orders from Supabase:', err);
    return null;
  }
}
