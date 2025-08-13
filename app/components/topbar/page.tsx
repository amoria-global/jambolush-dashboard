"use client";

import Image from "next/image";
import { useState } from "react";

export default function Page() {
  const [notifications] = useState(9);
  const balance = 3.0;

  return (
    <div
      className="fixed top-4 right-4 left-100 flex items-center justify-between px-6 py-2 bg-white border border-gray-200 rounded-full shadow-lg z-50"
    >
      {/* Left - Dashboard title */}
      <h1 className="text-xl font-bold text-gray-900 tracking-wide">
        Dashboard
      </h1>

      {/* Right side */}
      <div className="flex items-center gap-12">
        {/* Notifications */}
        <div className="relative flex items-center gap-4 cursor-pointer">
          <div className="relative">
            {/* Bell Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-7 h-8 text-gray-800"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.25 18.75a1.5 1.5 0 11-3 0m9-4.5V11a6.75 6.75 0 10-13.5 0v3.25L3 17.25h18l-3.75-3z"
              />
            </svg>

            {notifications > 0 && (
              <span
                className="absolute -top-2 -right-2 flex items-center justify-center w-5.5 h-5 text-xs font-bold text-white rounded-full"
                style={{ backgroundColor: "#F20C8F" }}
              >
                {notifications}+
              </span>
            )}
          </div>
          <span className="text-base font-bold text-gray-700">
            Balance: ${balance.toFixed(2)}
          </span>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-4 cursor-pointer">
          {/* Perfect circular holder */}
          <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
            <Image
              src="/favicon.ico"
              alt="Profile"
              width={44}
              height={44}
              className="object-cover w-full h-full"
            />
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold" style={{ color: "#083A85" }}>
              Diane Marry
            </span>
            <span className="text-sm font-bold text-gray-700">
              ${balance.toFixed(2)}
            </span>
          </div>

          {/* Chevron Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 text-gray-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
