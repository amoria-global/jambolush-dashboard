import UnifiedEarnings from "@/app/components/unified-earnings";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Earnings Overview',
    description: 'Overview of your earnings as a host.',
    keywords: ['earnings', 'host', 'revenue'],
};

export default function AgentEarnings() {
  return <UnifiedEarnings userType="host" />;
}