
import React from "react";
import SchedulePage from "../../../pages/guest/user-schedule";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Schedules and calendar',
    description: 'Overview of bookings ',
    keywords: ['guest', 'tour', 'booking', 'schedule', 'calendar'],
};

export default function AgentClients() {
  return (
    <SchedulePage />
  );
}