import {
  UserProfile,
  Department,
  Technician,
  WorkOrder,
  SystemSettings,
} from './types';

export const initialSystemSettings: SystemSettings = {
  hotelName: 'Ceyvista Engineering',
  hotelLogo: '/logo.png',
  hotelAddress: 'Colombo, Sri Lanka',
  hotelContactEmail: 'engineering@ceyvista.com',
  hotelContactPhone: '+94 11 765 4321',
  p1Label: 'P1 – EMERGENCY 🔴',
  p2Label: 'P2 – HIGH 🟠',
  p3Label: 'P3 – NORMAL 🟡',
  p4Label: 'P4 – PLANNED 🟢',
  soundAlertEnabled: true,
};

export const initialDepartments: Department[] = [
  { id: 'dept-fo', name: 'Front Office', code: 'FO', active: true },
  { id: 'dept-hk', name: 'Housekeeping', code: 'HK', active: true },
  { id: 'dept-fb', name: 'F&B Service', code: 'FB', active: true },
  { id: 'dept-kit', name: 'Kitchen & Culinary', code: 'KIT', active: true },
  { id: 'dept-sec', name: 'Security & Safety', code: 'SEC', active: true },
  { id: 'dept-mgmt', name: 'General Management', code: 'MGMT', active: true },
  { id: 'dept-admin', name: 'Administration & HR', code: 'ADMIN', active: true },
  { id: 'dept-spa', name: 'Spa & Wellness', code: 'SPA', active: true },
];

export const initialTechnicians: Technician[] = [
  { id: 'tech-kasun', name: 'Kasun Perera', department: 'Engineering', specialization: 'Electrical & Automation', active: true, phone: '+94 77 123 4567' },
  { id: 'tech-nimal', name: 'Nimal Silva', department: 'Engineering', specialization: 'Plumbing & Water Systems', active: true, phone: '+94 77 234 5678' },
  { id: 'tech-pradeep', name: 'Pradeep Fernando', department: 'Engineering', specialization: 'Air Conditioning / HVAC', active: true, phone: '+94 77 345 6789' },
  { id: 'tech-suresh', name: 'Suresh Bandara', department: 'Engineering', specialization: 'Carpentry & General Civil', active: true, phone: '+94 77 456 7890' },
];

export const initialUsers: UserProfile[] = [
  {
    id: 'user-admin',
    name: 'ME Colombo Administrator',
    username: 'mecolomboadmin',
    email: 'mecolomboadmin@mecolombo.com',
    password: 'adminme1234',
    role: 'ADMIN',
    department: 'Administration',
    active: true,
  },
];

export const initialWorkOrders: WorkOrder[] = [];
