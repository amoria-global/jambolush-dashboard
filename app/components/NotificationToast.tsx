//app/components/NotificationToast.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import notificationSound from '../utils/notificationSound';
import browserNotifications from '../utils/browserNotifications';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date | string;
  isRead: boolean;
  actionUrl?: string;
  fromUser?: string;
  relatedEntity?: string;
}

interface ToastNotification extends Notification {
  toastId: string;
  showTime: number;
}

export default function NotificationToast() {
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
  const router = useRouter();

  // Listen for new notifications and show toasts
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail.notification;
      if (!notification) return;

      // Create toast notification
      const toastNotification: ToastNotification = {
        ...notification,
        toastId: `toast_${notification.id}_${Date.now()}`,
        showTime: Date.now(),
        timestamp: new Date(notification.timestamp)
      };

      // Add to toast list
      setToastNotifications(prev => [...prev, toastNotification]);

      // Play notification sound
      const soundType = notification.priority === 'urgent' ? 'urgent' : notification.type;
      notificationSound.playNotificationSound(soundType);

      // Show browser notification if page is not visible
      if (document.hidden) {
        browserNotifications.showNotificationFromData(notification);
      }

      // Auto-remove after 6 seconds for non-urgent notifications
      // Keep urgent notifications longer (12 seconds)
      const autoRemoveTime = notification.priority === 'urgent' ? 12000 : 6000;

      setTimeout(() => {
        setToastNotifications(prev =>
          prev.filter(t => t.toastId !== toastNotification.toastId)
        );
      }, autoRemoveTime);
    };

    window.addEventListener('newNotificationReceived', handleNewNotification as EventListener);

    return () => {
      window.removeEventListener('newNotificationReceived', handleNewNotification as EventListener);
    };
  }, []);

  const getToastStyle = (type: string, priority: string) => {
    const baseStyle = "border-l-4 shadow-lg";

    let colorStyle = "";
    switch (type) {
      case 'success':
        colorStyle = "bg-green-50 border-green-400 text-green-800";
        break;
      case 'warning':
        colorStyle = "bg-yellow-50 border-yellow-400 text-yellow-800";
        break;
      case 'error':
        colorStyle = "bg-red-50 border-red-400 text-red-800";
        break;
      case 'info':
      default:
        colorStyle = "bg-blue-50 border-blue-400 text-blue-800";
        break;
    }

    // Add urgency styling
    if (priority === 'urgent') {
      colorStyle += " ring-2 ring-red-200 animate-pulse";
    }

    return `${baseStyle} ${colorStyle}`;
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success': return 'bi-check-circle-fill text-green-600';
      case 'warning': return 'bi-exclamation-triangle-fill text-yellow-600';
      case 'error': return 'bi-x-circle-fill text-red-600';
      case 'info': return 'bi-info-circle-fill text-blue-600';
      default: return 'bi-bell-fill text-blue-600';
    }
  };

  const handleToastClick = (notification: ToastNotification) => {
    // Remove the toast
    setToastNotifications(prev =>
      prev.filter(t => t.toastId !== notification.toastId)
    );

    // Navigate if action URL exists
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else {
      // Navigate to notifications page
      router.push('/all/notifications');
    }

    // Mark as read
    window.dispatchEvent(new CustomEvent('notificationClicked', {
      detail: {
        notificationId: notification.id,
        category: notification.category,
        type: notification.type
      }
    }));
  };

  const dismissToast = (toastId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setToastNotifications(prev =>
      prev.filter(t => t.toastId !== toastId)
    );
  };

  if (toastNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm w-full">
      {toastNotifications.map((notification) => (
        <div
          key={notification.toastId}
          className={`${getToastStyle(notification.type, notification.priority)} rounded-lg p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-slide-in-right`}
          onClick={() => handleToastClick(notification)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <i className={`bi ${getToastIcon(notification.type)} text-lg`}></i>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold truncate pr-2">
                  {notification.title}
                </h4>
                <button
                  onClick={(e) => dismissToast(notification.toastId, e)}
                  className="flex-shrink-0 text-gray-500 hover:text-gray-700 p-1"
                  title="Dismiss"
                >
                  <i className="bi bi-x text-sm"></i>
                </button>
              </div>

              <p className="text-sm opacity-90 line-clamp-2 mb-2">
                {notification.message}
              </p>

              <div className="flex items-center justify-between text-xs opacity-75">
                <div className="flex items-center gap-2">
                  {notification.priority === 'urgent' && (
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                      URGENT
                    </span>
                  )}
                  <span className="capitalize">{notification.category}</span>
                </div>
                {notification.fromUser && (
                  <span>From: {notification.fromUser}</span>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar showing auto-dismiss countdown */}
          <div className="mt-3 h-1 bg-black/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-current opacity-50 animate-toast-progress"
              style={{
                animationDuration: notification.priority === 'urgent' ? '12s' : '6s'
              }}
            ></div>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        .animate-toast-progress {
          animation: toast-progress linear;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}