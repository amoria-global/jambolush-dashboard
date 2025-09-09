"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import api from "../api/apiService"; // Assuming you have a configured api service

// UPDATED: 'field_agent' has been removed and merged into 'agent'
type UserRole = 'guest' | 'host' | 'agent' | 'tourguide';

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
  assessmentStatus?: 'none' | 'incomplete' | 'complete';
}

interface UserSession {
  user: UserProfile;
  token: string;
  role: UserRole;
}

interface Notification {
  id: number;
  icon: string;
  text: string;
  time: string;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface TopBarProps {
  onMenuButtonClick: () => void;
}

export default function TopBar({ onMenuButtonClick }: TopBarProps) {
  // Authentication state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // UI state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showAssessmentBadge, setShowAssessmentBadge] = useState(false);

  // Data state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [messagesCount, setMessagesCount] = useState<number>(0);

  // URL parameters state
  const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null);

  // Refs for dropdown detection
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Router for navigation
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
  
  // Function to check assessment status for agents
  const checkAssessmentStatus = async () => {
    try {
      const response = await api.get('/api/assessment/status');
      const status = response.data.status;

      if (status === 'none' || status === 'incomplete') {
        console.log('Assessment not completed, redirecting...');
        router.push('/all/assessment');
        return false; // Indicates a redirect is happening
      } else if (status === 'complete') {
        setShowAssessmentBadge(true);
      }
    } catch (error) {
      console.error('Failed to fetch assessment status:', error);
    }
    return true; // Indicates user can proceed
  };

  // Function to fetch user session from API
  const fetchUserSession = async () => {
    try {
      setIsLoading(true);
      
      const urlToken = getUrlToken();
      let authToken: string | null = null;

      if (urlToken) {
        authToken = urlToken;
        localStorage.setItem('authToken', urlToken);
        cleanUrlParams();
      } else {
        authToken = localStorage.getItem('authToken');
      }

      if (!authToken) {
        handleLogout();
        return;
      }

      api.setAuth(authToken);
      const response = await api.get('/api/auth/me');

      if (response.data) {
        const userData: UserProfile = response.data;
        
        // UPDATED: 'field_agent' removed from valid roles
        const validRoles: UserRole[] = ['guest', 'host', 'agent', 'tourguide'];
        if (!validRoles.includes(userData.userType)) {
          console.error('Invalid user role:', userData.userType);
          handleLogout();
          return;
        }

        // UPDATED: Role-specific logic now applies to 'agent'
        if (userData.userType === 'agent') {
          const canProceed = await checkAssessmentStatus();
          if (!canProceed) {
            return; // Stop execution if redirecting
          }
        }
        
        const session: UserSession = {
          user: userData,
          token: authToken,
          role: userData.userType
        };

        setUserSession(session);
        setUser(userData);
        setIsAuthenticated(true);

        await fetchUserData(authToken);

      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Failed to fetch user session:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch additional user data (notifications, balance, etc.)
  const fetchUserData = async (authToken: string) => {
    try {
      const notificationsResponse = await api.get('user/notifications');
      if (notificationsResponse.data) {
        setNotifications(notificationsResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setNotifications([
        { id: 1, icon: "bi-person-plus-fill", text: "Welcome to your dashboard!", time: "Just now", read: false, type: 'info' },
        { id: 2, icon: "bi-bell-fill", text: "Please complete your profile", time: "5 min ago", read: false, type: 'warning' }
      ]);
    }

    try {
      // This logic correctly includes 'agent' already
      if (userSession?.role === 'host' || userSession?.role === 'agent') {
        const balanceResponse = await api.get('user/balance');
        if (balanceResponse.data && balanceResponse.data.balance !== undefined) {
          setBalance(balanceResponse.data.balance);
        }
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance(0);
    }

    try {
      const messagesResponse = await api.get('user/messages/unread-count');
      if (messagesResponse.data && messagesResponse.data.count !== undefined) {
        setMessagesCount(messagesResponse.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch messages count:', error);
      setMessagesCount(0);
    }
  };

  // Function to handle logout
  const handleLogout = async () => {
    try {
      if (isAuthenticated) {
        await api.post('auth/logout');
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('userSession');
    setUser(null);
    setUserSession(null);
    setIsAuthenticated(false);
    setNotifications([]);
    setBalance(0);
    setMessagesCount(0);
    
    window.location.href = 'https://jambolush.com/all/login?redirect=' + encodeURIComponent(window.location.href);
  };

  useEffect(() => {
    if (urlParams !== null) {
      fetchUserSession();
    }
  }, [urlParams]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' && !e.newValue && isAuthenticated) {
        handleLogout();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [isAuthenticated]);

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
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`.trim();
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

  // UPDATED: 'Field Agent' display name removed
  const getRoleDisplayName = (role: UserRole): string => {
    const roleNames: Record<UserRole, string> = {
      guest: 'Guest',
      host: 'Host',
      agent: 'Agent',
      tourguide: 'Tour Guide'
    };
    return roleNames[role] || 'Guest';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await api.patch(`user/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed top-0 right-0 left-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-400 shadow-lg z-30 transition-all duration-300 lg:left-72">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuButtonClick}
            className="lg:hidden p-2 text-gray-600 rounded-md hover:text-[#083A85] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <i className="bi bi-list text-2xl"></i>
          </button>
          <h1 className="text-xl font-bold text-gray-900 tracking-wide sm:text-2xl">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
          <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !userSession) {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 left-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-400 shadow-lg z-30 transition-all duration-300 lg:left-72">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuButtonClick}
          className="lg:hidden p-2 text-gray-600 rounded-md hover:text-[#083A85] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        >
          <i className="bi bi-list text-2xl"></i>
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 tracking-wide sm:text-2xl">
            Dashboard
          </h1>
          {/* Assessment badge will now show for agents */}
          {showAssessmentBadge && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              ✅ Assessment completed
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-x-4 sm:gap-x-6">
        <div className="relative cursor-pointer hidden sm:block">
          <i className="bi bi-chat-left-text text-2xl text-black-200 hover:text-[#083A85]"></i>
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
            <i className="bi bi-bell text-2xl text-black-600 hover:text-[#083A85]"></i>
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
            <div className="absolute -left-41 mt-4 w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-3 bg-gray-50 border-b">
                <h6 className="font-semibold text-gray-800">Notifications</h6>
              </div>
              <div className="divide-y divide-gray-300 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <i className="bi bi-bell-slash text-2xl mb-2"></i>
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`flex items-start gap-3 p-3 transition-colors hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50/50' : ''}`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${
                        !notification.read ? 'bg-blue-500/20 text-blue-600' : 'bg-gray-200 text-gray-600'
                      }`}>
                        <i className={`bi ${notification.icon} text-lg`}></i>
                      </div>
                      <div className="flex-grow">
                        <p className="text-base text-black-700">{notification.text}</p>
                        <p className="text-sm text-gray-700 mt-1">{notification.time}</p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <a 
                  href="/all/notifications" 
                  className="block text-center p-2 text-base font-medium text-blue-600 hover:bg-gray-100 transition-colors"
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
                  : getRoleDisplayName(userSession.role)
                }
              </span>
            </div>

            <i className={`bi bi-chevron-down text-gray-500 transition-transform duration-200 ${
              isProfileOpen ? 'rotate-180' : ''
            }`}></i>
          </div>

          {isProfileOpen && (
            <div className="absolute -right-3 mt-4 w-52 sm:w-56 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-3 border-b">
                <p className="font-bold text-gray-800">{getUserDisplayName()}</p>
                <p className="text-sm text-gray-700">{getRoleDisplayName(userSession.role)} Account</p>
                <p className="text-xs text-gray-500 mt-1">{user.email}</p>
              </div>
              <div className="py-2">
                <a 
                  href="/all/profile" 
                  className="flex items-center gap-3 px-4 py-2 text-base text-black hover:bg-gray-100 transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <i className="bi bi-person-circle w-5 text-black"></i>
                  <span>Profile</span>
                </a>
                {/* Balance link correctly shows for agents */}
                {(userSession.role === 'host' || userSession.role === 'agent') && (
                  <a 
                    href="/all/earnings" 
                    className="flex items-center gap-3 px-4 py-2 text-base text-black hover:bg-gray-100 transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <i className="bi bi-wallet2 w-5 text-black"></i>
                    <span>Balance & Payments</span>
                  </a>
                )}
                <a 
                  href="/all/settings" 
                  className="flex items-center gap-3 px-4 py-2 text-base text-black hover:bg-gray-100 transition-colors"
                  onClick={() => setIsProfileOpen(false)}
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
      </div>
    </div>
  );
}