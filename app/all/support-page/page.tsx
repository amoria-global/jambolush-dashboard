

import React from "react";
import HelpSupportCenter from "../../pages/support-page";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Support - JamboLush",
  description: "Get help and support for your account and services",
};

export default function Support() {
  return <HelpSupportCenter />;
}
