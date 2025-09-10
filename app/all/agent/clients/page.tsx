
import React from "react";
import AgentListingPage from "../../../pages/agent/agent-clients";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Clients - JamboLush",
    description: "Overview of guests and their bookings",
};
export default function Guests() {
  return <AgentListingPage />;
}
