export type UserRole = 'ADMIN' | 'ENGINEERING' | 'EXECUTIVE' | 'TECHNICIAN';

export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

export type WorkOrderStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'COMPLETED'
  | 'CLOSED';

export type LocationOption =
  | 'Guest Room'
  | 'Lobby'
  | 'Restaurant'
  | 'Kitchen'
  | 'Rooftop'
  | 'Pool'
  | 'Office'
  | 'Staff Area'
  | 'Public Area'
  | 'Other';

export type CategoryOption =
  | 'Electrical'
  | 'Plumbing'
  | 'AC'
  | 'Water'
  | 'Lighting'
  | 'Furniture'
  | 'Equipment'
  | 'Civil'
  | 'Other';

export type HotelProperty = 'ME Colombo' | 'Rockwell' | 'NEVA';

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  password?: string;
  role: UserRole;
  department: string;
  active: boolean;
  phone?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  icon?: string;
  active: boolean;
}

export interface Technician {
  id: string;
  name: string;
  department: string;
  specialization: string;
  active: boolean;
  phone?: string;
}

export interface StatusHistoryItem {
  id: string;
  workOrderId: string;
  status: WorkOrderStatus;
  timestamp: string;
  actorName: string;
  note?: string;
}

export interface WorkOrder {
  id: string;
  workOrderNumber: string; // e.g. WO-2026-0045
  hotelName?: HotelProperty | string; // 'ME Colombo' | 'Rockwell' | 'NEVA'
  reportedBy: string;
  reportedById?: string;
  departmentId?: string;
  departmentName: string;
  location: LocationOption;
  roomNumber?: string;
  category: CategoryOption;
  title: string;
  description: string;
  photoUrl?: string;
  afterPhotoUrl?: string;
  guestAffected: boolean;
  priority: Priority;
  suggestedPriority?: Priority;
  priorityRationale?: string;
  status: WorkOrderStatus;
  
  // Assignments & Actions
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  
  // Timestamps
  reportedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  waitingAt?: string;
  completedAt?: string;
  closedAt?: string;
  
  // Personnel notes
  acceptedBy?: string;
  closedBy?: string;
  waitingReason?: string;
  workDone?: string;
  completionNote?: string;
  
  createdAt: string;
  updatedAt: string;
  history: StatusHistoryItem[];
}

export interface SystemSettings {
  hotelName: string;
  hotelLogo?: string;
  hotelAddress: string;
  hotelContactEmail?: string;
  hotelContactPhone?: string;
  p1Label: string; // e.g. Emergency 🔴
  p2Label: string; // e.g. High 🟠
  p3Label: string; // e.g. Normal 🟡
  p4Label: string; // e.g. Planned 🟢
  soundAlertEnabled: boolean;
}
