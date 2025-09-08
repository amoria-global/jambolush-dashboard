"use client";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Types
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

// Loading component for Suspense fallback
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

  // Date formatting helper function
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

  // Time ago helper function
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
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  
  // Filter states initialized with default values
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [readStatusFilter, setReadStatusFilter] = useState('all');
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Update URL when filters change
  const updateURL = (updates: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    
    // Get current values
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

  // Generate mock data
  useEffect(() => {
    const generateMockNotifications = (): Notification[] => {
      const types: ('info' | 'warning' | 'error' | 'success')[] = ['info', 'warning', 'error', 'success'];
      const priorities: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'high', 'urgent'];
      const categories = ['Booking', 'Payment', 'System', 'Security', 'Property', 'Guest Communication'];
      const users = ['Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown', 'Emma Davis'];
      
      const notificationTemplates = [
        { title: 'New booking received', message: 'You have received a new booking for Ocean View Villa', type: 'success', category: 'Booking' },
        { title: 'Payment reminder', message: 'Payment is due for booking #BK00123', type: 'warning', category: 'Payment' },
        { title: 'System maintenance', message: 'Scheduled maintenance will occur tonight from 2-4 AM', type: 'info', category: 'System' },
        { title: 'Security alert', message: 'Multiple failed login attempts detected', type: 'error', category: 'Security' },
        { title: 'Property update required', message: 'Please update your property availability calendar', type: 'info', category: 'Property' },
        { title: 'Guest message', message: 'You have a new message from your guest', type: 'info', category: 'Guest Communication' },
        { title: 'Booking cancelled', message: 'A booking has been cancelled by the guest', type: 'warning', category: 'Booking' },
        { title: 'Payment received', message: 'Payment successfully processed for booking #BK00156', type: 'success', category: 'Payment' },
        { title: 'Review received', message: 'You have received a new 5-star review!', type: 'success', category: 'Property' },
        { title: 'Account verification', message: 'Please verify your account to continue using our services', type: 'warning', category: 'Security' }
      ];
      
      return Array.from({ length: 42 }, (_, i) => {
        const template = notificationTemplates[i % notificationTemplates.length];
        const hoursAgo = Math.floor(Math.random() * 720); // Up to 30 days ago
        const timestamp = new Date();
        timestamp.setHours(timestamp.getHours() - hoursAgo);
        
        return {
          id: `NOT${String(i + 1).padStart(5, '0')}`,
          title: template.title,
          message: template.message,
          type: template.type as any,
          category: template.category,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          timestamp,
          isRead: Math.random() > 0.4, // 60% read, 40% unread
          fromUser: Math.random() > 0.5 ? users[Math.floor(Math.random() * users.length)] : undefined,
          relatedEntity: Math.random() > 0.5 ? `BK${String(Math.floor(Math.random() * 999) + 1).padStart(5, '0')}` : undefined,
          actionUrl: Math.random() > 0.7 ? '/bookings' : undefined
        };
      });
    };

    setTimeout(() => {
      setNotifications(generateMockNotifications());
      setLoading(false);
    }, 1000);
  }, []);

  // Update goToPageInput when currentPage changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...notifications];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(notification => notification.type === typeFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(notification => notification.category === categoryFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(notification => notification.priority === priorityFilter);
    }

    // Read status filter
    if (readStatusFilter !== 'all') {
      const isRead = readStatusFilter === 'read';
      filtered = filtered.filter(notification => notification.isRead === isRead);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'priority':
          const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'urgent': 4 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredNotifications(filtered);
    setCurrentPage(1);
  }, [notifications, searchTerm, typeFilter, categoryFilter, priorityFilter, readStatusFilter, sortField, sortOrder]);

  // Pagination
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredNotifications.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNotifications, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => {
    return [...new Set(notifications.map(n => n.category))];
  }, [notifications]);

  // Stats
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent').length;

  // Handlers with URL updates
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    updateURL({ search: value });
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    updateURL({ type: value });
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    updateURL({ category: value });
  };

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value);
    updateURL({ priority: value });
  };

  const handleReadStatusFilterChange = (value: string) => {
    setReadStatusFilter(value);
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

  const handleViewDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowModal(true);
    // Mark as read when opened
    handleMarkAsRead(notification.id);
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAsUnread = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: false } : n)
    );
  };

  const handleDelete = (notificationId: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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
    <div className="pt-14 bg-gray-50 min-h-screen">
      <style jsx>{`
        .bi::before {
          font-family: 'Bootstrap Icons';
        }
      `}</style>
      
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#083A85]">Notifications</h1>
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
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062a63] transition-colors text-base font-medium cursor-pointer"
              >
                Mark All Read
              </button>
            </div>
          </div>
        </div>

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
                {uniqueCategories.map(category => (
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
              Showing {paginatedNotifications.length} of {filteredNotifications.length} notifications
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
        {!loading && filteredNotifications.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <i className="bi bi-bell-slash text-5xl sm:text-6xl text-gray-300"></i>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mt-4">No notifications found</h3>
            <p className="text-base text-gray-600 mt-2">Try adjusting your filters or search criteria</p>
          </div>
        )}

        {/* List View */}
        {!loading && filteredNotifications.length > 0 && (
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
                  {paginatedNotifications.map((notification) => (
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

      {/* Detail Modal */}
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
                      <button className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
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
                      setSelectedNotification({...selectedNotification, isRead: false});
                    } else {
                      handleMarkAsRead(selectedNotification.id);
                      setSelectedNotification({...selectedNotification, isRead: true});
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
                    setShowModal(false);
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
  return (
    <Suspense fallback={<NotificationsLoading />}>
      <NotificationsContent />
    </Suspense>
  );
};

export default NotificationsPage;