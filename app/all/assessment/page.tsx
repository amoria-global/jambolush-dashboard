"use client";

import React, { useEffect } from "react";
import AssessmentPage from "@/app/pages/questions";

export default function Assessment() {
  useEffect(() => {
    document.title = 'Agent Assessment - Jambolush';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Complete the agent assessment to evaluate your qualifications');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Complete the agent assessment to evaluate your qualifications';
      document.head.appendChild(meta);
    }
  }, []);

  return <AssessmentPage />;
}