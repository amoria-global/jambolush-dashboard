"use client";

import AgentDashboard from "@/app/pages/agent/dashboard";
import AgentAssessmentGuard from "@/app/components/guards/AgentAssessmentGuard";

const AgentPage = () => {
    return (
        <AgentAssessmentGuard>
            <div className="mt-10">
                <AgentDashboard />
            </div>
        </AgentAssessmentGuard>
    );
};

export default AgentPage;