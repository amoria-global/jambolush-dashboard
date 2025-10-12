import { Metadata } from 'next';
import UserMyBookings from '../../../pages/guest/user-bookings';

export const metadata: Metadata = {
    title: 'My Reservations',
    description: 'Overview of your reservations as a guest.',
    keywords: ['Reservations', 'spaces', 'jambolush', 'bookings', 'guest'],
};

const UserBookingDashboardPage = () => {
  return (
    <div>
      <UserMyBookings />
    </div>
  );
};

export default UserBookingDashboardPage;