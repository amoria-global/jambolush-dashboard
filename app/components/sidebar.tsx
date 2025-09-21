//app/components/sidebar.tsx 
"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api from "../api/apiService"; // Import your API service

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

    // Function to get URL refresh token
    const getUrlRefreshToken = (): string | null => {
        if (typeof window === 'undefined' || !urlParams) return null;
        return urlParams.get('refresh_token');
    };

    // Function to clean URL after token extraction
    const cleanUrlParams = () => {
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            url.searchParams.delete('refresh_token');
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
            localStorage.setItem('refreshToken', getUrlRefreshToken() || '');
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

        console.log('=== SIDEBAR DEBUG: Full API Response ===', response);
        console.log('=== SIDEBAR DEBUG: Response.data ===', response.data);

        // FIXED: Check if response contains user data directly
        if (response.data && response.data.id) {
            // FIXED: User data is directly in response.data
            const userData: UserProfile = {
                ...response.data,
                id: response.data.id.toString() // Ensure ID is string
            };
            
            console.log('=== SIDEBAR DEBUG: Extracted User Data ===', userData);
            console.log('=== SIDEBAR DEBUG: Tour Guide Type ===', userData.tourGuideType);
            
            // Validate if user has appropriate role for dashboard access
             const validRoles: UserRole[] = ['guest', 'host', 'agent', 'tourguide'];
             if (!validRoles.includes(userData.userType)) {
            console.error('Invalid user role:', userData.userType);
            handleLogout();

            return;
}

// Check if KYC is required for hosts, tour guides, and agents
if ((userData.userType === 'host' || userData.userType === 'tourguide' || userData.userType === 'agent') && !userData.kycCompleted) {
    console.log('User requires KYC completion, redirecting to KYC page');
    router.push('/all/kyc');
    return;
}

// Create user session
const sessionData: UserSession = {
    user: userData,
    token: authToken,
    role: userData.userType
};

            setUserSession(sessionData);
            setSession(sessionData); // Keep both for compatibility
            setUser(userData);
            setIsAuthenticated(true);

            // Store session data with tour guide type
            localStorage.setItem('userSession', JSON.stringify({
                role: userData.userType,
                name: getUserDisplayName(userData),
                id: userData.id,
                email: userData.email,
                tourGuideType: userData.tourGuideType // FIXED: Include tour guide type
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
    const handleLogout = async () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userSession');
        setUser(null);
        setUserSession(null);
        setSession(null);
        setIsAuthenticated(false);
        
        // Redirect to login page
        console.log('Logging out and redirecting to login');
        // router.push('http://localhost:3001/all/login');
       window.location.href = 'https://jambolush.com/all/login';
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

    useEffect(() => {
  // Handle comprehensive profile updates
  const handleProfileUpdate = (event: CustomEvent) => {
    if (user && event.detail.user) {
      console.log('Sidebar: Profile updated, refreshing user data');
      
      // Update user state with all the new data
      const updatedUser = {
        ...user,
        ...event.detail.user,
        // Ensure we maintain the structure expected by the sidebar
        name: event.detail.user.name || `${event.detail.user.firstName || ''} ${event.detail.user.lastName || ''}`.trim(),
        profile: event.detail.user.profile,
        tourGuideType: event.detail.user.tourGuideType || user.tourGuideType // FIXED: Include tour guide type
      };
      
      setUser(updatedUser);
      
      // Also update userSession if needed
      if (userSession) {
        const updatedSession = {
          ...userSession,
          user: updatedUser
        };
        setUserSession(updatedSession);
        setSession(updatedSession); // Keep both updated
        
        // Update localStorage session data
        localStorage.setItem('userSession', JSON.stringify({
          role: updatedUser.userType,
          name: getUserDisplayName(updatedUser),
          id: updatedUser.id,
          email: updatedUser.email,
          tourGuideType: updatedUser.tourGuideType // FIXED: Include tour guide type
        }));
      }
    }
  };

  // Handle legacy profile image updates (for backward compatibility)
  const handleProfileImageUpdate = (event: CustomEvent) => {
    if (user && event.detail.profile) {
      console.log('Sidebar: Profile image updated');
      setUser({ ...user, profile: event.detail.profile });
    }
  };

  // Add both event listeners
  window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
  window.addEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
  
  return () => {
    window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
    window.removeEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
  };
}, [user, userSession]); // Added userSession to dependencies

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

    const getUserAvatar = () => {
        if (!user) return 'U';
        
        if (user.profile) return user.profile;
        if (user.firstName && user.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        }
        if (user.name) {
            const names = user.name.split(' ');
            return names.length > 1 
                ? `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase()
                : names[0].charAt(0).toUpperCase();
        }
        return user.email?.charAt(0).toUpperCase() || 'U';
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

    const getRoleDisplayName = (role: UserRole, tourGuideType?: TourGuideType): string => {
        console.log('=== SIDEBAR DEBUG: getRoleDisplayName called ===');
        console.log('Role:', role);
        console.log('TourGuideType:', tourGuideType);
        
        if (role === 'tourguide' && tourGuideType) {
            if (tourGuideType === 'freelancer') {
                console.log('=== SIDEBAR DEBUG: Returning Freelancer ===');
                return 'Freelancer';
            } else if (tourGuideType === 'employed') {
                console.log('=== SIDEBAR DEBUG: Returning Company ===');
                return 'Company';
            }
        }
        
        const roleNames: Record<UserRole, string> = {
            guest: 'Guest',
            host: 'Host',
            agent: 'Agent',
            tourguide: 'Tour Guide'
        };
        
        const result = roleNames[role] || 'Guest';
        console.log('=== SIDEBAR DEBUG: Returning default role ===', result);
        return result;
    };

    const getDashboardTitle = (role: UserRole, tourGuideType?: TourGuideType): string => {
        console.log('=== SIDEBAR DEBUG: getDashboardTitle called ===');
        console.log('Role:', role);
        console.log('TourGuideType:', tourGuideType);
        
        if (role === 'tourguide' && tourGuideType) {
            if (tourGuideType === 'freelancer') {
                console.log('=== SIDEBAR DEBUG: Returning Freelancer Dashboard ===');
                return 'Freelancer Tours Dashboard';
            } else if (tourGuideType === 'employed') {
                console.log('=== SIDEBAR DEBUG: Returning Company Dashboard ===');
                return 'Company Tours Dashboard';
            }
        }
        
        const dashboardTitles: Record<UserRole, string> = {
            guest: 'Guest Dashboard',
            host: 'Host Dashboard',
            agent: 'Agent Dashboard',
            tourguide: 'Tour Guide Dashboard'
        };
        
        const result = dashboardTitles[role] || 'Dashboard';
        console.log('=== SIDEBAR DEBUG: Returning default dashboard title ===', result);
        return result;
    };

    const isActive = (path: string): boolean => {
        return pathname === path;
    };

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
    if (!isAuthenticated || !user) {
        return null;
    }

    // Final debug log before rendering
    console.log('=== SIDEBAR DEBUG: About to render ===');
    console.log('User:', user);
    console.log('User role:', user.userType);
    console.log('Tour guide type:', user.tourGuideType);
    console.log('Dashboard title will be:', getDashboardTitle(user.userType, user.tourGuideType));

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
                {/* FIXED: Header now uses getDashboardTitle with tour guide type */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#083A85] to-[#F20C8F] flex items-center justify-center">
                            <img src="/favicon.ico" alt="logo" className='w-full h-full object-cover rounded-lg'/>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-black">Jambolush</h1>
                            <p className="text-base text-gray-600">
                                {getDashboardTitle(user.userType, user.tourGuideType)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    <nav className="space-y-1">
                        {/* FIXED: Use userSession consistently */}
                        {userSession && navigationItems[userSession.role].map((item: any, index: number) => (
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