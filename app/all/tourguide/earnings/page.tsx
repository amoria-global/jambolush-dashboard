import TourGuideEarnings from "@/app/pages/tourguide/earnings";
import { Metadata } from "next";
export const metadata: Metadata = {
    title: 'Earnings Overview',
    description: 'Overview of your earnings as a tour guide.',
    keywords: ['earnings', 'tour guide', 'revenue'],
};

const EarningsPage = () => {
    return (
        <div>
            <h1>Earnings Overview</h1>
            <TourGuideEarnings />
        </div>
    );
};

export default EarningsPage;
