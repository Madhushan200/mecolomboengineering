'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserProfile,
  Department,
  Technician,
  WorkOrder,
  WorkOrderStatus,
  Priority,
  SystemSettings,
  StatusHistoryItem,
} from './types';
import {
  initialSystemSettings,
  initialDepartments,
  initialTechnicians,
  initialUsers,
  initialWorkOrders,
} from './initial-data';
import { soundAlert } from './audio-alert';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  syncWorkOrderToSupabase,
  fetchWorkOrdersFromSupabase,
  fromDbWorkOrder,
  syncUserProfileToSupabase,
  deleteUserProfileFromSupabase,
  fetchUserProfilesFromSupabase,
  fromDbUserProfile,
} from './supabase-sync';
import { generateUUID } from './uuid';
import { nativeNotifications } from './native-notifications';

interface EngineeringContextType {
  // Data
  workOrders: WorkOrder[];
  users: UserProfile[];
  departments: Department[];
  technicians: Technician[];
  settings: SystemSettings;
  currentUser: UserProfile;
  
  // Audio Alert
  hasUnacceptedNewOrders: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  enableAudio: () => boolean;

  // Cloud Sync Status
  isCloudConnected: boolean;
  lastCloudSync: Date | null;
  
  // User Session
  setCurrentUser: (user: UserProfile) => void;
  switchUser: (userId: string) => void;
  
  // Work Order Workflow
  createWorkOrder: (order: {
    hotelName?: any;
    reportedBy: string;
    reportedById?: string;
    departmentName: string;
    location: any;
    roomNumber?: string;
    category: any;
    title: string;
    description: string;
    photoUrl?: string;
    guestAffected: boolean;
    priority: Priority;
    suggestedPriority?: Priority;
    priorityRationale?: string;
  }) => WorkOrder;
  
  acceptWorkOrder: (id: string, acceptedBy?: string) => void;
  assignTechnician: (id: string, technicianId: string, technicianName: string) => void;
  startWork: (id: string) => void;
  setWaiting: (id: string, reason: string) => void;
  resumeWork: (id: string) => void;
  completeWork: (id: string, workDone: string, completionNote?: string, afterPhotoUrl?: string) => void;
  closeWorkOrder: (id: string, closedBy: string, finalNote?: string) => void;
  
  // Admin Operations
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  addDepartment: (dept: Omit<Department, 'id'>) => void;
  deleteDepartment: (id: string) => void;
  addTechnician: (tech: Omit<Technician, 'id'>) => void;
  toggleTechnician: (id: string) => void;
  addUser: (user: Omit<UserProfile, 'id'>) => void;
  deleteUser: (id: string) => void;
  toggleUser: (id: string) => void;
  resetToDemoData: () => void;
}

const EngineeringContext = createContext<EngineeringContextType | undefined>(undefined);

export function EngineeringProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(initialSystemSettings);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [technicians, setTechnicians] = useState<Technician[]>(initialTechnicians);
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialUsers[0]); // Administrator
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);
  const [isMuted, setIsMuted] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(isSupabaseConfigured);
  const [lastCloudSync, setLastCloudSync] = useState<Date | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const DATA_VERSION = '2026_09_04_PROD_CLEAN_V6';
      const storedVersion = localStorage.getItem('simple_eng_data_version');
      
      // Auto-purge legacy dummy data cache
      if (storedVersion !== DATA_VERSION) {
        localStorage.removeItem('simple_eng_work_orders');
        localStorage.removeItem('simple_eng_work_orders_v2');
        localStorage.removeItem('simple_eng_work_orders_v3');
        localStorage.setItem('simple_eng_data_version', DATA_VERSION);
        localStorage.setItem('simple_eng_work_orders_v4', JSON.stringify([]));
        setWorkOrders([]);
      } else {
        const storedWos = localStorage.getItem('simple_eng_work_orders_v4');
        if (storedWos) {
          const parsed: WorkOrder[] = JSON.parse(storedWos);
          // Safety filter against any old dummy ticket numbers
          const clean = parsed.filter(w => !w.workOrderNumber?.startsWith('WO-2026-004'));
          setWorkOrders(clean);
        } else {
          setWorkOrders([]);
        }
      }

      const storedSettings = localStorage.getItem('simple_eng_settings');
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      } else {
        setSettings(initialSystemSettings);
      }

      const storedDepts = localStorage.getItem('simple_eng_departments');
      if (storedDepts) setDepartments(JSON.parse(storedDepts));

      const storedTechs = localStorage.getItem('simple_eng_technicians');
      if (storedTechs) setTechnicians(JSON.parse(storedTechs));

      // Load users and ensure admin password is adminme1234
      const storedUsers = localStorage.getItem('simple_eng_users_v3');
      if (storedUsers) {
        const parsed: UserProfile[] = JSON.parse(storedUsers);
        const updated = parsed.map(u => {
          if (u.role === 'ADMIN' || u.username === 'mecolomboadmin') {
            return { ...u, password: 'adminme1234' };
          }
          return u;
        });
        setUsers(updated);
      } else {
        setUsers(initialUsers);
        localStorage.setItem('simple_eng_users_v3', JSON.stringify(initialUsers));
      }

      const storedUser = localStorage.getItem('simple_eng_current_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role === 'ADMIN' || parsedUser.username === 'mecolomboadmin') {
          parsedUser.password = 'adminme1234';
        }
        setCurrentUser(parsedUser);
      }

      setIsMuted(soundAlert.getMuted());
    } catch (e) {
      console.error('Error loading stored engineering data:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('simple_eng_settings', JSON.stringify(settings));
    localStorage.setItem('simple_eng_departments', JSON.stringify(departments));
    localStorage.setItem('simple_eng_technicians', JSON.stringify(technicians));
    localStorage.setItem('simple_eng_users_v3', JSON.stringify(users));
    localStorage.setItem('simple_eng_current_user', JSON.stringify(currentUser));
    localStorage.setItem('simple_eng_work_orders_v4', JSON.stringify(workOrders));
  }, [isLoaded, settings, departments, technicians, users, currentUser, workOrders]);

  // Supabase Hydration & Dual-Engine Realtime Sync (WebSocket + 3s Polling)
  useEffect(() => {
    if (!isLoaded) return;

    // Initialize Native Android Notification Channels & Permissions
    nativeNotifications.init();

    if (!isSupabaseConfigured || !supabase) return;

    let isMounted = true;

    const pullRemoteData = async () => {
      try {
        const [remoteOrders, remoteProfiles] = await Promise.all([
          fetchWorkOrdersFromSupabase(),
          fetchUserProfilesFromSupabase(),
        ]);

        if (remoteOrders !== null && isMounted) {
          setIsCloudConnected(true);
          setLastCloudSync(new Date());

          setWorkOrders(prev => {
            // Detect any new incoming unaccepted tickets while screen was off
            const isEngineeringRole =
              currentUser.role === 'ENGINEERING' ||
              currentUser.role === 'ADMIN' ||
              currentUser.role === 'TECHNICIAN';

            if (isEngineeringRole) {
              const brandNewOrders = remoteOrders.filter(
                ro => ro.status === 'NEW' && !prev.some(p => p.workOrderNumber === ro.workOrderNumber)
              );
              brandNewOrders.forEach(bwo => {
                nativeNotifications.sendNewTicketAlert(bwo);
              });
            }

            // Supabase is the single source of truth for synced orders
            return remoteOrders.sort(
              (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
            );
          });
        }

        if (remoteProfiles !== null && isMounted) {
          setUsers(prev => {
            const map = new Map<string, UserProfile>();
            // Master initial users
            initialUsers.forEach(u => map.set(u.email.toLowerCase(), u));
            // Local users
            prev.forEach(u => map.set(u.email.toLowerCase(), u));
            // Remote Supabase users
            remoteProfiles.forEach(u => map.set(u.email.toLowerCase(), u));

            return Array.from(map.values()).map(u => {
              if (u.role === 'ADMIN' || u.username === 'mecolomboadmin') {
                return { ...u, password: 'adminme1234' };
              }
              return u;
            });
          });
        }
      } catch (err) {
        console.error('Background sync polling error:', err);
        if (isMounted) setIsCloudConnected(false);
      }
    };

    // 1. Initial Remote Fetch
    pullRemoteData();

    // 2. Active 3-second background polling timer (guarantees sync across all devices & mobile connections)
    const pollInterval = setInterval(pullRemoteData, 3000);

    // 3. Realtime Postgres Changes Subscription for Work Orders
    const channel = supabase
      .channel('realtime_work_orders_all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_orders',
        },
        payload => {
          setIsCloudConnected(true);
          setLastCloudSync(new Date());

          if (payload.eventType === 'INSERT') {
            const newWo = fromDbWorkOrder(payload.new);
            const isEngineeringRole =
              currentUser.role === 'ENGINEERING' ||
              currentUser.role === 'ADMIN' ||
              currentUser.role === 'TECHNICIAN';

            if (isEngineeringRole && newWo.status === 'NEW') {
              nativeNotifications.sendNewTicketAlert(newWo);
            }

            setWorkOrders(prev => {
              if (prev.some(w => w.id === newWo.id || w.workOrderNumber === newWo.workOrderNumber)) {
                return prev.map(w =>
                  w.id === newWo.id || w.workOrderNumber === newWo.workOrderNumber ? newWo : w
                );
              }
              return [newWo, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedWo = fromDbWorkOrder(payload.new);
            setWorkOrders(prev =>
              prev.map(w =>
                w.id === updatedWo.id || w.workOrderNumber === updatedWo.workOrderNumber
                  ? { ...w, ...updatedWo }
                  : w
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setWorkOrders(prev => prev.filter(w => w.id !== payload.old?.id));
          }
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setIsCloudConnected(true);
        }
      });

    // 4. Realtime Postgres Changes Subscription for Profiles
    const profilesChannel = supabase
      .channel('realtime_profiles_all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedUser = fromDbUserProfile(payload.new);
            setUsers(prev => {
              const filtered = prev.filter(
                u => u.id !== updatedUser.id && u.email.toLowerCase() !== updatedUser.email.toLowerCase()
              );
              return [...filtered, updatedUser];
            });
          } else if (payload.eventType === 'DELETE') {
            setUsers(prev => prev.filter(u => u.id !== payload.old?.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      supabase?.removeChannel(channel);
      supabase?.removeChannel(profilesChannel);
    };
  }, [isLoaded, currentUser.role]);

  // Audio loop management: Trigger chime ONLY for Engineering / Admin / Technicians on the Engineering Portal
  const hasUnacceptedNewOrders = workOrders.some(w => w.status === 'NEW');

  useEffect(() => {
    if (!isLoaded) return;

    const isEngineeringSide =
      currentUser.role === 'ENGINEERING' ||
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'TECHNICIAN';

    if (hasUnacceptedNewOrders && settings.soundAlertEnabled && !isMuted && isEngineeringSide) {
      soundAlert.startLoopingAlert();
    } else {
      soundAlert.stopAlert();
    }

    return () => {
      soundAlert.stopAlert();
    };
  }, [isLoaded, hasUnacceptedNewOrders, settings.soundAlertEnabled, isMuted, currentUser.role]);

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundAlert.setMuted(nextMute);
  };

  const enableAudio = () => {
    return soundAlert.unlockAudio();
  };

  const switchUser = (userId: string) => {
    const u = users.find(x => x.id === userId);
    if (u) {
      setCurrentUser(u);
    }
  };

  // Sequential WO Generator (e.g. WO-2026-0046)
  const getNextWoNumber = () => {
    const currentYear = new Date().getFullYear();
    const existingNumbers = workOrders
      .map(w => {
        const parts = w.workOrderNumber.split('-');
        return parts.length === 3 ? parseInt(parts[2], 10) : 0;
      })
      .filter(n => !isNaN(n));

    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 45;
    const nextNum = maxNum + 1;
    return `WO-${currentYear}-${String(nextNum).padStart(4, '0')}`;
  };

  // 1. Create Work Order
  const createWorkOrder = (data: {
    hotelName?: any;
    reportedBy: string;
    reportedById?: string;
    departmentName: string;
    location: any;
    roomNumber?: string;
    category: any;
    title: string;
    description: string;
    photoUrl?: string;
    guestAffected: boolean;
    priority: Priority;
    suggestedPriority?: Priority;
    priorityRationale?: string;
  }): WorkOrder => {
    const newWoNumber = getNextWoNumber();
    const nowIso = new Date().toISOString();
    const newId = generateUUID();

    const newOrder: WorkOrder = {
      id: newId,
      workOrderNumber: newWoNumber,
      hotelName: data.hotelName || settings.hotelName || 'ME Colombo',
      reportedBy: data.reportedBy,
      reportedById: data.reportedById || currentUser.id,
      departmentName: data.departmentName,
      location: data.location,
      roomNumber: data.roomNumber,
      category: data.category,
      title: data.title,
      description: data.description,
      photoUrl: data.photoUrl,
      guestAffected: data.guestAffected,
      priority: data.priority,
      suggestedPriority: data.suggestedPriority,
      priorityRationale: data.priorityRationale,
      status: 'NEW',
      reportedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      history: [
        {
          id: generateUUID(),
          workOrderId: newId,
          status: 'NEW',
          timestamp: nowIso,
          actorName: `${data.reportedBy} (${data.departmentName})`,
          note: 'Request created and sent to Engineering',
        },
      ],
    };

    setWorkOrders(prev => [newOrder, ...prev]);
    syncWorkOrderToSupabase(newOrder);

    return newOrder;
  };

  // 2. Accept Work Order (NEW -> ACCEPTED)
  const acceptWorkOrder = (id: string, acceptedBy?: string) => {
    const actor = acceptedBy || currentUser.name;
    const nowIso = new Date().toISOString();

    setWorkOrders(prev =>
      prev.map(w => {
        if (w.id === id) {
          const updated: WorkOrder = {
            ...w,
            status: 'ACCEPTED',
            acceptedAt: nowIso,
            acceptedBy: actor,
            updatedAt: nowIso,
            history: [
              ...w.history,
              {
                id: generateUUID(),
                workOrderId: id,
                status: 'ACCEPTED',
                timestamp: nowIso,
                actorName: actor,
                note: `Accepted request by Engineering`,
              },
            ],
          };
          syncWorkOrderToSupabase(updated);
          return updated;
        }
        return w;
      })
    );
  };

  // 3. Assign Technician
  const assignTechnician = (id: string, technicianId: string, technicianName: string) => {
    const nowIso = new Date().toISOString();

    setWorkOrders(prev =>
      prev.map(w => {
        if (w.id === id) {
          const updated: WorkOrder = {
            ...w,
            assignedTechnicianId: technicianId,
            assignedTechnicianName: technicianName,
            updatedAt: nowIso,
            history: [
              ...w.history,
              {
                id: generateUUID(),
                workOrderId: id,
                status: w.status,
                timestamp: nowIso,
                actorName: currentUser.name,
                note: `Assigned to technician ${technicianName}`,
              },
            ],
          };
          syncWorkOrderToSupabase(updated);
          return updated;
        }
        return w;
      })
    );
  };

  // 4. Start Work (ACCEPTED/NEW -> IN_PROGRESS)
  const startWork = (id: string) => {
    const nowIso = new Date().toISOString();

    setWorkOrders(prev =>
      prev.map(w => {
        if (w.id === id) {
          const updated: WorkOrder = {
            ...w,
            status: 'IN_PROGRESS',
            startedAt: w.startedAt || nowIso,
            updatedAt: nowIso,
            history: [
              ...w.history,
              {
                id: generateUUID(),
                workOrderId: id,
                status: 'IN_PROGRESS',
                timestamp: nowIso,
                actorName: currentUser.name,
                note: `Technician started work`,
              },
            ],
          };
          syncWorkOrderToSupabase(updated);
          return updated;
        }
        return w;
      })
    );
  };

  // 5. Set Waiting (IN_PROGRESS -> WAITING)
  const setWaiting = (id: string, reason: string) => {
    const nowIso = new Date().toISOString();

    setWorkOrders(prev =>
      prev.map(w => {
        if (w.id === id) {
          const updated: WorkOrder = {
            ...w,
            status: 'WAITING',
            waitingAt: nowIso,
            waitingReason: reason,
            updatedAt: nowIso,
            history: [
              ...w.history,
              {
                id: generateUUID(),
                workOrderId: id,
                status: 'WAITING',
                timestamp: nowIso,
                actorName: currentUser.name,
                note: `Put on hold: ${reason}`,
              },
            ],
          };
          syncWorkOrderToSupabase(updated);
          return updated;
        }
        return w;
      })
    );
  };

  // 6. Resume Work (WAITING -> IN_PROGRESS)
  const resumeWork = (id: string) => {
    const nowIso = new Date().toISOString();

    setWorkOrders(prev =>
      prev.map(w => {
        if (w.id === id) {
          const updated: WorkOrder = {
            ...w,
            status: 'IN_PROGRESS',
            updatedAt: nowIso,
            history: [
              ...w.history,
              {
                id: generateUUID(),
                workOrderId: id,
                status: 'IN_PROGRESS',
                timestamp: nowIso,
                actorName: currentUser.name,
                note: `Resumed work`,
              },
            ],
          };
          syncWorkOrderToSupabase(updated);
          return updated;
        }
        return w;
      })
    );
  };

  // 7. Complete Work (IN_PROGRESS -> COMPLETED)
  const completeWork = (
    id: string,
    workDone: string,
    completionNote?: string,
    afterPhotoUrl?: string
  ) => {
    const nowIso = new Date().toISOString();

    setWorkOrders(prev =>
      prev.map(w => {
        if (w.id === id) {
          const updated: WorkOrder = {
            ...w,
            status: 'COMPLETED',
            completedAt: nowIso,
            workDone,
            completionNote,
            afterPhotoUrl,
            updatedAt: nowIso,
            history: [
              ...w.history,
              {
                id: generateUUID(),
                workOrderId: id,
                status: 'COMPLETED',
                timestamp: nowIso,
                actorName: currentUser.name,
                note: `Work completed: ${workDone}`,
              },
            ],
          };
          syncWorkOrderToSupabase(updated);
          return updated;
        }
        return w;
      })
    );
  };

  // 8. Close Request (COMPLETED -> CLOSED)
  const closeWorkOrder = (id: string, closedBy: string, finalNote?: string) => {
    const nowIso = new Date().toISOString();

    setWorkOrders(prev =>
      prev.map(w => {
        if (w.id === id) {
          const updated: WorkOrder = {
            ...w,
            status: 'CLOSED',
            closedAt: nowIso,
            closedBy: closedBy || currentUser.name,
            updatedAt: nowIso,
            history: [
              ...w.history,
              {
                id: generateUUID(),
                workOrderId: id,
                status: 'CLOSED',
                timestamp: nowIso,
                actorName: closedBy || currentUser.name,
                note: finalNote ? `Verified & closed: ${finalNote}` : `Verified & closed request`,
              },
            ],
          };
          syncWorkOrderToSupabase(updated);
          return updated;
        }
        return w;
      })
    );
  };

  // Admin Setup
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const addDepartment = (dept: Omit<Department, 'id'>) => {
    const newDept: Department = {
      ...dept,
      id: `dept-${Date.now()}`,
    };
    setDepartments(prev => [...prev, newDept]);
  };

  const deleteDepartment = (id: string) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
  };

  const addTechnician = (tech: Omit<Technician, 'id'>) => {
    const newTech: Technician = {
      ...tech,
      id: `tech-${Date.now()}`,
    };
    setTechnicians(prev => [...prev, newTech]);
  };

  const toggleTechnician = (id: string) => {
    setTechnicians(prev =>
      prev.map(t => (t.id === id ? { ...t, active: !t.active } : t))
    );
  };

  const addUser = (user: Omit<UserProfile, 'id'>) => {
    const newUser: UserProfile = {
      ...user,
      id: generateUUID(),
    };
    setUsers(prev => [...prev, newUser]);
    syncUserProfileToSupabase(newUser);
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    deleteUserProfileFromSupabase(id);
  };

  const toggleUser = (id: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const updated = { ...u, active: !u.active };
          syncUserProfileToSupabase(updated);
          return updated;
        }
        return u;
      })
    );
  };

  const resetToDemoData = () => {
    setSettings(initialSystemSettings);
    setDepartments(initialDepartments);
    setTechnicians(initialTechnicians);
    setUsers(initialUsers);
    setCurrentUser(initialUsers[0]);
    setWorkOrders(initialWorkOrders);
    localStorage.clear();
  };

  return (
    <EngineeringContext.Provider
      value={{
        workOrders,
        users,
        departments,
        technicians,
        settings,
        currentUser,
        hasUnacceptedNewOrders,
        isMuted,
        toggleMute,
        enableAudio,
        isCloudConnected,
        lastCloudSync,
        setCurrentUser,
        switchUser,
        createWorkOrder,
        acceptWorkOrder,
        assignTechnician,
        startWork,
        setWaiting,
        resumeWork,
        completeWork,
        closeWorkOrder,
        updateSettings,
        addDepartment,
        deleteDepartment,
        addTechnician,
        toggleTechnician,
        addUser,
        deleteUser,
        toggleUser,
        resetToDemoData,
      }}
    >
      {children}
    </EngineeringContext.Provider>
  );
}

export function useHotelEngineering() {
  const context = useContext(EngineeringContext);
  if (!context) {
    throw new Error('useHotelEngineering must be used within an EngineeringProvider');
  }
  return context;
}
