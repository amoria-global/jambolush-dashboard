'use client';

import React, { Suspense } from 'react';
import EditTourContent from './EditTourContent';

// Loading component for Suspense fallback
const LoadingTourData = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85] mb-4"></div>
      <p className="text-gray-600 font-medium">Loading tour data...</p>
    </div>
  </div>
);

// Main page component with Suspense boundary
export default function EditTourPage() {
  return (
    <Suspense fallback={<LoadingTourData />}>
      <EditTourContent />
    </Suspense>
  );
}
