/**
 * Cloudflare Worker API Client for ME Colombo Engineering (Ceyvista Engineering)
 * Direct D1 & R2 Integration
 * Base URL: https://me-engineering-api.madhushan875.workers.dev
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://me-engineering-api.madhushan875.workers.dev";

export interface WorkOrder {
  id: string;
  work_order_number: string;
  reported_by: string;
  reported_by_id?: string | null;
  department_id?: string | null;
  department_name: string;
  location: string;
  room_number?: string | null;
  category: string;
  title: string;
  description?: string | null;
  photo_url?: string | null;
  after_photo_url?: string | null;
  guest_affected?: number | boolean;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  suggested_priority?: 'P1' | 'P2' | 'P3' | 'P4' | null;
  status: 'NEW' | 'ACCEPTED' | 'IN_PROGRESS' | 'WAITING' | 'COMPLETED' | 'CLOSED';
  assigned_technician_id?: string | null;
  assigned_technician_name?: string | null;
  reported_at?: string;
  accepted_at?: string | null;
  started_at?: string | null;
  waiting_at?: string | null;
  completed_at?: string | null;
  closed_at?: string | null;
  accepted_by?: string | null;
  closed_by?: string | null;
  waiting_reason?: string | null;
  work_done?: string | null;
  completion_note?: string | null;
  created_at?: string;
  updated_at?: string;
  hotel_name?: string;
  status_history?: WorkOrderStatusHistory[];
  photos?: WorkOrderPhoto[];
  comments?: WorkOrderComment[];
}

export interface WorkOrderStatusHistory {
  id: string;
  work_order_id: string;
  status: string;
  timestamp: string;
  actor_name: string;
  note?: string | null;
}

export interface WorkOrderPhoto {
  id: string;
  work_order_id: string;
  photo_url: string;
  photo_type?: 'before' | 'during' | 'after';
  caption?: string | null;
  uploaded_by?: string | null;
  created_at: string;
}

export interface WorkOrderComment {
  id: string;
  work_order_id: string;
  user_name: string;
  user_role: string;
  message: string;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ENGINEERING' | 'EXECUTIVE' | 'TECHNICIAN';
  department: string;
  phone?: string | null;
  active: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  icon?: string | null;
  active: number | boolean;
  created_at?: string;
}

export interface Technician {
  id: string;
  name: string;
  department?: string;
  specialization: string;
  phone?: string | null;
  active: number | boolean;
  created_at?: string;
}

export interface SystemSettings {
  id: string;
  hotel_name: string;
  hotel_logo?: string | null;
  hotel_address?: string;
  hotel_contact_email?: string;
  hotel_contact_phone?: string;
  p1_label?: string;
  p2_label?: string;
  p3_label?: string;
  p4_label?: string;
  sound_alert_enabled: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  work_order_id?: string | null;
  title: string;
  message: string;
  type: string;
  is_read: number | boolean;
  created_at: string;
}

export interface DashboardStats {
  total: number;
  by_status: {
    NEW: number;
    ACCEPTED: number;
    IN_PROGRESS: number;
    WAITING: number;
    COMPLETED: number;
    CLOSED: number;
  };
  by_priority: {
    P1: number;
    P2: number;
    P3: number;
    P4: number;
  };
  by_hotel: Array<{ hotel_name: string; count: number }>;
  timestamp: string;
}

class CloudflareApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMessage = `API Error (${res.status} ${res.statusText})`;
      try {
        const errorJson = (await res.json()) as any;
        if (errorJson && errorJson.error) errorMessage = errorJson.error;
      } catch {
        // use default error message
      }
      throw new Error(errorMessage);
    }

    return res.json() as Promise<T>;
  }

  // Health check
  async getHealth(): Promise<{ status: string; service: string; database: string; storage: string }> {
    return this.request('/health');
  }

  // Work Orders
  async getWorkOrders(filters?: {
    status?: string;
    priority?: string;
    hotel_name?: string;
    department_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<WorkOrder[]> {
    const params = new URLSearchParams();
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      }
    }
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<WorkOrder[]>(`/api/work-orders${qs}`);
  }

  async getWorkOrder(idOrNumber: string): Promise<WorkOrder> {
    return this.request<WorkOrder>(`/api/work-orders/${encodeURIComponent(idOrNumber)}`);
  }

  async createWorkOrder(data: Partial<WorkOrder>): Promise<WorkOrder> {
    return this.request<WorkOrder>('/api/work-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkOrder(idOrNumber: string, data: Partial<WorkOrder>): Promise<WorkOrder> {
    return this.request<WorkOrder>(`/api/work-orders/${encodeURIComponent(idOrNumber)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkOrder(idOrNumber: string): Promise<{ success: boolean; deleted_id: string }> {
    return this.request<{ success: boolean; deleted_id: string }>(
      `/api/work-orders/${encodeURIComponent(idOrNumber)}`,
      { method: 'DELETE' }
    );
  }

  // Sub-resources
  async getWorkOrderHistory(idOrNumber: string): Promise<WorkOrderStatusHistory[]> {
    return this.request<WorkOrderStatusHistory[]>(`/api/work-orders/${encodeURIComponent(idOrNumber)}/history`);
  }

  async addWorkOrderHistory(idOrNumber: string, data: { status: string; actor_name: string; note?: string }): Promise<WorkOrderStatusHistory> {
    return this.request<WorkOrderStatusHistory>(`/api/work-orders/${encodeURIComponent(idOrNumber)}/history`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkOrderComments(idOrNumber: string): Promise<WorkOrderComment[]> {
    return this.request<WorkOrderComment[]>(`/api/work-orders/${encodeURIComponent(idOrNumber)}/comments`);
  }

  async addWorkOrderComment(idOrNumber: string, comment: { user_name: string; user_role: string; message: string }): Promise<WorkOrderComment> {
    return this.request<WorkOrderComment>(`/api/work-orders/${encodeURIComponent(idOrNumber)}/comments`, {
      method: 'POST',
      body: JSON.stringify(comment),
    });
  }

  async getWorkOrderPhotos(idOrNumber: string): Promise<WorkOrderPhoto[]> {
    return this.request<WorkOrderPhoto[]>(`/api/work-orders/${encodeURIComponent(idOrNumber)}/photos`);
  }

  async addWorkOrderPhoto(idOrNumber: string, photo: { photo_url: string; photo_type?: string; caption?: string; uploaded_by?: string }): Promise<WorkOrderPhoto> {
    return this.request<WorkOrderPhoto>(`/api/work-orders/${encodeURIComponent(idOrNumber)}/photos`, {
      method: 'POST',
      body: JSON.stringify(photo),
    });
  }

  // Profiles & Auth
  async getProfiles(): Promise<Profile[]> {
    return this.request<Profile[]>('/api/profiles');
  }

  async getProfile(idOrEmail: string): Promise<Profile> {
    return this.request<Profile>(`/api/profiles/${encodeURIComponent(idOrEmail)}`);
  }

  async login(credentials: { email?: string; name?: string }): Promise<{ success: boolean; profile: Profile }> {
    return this.request<{ success: boolean; profile: Profile }>('/api/profiles/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async upsertProfile(profile: Partial<Profile>): Promise<Profile> {
    return this.request<Profile>('/api/profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    return this.request<Department[]>('/api/departments');
  }

  async upsertDepartment(dept: Partial<Department>): Promise<Department> {
    return this.request<Department>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(dept),
    });
  }

  // Technicians
  async getTechnicians(): Promise<Technician[]> {
    return this.request<Technician[]>('/api/technicians');
  }

  async upsertTechnician(tech: Partial<Technician>): Promise<Technician> {
    return this.request<Technician>('/api/technicians', {
      method: 'POST',
      body: JSON.stringify(tech),
    });
  }

  // Settings
  async getSystemSettings(): Promise<SystemSettings> {
    return this.request<SystemSettings>('/api/system-settings');
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    return this.request<SystemSettings>('/api/system-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>('/api/notifications');
  }

  async createNotification(notif: { title: string; message: string; type?: string; work_order_id?: string }): Promise<Notification> {
    return this.request<Notification>('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(notif),
    });
  }

  async markNotificationRead(id: string): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/notifications/read-all', {
      method: 'PUT',
    });
  }

  // Photo Upload to Cloudflare R2
  async uploadPhoto(
    image: File | Blob | string,
    filename?: string
  ): Promise<{ success: boolean; filename: string; url: string; fullUrl: string; size: number }> {
    if (typeof image === 'string') {
      // Base64 JSON payload
      return this.request<{ success: boolean; filename: string; url: string; fullUrl: string; size: number }>('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ image, filename }),
      });
    }

    // FormData upload
    const formData = new FormData();
    formData.append('file', image, filename || 'upload.jpg');

    const res = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Upload failed: ${res.statusText}`);
    }

    return res.json();
  }

  // Stats
  async getStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/api/stats');
  }
}

export const cloudflareApi = new CloudflareApiClient();
export default cloudflareApi;
