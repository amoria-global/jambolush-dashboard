//app/components/SessionExpiredModal.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SessionExpiredModalProps {
  frontendUrl?: string;
}

interface SessionExpiredDetail {
  reason?: string;
  timestamp?: number;
  sessionDuration?: number;
  refreshCount?: number;
  source?: string;
}

export default function SessionExpiredModal({ frontendUrl = 'https://jambolush.com' }: SessionExpiredModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [expiredReason, setExpiredReason] = useState<SessionExpiredDetail>({});
  const router = useRouter();

  useEffect(() => {
    const handleSessionExpired = (event: CustomEvent) => {
      const detail = event.detail as SessionExpiredDetail || {};
      setExpiredReason(detail);
      setIsVisible(true);
    };

    window.addEventListener('sessionExpired', handleSessionExpired as EventListener);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired as EventListener);
    };
  }, []);

  const handleLoginRedirect = () => {
    const redirectUrl = frontendUrl + `/all/login?redirect=` + encodeURIComponent(window.location.href);
    window.location.href = redirectUrl;
  };

  // Get user-friendly message based on expiration reason
  const getExpirationMessage = () => {
    if (expiredReason.reason === 'max_duration_exceeded') {
      const hours = expiredReason.sessionDuration ? Math.floor(expiredReason.sessionDuration / 60) : 4;
      const minutes = expiredReason.sessionDuration ? expiredReason.sessionDuration % 60 : 0;
      return {
        title: 'Session Expired',
        message: `Your session has expired after ${hours} hour${hours !== 1 ? 's' : ''} ${minutes > 0 ? `and ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''} of use.`,
        reason: `For security, sessions are limited to a maximum of 4 hours. You were logged in for approximately ${hours} hour${hours !== 1 ? 's' : ''}.`
      };
    } else if (expiredReason.reason === 'unauthorized_401') {
      return {
        title: 'Session Expired',
        message: 'Your session has expired or your authentication token is no longer valid.',
        reason: 'This can happen if you logged in from another device or your session was manually revoked for security reasons.'
      };
    } else {
      return {
        title: 'Session Expired',
        message: 'Your session has expired for security reasons.',
        reason: 'Sessions expire automatically after a period of inactivity or after the maximum duration (4 hours) to protect your account security.'
      };
    }
  };

  const expirationInfo = getExpirationMessage();

  if (!isVisible) return null;

  return (
    <>
      {/* Blur Background Overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9998]" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-[fadeIn_0.3s_ease-in-out]">
          {/* Header with Icon */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <i className="bi bi-shield-lock text-4xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-white">{expirationInfo.title}</h2>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <p className="text-gray-700 dark:text-gray-300 mb-2 text-base">
              {expirationInfo.message}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Please login again to continue using the application.
            </p>

            {/* Login Button */}
            <button
              onClick={handleLoginRedirect}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#083A85] to-[#0a4fa0] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <i className="bi bi-box-arrow-in-right"></i>
              Login Again
            </button>

            {/* Security Info */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3 text-left">
                <i className="bi bi-info-circle text-blue-500 text-lg mt-0.5"></i>
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Why did this happen?
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {expirationInfo.reason}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
