"use client";

import { useEffect } from "react";
import AccountActivityPage from "../../pages/recent-activity";

export default function Page() {
  useEffect(() => {
    document.title = 'Recent Activity - Jambolush';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'View your recent account activity and transaction history');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'View your recent account activity and transaction history';
      document.head.appendChild(meta);
    }
  }, []);

  return <AccountActivityPage />;
}
