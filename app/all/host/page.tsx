'use client';

import Dashboard from "@/app/pages/host/dashboard";
import { useRouter } from "next/navigation";

const HostPage: React.FC = () => {
    const router  = useRouter();
    router.prefetch('/all/host/dashboard');
    return (
        <div className="mt-10">
            <Dashboard />
        </div>
    );
};

export default HostPage;