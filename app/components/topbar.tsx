"use client";

import { useState, useEffect, useRef } from "react";

export default function TopBar() {
  // State for managing dropdown visibility
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Sample data for notifications
  const [notifications, setNotifications] = useState([
    { id: 1, icon: "bi-person-plus-fill", text: "New user registered", time: "5 min ago", read: false },
    { id: 2, icon: "bi-receipt", text: "New order received", time: "10 min ago", read: false },
    { id: 3, icon: "bi-graph-up-arrow", text: "Sales report is ready", time: "30 min ago", read: true },
    { id: 4, icon: "bi-server", text: "Server performance is low", time: "1 hr ago", read: true },
  ]);
  const balance = 3.0;

  // Refs to detect clicks outside of dropdowns
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Effect to handle clicks outside of dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileRef, notificationsRef]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div
      className="fixed right-0 left-72 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-400 shadow-lg z-50"
    >
      {/* Left - Dashboard title */}
      <h1 className="text-xl font-bold text-gray-900 tracking-wide">
        Dashboard
      </h1>

      {/* Right side Icons and Profile */}
      <div className="flex items-center gap-15">
        {/* Messages Icon */}
        <div className="relative cursor-pointer">
           <i className="bi bi-chat-left-text text-2xl text-black-200 hover:text-[#083A85]"></i>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
            <div className="relative cursor-pointer" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
                <i className="bi bi-bell text-2xl text-black-600 hover:text-[#083A85]"></i>
                {unreadCount > 0 && (
                <span
                    className="absolute -top-2 -right-2 flex items-center cursor-pointer justify-center w-5 h-5 text-xs font-bold text-white rounded-full"
                    style={{ backgroundColor: "#F20C8F" }}
                >
                    {unreadCount}
                </span>
                )}
            </div>

            {isNotificationsOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-3 bg-gray-50 border-b">
                        <h6 className="font-semibold text-gray-800">Notifications</h6>
                    </div>
                    <div className="divide-y divide-gray-300 max-h-80 overflow-y-auto">
                        {notifications.map(notification => (
                             <div key={notification.id} className={`flex items-start gap-3 p-3 transition-colors hover:bg-gray-50 ${!notification.read ? 'bg-blue-50/50' : ''}`}>
                                <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${!notification.read ? 'bg-blue-500/20 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
                                    <i className={`bi ${notification.icon} text-lg`}></i>
                                </div>
                                <div className="flex-grow cursor-pointer">
                                    <p className="text-base text-black-700">{notification.text}</p>
                                    <p className="text-sm text-gray-700 mt-1">{notification.time}</p>
                                </div>
                                {!notification.read && <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>}
                            </div>
                        ))}
                    </div>
                     <a href="#" className="block text-center p-2 text-base font-medium text-blue-600 hover:bg-gray-100 transition-colors">
                        View All Notifications
                    </a>
                </div>
            )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 border-2 border-gray-300">
              <img
                src="/favicon.ico" // Replace with actual user profile image URL
                alt="Profile"
                width="40"
                height="40"
                className="object-cover w-full h-full"
              />
            </div>

            <div className="flex flex-col leading-tight">
              <span className="font-semibold" style={{ color: "#083A85" }}>
                Diane Marry
              </span>
              <span className="text-base text-gray-500">
                ${balance.toFixed(2)}
              </span>
            </div>

            <i className={`bi bi-chevron-down text-gray-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}></i>
          </div>

          {/* Dropdown Card */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-4 w-56 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-3 border-b">
                    <p className="font-bold text-gray-800">Diane Marry</p>
                    <p className="text-sm text-gray-700">Host Account</p>
                </div>
                <div className="py-2">
                    <a href="/all/profile" className="flex items-center gap-3 px-4 py-2 text-base text-black hover:bg-gray-100 transition-colors">
                        <i className="bi bi-person-circle w-5 text-black"></i>
                        <span>Profile</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-2 text-base text-black hover:bg-gray-100 transition-colors">
                        <i className="bi bi-wallet2 w-5 text-black"></i>
                        <span>Balance & Payments</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-2 text-base text-black hover:bg-gray-100 transition-colors">
                        <i className="bi bi-gear w-5 text-black"></i>
                        <span>Settings</span>
                    </a>
                </div>
                <div className="border-t p-2">
                     <a href="#" className="flex items-center gap-3 px-4 py-2 text-base text-red-600 hover:bg-red-50 rounded-md transition-colors">
                        <i className="bi bi-box-arrow-right w-5"></i>
                        <span>Logout</span>
                    </a>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
