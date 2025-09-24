//app/utils/browserNotifications.ts

export class BrowserNotificationManager {
  private static instance: BrowserNotificationManager;
  private permission: NotificationPermission = 'default';
  private enabled: boolean = true;

  private constructor() {
    this.enabled = typeof window !== 'undefined'
      ? localStorage.getItem('browserNotifications') !== 'false'
      : true;
    this.checkPermission();
  }

  static getInstance(): BrowserNotificationManager {
    if (!BrowserNotificationManager.instance) {
      BrowserNotificationManager.instance = new BrowserNotificationManager();
    }
    return BrowserNotificationManager.instance;
  }

  private checkPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('browserNotifications', enabled.toString());
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  canShowNotifications(): boolean {
    return this.enabled && this.permission === 'granted' && typeof window !== 'undefined' && 'Notification' in window;
  }

  async showNotification(
    title: string,
    options: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      requireInteraction?: boolean;
      silent?: boolean;
      data?: any;
      actions?: NotificationOptions[];
    } = {}
  ): Promise<Notification | null> {
    if (!this.canShowNotifications()) {
      return null;
    }

    // Don't show browser notification if the page is visible
    if (typeof window !== 'undefined' && !document.hidden) {
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      // Auto-close after 10 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      return notification;
    } catch (error) {
      console.warn('Error showing browser notification:', error);
      return null;
    }
  }

  async showNotificationFromData(notification: {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    actionUrl?: string;
    category: string;
  }): Promise<Notification | null> {
    const icon = this.getIconForType(notification.type);
    const requireInteraction = notification.priority === 'urgent';

    const browserNotification = await this.showNotification(notification.title, {
      body: notification.message,
      icon,
      tag: `notification_${notification.id}`,
      requireInteraction,
      data: {
        notificationId: notification.id,
        actionUrl: notification.actionUrl,
        type: notification.type,
        priority: notification.priority,
      }
    });

    if (browserNotification) {
      browserNotification.onclick = () => {
        // Focus the window
        window.focus();

        // Navigate to action URL if available
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        } else {
          window.location.href = '/all/notifications';
        }

        browserNotification.close();
      };
    }

    return browserNotification;
  }

  private getIconForType(type: string): string {
    // You can replace these with actual icon URLs
    switch (type) {
      case 'success':
        return '/favicon.ico'; // Replace with success icon URL
      case 'warning':
        return '/favicon.ico'; // Replace with warning icon URL
      case 'error':
        return '/favicon.ico'; // Replace with error icon URL
      case 'info':
      default:
        return '/favicon.ico'; // Replace with info icon URL
    }
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

export default BrowserNotificationManager.getInstance();