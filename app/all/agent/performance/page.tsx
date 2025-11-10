"use client";

import React from "react";
import AgentPerformanceDashboard from '../../../pages/agent/agent-performance';
import AgentAssessmentGuard from "@/app/components/guards/AgentAssessmentGuard";

export default function AgentPerformance() {
  return (
    <AgentAssessmentGuard>
      <AgentPerformanceDashboard />
    </AgentAssessmentGuard>
  );
}