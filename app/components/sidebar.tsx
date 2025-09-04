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

interface SideBarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

interface UserSession {
    role: UserRole;
    name: string;
}

// Role Selection Modal Component
const RoleSelectionModal: React.FC<{
    isOpen: boolean;
    onLogin: (role: UserRole, name: string) => void;
}> = ({ isOpen, onLogin }) => {
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [userName, setUserName] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const roleOptions = [
        { value: 'user' as UserRole, label: 'User', icon: 'bi-person', description: 'Book accommodations and tours' },
        { value: 'host' as UserRole, label: 'Host', icon: 'bi-building', description: 'Manage properties and bookings' },
        { value: 'agent' as UserRole, label: 'Agent', icon: 'bi-briefcase', description: 'Help clients find properties' },
        { value: 'tourguide' as UserRole, label: 'Tour Guide', icon: 'bi-compass', description: 'Create and manage tours' }
    ];

    const handleLogin = () => {
        if (!selectedRole || !userName.trim()) return;
        
        setIsLoggingIn(true);
        // Simulate login process
        setTimeout(() => {
            onLogin(selectedRole, userName.trim());
            setIsLoggingIn(false);
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-2 mb-1">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F20C8F' }}>
                            <span className="text-white font-bold text-sm">J</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Welcome to Jambolush</h2>
                    </div>
                    <p className="text-sm text-gray-600">Choose your role to get started</p>
                </div>

                {/* Modal Content */}
                <div className="p-4">
                    {/* Name Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Role Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Your Role
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {roleOptions.map((role) => (
                                <div
                                    key={role.value}
                                    onClick={() => setSelectedRole(role.value)}
                                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                        selectedRole === role.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="text-center">
                                        <i className={`bi ${role.icon} text-lg ${
                                            selectedRole === role.value ? 'text-blue-600' : 'text-gray-500'
                                        }`}></i>
                                        <h3 className={`text-sm font-medium mt-1 ${
                                            selectedRole === role.value ? 'text-blue-900' : 'text-gray-900'
                                        }`}>
                                            {role.label}
                                        </h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Login Button */}
                    <button
                        onClick={handleLogin}
                        disabled={!selectedRole || !userName.trim() || isLoggingIn}
                        className={`w-full py-2.5 px-4 rounded-lg font-medium text-base transition-all duration-200 ${
                            !selectedRole || !userName.trim() || isLoggingIn
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {isLoggingIn ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">Logging in...</span>
                            </div>
                        ) : (
                            'Login'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SideBar: React.FC<SideBarProps> = ({ isSidebarOpen, toggleSidebar }) => {
    const [sessionRole, setSessionRole] = useState<UserRole | null>(null);
    const [userName, setUserName] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const sessionUser = localStorage.getItem('sessionUser');
        if (sessionUser) {
            try {
                const userData: UserSession = JSON.parse(sessionUser);
                setSessionRole(userData.role);
                setUserName(userData.name || 'User');
                setShowModal(false);
            } catch (error) {
                localStorage.removeItem('sessionUser');
                setSessionRole(null);
                setShowModal(true);
            }
        } else {
            setSessionRole(null);
            setShowModal(true);
        }
    }, []);

    useEffect(() => {
        if (isSidebarOpen) {
            toggleSidebar();
        }
    }, [pathname]);

    const handleLogin = (role: UserRole, name: string) => {
        const userData: UserSession = { role, name };
        localStorage.setItem('sessionUser', JSON.stringify(userData));
        setSessionRole(role);
        setUserName(name);
        setShowModal(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('sessionUser');
        setSessionRole(null);
        setUserName('');
        setShowModal(true);
    };

    const navigationItems: Record<UserRole, NavigationItem[]> = {
        user: [
            { label: 'Home', icon: 'bi-house', path: '/all/guest' },
            { label: 'My Bookings', icon: 'bi-calendar-check', path: '/all/guest/bookings' },
            { label: 'Schedule', icon: 'bi-calendar-plus', path: '/all/guest/schedule' },
            { label: 'Tours & Experiences', icon: 'bi-map', path: '/all/guest/tour' },
            { label: 'Payments', icon: 'bi-credit-card', path: '/all/guest/payments' },
            { label: 'Wishlist', icon: 'bi-heart', path: '/all/guest/wishlist' },
            { label: 'Settings', icon: 'bi-gear', path: '/all/settings' }
        ],
        
        host: [
            { label: 'Dashboard', icon: 'bi-speedometer2', path: '/all/host/' },
            { label: 'My Properties', icon: 'bi-building', path: '/all/host/properties' },
            { label: 'Bookings', icon: 'bi-calendar3', path: '/all/host/bookings' },
            { label: 'Guests', icon: 'bi-people', path: '/all/host/guests' },
            { label: 'Earnings', icon: 'bi-cash-coin', path: '/all/host/earnings' },
            { label: 'Analytics', icon: 'bi-graph-up', path: '/all/host/analytics' },
            { label: 'Settings', icon: 'bi-gear', path: '/all/settings' }
        ],
        
        agent: [
            { label: 'Dashboard', icon: 'bi-speedometer2', path: '/all/agent' },
            { label: 'Clients', icon: 'bi-people-fill', path: '/all/agent/clients' },
            { label: 'Properties', icon: 'bi-building', path: '/all/agent/property' },
            { label: 'Performance', icon: 'bi-trophy', path: '/all/agent/performance' },
            { label: 'Earnings', icon: 'bi-cash-coin', path: '/all/agent/earnings' },
            { label: 'Settings', icon: 'bi-gear', path: '/all/settings' }
        ],

        tourguide: [
            { label: 'Dashboard', icon: 'bi-speedometer2', path: '/all/tourguide' },
            { label: 'My Tours', icon: 'bi-compass', path: '/all/tourguide/tours' },
            { label: 'Schedule', icon: 'bi-calendar2-week', path: '/all/tourguide/schedule' },
            { label: 'Guests', icon: 'bi-people', path: '/all/tourguide/guests' },
            { label: 'Earnings', icon: 'bi-cash-coin', path: '/all/tourguide/earnings' },
            { label: 'Reviews', icon: 'bi-star', path: '/all/tourguide/reviews' },
            { label: 'Messages', icon: 'bi-envelope', path: '/all/messages' },
            { label: 'Settings', icon: 'bi-gear', path: '/all/settings' }
        ]
    };

    const commonItems: NavigationItem[] = [
        { label: 'Profile', icon: 'bi-person', path: '/all/profile' },
        { label: 'Notifications', icon: 'bi-bell', path: '/all/notifications' },
        { label: 'Help & Support', icon: 'bi-question-circle', path: '/all/support-page' }
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

    if (!sessionRole) {
        return <RoleSelectionModal isOpen={showModal} onLogin={handleLogin} />;
    }

    return (
        <>
            <div
                className={`fixed inset-0 bg-white/30 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden ${
                    isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={toggleSidebar}
                aria-hidden="true"
            ></div>

            <button
                className="md:hidden fixed top-4 left-4 z-60 p-2 rounded-md bg-white text-gray-800 shadow-md"
                onClick={toggleSidebar}
                aria-controls="sidebar"
                aria-expanded={isSidebarOpen}
            >
                <i className="bi bi-list text-2xl"></i>
            </button>

            <div
                id="sidebar"
                className={`fixed top-0 left-0 w-72 h-full bg-white border-r border-gray-200 shadow-lg overflow-y-auto z-40 transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0`}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F20C8F' }}>
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
                                        : 'text-gray-900 hover:text-black font-medium'
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

                {/* Profile Section */}
                <div className="p-4">
                    <Link
                        href="/all/profile"
                        className="flex items-center space-x-3 px-3 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                    >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F20C8F' }}>
                            <i className="bi bi-person-fill text-white text-base"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-black truncate">{userName}</p>
                            <p className="text-sm text-gray-500 truncate">{getRoleDisplayName(sessionRole)}</p>
                        </div>
                    </Link>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-3 py-3 mt-2 rounded-lg cursor-pointer text-left transition-all duration-200 hover:bg-red-50 text-gray-700 hover:text-red-600"
                    >
                        <i className="bi bi-box-arrow-right text-lg text-gray-500"></i>
                        <span className="text-base">Logout</span>
                    </button>
                </div>
            </div>

            {/* Role Selection Modal */}
            <RoleSelectionModal isOpen={showModal} onLogin={handleLogin} />
        </>
    );
};

export default SideBar;