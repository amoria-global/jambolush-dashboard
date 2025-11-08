'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TourRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified bookings with tours tab
    router.replace('/all/guest/bookings?tab=tours');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to My Bookings...</p>
      </div>
    </div>
  );
}
