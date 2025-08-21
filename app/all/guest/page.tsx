import GuestDashboard from "@/app/pages/guest/dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard - Jambolush",
    description: "Overview of guest activities and performance",
};

const GuestPage = () => {
    return (
        <div className="mt-10">
            <GuestDashboard />
        </div>
    );
};

export default GuestPage;