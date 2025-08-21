import AgentDashboard from "@/app/pages/agent/dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard - Jambolush",
    description: "Overview of agent activities and performance",
};
const AgentPage = () => {
    return (
        <div className="mt-10">
            <AgentDashboard />
        </div>
    );
};

export default AgentPage;