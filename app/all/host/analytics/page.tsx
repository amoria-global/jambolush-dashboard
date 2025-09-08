
import React from "react";
import HostAnalyticsPage from  '../../../pages/host/host-analytics';
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Analytics- Jambolush",
    description: "Overview of host activities and performance",
};
export default function HostAnalytics() {
  return <HostAnalyticsPage />;
}
