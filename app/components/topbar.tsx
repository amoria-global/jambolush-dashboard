//app/components/topbar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import api from "../api/apiService";

type UserRole = 'guest' | 'host' | 'agent' | 'tourguide';
type TourGuideType = 'freelancer' | 'employed';

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

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date | string;
  isRead: boolean;
  actionUrl?: string;
  fromUser?: string;
  relatedEntity?: string;
}

interface TopBarProps {
  onMenuButtonClick: () => void;
}

export default function TopBar({ onMenuButtonClick }: TopBarProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [messagesCount, setMessagesCount] = useState<number>(0);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const [frontend_url, setFrontEnd] = useState<string>('https://jambolush.com');

  // Expose test function for debugging (remove in production)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testLogout = () => {
        console.log('🧪 Testing logout function...');
        handleLogout();
      };
      
      (window as any).test401 = () => {
        console.log('🧪 Testing 401 detection...');
        const fakeError = { response: { status: 401 } };
        handleApiCall(() => Promise.reject(fakeError)).catch(() => {});
      };
    }
  }, []);

  useEffect(() => { 
    if (process.env.FRONTEND_URL) {
      setFrontEnd(process.env.FRONTEND_URL);
    }
  }, []);

  // Add global error handler as backup
  useEffect(() => {
    const handleGlobalError = (event: any) => {
      const error = event.detail || event.error || event;
      console.log('Global error caught:', error);
      
      if (error?.response?.status === 401 || error?.status === 401) {
        console.log('🚨 Global 401 error detected - redirecting to login');
        handleLogout();
      }
    };

    // Listen for unhandled promise rejections that might contain 401s
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      console.log('Unhandled rejection:', error);
      
      if (error?.response?.status === 401 || error?.status === 401) {
        console.log('🚨 Unhandled 401 rejection detected - redirecting to login');
        handleLogout();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  // Add 401 error handling to API calls
  const handleApiCall = async <T,>(apiCall: () => Promise<T>): Promise<T> => {
    try {
      return await apiCall();
    } catch (error: any) {
      console.log('API Error caught:', error);
      console.log('Error response:', error?.response);
      console.log('Error status:', error?.response?.status);
      console.log('Direct error status:', error?.status);
      
      // Check multiple possible error structures
      const isUnauthorized = 
        error?.response?.status === 401 ||
        error?.status === 401 ||
        error?.response?.statusCode === 401 ||
        error?.statusCode === 401 ||
        (error?.message && error.message.includes('401')) ||
        (error?.response?.data && error.response.data.statusCode === 401);
      
      if (isUnauthorized) {
        console.log('🚨 401 Unauthorized detected - redirecting to login');
        handleLogout();
        return Promise.reject(error); // Don't continue processing
      }
      throw error;
    }
  };

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

      // Set auth token in the API service
      api.setAuth(authToken);
      
      // Call the /auth/me endpoint with 401 handling
      console.log('📡 Calling /auth/me endpoint...');
      const response = await handleApiCall(() => api.get('auth/me'));
      
      console.log('=== TOPBAR DEBUG: API Response ===', response);

      // FIXED: Check the actual API response structure from your logs
      if (response.data && response.data.id) {
        const userData: UserProfile = {
          ...response.data,
          id: response.data.id.toString()
        };
        
        console.log('=== TOPBAR DEBUG: User Data ===', userData);
        
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
        const session: UserSession = {
          user: userData,
          token: authToken,
          role: userData.userType
        };

        setUserSession(session);
        setUser(userData);
        setIsAuthenticated(true);
        await fetchUserData(authToken);
        console.log('✅ TopBar User session established successfully');

      } else {
        console.log('Invalid response structure:', response.data);
        setIsAuthenticated(false);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch user session:', error);
      console.log('Error details:', {
        status: error?.response?.status || error?.status,
        statusCode: error?.response?.statusCode || error?.statusCode,
        message: error?.message
      });
      
      // Check if this is a 401 error that wasn't caught by handleApiCall
      const isUnauthorized = 
        error?.response?.status === 401 ||
        error?.status === 401 ||
        error?.response?.statusCode === 401 ||
        error?.statusCode === 401;
        
      if (isUnauthorized) {
        console.log('🚨 401 detected in fetchUserSession catch block');
        handleLogout();
        return;
      }
      
      // Don't logout on network errors, just show unauthenticated state
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserData = async (authToken: string) => {
    try {
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }

    try {
      if (userSession?.role === 'host' || userSession?.role === 'agent') {
        const balanceResponse = await handleApiCall(() => api.get('user/balance'));
        if (balanceResponse.data && balanceResponse.data.balance !== undefined) {
          setBalance(balanceResponse.data.balance);
        }
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance(0);
    }

    try {
      const messagesResponse = await handleApiCall(() => api.get('user/messages/unread-count'));
      if (messagesResponse.data && messagesResponse.data.count !== undefined) {
        setMessagesCount(messagesResponse.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch messages count:', error);
      setMessagesCount(0);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      
      const response = await handleApiCall(() => api.get('/notifications', { params: {
        limit: 10,
        sortField: 'timestamp',
        sortOrder: 'desc'
      }}));

      if (response.data && response.data.data) {
        const transformedNotifications = response.data.data.map((notification: any) => ({
          ...notification,
          timestamp: new Date(notification.timestamp)
        }));
        setNotifications(transformedNotifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await handleApiCall(() => api.markNotificationAsRead(notificationId));
      
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleNotificationUpdate = () => {
      console.log('TopBar: Notification updated, refreshing notifications');
      fetchNotifications();
    };

    const handleNotificationRead = (event: CustomEvent) => {
      const { notificationId } = event.detail;
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    };

    const handleNotificationDeleted = (event: CustomEvent) => {
      const { notificationId } = event.detail;
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    window.addEventListener('notificationUpdated', handleNotificationUpdate as EventListener);
    window.addEventListener('notificationRead', handleNotificationRead as EventListener);
    window.addEventListener('notificationDeleted', handleNotificationDeleted as EventListener);
    window.addEventListener('allNotificationsRead', handleNotificationUpdate as EventListener);

    return () => {
      window.removeEventListener('notificationUpdated', handleNotificationUpdate as EventListener);
      window.removeEventListener('notificationRead', handleNotificationRead as EventListener);
      window.removeEventListener('notificationDeleted', handleNotificationDeleted as EventListener);
      window.removeEventListener('allNotificationsRead', handleNotificationUpdate as EventListener);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'bi-check-circle-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      case 'error': return 'bi-x-circle-fill';
      case 'info': return 'bi-info-circle-fill';
      default: return 'bi-bell-fill';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const timeAgo = (date: Date | string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[notificationDate.getMonth()]} ${notificationDate.getDate()}`;
  };

  const handleLogout = async () => {
    console.log('🔄 Starting logout process...');
    
    try {
      setIsRedirecting(true);
      if (isAuthenticated) {
        console.log('📡 Calling logout API...');
        await api.logout();
        console.log('✅ Logout API call successful');
      }
    } catch (error) {
      console.error('❌ Logout API call failed:', error);
      // Continue with local cleanup even if API fails
    }

    console.log('🧹 Cleaning up local storage and state...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userSession');
    setUser(null);
    setUserSession(null);
    setIsAuthenticated(false);
    setNotifications([]);
    setBalance(0);
    setMessagesCount(0);
    setAuthInitialized(false);
    
    const redirectUrl = frontend_url + `/all/login?redirect=` + encodeURIComponent(window.location.href);
    console.log('🚀 Redirecting to:', redirectUrl);
    
    // Immediate redirect without setTimeout
    window.location.href = redirectUrl;
  };

  // Initialize authentication on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchUserSession();
    }
  }, []);

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
    const handleProfileUpdate = (event: CustomEvent) => {
      if (user && event.detail.user) {
        console.log('TopBar: Profile updated, refreshing user data');
        
        const updatedUser = {
          ...user,
          ...event.detail.user,
          name: event.detail.user.name || `${event.detail.user.firstName || ''} ${event.detail.user.lastName || ''}`.trim(),
          profile: event.detail.user.profile,
          tourGuideType: event.detail.user.tourGuideType || user.tourGuideType
        };
        
        setUser(updatedUser);
        
        if (userSession) {
          setUserSession({ ...userSession, user: updatedUser });
        }
        
        if (updatedUser.userType !== user.userType) {
          const authToken = localStorage.getItem('authToken');
          if (authToken) {
            fetchUserData(authToken);
          }
        }
      }
    };

    const handleProfileImageUpdate = (event: CustomEvent) => {
      if (user && event.detail.profile) {
        console.log('TopBar: Profile image updated');
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (user.name) return user.name;
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };
  
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

  // Get current page title
  const getPageTitle = () => {
    if (isLoading || isRedirecting) return isRedirecting ? 'Redirecting...' : 'Loading...';
    if (!isAuthenticated) return 'Welcome to Jambolush';
    return 'Dashboard';
  };

  return (
    <div className="fixed top-0 right-0 left-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-lg z-30 transition-all duration-300 lg:left-72">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuButtonClick}
          className="lg:hidden p-2 text-gray-600 rounded-md hover:text-[#083A85] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        >
          <i className="bi bi-list text-2xl"></i>
        </button>
        <h1 className="text-xl font-bold text-gray-900 tracking-wide sm:text-2xl">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-x-4 sm:gap-x-6">
        {/* Show loading state */}
        {(isLoading || isRedirecting) && (
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
            <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
          </div>
        )}

        {/* Show authenticated user features only if logged in */}
        {!isLoading && !isRedirecting && isAuthenticated && user && userSession ? (
          <>
            {/* KYC Notice in TopBar */}
            {user && !user.kycCompleted && (user.userType === 'host' || user.userType === 'agent' || user.userType === 'tourguide') && (
              <div className="hidden md:flex items-center bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full text-sm">
                <i className="bi bi-exclamation-triangle mr-1"></i>
                <span>Complete KYC</span>
                <button
                  onClick={() => router.push('/all/kyc')}
                  className="ml-2 text-yellow-700 hover:text-yellow-900 underline"
                >
                  →
                </button>
              </div>
            )}

            <div className="relative cursor-pointer hidden sm:block">
              <i className="bi bi-chat-left-text text-2xl text-gray-600 hover:text-[#083A85]"></i>
              {messagesCount > 0 && (
                <span className="absolute -top-2 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white rounded-full bg-red-500">
                  {messagesCount > 99 ? '99+' : messagesCount}
                </span>
              )}
            </div>

            <div className="relative" ref={notificationsRef}>
              <div 
                className="relative cursor-pointer" 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileOpen(false);
                }}
              >
                <i className="bi bi-bell text-2xl text-gray-600 hover:text-[#083A85]"></i>
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-2 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white rounded-full"
                    style={{ backgroundColor: "#F20C8F" }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-4 w-72 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
                    <h6 className="font-semibold text-gray-800">Notifications</h6>
                    {notificationsLoading && (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                  <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <i className="bi bi-bell-slash text-2xl mb-2"></i>
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`flex items-start gap-3 p-3 transition-colors hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
                          onClick={() => {
                            markNotificationAsRead(notification.id);
                            if (notification.actionUrl) {
                              router.push(notification.actionUrl);
                            }
                          }}
                        >
                          <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${
                            !notification.isRead ? 'bg-blue-500/20' : 'bg-gray-200'
                          }`}>
                            <i className={`bi ${getNotificationIcon(notification.type)} text-lg ${
                              !notification.isRead ? getNotificationColor(notification.type) : 'text-gray-600'
                            }`}></i>
                          </div>
                          <div className="flex-grow">
                            <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-500">{timeAgo(notification.timestamp)}</p>
                              {notification.priority === 'urgent' && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                  Urgent
                                </span>
                              )}
                            </div>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <a 
                      href="/all/notifications" 
                      className="block text-center p-2 text-sm font-medium text-blue-600 hover:bg-gray-100 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        router.push('/all/notifications');
                        setIsNotificationsOpen(false);
                      }}
                    >
                      View All Notifications
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <div 
                className="flex items-center gap-3 cursor-pointer" 
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                }}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#083A85] to-[#F20C8F] border-2 border-gray-300">
                  {user.profile ? (
                    <img
                      src={user.profile}
                      alt="Profile"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">{getUserAvatar()}</span>
                  )}
                </div>

                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="font-semibold" style={{ color: "#083A85" }}>
                    {getUserDisplayName()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {userSession.role === 'host' || userSession.role === 'agent' 
                      ? `$${balance.toFixed(2)}` 
                      : getRoleDisplayName(userSession.role, user.tourGuideType)
                    }
                  </span>
                </div>

                <i className={`bi bi-chevron-down text-gray-500 transition-transform duration-200 ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}></i>
              </div>

              {isProfileOpen && (
                <div className="absolute right-0 mt-4 w-52 sm:w-56 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-3 border-b">
                    <p className="font-bold text-gray-800">{getUserDisplayName()}</p>
                    <p className="text-sm text-gray-700">
                      {getRoleDisplayName(userSession.role, user.tourGuideType)} Account
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                  </div>
                  <div className="py-2">
                    <a 
                      href="/all/profile" 
                      className="flex items-center gap-3 px-4 py-2 text-base text-black hover:bg-gray-100 transition-colors"
                      onClick={(e) => { e.preventDefault(); router.push('/all/profile'); setIsProfileOpen(false); }}
                    >
                      <i className="bi bi-person-circle w-5 text-black"></i>
                      <span>Profile</span>
                    </a>
                    {(userSession.role === 'host' || userSession.role === 'agent') && (
                      <a 
                        href={`/all/${userSession.role}/earnings`}
                        className="flex items-center gap-3 px-4 py-2 text-base text-black hover:bg-gray-100 transition-colors"
                        onClick={(e) => { e.preventDefault(); router.push('/all/earnings'); setIsProfileOpen(false); }}
                      >
                        <i className="bi bi-wallet2 w-5 text-black"></i>
                        <span>Balance & Payments</span>
                      </a>
                    )}
                    <a 
                      href="/all/settings" 
                      className="flex items-center gap-3 px-4 py-2 text-base text-black hover:bg-gray-100 transition-colors"
                      onClick={(e) => { e.preventDefault(); router.push('/all/settings'); setIsProfileOpen(false); }}
                    >
                      <i className="bi bi-gear w-5 text-black"></i>
                      <span>Settings</span>
                    </a>
                  </div>
                  <div className="border-t p-2">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-base text-red-600 hover:bg-red-50 rounded-md transition-colors w-full text-left"
                    >
                      <i className="bi bi-box-arrow-right w-5"></i>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Show basic actions for unauthenticated users */
          !isLoading && !isRedirecting && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(frontend_url + `/all/login?redirect=` + encodeURIComponent(window.location.href))}
                className="px-4 py-2 text-sm font-medium text-[#083A85] hover:text-[#062a63] transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push(frontend_url + `/all/signup`)}
                className="px-4 py-2 text-sm font-medium bg-[#083A85] text-white rounded-lg hover:bg-[#062a63] transition-colors"
              >
                Sign Up
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}