import UnifiedEarnings from "@/app/components/unified-earnings";
import { Metadata } from "next";
export const metadata: Metadata = {
    title: 'Earnings Overview',
    description: 'Overview of your earnings as a tour guide.',
    keywords: ['earnings', 'tour guide', 'revenue'],
};

export default function AgentEarnings() {
  return <UnifiedEarnings userType="tourguide" />;
}
