//app/layout.tsx
"use client";
import React, { useEffect, useState } from 'react';
import SideBar from "./components/sidebar";
import TopBar from "./components/topbar";
import NotificationToast from "./components/NotificationToast";
import './styles/globals.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import authService from './api/authService';

// Interface for appearance settings
interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. Manage the sidebar's state in the parent layout component
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 2. Appearance settings state
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'light',
    fontSize: 'medium',
    compactMode: false,
  });

  // 3. Function to toggle the sidebar's visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 4. Load saved appearance settings on mount and apply them
  useEffect(() => {
    try {
      const savedAppearance = localStorage.getItem('appearanceSettings');
      if (savedAppearance) {
        const parsedAppearance = JSON.parse(savedAppearance);
        setAppearance(parsedAppearance);

        // Apply theme
        const root = document.documentElement;
        if (parsedAppearance.theme === 'dark') {
          root.classList.add('dark');
        } else if (parsedAppearance.theme === 'light') {
          root.classList.remove('dark');
        } else {
          // Auto mode - check system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }

        // Apply font size
        root.classList.remove('font-small', 'font-medium', 'font-large');
        root.classList.add(`font-${parsedAppearance.fontSize}`);

        // Apply compact mode
        if (parsedAppearance.compactMode) {
          root.classList.add('compact');
        } else {
          root.classList.remove('compact');
        }
      }
    } catch (error) {
      console.error('Failed to load saved appearance settings:', error);
    }
  }, []);

  // 5. Apply appearance settings to the document
  useEffect(() => {
    const applySettings = () => {
      const root = document.documentElement;

      // Apply theme
      if (appearance.theme === 'dark') {
        root.classList.add('dark');
      } else if (appearance.theme === 'light') {
        root.classList.remove('dark');
      } else { // auto theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }

      // Apply font size
      root.classList.remove('font-small', 'font-medium', 'font-large');
      root.classList.add(`font-${appearance.fontSize}`);

      // Apply compact mode
      if (appearance.compactMode) {
        root.classList.add('compact');
      } else {
        root.classList.remove('compact');
      }
    };

    applySettings();

    // Listen for system theme changes when auto mode is selected
    if (appearance.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applySettings();
      mediaQuery.addEventListener('change', handleChange);

      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [appearance]);

  // 6. Listen for settings updates from settings page
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const savedAppearance = localStorage.getItem('appearanceSettings');
        if (savedAppearance) {
          const parsedAppearance = JSON.parse(savedAppearance);
          setAppearance(parsedAppearance);
        }
      } catch (error) {
        console.error('Failed to reload appearance settings:', error);
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom settings update event
    window.addEventListener('userSettingsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userSettingsUpdated', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    // Initialize auth service once at app startup
    authService.initialize();
  }, [])
  
  return (
    <html lang="en">
      <head>
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <style jsx global>{`
          /* Dark mode styles */
          .dark {
            color-scheme: dark;
          }

          .dark body {
            background-color: #0f172a;
            color: #f1f5f9;
          }

          .dark .bg-white {
            background-color: #1e293b !important;
             color: #848687 !important; 
          }

          .dark .text-gray-900 {
            color: #f1f5f9 !important;
          }

          .dark .text-gray-700 {
            color: #cbd5e1 !important;
          }

          .dark .text-gray-600 {
            color: #94a3b8 !important;
          }

          .dark .text-gray-500 {
            color: #64748b !important;
          }

          .dark .bg-gray-50 {
            background-color: #334155 !important;
          }

          .dark .border-gray-300 {
            border-color: #475569 !important;
          }

          .dark .border-gray-200 {
            border-color: #374151 !important;
          }

          .dark .shadow-lg {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2) !important;
          }

          .dark .bg-gray-100 {
            background-color: #374151 !important;
          }

          /* Compact mode styles */
          .compact-mode .p-6 {
            padding: 1rem !important;
          }

          .compact-mode .p-4 {
            padding: 0.75rem !important;
          }

          .compact-mode .py-3 {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }

          .compact-mode .mb-6 {
            margin-bottom: 1rem !important;
          }

          .compact-mode .mb-4 {
            margin-bottom: 0.75rem !important;
          }

          .compact-mode .space-y-6 > * + * {
            margin-top: 1rem !important;
          }

          .compact-mode .space-y-4 > * + * {
            margin-top: 0.75rem !important;
          }

          /* Font size adjustments */
          .text-sm {
            font-size: 0.875rem;
          }

          .text-base {
            font-size: 1rem;
          }

          .text-lg {
            font-size: 1.125rem;
          }
        `}</style>
      </head>
      <body className="">
        {/* Pass the state and toggle function to the SideBar */}
        <SideBar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Pass the toggle function to the TopBar's onMenuButtonClick prop */}
        <TopBar onMenuButtonClick={toggleSidebar} />

        {/* Notification Toast Component */}
        <NotificationToast />

        <main className={`md:ml-72 p-4 sm:p-2 md:p-4 `}>
          {children}
        </main>
      </body>
    </html>
  );
}