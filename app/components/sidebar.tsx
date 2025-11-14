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
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [authInitialized, setAuthInitialized] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const pathname = usePathname();
    const router = useRouter();

    const [frontend_url, setFrontEnd] = useState<string>('https://jambolush.com');

    useEffect(() => { 
        if (process.env.FRONTEND_URL) {
        setFrontEnd(process.env.FRONTEND_URL);
        }
    }, []);

    // Function to fetch user session from API
    const fetchUserSession = async () => {
        if (authInitialized || isLoggingOut) return;
        
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
            } else {
                authToken = localStorage.getItem('authToken');
            }
            
            if (!authToken) {
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            // Set authorization header
            api.setAuth(authToken);
            const response = await api.get('auth/me');

            // Check the actual API response structure
            if (response.data && response.data.id) {
                const userData: UserProfile = {
                    ...response.data,
                    id: response.data.id.toString()
                };
                
                // Validate user role
                const validRoles: UserRole[] = ['guest', 'host', 'agent', 'tourguide'];
                if (!validRoles.includes(userData.userType)) {
                    handleLogout();
                    return;
                }

                // Log KYC status but allow dashboard access
                if ((userData.userType === 'host' || userData.userType === 'tourguide' || userData.userType === 'agent') && !userData.kycCompleted) {
                    // Show notification instead of blocking access
                }

                setUser(userData);
                setIsAuthenticated(true);

                // Store minimal session data
                localStorage.setItem('userSession', JSON.stringify({
                    role: userData.userType,
                    name: getUserDisplayName(userData),
                    id: userData.id,
                    email: userData.email,
                    tourGuideType: userData.tourGuideType
                }));

            } else {
                handleLogout();
            }
        } catch (error: any) {
            // Handle 401 errors or network issues
            if (error?.response?.status === 401 || error?.status === 401) {
                handleLogout();
                return;
            }
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Enhanced logout function
    const handleLogout = async () => {
        if (isLoggingOut) return; // Prevent multiple logout calls

        setTimeout(() => {
            window.location.href = frontend_url + `/all/login?redirect=` + encodeURIComponent(window.location.href);
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
            if (e.key === 'authToken' && !e.newValue && isAuthenticated && !isLoggingOut) {
                handleLogout();
            }
        };

        const handleUserLogout = () => {
            handleLogout();
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('storage', handleStorageChange);
            window.addEventListener('userLogout', handleUserLogout);
            return () => {
                window.removeEventListener('storage', handleStorageChange);
                window.removeEventListener('userLogout', handleUserLogout);
            };
        }
    }, [isAuthenticated, isLoggingOut]);

    // Handle profile updates
    useEffect(() => {
        const handleProfileUpdate = (event: CustomEvent) => {
            if (user && event.detail.user && !isLoggingOut) {
                const updatedUser = {
                    ...user,
                    ...event.detail.user,
                    name: event.detail.user.name || `${event.detail.user.firstName || ''} ${event.detail.user.lastName || ''}`.trim(),
                    profile: event.detail.user.profile,
                    tourGuideType: event.detail.user.tourGuideType || user.tourGuideType
                };
                
                setUser(updatedUser);
                
                localStorage.setItem('userSession', JSON.stringify({
                    role: updatedUser.userType,
                    name: getUserDisplayName(updatedUser),
                    id: updatedUser.id,
                    email: updatedUser.email,
                    tourGuideType: updatedUser.tourGuideType
                }));
            }
        };

        const handleProfileImageUpdate = (event: CustomEvent) => {
            if (user && event.detail.profile && !isLoggingOut) {
                setUser({ ...user, profile: event.detail.profile });
            }
        };

        window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
        window.addEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
        
        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
            window.removeEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
        };
    }, [user, isLoggingOut]);

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
            { label: 'Payments', icon: 'bi-credit-card', path: '/all/guest/payments' },
            { label: 'Unlocks', icon: 'bi-unlock', path: '/all/guest/unlocks' },
            { label: 'Wishlist', icon: 'bi-heart', path: '/all/guest/wishlist' },
            { label: 'Settings', icon: 'bi-gear', path: '/all/settings' }
        ],
        
        host: [
            { label: 'Dashboard', icon: 'bi-speedometer2', path: '/all/host/' },
            { label: 'My Properties', icon: 'bi-building', path: '/all/host/properties' },
            { label: 'Bookings', icon: 'bi-calendar3', path: '/all/host/bookings' },
            { label: 'Guests', icon: 'bi-people', path: '/all/host/guests' },
            { label: 'Earnings', icon: 'bi-cash-coin', path: '/all/host/earnings' },
            { label: 'Unlocks', icon: 'bi-unlock', path: '/all/host/unlock-analytics' },
            { label: 'Analytics', icon: 'bi-graph-up', path: '/all/host/analytics' },
            { label: 'Settings', icon: 'bi-gear', path: '/all/settings' }
        ],
        
        agent: [
            { label: 'Dashboard', icon: 'bi-speedometer2', path: '/all/agent' },
            { label: 'Guests', icon: 'bi-people-fill', path: '/all/agent/clients' },
            { label: 'Properties', icon: 'bi-building', path: '/all/agent/properties' },
            { label: 'Bookings', icon: 'bi-calendar3', path: '/all/agent/bookings' },
            { label: 'Performance', icon: 'bi-trophy', path: '/all/agent/performance' },
            { label: 'Earnings', icon: 'bi-cash-coin', path: '/all/agent/earnings' },
            { label: 'Settings', icon: 'bi-gear', path: '/all/settings' }
        ],

        tourguide: [
            { label: 'Dashboard', icon: 'bi-speedometer2', path: '/all/tourguide' },
            { label: 'Reservations', icon: 'bi-bag', path: '/all/tourguide/reservations' },
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
        { label: 'Login', icon: 'bi-box-arrow-in-right', path: frontend_url + `/all/login`},
        { label: 'Sign Up', icon: 'bi-person-plus', path: frontend_url + '/all/signup' },
        { label: 'Help & Support', icon: 'bi-question-circle', path: frontend_url + '/all/support-page' }
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
    const currentNavItems = isAuthenticated && user 
        ? navigationItems[user.userType] 
        : fallbackItems;
    
    const currentDashboardTitle = isAuthenticated && user 
        ? getDashboardTitle(user.userType, user.tourGuideType)
        : 'Welcome to Jambolush';

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden ${
                    isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={toggleSidebar}
                aria-hidden="true"
            />

            <div
                id="sidebar"
                className={`fixed top-0 left-0 w-72 h-full bg-white border-r border-gray-200 shadow-xl z-40 transition-transform duration-300 ease-in-out flex flex-col
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0`}
                style={{ width: '240px' }}
            >
                {/* Header - Fixed at top */}
                <div className="px-5 pt-4 pb-3 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#083A85] via-[#0a4fa0] to-[#F20C8F] flex items-center justify-center shadow-lg ring-2 ring-white ring-offset-2">
                            <img src="/favicon.ico" alt="logo" className='w-7 h-7 object-cover rounded-lg'/>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">Jambolush</h1>
                            <p className="text-[11px] font-medium text-gray-500 tracking-wide uppercase">
                                {isLoading || isRedirecting ? 'Loading...' : currentDashboardTitle.replace(' Dashboard', '')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
                    {/* Show loading state */}
                    {(isLoading || isRedirecting) && (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center space-y-3">
                                <div className="w-8 h-8 border-3 border-[#083A85] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-xs font-medium text-gray-500">
                                    {isRedirecting ? 'Redirecting...' : 'Loading...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Main Navigation */}
                    {!isLoading && !isRedirecting && (
                        <>
                            <div className="px-4 py-3">
                                <nav className="space-y-1">
                                    {currentNavItems.map((item: NavigationItem, index: number) => (
                                        <Link
                                            key={index}
                                            href={item.path}
                                            className={`group relative w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 ${
                                                isActive(item.path)
                                                    ? 'text-white font-semibold shadow-md'
                                                    : 'text-gray-700 font-medium hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm'
                                            }`}
                                            style={{
                                                backgroundColor: isActive(item.path) ? '#083A85' : 'transparent'
                                            }}
                                        >
                                            {isActive(item.path) && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#F20C8F] rounded-r-full"></div>
                                            )}
                                            <i className={`bi ${item.icon} text-lg ${
                                                isActive(item.path) ? 'text-white' : 'text-gray-500 group-hover:text-[#083A85]'
                                            }`} />
                                            <span className="text-sm tracking-wide">{item.label}</span>
                                        </Link>
                                    ))}
                                </nav>
                            </div>

                            {/* Show additional sections only for authenticated users */}
                            {isAuthenticated && (
                                <>
                                    <div className="mx-4 my-2">
                                        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                    </div>

                                    <div className="px-4 py-2">
                                        <nav className="space-y-1">
                                            {commonItems.map((item, index) => (
                                                <Link
                                                    key={index}
                                                    href={item.path}
                                                    className={`group relative w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 ${
                                                        isActive(item.path)
                                                            ? 'text-white font-semibold shadow-md'
                                                            : 'text-gray-700 font-medium hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm'
                                                    }`}
                                                    style={{
                                                        backgroundColor: isActive(item.path) ? '#083A85' : 'transparent'
                                                    }}
                                                >
                                                    {isActive(item.path) && (
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#F20C8F] rounded-r-full"></div>
                                                    )}
                                                    <i className={`bi ${item.icon} text-lg ${
                                                        isActive(item.path) ? 'text-white' : 'text-gray-500 group-hover:text-[#083A85]'
                                                    }`} />
                                                    <span className="text-sm tracking-wide">{item.label}</span>
                                                </Link>
                                            ))}
                                        </nav>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Fixed Footer Section - For authenticated users */}
                {!isLoading && !isRedirecting && isAuthenticated && (
                    <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
                        {/* KYC Notice */}
                        {user && !user.kycCompleted && (user.userType === 'host' || user.userType === 'agent' || user.userType === 'tourguide') && (
                            <div className="mb-2 p-3 bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-300/50 rounded-xl shadow-sm">
                                <div className="flex items-center mb-1.5">
                                    <i className="bi bi-exclamation-triangle-fill text-yellow-600 mr-2 text-base"></i>
                                    <p className="text-xs font-semibold text-yellow-900">Complete KYC Verification</p>
                                </div>
                                <Link
                                    href="/all/kyc"
                                    className="inline-flex items-center text-xs font-medium text-yellow-700 hover:text-yellow-900 transition-colors"
                                >
                                    Complete now
                                    <i className="bi bi-arrow-right ml-1"></i>
                                </Link>
                            </div>
                        )}

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 font-medium ${
                                isLoggingOut
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'hover:bg-red-50 text-gray-700 hover:text-red-600 cursor-pointer hover:shadow-sm'
                            }`}
                        >
                            <i className={`bi ${isLoggingOut ? 'bi-arrow-clockwise animate-spin' : 'bi-box-arrow-right'} text-lg`} />
                            <span className="text-sm tracking-wide">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                        </button>
                    </div>
                )}

                {/* Fixed Footer Section - For unauthenticated users */}
                {!isLoading && !isRedirecting && !isAuthenticated && (
                    <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center border border-blue-200/50 shadow-sm">
                            <i className="bi bi-shield-lock text-3xl text-[#083A85] mb-2"></i>
                            <p className="text-xs font-medium text-gray-700 mb-3">
                                Please log in to access all features
                            </p>
                            <Link
                                href={frontend_url + `/all/login?redirect=` + encodeURIComponent(window.location.href)}
                                className="inline-flex items-center px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062a63] transition-colors"
                            >
                                <i className="bi bi-box-arrow-in-right mr-2"></i>
                                Login Now
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default SideBar;