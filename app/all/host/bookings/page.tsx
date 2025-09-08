
import React from "react";
import BookingsPage from '../../../pages/host/host-bookings';
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Bookings - JamboLush",
    description: "Overview of bookings and their status",
};
export default function HostBookingsPage() {
  return <BookingsPage />;
}