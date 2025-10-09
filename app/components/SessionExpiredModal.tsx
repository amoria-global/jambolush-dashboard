//app/components/SessionExpiredModal.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SessionExpiredModalProps {
  frontendUrl?: string;
}

export default function SessionExpiredModal({ frontendUrl = 'https://jambolush.com' }: SessionExpiredModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleSessionExpired = () => {
      setIsVisible(true);
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, []);

  const handleLoginRedirect = () => {
    const redirectUrl = frontendUrl + `/all/login?redirect=` + encodeURIComponent(window.location.href);
    window.location.href = redirectUrl;
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Blur Background Overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9998]" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-[fadeIn_0.3s_ease-in-out]">
          {/* Header with Icon */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <i className="bi bi-shield-lock text-4xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-white">Session Expired</h2>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <p className="text-gray-700 mb-2 text-base">
              Your session has expired for security reasons.
            </p>
            <p className="text-gray-600 text-sm mb-6">
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
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3 text-left">
                <i className="bi bi-info-circle text-blue-500 text-lg mt-0.5"></i>
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    Why did this happen?
                  </p>
                  <p className="text-xs text-gray-600">
                    Sessions expire automatically after a period of inactivity to protect your account security.
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
