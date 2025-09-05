import Dashboard from "@/app/pages/host/dashboard";
import { Metadata } from "next";
export const metadata: Metadata = {
    title: "Host Dashboard - Jambolush",
};
const HostPage: React.FC = () => {
    return (
        <div className="mt-10">
            <Dashboard />
        </div>
    );
};

export default HostPage;