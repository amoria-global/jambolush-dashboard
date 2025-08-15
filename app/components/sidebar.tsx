"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type UserRole = 'user' | 'host' | 'agent' | 'tourguide';

interface NavigationItem {
    label: string;
    icon: string;
    path: string;
}

const SideBar: React.FC = () => {
    // Mock session role - in real app this would come from auth context
    const [sessionRole, setSessionRole] = useState<UserRole>('user');
    const pathname = usePathname();
    useEffect(() => {
        const sessionUser = localStorage.getItem('sessionUser');
        if (sessionUser) {
            // Parse the user role from the session data
            const userData = JSON.parse(sessionUser);
            setSessionRole(userData.role);
        }
    }, []);
    // Define navigation items for each role
    const navigationItems: Record<UserRole, NavigationItem[]> = {
        user: [
            { label: 'Home', icon: 'bi-house', path: '/' },
            { label: 'My Bookings', icon: 'bi-calendar-check', path: '/all/user-bookings' },
            { label: 'Tours & Experiences', icon: 'bi-map', path: '/user/tours' },
            { label: 'My Trips', icon: 'bi-airplane', path: '/user/trips' },
            { label: 'Payments', icon: 'bi-credit-card', path: '/user/payments' },
            { label: 'Wishlist', icon: 'bi-heart', path: '/user/wishlist' },
            { label: 'Settings', icon: 'bi-gear', path: '/user/settings' }
        ],
        host: [
            { label: 'Dashboard', icon: 'bi-speedometer2', path: '/host/dashboard' },
            { label: 'My Properties', icon: 'bi-building', path: '/host/properties' },
            { label: 'Bookings', icon: 'bi-calendar3', path: '/host/bookings' },
            { label: 'Guests', icon: 'bi-people', path: '/host/guests' },
            { label: 'Earnings', icon: 'bi-cash-coin', path: '/host/earnings' },
            { label: 'Analytics', icon: 'bi-graph-up', path: '/host/analytics' },
            { label: 'Settings', icon: 'bi-gear', path: '/host/settings' }
        ],
        agent: [
            { label: 'Dashboard', icon: 'bi-speedometer2', path: '/agent/dashboard' },
            { label: 'Clients', icon: 'bi-people-fill', path: '/agent/clients' },
            { label: 'Properties', icon: 'bi-building', path: '/agent/properties' },
            { label: 'Performance', icon: 'bi-trophy', path: '/agent/performance' },
            { label: 'Earnings', icon: 'bi-cash-coin', path: '/agent/earnings' },
            { label: 'Settings', icon: 'bi-gear', path: '/agent/settings' }
        ],
        tourguide: [
            { label: 'Dashboard', icon: 'bi-speedometer2', path: '/tourguide/dashboard' },
            { label: 'My Tours', icon: 'bi-compass', path: '/tourguide/tours' },
            { label: 'Schedule', icon: 'bi-calendar2-week', path: '/tourguide/schedule' },
            { label: 'Guests', icon: 'bi-people', path: '/tourguide/guests' },
            { label: 'Earnings', icon: 'bi-cash-coin', path: '/tourguide/earnings' },
            { label: 'Reviews', icon: 'bi-star', path: '/tourguide/reviews' },
            { label: 'Messages', icon: 'bi-envelope', path: '/tourguide/messages' },
            { label: 'Settings', icon: 'bi-gear', path: '/tourguide/settings' }
        ]
    };
    
    // Common items for all roles
    const commonItems: NavigationItem[] = [
        { label: 'Notifications', icon: 'bi-bell', path: '/notifications' },
        { label: 'Help & Support', icon: 'bi-question-circle', path: '/support-page' }
    ];
    
    const getRoleDisplayName = (role: UserRole): string => {
        const roleNames: Record<UserRole, string> = {
            user: 'User',
            host: 'Host',
            agent: 'Agent',
            tourguide: 'Tour Guide'
        };
        return roleNames[role] || 'User';
    };

    const isActive = (path: string): boolean => {
        return pathname === path;
    };

    return (
        <div className="fixed top-0 left-0 w-72 h-full bg-white border-r border-gray-200 shadow-lg overflow-y-auto">
            {/* Header with Logo and Company Name */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor: '#F20C8F'}}>
                        <span className="text-white font-bold text-lg">J</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-black">Jambolush</h1>
                        <p className="text-base text-gray-600">{getRoleDisplayName(sessionRole)} Dashboard</p>
                    </div>
                </div>
            </div>

            {/* Navigation Items */}
            <div className="p-4">
                <nav className="space-y-1">
                    {navigationItems[sessionRole].map((item, index) => (
                        <Link
                            key={index}
                            href={item.path}
                            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 hover:bg-gray-50 ${
                                isActive(item.path) 
                                    ? 'text-white font-medium' 
                                    : 'text-gray-700 hover:text-black'
                            }`}
                            style={{
                                backgroundColor: isActive(item.path) ? '#083A85' : 'transparent'
                            }}
                        >
                            <i className={`bi ${item.icon} text-lg ${
                                isActive(item.path) ? 'text-white' : 'text-gray-500'
                            }`}></i>
                            <span className="text-base">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-gray-200"></div>

            {/* Common Items */}
            <div className="p-4">
                <nav className="space-y-1">
                    {commonItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.path}
                            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 hover:bg-gray-50 ${
                                isActive(item.path) 
                                    ? 'text-white font-medium' 
                                    : 'text-gray-700 hover:text-black'
                            }`}
                            style={{
                                backgroundColor: isActive(item.path) ? '#083A85' : 'transparent'
                            }}
                        >
                            <i className={`bi ${item.icon} text-lg ${
                                isActive(item.path) ? 'text-white' : 'text-gray-500'
                            }`}></i>
                            <span className="text-base">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-gray-200"></div>

            {/* Profile Section as Last Item */}
            <div className="p-4">
                <Link 
                    href="/all/profile"
                    className="flex items-center space-x-3 px-3 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#F20C8F'}}>
                        <i className="bi bi-person-fill text-white text-base"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-black truncate">John Doe</p>
                        <p className="text-xs text-gray-500 truncate">{getRoleDisplayName(sessionRole)}</p>
                    </div>
                </Link>
                
                {/* Logout Button */}
                <button 
                    onClick={() => {
                        localStorage.removeItem('sessionUser');
                        window.location.href = '/login';
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-3 mt-2 rounded-lg cursor-pointer text-left transition-all duration-200 hover:bg-red-50 text-gray-700 hover:text-red-600"
                >
                    <i className="bi bi-box-arrow-right text-lg text-gray-500"></i>
                    <span className="text-base">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default SideBar;