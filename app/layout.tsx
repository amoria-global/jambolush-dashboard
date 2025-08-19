"use client";
import React, { useState } from 'react'; // Import useState
import SideBar from "./components/sidebar";
import TopBar from "./components/topbar";
import "./styles/globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Manage the sidebar's state in the parent layout component
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 2. Function to toggle the sidebar's visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <html lang="en">
      <head>
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body className="">
        {/* Pass the state and toggle function to the SideBar */}
        <SideBar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        
        {/* Pass the toggle function to the TopBar's onMenuButtonClick prop */}
        <TopBar onMenuButtonClick={toggleSidebar} />

        <main className={`md:ml-72 p-4 sm:p-2 md:p-4 `}>
          {children}
        </main>
      </body>
    </html>
  );
}