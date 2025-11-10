"use client";

import React from "react";
import AgentListingPage from "../../../pages/agent/agent-clients";
import AgentAssessmentGuard from "@/app/components/guards/AgentAssessmentGuard";

export default function Guests() {
  return (
    <AgentAssessmentGuard>
      <AgentListingPage />
    </AgentAssessmentGuard>
  );
}
