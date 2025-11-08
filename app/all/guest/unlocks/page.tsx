
import GuestUnlockHistory from "@/app/pages/guest/unlock-history";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Unlocks - Jambolush",
    description: "Overview of unclocks activities and performance",
};

const GuestPage = () => {
    return (
        <div className="mt-10">
            <GuestUnlockHistory />
        </div>
    );
};

export default GuestPage;