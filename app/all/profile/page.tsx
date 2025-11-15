"use client";

import React, { useEffect } from "react";
import UserProfileSettingsPage from '../../pages/profile';

export default function ProfilePage() {
  useEffect(() => {
    document.title = 'My Profile - Jambolush';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'View and manage your profile information and account settings');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'View and manage your profile information and account settings';
      document.head.appendChild(meta);
    }
  }, []);

  return <UserProfileSettingsPage />;
}