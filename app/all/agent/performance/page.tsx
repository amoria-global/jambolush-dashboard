"use client";

import React, { useEffect } from "react";
import AgentPerformanceDashboard from '../../../pages/agent/agent-performance';
import AgentAssessmentGuard from "@/app/components/guards/AgentAssessmentGuard";

export default function AgentPerformance() {
  useEffect(() => {
    document.title = 'Agent Performance - Jambolush';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'View your performance metrics and analytics as an agent');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'View your performance metrics and analytics as an agent';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <AgentAssessmentGuard>
      <AgentPerformanceDashboard />
    </AgentAssessmentGuard>
  );
}