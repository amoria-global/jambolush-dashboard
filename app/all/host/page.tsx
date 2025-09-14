import Dashboard from "@/app/pages/host/dashboard";
const HostPage: React.FC = () => {
    return (
        <>
        <head>
            <title>Host Dashboard - JamboLush</title>
            <meta name="description" content="Dashboard for your JamboLush Host account" />
        </head>
        <div className="mt-10">
            <Dashboard />
        </div>
        </>
    );
};

export default HostPage;