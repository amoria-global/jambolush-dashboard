"use client";
import React, { useState, useMemo, FC } from 'react';
import AgentClientsPage from "../../../pages/user-mytrip";

const ClientsDashboard: FC = () => {
  return (
    <div className="p-6">
      <AgentClientsPage />
    </div>
  );
};

export default ClientsDashboard;
