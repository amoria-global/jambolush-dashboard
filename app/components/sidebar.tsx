// app/components/sidebar.tsx
"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import authService, { UserSession } from '@/app/api/authService';

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

const SideBar: React.FC<SideBarProps> = ({ isSidebarOpen, toggleSidebar }) => {
    const [session, setSession] = useState<UserSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const pathname = usePathname();
    const router = useRouter();

    // Initialize auth service and session
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                setIsLoading(true);
                const userSession = await authService.initialize();
                
                if (userSession) {
                    setSession(userSession);
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                    // Don't redirect here - let the page handle it
                }
            } catch (error) {
                console.error('Sidebar auth initialization failed:', error);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    // Listen for auth events
    useEffect(() => {
        const handleLogin = (userSession: UserSession) => {
            setSession(userSession);
            setIsAuthenticated(true);
        };

        const handleLogout = () => {
            setSession(null);
            setIsAuthenticated(false);
            // Redirect to login
        };

        const handleProfileUpdate = (updatedUser: any) => {
            if (session) {
                const updatedSession = {
                    ...session,
                    user: updatedUser
                };
                setSession(updatedSession);
            }
        };

        const handleTokenRefresh = () => {
            // Session will be updated automatically by the auth service
            console.log('Tokens refreshed successfully');
        };

        const handleSessionExpired = () => {
            setSession(null);
            setIsAuthenticated(false);
        };

        // Subscribe to auth events
        authService.on('login', handleLogin);
        authService.on('logout', handleLogout);
        authService.on('profile_updated', handleProfileUpdate);
        authService.on('token_refreshed', handleTokenRefresh);
        authService.on('session_expired', handleSessionExpired);

        // Cleanup
        return () => {
            authService.off('login', handleLogin);
            authService.off('logout', handleLogout);
            authService.off('profile_updated', handleProfileUpdate);
            authService.off('token_refreshed', handleTokenRefresh);
            authService.off('session_expired', handleSessionExpired);
        };
    }, [session, router]);

    // Listen for custom profile update events (backward compatibility)
    useEffect(() => {
        const handleProfileUpdate = (event: CustomEvent) => {
            if (session && event.detail.user) {
                console.log('Sidebar: Profile updated via custom event');
                authService.updateProfile(event.detail.user);
            }
        };

        const handleProfileImageUpdate = (event: CustomEvent) => {
            if (session && event.detail.profile) {
                console.log('Sidebar: Profile image updated via custom event');
                authService.updateProfile({ profile: event.detail.profile });
            }
        };

        window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
        window.addEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
        
        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
            window.removeEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
        };
    }, [session]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (isSidebarOpen) {
            toggleSidebar();
        }
    }, [pathname]);

    // Helper function to get user display name
    const getUserDisplayName = () => {
        if (!session?.user) return 'User';
        const user = session.user;
        if (user.name) return user.name;
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`.trim();
        }
        return user.email;
    };

    // Helper function to get user avatar or initials
    const getUserAvatar = () => {
        if (!session?.user) return 'U';
        const user = session.user;
        
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

    // Handle logout
    const handleLogout = async () => {
        try {
            await authService.logout();
            // The auth service will emit logout event which will be handled above
        } catch (error) {
            console.error('Logout failed:', error);
            // Force logout even if API call fails
            setSession(null);
            setIsAuthenticated(false);
        }
    };

    // Define navigation items for each role
    const navigationItems: Record<UserRole, NavigationItem[]>| any = {
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
    if (!isAuthenticated || !session) {
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
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#083A85] to-[#F20C8F] flex items-center justify-center">
                      <img src="/favicon.ico" alt="logo" className='w-full h-full object-cover rounded-lg'/>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-black">Jambolush</h1>
                      <p className="text-base text-gray-600">{getRoleDisplayName(session.role)} Dashboard</p>
                    </div>
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="p-4">
                    <nav className="space-y-1">
                        {navigationItems[session.role].map((item: any, index: number) => (
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
                            {session.user.profile ? (
                                <img src={session.user.profile} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-sm font-semibold">{getUserAvatar()}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-black truncate">{getUserDisplayName()}</p>
                            <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
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