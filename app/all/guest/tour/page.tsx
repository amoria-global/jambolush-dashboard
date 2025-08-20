"use client";
import React, { useState, useMemo, FC } from 'react';
import BookingsTable from "../../../pages/user-tour";
export default function DashboardPage() {
  return (
    <div className="p-6">
      <BookingsTable />
    </div>
  );
}
