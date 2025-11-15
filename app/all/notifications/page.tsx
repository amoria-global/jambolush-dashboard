//all/notifications/page.tsx
"use client";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '../../api/apiService';
import notificationSound from '../../utils/notificationSound';
import browserNotifications from '../../utils/browserNotifications'; 

// Types (keep existing interfaces)
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  fromUser?: string;
  relatedEntity?: string;
}

type SortField = 'timestamp' | 'priority' | 'category' | 'type';
type SortOrder = 'asc' | 'desc';

// Loading component for Suspense fallback (keep existing)
function NotificationsLoading() {
  return (
    <div className="pt-14 bg-gray-50 min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-96 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <div className="h-6 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-lg w-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <div className="h-6 bg-gray-200 rounded w-full animate-pulse"></div>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6 border-b">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main notifications content component
function NotificationsContent() {
  const router = useRouter();
  const pathname = usePathname();

  // Date formatting helper function (keep existing)
  const format = (date: Date, formatStr: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    const dayOfWeek = d.getDay();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    
    switch(formatStr) {
      case 'MMM dd, yyyy':
        return `${months[month]} ${day.toString().padStart(2, '0')}, ${year}`;
      case 'MMM dd':
        return `${months[month]} ${day.toString().padStart(2, '0')}`;
      case 'HH:mm':
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      case 'MMM dd, HH:mm':
        return `${months[month]} ${day.toString().padStart(2, '0')}, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      default:
        return `${months[month]} ${day}, ${year}`;
    }
  };

  // Time ago helper function (keep existing)
  const timeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return format(date, 'MMM dd, yyyy');
  };

  // States
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(true);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  
  // API response states
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [readStatusFilter, setReadStatusFilter] = useState('all');
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Update URL when filters change (keep existing)
  const updateURL = (updates: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    
    const currentParams = {
      search: searchTerm,
      type: typeFilter,
      category: categoryFilter,
      priority: priorityFilter,
      status: readStatusFilter,
      sortField: sortField,
      sortOrder: sortOrder,
      ...updates
    };
    
    Object.entries(currentParams).forEach(([key, value]) => {
      if (value !== 'all' && value !== '' && !(key === 'sortField' && value === 'timestamp') && !(key === 'sortOrder' && value === 'desc')) {
        searchParams.set(key, value);
      }
    });

    const queryString = searchParams.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getNotifications({
        search: searchTerm || undefined,
        type: typeFilter !== 'all' ? typeFilter as any : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter as any : undefined,
        status: readStatusFilter !== 'all' ? readStatusFilter as any : undefined,
        sortField: sortField,
        sortOrder: sortOrder,
        page: currentPage,
        limit: itemsPerPage
      });

      if (response.data.success) {
        const data = response.data.data;
        
        // Transform timestamps to Date objects
        const transformedNotifications = data.notifications.map(notification => ({
          ...notification,
          timestamp: new Date(notification.timestamp)
        }));
        
        setNotifications(transformedNotifications);
        setTotalNotifications(data.total);
        setTotalPages(data.totalPages);
        setUnreadCount(data.stats.unreadCount);
        setUrgentCount(data.stats.urgentCount);
        setUniqueCategories(data.stats.categories);
      } else {
        throw new Error(response.data.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and refetch when filters/page changes
  useEffect(() => {
    fetchNotifications();
  }, [
    currentPage,
    searchTerm,
    typeFilter,
    categoryFilter,
    priorityFilter,
    readStatusFilter,
    sortField,
    sortOrder
  ]);

  // Update goToPageInput when currentPage changes (keep existing)
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Initialize settings
  useEffect(() => {
    setSoundEnabled(notificationSound.isSoundEnabled());
    setBrowserNotificationsEnabled(browserNotifications.isEnabled());
    setBrowserPermission(browserNotifications.getPermissionStatus());
  }, []);

  const toggleSoundEnabled = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    notificationSound.setSoundEnabled(newSoundEnabled);

    // Play test sound if enabling
    if (newSoundEnabled) {
      notificationSound.playNotificationSound('info');
    }
  };

  const toggleBrowserNotifications = async () => {
    if (!browserNotificationsEnabled && browserPermission !== 'granted') {
      const granted = await browserNotifications.requestPermission();
      if (granted) {
        setBrowserPermission('granted');
        setBrowserNotificationsEnabled(true);
        browserNotifications.setEnabled(true);
      } else {
        setBrowserPermission(browserNotifications.getPermissionStatus());
      }
    } else {
      const newEnabled = !browserNotificationsEnabled;
      setBrowserNotificationsEnabled(newEnabled);
      browserNotifications.setEnabled(newEnabled);
    }
  };

  // Handlers with URL updates
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page
    updateURL({ search: value });
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
    updateURL({ type: value });
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
    updateURL({ category: value });
  };

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value);
    setCurrentPage(1);
    updateURL({ priority: value });
  };

  const handleReadStatusFilterChange = (value: string) => {
    setReadStatusFilter(value);
    setCurrentPage(1);
    updateURL({ status: value });
  };

  const handleSort = (field: SortField) => {
    let newOrder: SortOrder;
    if (sortField === field) {
      newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      newOrder = 'asc';
    }
    setSortField(field);
    setSortOrder(newOrder);
    updateURL({ sortField: field, sortOrder: newOrder });
  };

  const handleViewDetails = async (notification: Notification) => {
    setSelectedNotification(notification);
    setShowModal(true);
    
    // Mark as read when opened
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
  try {
    await api.markNotificationAsRead(notificationId);
    
    // Update local state
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    
    // Update selected notification if it's the current one
    if (selectedNotification?.id === notificationId) {
      setSelectedNotification(prev => prev ? { ...prev, isRead: true } : null);
    }
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));

    // 🆕 Dispatch event for topbar to listen
    window.dispatchEvent(new CustomEvent('notificationRead', {
      detail: { notificationId }
    }));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

  const handleMarkAsUnread = async (notificationId: string) => {
  try {
    await api.markNotificationAsUnread(notificationId);
    
    // Update local state
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: false } : n)
    );
    
    // Update selected notification if it's the current one
    if (selectedNotification?.id === notificationId) {
      setSelectedNotification(prev => prev ? { ...prev, isRead: false } : null);
    }
    
    // Update unread count
    setUnreadCount(prev => prev + 1);

    // 🆕 Dispatch event for topbar to listen
    window.dispatchEvent(new CustomEvent('notificationUpdated', {
      detail: { action: 'marked_unread', notificationId }
    }));
  } catch (error) {
    console.error('Error marking notification as unread:', error);
  }
};

  const handleDelete = async (notificationId: string) => {
  if (confirm('Are you sure you want to delete this notification?')) {
    try {
      await api.deleteNotification(notificationId);
      
      // Check if the deleted notification was unread to update count
      const deletedNotification = notifications.find(n => n.id === notificationId);
      const wasUnread = deletedNotification && !deletedNotification.isRead;
      
      // Refresh notifications list
      fetchNotifications();
      
      // Close modal if the deleted notification was selected
      if (selectedNotification?.id === notificationId) {
        setShowModal(false);
        setSelectedNotification(null);
      }

      // 🆕 Dispatch event for topbar to listen
      window.dispatchEvent(new CustomEvent('notificationDeleted', {
        detail: { notificationId, wasUnread }
      }));
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification. Please try again.');
    }
  }
};

  const handleMarkAllAsRead = async () => {
  try {
    await api.markAllNotificationsAsRead();
    
    // Refresh notifications list
    fetchNotifications();

    // 🆕 Dispatch event for topbar to listen
    window.dispatchEvent(new CustomEvent('allNotificationsRead', {
      detail: { timestamp: new Date().toISOString() }
    }));
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    alert('Failed to mark all notifications as read. Please try again.');
  }
};

const checkForNewNotifications = async () => {
  try {
    const response = await api.getNotifications({
      limit: 1,
      sortField: 'timestamp',
      sortOrder: 'desc'
    });

    if (response.data.success && response.data.data.notifications.length > 0) {
      const latestNotification = response.data.data.notifications[0];
      const latestTimestamp = new Date(latestNotification.timestamp);
      
      // Check if this is newer than our last check
      const lastCheck = localStorage.getItem('lastNotificationCheck');
      if (!lastCheck || latestTimestamp > new Date(lastCheck)) {
        // Dispatch event for new notification
        window.dispatchEvent(new CustomEvent('newNotificationReceived', {
          detail: { 
            notification: latestNotification,
            timestamp: latestTimestamp.toISOString()
          }
        }));
        
        // Update last check timestamp
        localStorage.setItem('lastNotificationCheck', latestTimestamp.toISOString());
        
        // Refresh the current page's notifications
        fetchNotifications();
      }
    }
  } catch (error) {
    console.error('Error checking for new notifications:', error);
  }
};

useEffect(() => {
  // Check for new notifications every 30 seconds
  const pollInterval = setInterval(checkForNewNotifications, 5000);
  
  return () => clearInterval(pollInterval);
}, []);

const handleNotificationClick = async (notification: Notification) => {
  // Mark as read if not already read
  if (!notification.isRead) {
    await handleMarkAsRead(notification.id);
  }
  
  // Open notification details
  handleViewDetails(notification);
  
  // Dispatch event for analytics or other components
  window.dispatchEvent(new CustomEvent('notificationClicked', {
    detail: { 
      notificationId: notification.id,
      category: notification.category,
      type: notification.type
    }
  }));
};

  const handleGoToPage = (value: string) => {
    const page = parseInt(value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setGoToPageInput(page.toString());
    } else {
      setGoToPageInput(currentPage.toString());
    }
  };

  // Keep existing utility functions (getTypeColor, getTypeIcon, getPriorityColor)
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return 'bi-check-circle-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      case 'error': return 'bi-x-circle-fill';
      case 'info': return 'bi-info-circle-fill';
      default: return 'bi-bell-fill';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 font-bold';
      case 'high': return 'text-orange-600 font-semibold';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="pt-5 min-h-screen">
      <style jsx>{`
        .bi::before {
          font-family: 'Bootstrap Icons';
        }
      `}</style>
      
      <div className="mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#083A85]">Notifications</h1>
              <p className="text-gray-600 mt-2">Stay updated with your latest alerts and messages</p>
            </div>
            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 sm:gap-4">
              <div className="flex items-center gap-2 bg-blue-500 px-3 py-2 rounded-lg">
                <i className="bi bi-bell text-white"></i>
                <span className="text-base font-medium text-white">{unreadCount} unread</span>
              </div>
              {urgentCount > 0 && (
                <div className="flex items-center gap-2 bg-red-500 px-3 py-2 rounded-lg">
                  <i className="bi bi-exclamation-triangle text-white"></i>
                  <span className="text-base font-medium text-white">{urgentCount} urgent</span>
                </div>
              )}
              <button
                onClick={toggleSoundEnabled}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-base font-medium cursor-pointer ${
                  soundEnabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={soundEnabled ? 'Disable notification sounds' : 'Enable notification sounds'}
              >
                <i className={`bi ${soundEnabled ? 'bi-volume-up' : 'bi-volume-mute'}`}></i>
                <span className="hidden sm:inline">
                  {soundEnabled ? 'Sound On' : 'Sound Off'}
                </span>
              </button>
              <button
                onClick={toggleBrowserNotifications}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-base font-medium cursor-pointer ${
                  browserNotificationsEnabled && browserPermission === 'granted'
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : browserPermission === 'denied'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={
                  browserPermission === 'denied'
                    ? 'Browser notifications blocked'
                    : browserNotificationsEnabled
                    ? 'Disable browser notifications'
                    : 'Enable browser notifications'
                }
              >
                <i className={`bi ${
                  browserPermission === 'denied'
                    ? 'bi-bell-slash'
                    : browserNotificationsEnabled && browserPermission === 'granted'
                    ? 'bi-bell'
                    : 'bi-bell-slash'
                }`}></i>
                <span className="hidden md:inline">
                  {browserPermission === 'denied'
                    ? 'Blocked'
                    : browserNotificationsEnabled && browserPermission === 'granted'
                    ? 'Browser'
                    : 'Browser'
                  }
                </span>
              </button>
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading || unreadCount === 0}
                className="px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062a63] transition-colors text-base font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark All Read
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <i className="bi bi-exclamation-circle text-red-500 mr-2"></i>
              <p className="text-red-700">{error}</p>
              <button
                onClick={fetchNotifications}
                className="ml-auto px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-1">
              <label className="block text-base font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => handleTypeFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-base"
              >
                <option value="all">All Types</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-base"
              >
                <option value="all">All Categories</option>
                {uniqueCategories?.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => handlePriorityFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-base"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Read Status Filter */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Status</label>
              <select
                value={readStatusFilter}
                onChange={(e) => handleReadStatusFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-base"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex justify-between items-center mt-6">
            <p className="text-base text-gray-600">
              Showing {notifications.length} of {totalNotifications} notifications
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <i className="bi bi-bell-slash text-5xl sm:text-6xl text-gray-300"></i>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mt-4">No notifications found</h3>
            <p className="text-base text-gray-600 mt-2">Try adjusting your filters or search criteria</p>
          </div>
        )}

        {/* List View */}
        {!loading && notifications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      Notification
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('category')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Category
                        <i className={`bi bi-chevron-${sortField === 'category' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('priority')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Priority
                        <i className={`bi bi-chevron-${sortField === 'priority' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('timestamp')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Time
                        <i className={`bi bi-chevron-${sortField === 'timestamp' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-base font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <tr 
                      key={notification.id} 
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                      onClick={() => handleViewDetails(notification)}
                    >
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <i className={`bi ${getTypeIcon(notification.type)} text-lg ${notification.type === 'success' ? 'text-green-600' : notification.type === 'warning' ? 'text-yellow-600' : notification.type === 'error' ? 'text-red-600' : 'text-blue-600'}`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`text-base ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'} truncate`}>
                                {notification.title}
                              </h3>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-base text-gray-600 line-clamp-2">{notification.message}</p>
                            {notification.fromUser && (
                              <p className="text-base text-gray-500 mt-1">From: {notification.fromUser}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-base text-gray-900">{notification.category}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`text-base ${getPriorityColor(notification.priority)} capitalize`}>
                          {notification.priority}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900">{timeAgo(notification.timestamp)}</div>
                        <div className="text-base text-gray-500">{format(notification.timestamp, 'MMM dd, HH:mm')}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (notification.isRead) {
                                handleMarkAsUnread(notification.id);
                              } else {
                                handleMarkAsRead(notification.id);
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 cursor-pointer"
                            title={notification.isRead ? 'Mark as unread' : 'Mark as read'}
                          >
                            <i className={`bi ${notification.isRead ? 'bi-envelope' : 'bi-envelope-open'} text-lg`}></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
                            title="Delete notification"
                          >
                            <i className="bi bi-trash text-lg"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              
              <div className="hidden sm:flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-base font-medium transition-colors cursor-pointer ${
                        currentPage === pageNum
                          ? 'text-white'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      style={{
                        backgroundColor: currentPage === pageNum ? '#083A85' : undefined
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <div className="sm:hidden text-base text-gray-700">Page {currentPage} of {totalPages}</div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <span className="text-base text-gray-700">Go to page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={goToPageInput}
                onChange={(e) => setGoToPageInput(e.target.value)}
                onBlur={(e) => handleGoToPage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleGoToPage((e.target as HTMLInputElement).value);
                  }
                }}
                className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-base text-gray-700">of {totalPages}</span>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal - Keep existing modal code but update the action handlers */}
      {showModal && selectedNotification && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity" />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between z-10">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Notification Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="cursor-pointer flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-700 hover:text-white hover:bg-red-500 rounded-full transition-colors"
                >
                  <i className="bi bi-x text-xl"></i>
                </button>
              </div>

              <div className="px-4 sm:px-8 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
                <div className="space-y-6 text-base">
                  {/* Type and Priority */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className={`px-3 py-1 text-base font-semibold rounded-full ${getTypeColor(selectedNotification.type)}`}>
                      <i className={`bi ${getTypeIcon(selectedNotification.type)} mr-1`}></i>
                      {selectedNotification.type.charAt(0).toUpperCase() + selectedNotification.type.slice(1)}
                    </span>
                    <span className={`text-base font-medium ${getPriorityColor(selectedNotification.priority)} capitalize`}>
                      {selectedNotification.priority} Priority
                    </span>
                    {selectedNotification.isRead === false && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-base font-medium rounded-full">
                        Unread
                      </span>
                    )}
                  </div>

                  {/* Title and Message */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{selectedNotification.title}</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedNotification.message}</p>
                  </div>

                  {/* Details */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between"><span className="text-gray-600">Category</span><span className="font-medium text-gray-900">{selectedNotification.category}</span></div>
                    <div className="flex flex-col sm:flex-row justify-between"><span className="text-gray-600">Notification ID</span><span className="font-medium text-gray-900">{selectedNotification.id}</span></div>
                    <div className="flex flex-col sm:flex-row justify-between"><span className="text-gray-600">Received</span><span className="font-medium text-gray-900">{format(selectedNotification.timestamp, 'MMM dd, yyyy')} at {format(selectedNotification.timestamp, 'HH:mm')}</span></div>
                    {selectedNotification.fromUser && (<div className="flex flex-col sm:flex-row justify-between"><span className="text-gray-600">From</span><span className="font-medium text-gray-900">{selectedNotification.fromUser}</span></div>)}
                    {selectedNotification.relatedEntity && (<div className="flex flex-col sm:flex-row justify-between"><span className="text-gray-600">Related to</span><span className="font-medium text-gray-900">{selectedNotification.relatedEntity}</span></div>)}
                  </div>

                  {/* Action URL */}
                  {selectedNotification.actionUrl && (
                    <div>
                      <button 
                        onClick={() => router.push(selectedNotification.actionUrl!)}
                        className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        <i className="bi bi-arrow-right-circle mr-2"></i>
                        View Related Item
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-8 py-3 sm:py-4 flex flex-wrap justify-end gap-3 z-10">
                <button
                  onClick={() => {
                    if (selectedNotification.isRead) {
                      handleMarkAsUnread(selectedNotification.id);
                    } else {
                      handleMarkAsRead(selectedNotification.id);
                    }
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium cursor-pointer text-base"
                >
                  <i className={`bi ${selectedNotification.isRead ? 'bi-envelope' : 'bi-envelope-open'} sm:mr-2`}></i>
                  <span className="hidden sm:inline">{selectedNotification.isRead ? 'Mark Unread' : 'Mark Read'}</span>
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedNotification.id);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer text-base"
                >
                  <i className="bi bi-trash sm:mr-2"></i><span className="hidden sm:inline">Delete</span>
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-white rounded-lg transition-colors font-medium cursor-pointer text-base"
                  style={{ backgroundColor: '#083A85' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main component with proper Suspense wrapper
const NotificationsPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Notifications - Jambolush';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Stay updated with your latest alerts, messages, and notifications');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Stay updated with your latest alerts, messages, and notifications';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <Suspense fallback={<NotificationsLoading />}>
      <NotificationsContent />
    </Suspense>
  );
};

export default NotificationsPage;