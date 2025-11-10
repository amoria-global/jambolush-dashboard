"use client";

import React from "react";
import BookingsPage from '../../../pages/agent/agent-bookings';
import AgentAssessmentGuard from "@/app/components/guards/AgentAssessmentGuard";

export default function HostBookingsPage() {
  return (
    <AgentAssessmentGuard>
      <BookingsPage />
    </AgentAssessmentGuard>
  );
}