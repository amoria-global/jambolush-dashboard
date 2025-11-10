"use client";

import UnifiedEarnings from '@/app/components/unified-earnings';
import AgentAssessmentGuard from "@/app/components/guards/AgentAssessmentGuard";

export default function AgentEarnings() {
  return (
    <AgentAssessmentGuard>
      <UnifiedEarnings userType="agent" />
    </AgentAssessmentGuard>
  );
}