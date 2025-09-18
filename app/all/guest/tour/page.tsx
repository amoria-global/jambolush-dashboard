
import React from 'react';
import BookingsTable from "../../../pages/guest/user-tour";
import { Metadata } from 'next';
export const metadata: Metadata = {
    title: 'Tours and Experience',
    description: 'Tour booking management and overview',
    keywords: ['trip', 'guest', 'tour'],
};

export default function DashboardPage() {
  return (
    <div className="p-6">
      <BookingsTable />
    </div>
  );
}
