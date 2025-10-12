import Payments from "@/app/pages/guest/earnings";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Payments Overview',
    description: 'Overview of your payments as a guest.',
    keywords: ['payments', 'guest', 'transactions'],
};

const PaymentsPage = () => {
    return (
        <div>
            <h1>Payments Overview</h1>
            <Payments userType="guest" />
        </div>
    );
};

export default PaymentsPage;
    