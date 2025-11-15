"use client";

import React, { useEffect } from "react";
import Messagespage from "../../pages/messages";

export default function TourGuideSchedule() {
  useEffect(() => {
    document.title = 'Messages - Jambolush';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'View and manage your messages and communications');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'View and manage your messages and communications';
      document.head.appendChild(meta);
    }
  }, []);

  return <Messagespage />;
}
