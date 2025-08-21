import MyTours from "@/app/pages/tourguide/tours";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'My Tours',
  description: 'Manage your tours and view bookings.',
  keywords: ['tours', 'bookings', 'management'],
};

const ToursPage = () => {
  return (
    <div>
      <MyTours />
    </div>
  );
};

export default ToursPage;
