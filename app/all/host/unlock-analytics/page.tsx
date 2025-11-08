import Dashboard from "@/app/pages/host/dashboard";
import HostUnlockAnalytics from "@/app/pages/host/unlock-analytics";
const HostPage: React.FC = () => {
    return (
        <>
        <head>
            <title>Unlock Analytics - JamboLush</title>
            <meta name="description" content="Dashboard for your JamboLush Host account" />
        </head>
        <div className="mt-10">
            <HostUnlockAnalytics />
        </div>
        </>
    );
};

export default HostPage;