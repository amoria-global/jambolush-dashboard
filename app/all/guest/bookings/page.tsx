import { Metadata } from 'next';
import BookingsDashboard from '../../../pages/guest/user-bookings';

export const metadata: Metadata = {
    title: 'Payments Overview',
    description: 'Overview of your payments as a guest.',
    keywords: ['payments', 'guest', 'transactions'],
};

const UserBookingDashboardPage = () => {
  return (
    <div>
      <BookingsDashboard />
    </div>
  );
};

export default UserBookingDashboardPage;