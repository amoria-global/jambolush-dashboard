'use client';

import React, { Suspense, useEffect } from 'react';
import EditPropertyContent from './EditPropertyContent';

// Loading component for Suspense fallback
const LoadingPropertyData = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85] mb-4"></div>
      <p className="text-gray-600 font-medium">Loading property data...</p>
    </div>
  </div>
);

// Main page component with Suspense boundary
export default function EditPropertyPage() {
  useEffect(() => {
    document.title = 'Edit Property - Jambolush';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Edit property details and information');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Edit property details and information';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <Suspense fallback={<LoadingPropertyData />}>
      <EditPropertyContent />
    </Suspense>
  );
}
