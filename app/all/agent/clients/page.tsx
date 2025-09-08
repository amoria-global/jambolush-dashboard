
import React from "react";
import GuestsListingPage from "../../../pages/host/host-guests";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Clients - JamboLush",
    description: "Overview of guests and their bookings",
};
export default function Guests() {
  return <GuestsListingPage />;
}
