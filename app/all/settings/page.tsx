"use client";

import React, { useEffect } from "react";
import SettingsPage from "../../pages/settings";

export default function Settings() {
  useEffect(() => {
    document.title = 'Settings - Jambolush';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Manage your account preferences and application settings');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Manage your account preferences and application settings';
      document.head.appendChild(meta);
    }
  }, []);

  return <SettingsPage />;
}