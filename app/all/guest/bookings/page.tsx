import { Metadata } from 'next';
import { Suspense } from 'react';
import GuestBookingsUnified from '../../../pages/guest/bookings-unified';

export const metadata: Metadata = {
    title: 'My Bookings',
    description: 'Manage all your stays, tours and experiences',
    keywords: ['Bookings', 'Reservations', 'Tours', 'Stays', 'Schedules', 'Jambolush', 'Guest'],
};

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85]"></div>
  </div>
);

const UserBookingDashboardPage = () => {
  return (
    <div>
      <Suspense fallback={<LoadingFallback />}>
        <GuestBookingsUnified />
      </Suspense>
    </div>
  );
};

export default UserBookingDashboardPage;