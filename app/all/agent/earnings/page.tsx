import UnifiedEarnings from '@/app/components/unified-earnings';
import { Metadata } from 'next';
export const metadata: Metadata = {
    title: "Earnings - Jambolush",
    description: "Overview of agent earnings and payouts",
};
export default function AgentEarnings() {
  return <UnifiedEarnings userType="agent" />;
}