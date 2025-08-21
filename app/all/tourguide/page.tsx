import TourGuideDashboard from "@/app/pages/tourguide/dashboard";

export const metadata = {
    title: "Dashboard - Jambolush",
    description: "Overview of tour guide activities and performance",
};

const TourGuidePage = () => {
    return (
        <div className="mt-10">
            <TourGuideDashboard />
        </div>
    );
};

export default TourGuidePage;   