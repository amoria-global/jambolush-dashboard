'use client';

import React, { Suspense } from 'react';
import EditPropertyContent from './EditPropertyContent';
import { Metadata } from 'next';
const metadata: Metadata = {
  title: 'Edit Property - Jambolush',
  description: 'Edit property details and information',
};

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
  return (
    <Suspense fallback={<LoadingPropertyData />}>
      <head>
        <title>Edit Property - Jambolush</title>
      </head>
      <EditPropertyContent />
    </Suspense>
  );
}
