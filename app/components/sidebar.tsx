"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api from "../api/apiService"; // Import your API service

type UserRole = 'guest' | 'host' | 'agent' | 'tourguide';

interface NavigationItem {
    label: string;
    icon: string;
    path: string;
}

interface SideBarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  phoneCountryCode?: string;
  profile?: string | null;
  country?: string;
  state?: string | null;
  province?: string | null;
  city?: string | null;
  street?: string | null;
  zipCode?: string | null;
  postalCode?: string | null;
  postcode?: string | null;
  pinCode?: string | null;
  eircode?: string | null;
  cep?: string | null;
  status: string;
  userType: UserRole; // This maps to our role system
  provider?: string;
}

interface UserSession {
    user: UserProfile;
    token: string;
    role: UserRole;
}

const SideBar: React.FC<SideBarProps> = ({ isSidebarOpen, toggleSidebar }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [userSession, setUserSession] = useState<UserSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // URL parameters state
    const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null);

    const pathname = usePathname();
    const router = useRouter();

    // Client-side URL parameter extraction
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            setUrlParams(params);
        }
    }, []);

    // Function to get URL token
    const getUrlToken = (): string | null => {
        if (typeof window === 'undefined' || !urlParams) return null;
        return urlParams.get('token');
    };

    // Function to clean URL after token extraction
    const cleanUrlParams = () => {
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            window.history.replaceState({}, '', url.toString());
        }
    };

    // Function to fetch user session from API
    const fetchUserSession = async () => {
        try {
            setIsLoading(true);
            
            // Always prioritize token from URL parameters
            const urlToken = getUrlToken();
            let authToken: string | null = null;

            if (urlToken) {
                // Use token from URL parameters
                authToken = urlToken;
                
                // Store token in localStorage immediately
                localStorage.setItem('authToken', urlToken);
                
                // Clean URL after storing token
                cleanUrlParams();
                
                console.log('Token retrieved from URL and stored in localStorage');
            } else {
                // Fallback to localStorage only if no URL token
                authToken = localStorage.getItem('authToken');
            }
            
            if (!authToken) {
                // No token available, redirect to login
                console.log('No token found, redirecting to login');
                handleLogout();
                return;
            }

            // Set authorization header
            api.setAuth(authToken);
            const response = await api.get('auth/me');

            if (response.data) {
                const userData: UserProfile = response.data;
                
                // Validate if user has appropriate role for dashboard access
                const validRoles: UserRole[] = ['guest', 'host', 'agent', 'tourguide'];
                if (!validRoles.includes(userData.userType)) {
                    console.error('Invalid user role:', userData.userType);
                    handleLogout();
                    return;
                }

                // Create user session
                const session: UserSession = {
                    user: userData,
                    token: authToken,
                    role: userData.userType
                };

                setUserSession(session);
                setUser(userData);
                setIsAuthenticated(true);

                // Store session data
                localStorage.setItem('userSession', JSON.stringify({
                    role: userData.userType,
                    name: getUserDisplayName(userData),
                    id: userData.id,
                    email: userData.email
                }));

                console.log('User session established successfully');

            } else {
                // Invalid token or no user data
                console.log('Invalid token or no user data, logging out');
                handleLogout();
            }
        } catch (error) {
            console.error('Failed to fetch user session:', error);
            handleLogout();
        } finally {
            setIsLoading(false);
        }
    };

    // Function to handle logout
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userSession');
        setUser(null);
        setUserSession(null);
        setIsAuthenticated(false);
        
        // Redirect to login page
        console.log('Logging out and redirecting to login');
        // router.push('http://localhost:3001/all/login');
       // window.location.href = 'http://localhost:3001/all/login';
    };

    // Initialize authentication on component mount and when URL params change
    useEffect(() => {
        if (urlParams !== null) {
            fetchUserSession();
        }
    }, [urlParams]);

    // Monitor localStorage changes (for when token is removed externally)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'authToken' && !e.newValue && isAuthenticated) {
                console.log('Auth token removed from localStorage, logging out');
                handleLogout();
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('storage', handleStorageChange);
            return () => window.removeEventListener('storage', handleStorageChange);
        }
    }, [isAuthenticated]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (isSidebarOpen) {
            toggleSidebar();
        }
    }, [pathname]);

    // Helper function to get user display name
    const getUserDisplayName = (userData: UserProfile) => {
        if (userData.name) return userData.name;
        if (userData.firstName && userData.lastName) {
            return `${userData.firstName} ${userData.lastName}`.trim();
        }
        return userData.email;
    };

    // Helper function to get user avatar or initials
    const getUserAvatar = () => {
        if (user?.profile) return user.profile;
        if (user?.firstName && user?.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        }
        if (user?.name) {
            const names = user.name.split(' ');
            return names.length > 1 
                ? `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
                : names[0].charAt(0).toUpperCase();
        }
        return user?.email?.charAt(0).toUpperCase() || 'U';
    };

    // Define navigation items for each role
    const navigationItems: Record<UserRole, NavigationItem[]> = {
        guest: [
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

            { label: 'Properties', icon: 'bi-building', path: '/all/agent/properties' },

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
            guest: 'Guest',
            host: 'Host',
            agent: 'Agent',
            tourguide: 'Tour Guide'
        };
        return roleNames[role] || 'Guest';
    };

    const isActive = (path: string): boolean => {
        return pathname === path;
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="fixed top-0 left-0 w-72 h-full bg-white border-r border-gray-200 shadow-lg z-40 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - this will trigger redirect to login
    if (!isAuthenticated || !user || !userSession) {
        return null;
    }

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={`fixed inset-0 bg-white/30 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden ${
                    isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={toggleSidebar}
                aria-hidden="true"
            />

            {/* Mobile menu button */}
            <button
                className="md:hidden fixed top-4 left-4 z-60 p-2 rounded-md bg-white text-gray-800 shadow-md"
                onClick={toggleSidebar}
                aria-controls="sidebar"
                aria-expanded={isSidebarOpen}
            >
                <i className="bi bi-list text-2xl" />
            </button>

            {/* Sidebar */}
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
                            <p className="text-base text-gray-600">{getRoleDisplayName(userSession.role)} Dashboard</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Items */}
                <div className="p-4">
                    <nav className="space-y-1">
                        {navigationItems[userSession.role].map((item, index) => (
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
                                }`} />
                                <span className="text-base">{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Divider */}
                <div className="mx-4 border-t border-gray-200" />

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
                                }`} />
                                <span className="text-base">{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Divider */}
                <div className="mx-4 border-t border-gray-200" />

                {/* Profile Section */}
                <div className="p-4">
                    <Link
                        href="/all/profile"
                        className="flex items-center space-x-3 px-3 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                    >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#F20C8F' }}>
                            {user.profile ? (
                                <img src={user.profile} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-sm font-semibold">{getUserAvatar()}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-black truncate">{getUserDisplayName(user)}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                    </Link>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-3 py-3 mt-2 rounded-lg cursor-pointer text-left transition-all duration-200 hover:bg-red-50 text-gray-700 hover:text-red-600"
                    >
                        <i className="bi bi-box-arrow-right text-lg text-gray-500" />
                        <span className="text-base">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default SideBar; 