import React from "react";
import TourBookingsPage from "@/app/pages/tourguide/bookings";
export const metadata = {
  title: "Reservations - JamboLush",
  description: "Overview of your tour reservations and their status",
};

const Reservations = () => {
  return (
    <div>
      <TourBookingsPage />
    </div>
  );
};

export default Reservations;