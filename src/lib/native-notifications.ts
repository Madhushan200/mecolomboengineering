import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const CHANNEL_ID = 'me_colombo_duty_alerts_v2';

class NativeNotificationManager {
  private isInitialized = false;

  async init() {
    if (typeof window === 'undefined' || !Capacitor.isNativePlatform() || this.isInitialized) return;

    try {
      // 1. Request notification permissions on mobile
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }

      // 2. Create High-Priority Notification Channel on Android
      // Importance 5 = IMPORTANCE_HIGH (Heads up, loud chime, vibrates, wakes lock screen)
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'ME Colombo Emergency Alerts',
        description: 'Audible emergency alert when new engineering requests arrive',
        importance: 5,
        visibility: 1, // VISIBILITY_PUBLIC (Shows and rings on Lock Screen)
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#EF4444',
      });

      this.isInitialized = true;
    } catch (e) {
      console.warn('Native local notification init (web fallback mode):', e);
    }
  }

  async sendNewTicketAlert(wo: {
    workOrderNumber: string;
    title: string;
    priority: string;
    location: string;
    roomNumber?: string;
    departmentName: string;
  }) {
    try {
      await this.init();

      const loc = wo.roomNumber ? `Room ${wo.roomNumber}` : wo.location;
      const notifId = Math.floor(Date.now() % 100000);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: `🚨 [${wo.priority}] NEW WORK ORDER: ${wo.workOrderNumber}`,
            body: `📍 ${loc} • ${wo.title} (${wo.departmentName})`,
            channelId: CHANNEL_ID,
            schedule: { at: new Date(Date.now() + 150) },
            sound: 'default',
            actionTypeId: 'OPEN_TICKET',
            extra: {
              workOrderNumber: wo.workOrderNumber,
            },
          },
        ],
      });
    } catch (err) {
      console.warn('Error scheduling native notification:', err);
    }
  }
}

export const nativeNotifications = new NativeNotificationManager();
