import HostEarnings from "@/app/pages/host/earnings";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Earnings Overview',
    description: 'Overview of your earnings as a host.',
    keywords: ['earnings', 'host', 'revenue'],
};

const EarningsPage = () => {
    return (
        <div>
            <HostEarnings />
        </div>
    );
};

export default EarningsPage;