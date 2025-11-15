"use client";
import React, { useEffect } from "react";
import WithdrawPage from '../../pages/withdraw';
const WithdrawTextPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Withdraw Funds - Jambolush';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Withdraw your earnings and manage payout methods');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Withdraw your earnings and manage payout methods';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <WithdrawPage />
    </div>
  );
};

export default WithdrawTextPage;
