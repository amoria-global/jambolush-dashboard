//app/components/sidebar.tsx 
"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api from "../api/apiService";

type UserRole = 'guest' | 'host' | 'agent' | 'tourguide';
type TourGuideType = 'freelancer' | 'employed';

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
  userType: UserRole; 
  provider?: string;
  isVerified?: boolean;
  tourGuideType?: TourGuideType;
  createdAt: string;
  updatedAt: string; 
  kycCompleted?: boolean;
  kycStatus?: string;
  kycSubmittedAt?: string;
  addressDocument?: string; 
}

interface UserSession {
    user: UserProfile;
    token: string;
    role: UserRole;
}

const SideBar: React.FC<SideBarProps> = ({ isSidebarOpen, toggleSidebar }) => {
    const [session, setSession] = useState<UserSession | null>(null);
    const [userSession, setUserSession] = useState<UserSession | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [authInitialized, setAuthInitialized] = useState(false);

    const pathname = usePathname();
    const router = useRouter();

    // Function to fetch user session from API
    const fetchUserSession = async () => {
        if (authInitialized) return; // Prevent multiple calls
        
        try {
            setIsLoading(true);
            setAuthInitialized(true);
            
            // Get token from localStorage or URL
            const urlParams = new URLSearchParams(window.location.search);
            const urlToken = urlParams.get('token');
            const urlRefreshToken = urlParams.get('refresh_token');
            
            let authToken: string | null = null;

            if (urlToken) {
                authToken = urlToken;
                localStorage.setItem('authToken', urlToken);
                localStorage.setItem('refreshToken', urlRefreshToken || '');
                
                // Clean URL
                const url = new URL(window.location.href);
                url.searchParams.delete('token');
                url.searchParams.delete('refresh_token');
                window.history.replaceState({}, '', url.toString());
                
                console.log('Token retrieved from URL and stored');
            } else {
                authToken = localStorage.getItem('authToken');
            }
            
            if (!authToken) {
                console.log('No token found');
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            // Set authorization header
            api.setAuth(authToken);
            const response = await api.get('auth/me');

            console.log('=== SIDEBAR DEBUG: API Response ===', response);

            // FIXED: Check the actual API response structure from your logs
            if (response.data && response.data.id) {
                const userData: UserProfile = {
                    ...response.data,
                    id: response.data.id.toString()
                };
                
                console.log('=== SIDEBAR DEBUG: User Data ===', userData);
                
                // Validate user role
                const validRoles: UserRole[] = ['guest', 'host', 'agent', 'tourguide'];
                if (!validRoles.includes(userData.userType)) {
                    console.error('Invalid user role:', userData.userType);
                    handleLogout();
                    return;
                }

                // FIXED: Remove problematic KYC redirect that was preventing authentication
                // Just log KYC status but don't redirect - let user access dashboard
                if ((userData.userType === 'host' || userData.userType === 'tourguide' || userData.userType === 'agent') && !userData.kycCompleted) {
                    console.log('User KYC not completed, but allowing dashboard access');
                    // You can show a banner or notification instead of redirecting
                }

                // Create user session
                const sessionData: UserSession = {
                    user: userData,
                    token: authToken,
                    role: userData.userType
                };

                setUserSession(sessionData);
                setSession(sessionData);
                setUser(userData);
                setIsAuthenticated(true);

                // Store session data
                localStorage.setItem('userSession', JSON.stringify({
                    role: userData.userType,
                    name: getUserDisplayName(userData),
                    id: userData.id,
                    email: userData.email,
                    tourGuideType: userData.tourGuideType
                }));

                console.log('✅ User session established successfully');

            } else {
                console.log('Invalid response structure');
                handleLogout();
            }
        } catch (error) {
            console.error('Failed to fetch user session:', error);
            // Don't logout on network errors, just show unauthenticated state
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to handle logout
    const handleLogout = async () => {
        setIsRedirecting(true);
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userSession');
        setUser(null);
        setUserSession(null);
        setSession(null);
        setIsAuthenticated(false);
        setAuthInitialized(false);
        
        setTimeout(() => {
            window.location.href = 'https://jambolush.com/all/login';
        }, 100);
    };

    // Initialize authentication on component mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            fetchUserSession();
        }
    }, []);

    // Monitor localStorage changes
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

    // Handle profile updates
    useEffect(() => {
        const handleProfileUpdate = (event: CustomEvent) => {
            if (user && event.detail.user) {
                console.log('Sidebar: Profile updated');
                
                const updatedUser = {
                    ...user,
                    ...event.detail.user,
                    name: event.detail.user.name || `${event.detail.user.firstName || ''} ${event.detail.user.lastName || ''}`.trim(),
                    profile: event.detail.user.profile,
                    tourGuideType: event.detail.user.tourGuideType || user.tourGuideType
                };
                
                setUser(updatedUser);
                
                if (userSession) {
                    const updatedSession = {
                        ...userSession,
                        user: updatedUser
                    };
                    setUserSession(updatedSession);
                    setSession(updatedSession);
                    
                    localStorage.setItem('userSession', JSON.stringify({
                        role: updatedUser.userType,
                        name: getUserDisplayName(updatedUser),
                        id: updatedUser.id,
                        email: updatedUser.email,
                        tourGuideType: updatedUser.tourGuideType
                    }));
                }
            }
        };

        const handleProfileImageUpdate = (event: CustomEvent) => {
            if (user && event.detail.profile) {
                console.log('Sidebar: Profile image updated');
                setUser({ ...user, profile: event.detail.profile });
            }
        };

        window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
        window.addEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
        
        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
            window.removeEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
        };
    }, [user, userSession]);

    // Close sidebar on route change
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
        return userData.email || '';
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
            { label: 'Properties', icon: 'bi-building', path: '/all/agent/properties' },
            { label: 'Bookings', icon: 'bi-calendar3', path: '/all/agent/bookings' },
            { label: 'Performance', icon: 'bi-trophy', path: '/all/agent/performance' },
            { label: 'Earnings', icon: 'bi-cash-coin', path: '/all/agent/earnings' },
            { label: 'Settings', icon: 'bi-gear', path: '/all/settings' }
        ],

        tourguide: [
            { label: 'Dashboard', icon: 'bi-speedometer2', path: '/all/tourguide' },
            { label: 'My Tours', icon: 'bi-compass', path: '/all/tourguide/tours' },
            { label: 'Schedule', icon: 'bi-calendar2-week', path: '/all/tourguide/schedule' },
            { label: 'Earnings', icon: 'bi-cash-coin', path: '/all/tourguide/earnings' },
            { label: 'Reviews', icon: 'bi-star', path: '/all/tourguide/reviews' },
            { label: 'Settings', icon: 'bi-gear', path: '/all/settings' }
        ]
    };

    const commonItems: NavigationItem[] = [
        { label: 'Profile', icon: 'bi-person', path: '/all/profile' },
        { label: 'Notifications', icon: 'bi-bell', path: '/all/notifications' },
        { label: 'Help & Support', icon: 'bi-question-circle', path: '/all/support-page' }
    ];

    // Fallback navigation for unauthenticated users
    const fallbackItems: NavigationItem[] = [
        { label: 'Login', icon: 'bi-box-arrow-in-right', path: '/all/login' },
        { label: 'Sign Up', icon: 'bi-person-plus', path: '/all/signup' },
        { label: 'Help & Support', icon: 'bi-question-circle', path: '/all/support-page' }
    ];

    const getRoleDisplayName = (role: UserRole, tourGuideType?: TourGuideType): string => {
        if (role === 'tourguide' && tourGuideType) {
            if (tourGuideType === 'freelancer') return 'Freelancer';
            if (tourGuideType === 'employed') return 'Company';
        }
        
        const roleNames: Record<UserRole, string> = {
            guest: 'Guest',
            host: 'Host',
            agent: 'Agent',
            tourguide: 'Tour Guide'
        };
        
        return roleNames[role] || 'Guest';
    };

    const getDashboardTitle = (role: UserRole, tourGuideType?: TourGuideType): string => {
        if (role === 'tourguide' && tourGuideType) {
            if (tourGuideType === 'freelancer') return 'Freelancer Tours Dashboard';
            if (tourGuideType === 'employed') return 'Company Tours Dashboard';
        }
        
        const dashboardTitles: Record<UserRole, string> = {
            guest: 'Guest Dashboard',
            host: 'Host Dashboard',
            agent: 'Agent Dashboard',
            tourguide: 'Tour Guide Dashboard'
        };
        
        return dashboardTitles[role] || 'Dashboard';
    };

    const isActive = (path: string): boolean => {
        return pathname === path;
    };

    // Get current navigation items and dashboard title
    const currentNavItems = isAuthenticated && userSession 
        ? navigationItems[userSession.role] 
        : fallbackItems;
    
    const currentDashboardTitle = isAuthenticated && user 
        ? getDashboardTitle(user.userType, user.tourGuideType)
        : 'Welcome to Jambolush';

    return (
        <>
            <div
                className={`fixed inset-0 bg-white/30 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden ${
                    isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={toggleSidebar}
                aria-hidden="true"
            />

            <button
                className="md:hidden fixed top-4 left-4 z-60 p-2 rounded-md bg-white text-gray-800 shadow-md"
                onClick={toggleSidebar}
                aria-controls="sidebar"
                aria-expanded={isSidebarOpen}
            >
                <i className="bi bi-list text-2xl" />
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
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#083A85] to-[#F20C8F] flex items-center justify-center">
                            <img src="/favicon.ico" alt="logo" className='w-full h-full object-cover rounded-lg'/>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-black">Jambolush</h1>
                            <p className="text-base text-gray-600">
                                {isLoading || isRedirecting ? 'Loading...' : currentDashboardTitle}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Show loading state */}
                {(isLoading || isRedirecting) && (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center space-y-3">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-600">
                                {isRedirecting ? 'Redirecting...' : 'Loading...'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Main Navigation */}
                {!isLoading && !isRedirecting && (
                    <>
                        <div className="p-4">
                            <nav className="space-y-1">
                                {currentNavItems.map((item: NavigationItem, index: number) => (
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

                        {/* Show additional sections only for authenticated users */}
                        {isAuthenticated && (
                            <>
                                <div className="mx-4 border-t border-gray-200" />

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

                                <div className="mx-4 border-t border-gray-200" />

                                <div className="p-4">
                                    {/* KYC Notice */}
                                    {user && !user.kycCompleted && (user.userType === 'host' || user.userType === 'agent' || user.userType === 'tourguide') && (
                                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="flex items-center">
                                                <i className="bi bi-exclamation-triangle text-yellow-600 mr-2"></i>
                                                <p className="text-sm text-yellow-800">Complete your KYC verification</p>
                                            </div>
                                            <Link
                                                href="/all/kyc"
                                                className="mt-2 text-xs text-yellow-700 hover:text-yellow-900 underline"
                                            >
                                                Complete now →
                                            </Link>
                                        </div>
                                    )}

                                    {/* Logout Button */}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center space-x-3 px-3 py-3 mt-2 rounded-lg cursor-pointer text-left transition-all duration-200 hover:bg-red-50 text-gray-700 hover:text-red-600"
                                    >
                                        <i className="bi bi-box-arrow-right text-lg text-gray-500" />
                                        <span className="text-base">Logout</span>
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Show login prompt for unauthenticated users */}
                        {!isAuthenticated && (
                            <div className="p-4">
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                    <p className="text-sm text-gray-600 mb-3">
                                        Please log in to access all features
                                    </p>
                                    <Link 
                                        href="/all/login"
                                        className="inline-flex items-center px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062a63] transition-colors"
                                    >
                                        <i className="bi bi-box-arrow-in-right mr-2"></i>
                                        Login
                                    </Link>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

export default SideBar;