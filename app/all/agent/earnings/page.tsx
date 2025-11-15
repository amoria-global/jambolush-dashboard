"use client";

import { useEffect } from 'react';
import UnifiedEarnings from '@/app/components/unified-earnings';
import AgentAssessmentGuard from "@/app/components/guards/AgentAssessmentGuard";

export default function AgentEarnings() {
  useEffect(() => {
    document.title = 'Agent Earnings - Jambolush';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Track your earnings and commission from property sales');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Track your earnings and commission from property sales';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <AgentAssessmentGuard>
      <UnifiedEarnings userType="agent" />
    </AgentAssessmentGuard>
  );
}