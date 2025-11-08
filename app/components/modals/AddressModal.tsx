'use client';

import React from 'react';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyName: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export default function AddressModal({
  isOpen,
  onClose,
  propertyName,
  address,
  latitude,
  longitude
}: AddressModalProps) {
  if (!isOpen) return null;

  // Generate Google Maps URLs
  const getGoogleMapsDirectionsUrl = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    }
    // Fallback to address search
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  };

  const getGoogleMapsViewUrl = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const getEmbedMapUrl = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps?q=${latitude},${longitude}&output=embed`;
    }
    return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  };

  // Copy address to clipboard
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    // You could add a toast notification here
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <i className="bi bi-geo-alt-fill text-[#083A85] text-xl"></i>
                  <h2 className="text-xl font-semibold text-gray-900">Property Location</h2>
                </div>
                <p className="text-sm text-gray-600">{propertyName}</p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <i className="bi bi-x-lg text-xl"></i>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Google Maps Embed - Shows by default */}
            <div className="mb-6 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
              <iframe
                width="100%"
                height="400"
                frameBorder="0"
                style={{ border: 0 }}
                src={getEmbedMapUrl()}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              ></iframe>
            </div>

            {/* Address Display */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-200 p-5 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <i className="bi bi-map text-blue-600 text-xl"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-blue-900 mb-2">Exact Location</div>
                  <div className="text-gray-900 font-medium text-lg leading-relaxed">
                    {address}
                  </div>
                  {latitude && longitude && (
                    <div className="text-sm text-gray-600 mt-2 font-mono">
                      {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleCopyAddress}
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                <i className="bi bi-clipboard text-lg"></i>
                Copy
              </button>
              <a
                href={getGoogleMapsViewUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#083A85] text-[#083A85] rounded-xl hover:bg-blue-50 transition-all font-medium"
              >
                <i className="bi bi-box-arrow-up-right text-lg"></i>
                Open in Maps
              </a>
              <a
                href={getGoogleMapsDirectionsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#062d65] transition-all font-medium shadow-sm hover:shadow-md"
              >
                <i className="bi bi-signpost-2 text-lg"></i>
                Directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
