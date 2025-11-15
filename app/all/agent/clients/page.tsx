"use client";

import React, { useEffect } from "react";
import AgentListingPage from "../../../pages/agent/agent-clients";
import AgentAssessmentGuard from "@/app/components/guards/AgentAssessmentGuard";

export default function Guests() {
  useEffect(() => {
    document.title = 'My Clients - Jambolush';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Manage your client relationships and property listings');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Manage your client relationships and property listings';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <AgentAssessmentGuard>
      <AgentListingPage />
    </AgentAssessmentGuard>
  );
}
