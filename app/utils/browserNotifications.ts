/**
 * Browser Notifications Utility
 * Handles browser push notifications with permission management
 */

/**
 * Request permission for browser notifications
 * @returns Promise with permission state
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

/**
 * Check if notifications are supported and permitted
 * @returns boolean indicating if notifications can be shown
 */
export const canShowNotifications = (): boolean => {
  return 'Notification' in window && Notification.permission === 'granted';
};

/**
 * Show a browser notification
 * @param title - Notification title
 * @param options - Notification options
 */
export const showNotification = (
  title: string,
  options?: NotificationOptions
): Notification | null => {
  if (!canShowNotifications()) {
    console.warn('Cannot show notification: Permission not granted');
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
};

/**
 * Show a notification with custom options
 * @param title - Notification title
 * @param body - Notification body text
 * @param type - Type of notification (affects icon)
 */
export const showCustomNotification = (
  title: string,
  body: string,
  type: 'success' | 'info' | 'warning' | 'error' = 'info'
): Notification | null => {
  const icons = {
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
  };

  return showNotification(title, {
    body,
    icon: `/icons/${type}.png`,
    tag: `${type}-${Date.now()}`,
    requireInteraction: type === 'error',
  });
};

/**
 * Check if browser notifications are enabled in settings
 */
export const isEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  const enabled = localStorage.getItem('browserNotificationsEnabled');
  return enabled === 'true';
};

/**
 * Enable browser notifications
 */
export const enable = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('browserNotificationsEnabled', 'true');
  }
};

/**
 * Disable browser notifications
 */
export const disable = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('browserNotificationsEnabled', 'false');
  }
};

/**
 * Get current browser notification permission status
 */
export const getPermissionStatus = (): NotificationPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Set browser notifications enabled status
 */
export const setBrowserNotificationsEnabled = (enabled: boolean): void => {
  if (enabled) {
    enable();
  } else {
    disable();
  }
};

/**
 * Alias for requestNotificationPermission
 */
export const requestPermission = requestNotificationPermission;

/**
 * Alias for enable
 */
export const setEnabled = (enabled: boolean) => {
  if (enabled) {
    enable();
  } else {
    disable();
  }
};

/**
 * Show notification from notification data object
 */
export const showNotificationFromData = (notificationData: any): Notification | null => {
  if (!notificationData) return null;

  return showNotification(notificationData.title || "Notification", {
    body: notificationData.message || notificationData.body || "",
    icon: notificationData.icon || "/logo.png",
    tag: notificationData.id || `notification-${Date.now()}`,
    requireInteraction: notificationData.priority === 'urgent',
  });
};

export default {
  requestNotificationPermission,
  requestPermission,
  canShowNotifications,
  showNotification,
  showCustomNotification,
  showNotificationFromData,
  isEnabled,
  enable,
  disable,
  getPermissionStatus,
  setBrowserNotificationsEnabled,
  setEnabled,
};
