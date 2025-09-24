// apiService.ts - Enhanced Frontend API service with automatic token refresh
import authService from './authService';

export interface APIConfig {
  method?: string;
  headers?: Record<string, any>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
  skipTokenRefresh?: boolean; // Flag to prevent infinite refresh loops
}

export interface APIResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
  message: string;
}

// Backend response wrapper
export interface BackendResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

// Token refresh response
interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

// Auth tokens interface
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
}

// Property interfaces (keeping existing interfaces...)
export interface Property {
  id: number;
  name: string;
  location: string;
  category: string;
  pricePerNight: number;
  image: string;
  rating: number;
  reviewsCount: number;
  beds: number;
  baths: number;
  hostName: string;
  availability: string;
  type?: string;
}

// Detailed property info
export interface PropertyInfo {
  id: number;
  name: string;
  location: string;
  type: string;
  category: string;
  pricePerNight: number;
  pricePerTwoNights?: number;
  beds: number;
  baths: number;
  maxGuests: number;
  features: string[];
  description?: string;
  images: PropertyImages;
  video3D?: string;
  rating: number;
  reviewsCount: number;
  hostId: number;
  hostName: string;
  hostProfileImage?: string;
  status: string;
  availability: PropertyAvailability;
  createdAt: string;
  updatedAt: string;
  totalBookings: number;
  isVerified: boolean;
}

// Property images structure
export interface PropertyImages {
  livingRoom: string[];
  kitchen: string[];
  diningArea: string[];
  bedroom: string[];
  bathroom: string[];
  workspace: string[];
  balcony: string[];
  laundryArea: string[];
  gym: string[];
  exterior: string[];
  childrenPlayroom: string[];
}

// Property availability
export interface PropertyAvailability {
  isAvailable: boolean;
  availableFrom?: string;
  availableTo?: string;
  blockedDates: string[];
  minStay: number;
  maxStay?: number;
}

// Property search filters
export interface PropertyFilters {
  location?: string;
  type?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  maxGuests?: number;
  features?: string[];
  availableFrom?: string;
  availableTo?: string;
  status?: string;
  hostId?: number;
  search?: string;
  keyword?: string;
  sortBy?: 'price' | 'rating' | 'created_at' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Properties response structure
export interface PropertiesResponse {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Booking interfaces
export interface BookingData {
  propertyId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice?: number;
  paymentTiming: 'now' | 'later';
  paymentMethod?: 'card' | 'momo' | 'airtel' | 'mpesa' | 'property';
  message?: string;
  cardDetails?: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  };
  mobileDetails?: {
    phoneNumber: string;
  };
}

export interface BookingInfo {
  id: string;
  propertyId: number;
  propertyName: string;
  propertyImage: string;
  propertyLocation: string;
  guestId: number;
  guestName: string;
  guestEmail: string;
  hostId: number;
  hostName: string;
  hostEmail: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  pricePerNight: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  totalPrice: number;
  status: string;
  paymentMethod?: string;
  paymentTiming: string;
  message?: string;
  cancellationReason?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
  confirmationCode: string;
}

export interface BookingValidation {
  isAvailable: boolean;
  conflicts: any[];
  priceBreakdown: {
    basePrice: number;
    nights: number;
    subtotal: number;
    cleaningFee: number;
    serviceFee: number;
    taxes: number;
    total: number;
    currency: string;
  };
  maxGuests: number;
  minStay: number;
  maxStay?: number;
  cancellationPolicy: string;
}

// User interfaces
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
}

export interface Notification {
  id: string;
  userId: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date | string;
  isRead: boolean;
  actionUrl?: string;
  fromUser?: string;
  relatedEntity?: string;
  metadata?: any;
  expiresAt?: Date | string;
}

export interface NotificationFilters {
  search?: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'all';
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | 'all';
  status?: 'read' | 'unread' | 'all';
  sortField?: 'timestamp' | 'priority' | 'category' | 'type';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    unreadCount: number;
    urgentCount: number;
    categories: string[];
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  byType: {
    info: number;
    success: number;
    warning: number;
    error: number;
  };
  byCategory: Record<string, number>;
  categories: string[];
}

// ============ HELP & SUPPORT INTERFACES ============

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful: number;
  lastUpdated: Date | string;
  priority: 'high' | 'medium' | 'low';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  readTime: number;
  views: number;
  lastUpdated: Date | string;
  isPublished: boolean;
  author?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  userId: number;
  assignedTo?: number;
  responses?: TicketResponse[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  message: string;
  isFromSupport: boolean;
  createdAt: Date | string;
  createdBy: number;
}

export interface HelpFilters {
  search?: string;
  category?: string;
  priority?: string;
  status?: string;
  sortBy?: 'relevance' | 'date' | 'popularity' | 'category';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface HelpResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  categories: string[];
}


class FrontendAPIService {
  private baseURL: string;
  private defaultHeaders: Record<string, string> = {
    'Accept': 'application/json'
  };
  private isLoggingOut: boolean = false;
  private tokenRefreshPromise: Promise<void> | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL || 'http://localhost:5000/api';
    
    // Set up auth service integration
    this.setupAuthIntegration();
  }

  private setupAuthIntegration() {
    // Listen for auth events and update headers
    authService.on('login', (session) => {
      if (session?.tokens?.accessToken) {
        this.setAuth(session.tokens.accessToken, session.tokens.refreshToken);
      }
    });

    authService.on('logout', () => {
      this.clearAuth();
    });

    authService.on('token_refreshed', (tokens) => {
      if (tokens?.accessToken) {
        this.setAuth(tokens.accessToken, tokens.refreshToken);
      }
    });

    // Initialize with existing session if available
    const session = authService.getSession();
    if (session?.tokens?.accessToken) {
      this.setAuth(session.tokens.accessToken, session.tokens.refreshToken);
    }
  }

  setAuth(accessToken: string, refreshToken?: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  clearAuth(): void {
    delete this.defaultHeaders['Authorization'];
    this.isLoggingOut = false;
    this.tokenRefreshPromise = null;
  }

  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const baseURL = this.baseURL.endsWith('/') ? this.baseURL : this.baseURL + '/';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    const url = new URL(cleanEndpoint, baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value != null) url.searchParams.set(key, String(value));
      });
    }
    return url.toString();
  }

  private prepareBody(body: any): any {
    if (!body) return null;
    
    if (body instanceof FormData || body instanceof File || body instanceof Blob || 
        body instanceof ArrayBuffer || body instanceof URLSearchParams || 
        typeof body === 'string') {
      return body;
    }

    if (this.hasFiles(body)) {
      const formData = new FormData();
      this.buildFormData(formData, body);
      return formData;
    }

    return JSON.stringify(body);
  }

  private hasFiles(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    
    const checkValue = (val: any): boolean => {
      if (val instanceof File || val instanceof Blob) return true;
      if (Array.isArray(val)) return val.some(checkValue);
      if (val && typeof val === 'object') return Object.values(val).some(checkValue);
      return false;
    };
    
    return Object.values(obj).some(checkValue);
  }

  private buildFormData(formData: FormData, obj: any, prefix = ''): void {
    Object.entries(obj).forEach(([key, value]) => {
      const fieldName = prefix ? `${prefix}[${key}]` : key;
      
      if (value instanceof File || value instanceof Blob) {
        formData.append(fieldName, value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const arrayFieldName = `${fieldName}[${index}]`;
          if (item instanceof File || item instanceof Blob) {
            formData.append(arrayFieldName, item);
          } else if (item && typeof item === 'object') {
            this.buildFormData(formData, item, arrayFieldName);
          } else {
            formData.append(arrayFieldName, String(item));
          }
        });
      } else if (value && typeof value === 'object') {
        this.buildFormData(formData, value, fieldName);
      } else if (value != null) {
        formData.append(fieldName, String(value));
      }
    });
  }

  async request<T = any>(endpoint: string, config: APIConfig = {}): Promise<APIResponse<T>> {
    const { method = 'GET', headers = {}, body, params, timeout = 50000 } = config;
    
    // Don't attempt token refresh if we're logging out or calling auth endpoints
    if (!this.isLoggingOut && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register') && !endpoint.includes('/auth/logout')) {
      try {
        await this.ensureValidToken();
      } catch (error) {
        // Token validation failed, continue with request - will get 401 and trigger logout
      }
    }
    
    const url = this.buildURL(endpoint, params);
    const mergedHeaders = { ...this.defaultHeaders, ...headers };
    const preparedBody = this.prepareBody(body);
    
    if (preparedBody instanceof FormData) {
      delete mergedHeaders['Content-Type'];
    } else if (preparedBody && typeof preparedBody === 'string') {
      mergedHeaders['Content-Type'] = 'application/json';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: mergedHeaders,
        body: preparedBody,
        signal: controller.signal,
        credentials: 'include',
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      let data: T;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('json')) {
        data = await response.json();
      } else if (contentType.includes('text')) {
        data = await response.text() as T;
      } else if (contentType.includes('blob') || contentType.includes('octet-stream')) {
        data = await response.blob() as T;
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text as T;
        }
      }

      // Handle 401 Unauthorized - trigger logout only if not already logging out
      if (response.status === 401 && !endpoint.includes('/auth/') && !this.isLoggingOut) {
        this.handleLogout();
        
        throw {
          message: `HTTP ${response.status}: Unauthorized`,
          status: response.status,
          data,
          response
        };
      }

      if (!response.ok) {
        throw {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          data,
          response
        };
      }

      return { data, status: response.status, ok: response.ok, message: (data as any)?.message || '' };
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  private async ensureValidToken(): Promise<void> {
    const session = authService.getSession();
    if (!session) return;

    try {
      // Check if token needs refresh
      const tokenExpiryBuffer = 60 * 1000; // 1 minute buffer
      const isExpiringSoon = session.tokens.expiresAt <= (Date.now() + tokenExpiryBuffer);
      
      if (isExpiringSoon && !this.tokenRefreshPromise) {
        // Only one refresh at a time
        this.tokenRefreshPromise = this.performTokenRefresh();
        await this.tokenRefreshPromise;
        this.tokenRefreshPromise = null;
      } else if (this.tokenRefreshPromise) {
        // Wait for ongoing refresh
        await this.tokenRefreshPromise;
      }
    } catch (error) {
      this.tokenRefreshPromise = null;
      throw error;
    }
  }

  private async performTokenRefresh(): Promise<void> {
    try {
      await authService.refreshTokens();
    } catch (error) {
      // If refresh fails, trigger logout
      this.handleLogout();
      throw error;
    }
  }

  private handleLogout(): void {
    if (this.isLoggingOut) return; // Prevent multiple logout calls
    
    this.isLoggingOut = true;
    
    // Clear all local data immediately
    this.clearAuth();
    
    // Broadcast logout event
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('userLogout', { 
        detail: { timestamp: Date.now() } 
      }));
    }, 0);
  }

  // HTTP method shortcuts
  get<T = any>(url: string, config?: Omit<APIConfig, 'method' | 'body'>): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  post<T = any>(url: string, body?: any, config?: Omit<APIConfig, 'method' | 'body'>): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body });
  }

  put<T = any>(url: string, body?: any, config?: Omit<APIConfig, 'method' | 'body'>): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body });
  }

  patch<T = any>(url: string, body?: any, config?: Omit<APIConfig, 'method' | 'body'>): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body });
  }

  delete<T = any>(url: string, config?: Omit<APIConfig, 'method' | 'body'>): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

// ============ FAQ API METHODS ============

/**
 * Get FAQs with filters and pagination
 */
async getFAQs(filters?: HelpFilters): Promise<APIResponse<BackendResponse<HelpResponse<FAQ>>>> {
  const params: Record<string, any> = {};
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params[key] = value;
      }
    });
  }

  return this.get<BackendResponse<HelpResponse<FAQ>>>('/help/faqs', { params });
}

/**
 * Get single FAQ by ID
 */
async getFAQ(faqId: string): Promise<APIResponse<BackendResponse<FAQ>>> {
  return this.get<BackendResponse<FAQ>>(`/help/faqs/${faqId}`);
}

/**
 * Mark FAQ as helpful
 */
async markFAQHelpful(faqId: string): Promise<APIResponse<BackendResponse<{ helpful: number }>>> {
  return this.patch<BackendResponse<{ helpful: number }>>(`/help/faqs/${faqId}/helpful`);
}

/**
 * Search FAQs
 */
async searchFAQs(query: string, filters?: Omit<HelpFilters, 'search'>): Promise<APIResponse<BackendResponse<HelpResponse<FAQ>>>> {
  return this.getFAQs({ ...filters, search: query });
}

// ============ ARTICLE API METHODS ============

/**
 * Get articles with filters and pagination
 */
async getArticles(filters?: HelpFilters): Promise<APIResponse<BackendResponse<HelpResponse<Article>>>> {
  const params: Record<string, any> = {};
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params[key] = value;
      }
    });
  }

  return this.get<BackendResponse<HelpResponse<Article>>>('/help/articles', { params });
}

/**
 * Get single article by ID
 */
async getArticle(articleId: string): Promise<APIResponse<BackendResponse<Article>>> {
  return this.get<BackendResponse<Article>>(`/help/articles/${articleId}`);
}

/**
 * Increment article view count
 */
async incrementArticleViews(articleId: string): Promise<APIResponse<BackendResponse<{ views: number }>>> {
  return this.patch<BackendResponse<{ views: number }>>(`/help/articles/${articleId}/views`);
}

/**
 * Search articles
 */
async searchArticles(query: string, filters?: Omit<HelpFilters, 'search'>): Promise<APIResponse<BackendResponse<HelpResponse<Article>>>> {
  return this.getArticles({ ...filters, search: query });
}

// ============ SUPPORT TICKET API METHODS ============

/**
 * Get user's support tickets with filters and pagination
 */
async getSupportTickets(filters?: HelpFilters): Promise<APIResponse<BackendResponse<HelpResponse<SupportTicket>>>> {
  const params: Record<string, any> = {};
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params[key] = value;
      }
    });
  }

  return this.get<BackendResponse<HelpResponse<SupportTicket>>>('/help/tickets', { params });
}

/**
 * Get single support ticket by ID
 */
async getSupportTicket(ticketId: string): Promise<APIResponse<BackendResponse<SupportTicket>>> {
  return this.get<BackendResponse<SupportTicket>>(`/help/tickets/${ticketId}`);
}

/**
 * Create new support ticket
 */
async createSupportTicket(ticketData: {
  subject: string;
  description: string;
  category: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
}): Promise<APIResponse<BackendResponse<SupportTicket>>> {
  return this.post<BackendResponse<SupportTicket>>('/help/tickets', ticketData);
}

/**
 * Update support ticket
 */
async updateSupportTicket(ticketId: string, updateData: {
  subject?: string;
  description?: string;
  category?: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  status?: 'open' | 'in-progress' | 'resolved' | 'closed';
}): Promise<APIResponse<BackendResponse<SupportTicket>>> {
  return this.put<BackendResponse<SupportTicket>>(`/help/tickets/${ticketId}`, updateData);
}

/**
 * Add response to support ticket
 */
async addTicketResponse(ticketId: string, message: string): Promise<APIResponse<BackendResponse<TicketResponse>>> {
  return this.post<BackendResponse<TicketResponse>>(`/help/tickets/${ticketId}/responses`, { message });
}

/**
 * Close support ticket
 */
async closeSupportTicket(ticketId: string): Promise<APIResponse<BackendResponse<SupportTicket>>> {
  return this.patch<BackendResponse<SupportTicket>>(`/help/tickets/${ticketId}/close`);
}

// ============ HELP GENERAL METHODS ============

/**
 * Get help categories
 */
async getHelpCategories(): Promise<APIResponse<BackendResponse<string[]>>> {
  return this.get<BackendResponse<string[]>>('/help/categories');
}

/**
 * Send contact form message
 */
async sendContactMessage(contactData: {
  subject: string;
  category: string;
  message: string;
  email?: string;
  name?: string;
}): Promise<APIResponse<BackendResponse<any>>> {
  return this.post<BackendResponse<any>>('/help/contact', contactData);
}

/**
 * Get help statistics
 */
async getHelpStats(): Promise<APIResponse<BackendResponse<{
  totalFAQs: number;
  totalArticles: number;
  totalTickets: number;
  categoryCounts: Record<string, number>;
}>>> {
  return this.get<BackendResponse<{
    totalFAQs: number;
    totalArticles: number;
    totalTickets: number;
    categoryCounts: Record<string, number>;
  }>>('/help/stats');
}

  // ============ NOTIFICATION API METHODS ============

/**
 * Get notifications with filters and pagination
 */
async getNotifications(filters?: NotificationFilters): Promise<APIResponse<BackendResponse<NotificationsResponse>>> {
  const params: Record<string, any> = {};
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params[key] = value;
      }
    });
  }

  return this.get<BackendResponse<NotificationsResponse>>('/notifications', { params });
}

/**
 * Get single notification by ID
 */
async getNotification(notificationId: string): Promise<APIResponse<BackendResponse<Notification>>> {
  return this.get<BackendResponse<Notification>>(`/notifications/${notificationId}`);
}

/**
 * Mark notification as read
 */
async markNotificationAsRead(notificationId: string): Promise<APIResponse<BackendResponse<Notification>>> {
  return this.patch<BackendResponse<Notification>>(`/notifications/${notificationId}/read`);
}

/**
 * Mark notification as unread
 */
async markNotificationAsUnread(notificationId: string): Promise<APIResponse<BackendResponse<Notification>>> {
  return this.patch<BackendResponse<Notification>>(`/notifications/${notificationId}/unread`);
}

/**
 * Mark all notifications as read
 */
async markAllNotificationsAsRead(): Promise<APIResponse<BackendResponse<{ updatedCount: number }>>> {
  return this.patch<BackendResponse<{ updatedCount: number }>>('/notifications/mark-all-read');
}

/**
 * Delete notification
 */
async deleteNotification(notificationId: string): Promise<APIResponse<BackendResponse<any>>> {
  return this.delete<BackendResponse<any>>(`/notifications/${notificationId}`);
}

/**
 * Create new notification (admin/system use)
 */
async createNotification(notificationData: {
  userId: number;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  fromUser?: string;
  relatedEntity?: string;
  metadata?: any;
  expiresAt?: string;
}): Promise<APIResponse<BackendResponse<Notification>>> {
  return this.post<BackendResponse<Notification>>('/notifications', notificationData);
}

/**
 * Get notification statistics
 */
async getNotificationStats(): Promise<APIResponse<BackendResponse<NotificationStats>>> {
  return this.get<BackendResponse<NotificationStats>>('/notifications/stats');
}

  // ============ AUTHENTICATION METHODS ============

  /**
   * User registration
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<APIResponse<BackendResponse<{ user: User; accessToken: string; refreshToken: string }>>> {
    const response = await this.post<BackendResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/register', userData);
    
    // Store tokens after successful registration
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken } = response.data.data;
      this.setAuth(accessToken, refreshToken);
    }
    
    return response;
  }

  /**
   * User login
   */
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<APIResponse<BackendResponse<{ user: User; accessToken: string; refreshToken: string }>>> {
    const response = await this.post<BackendResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', credentials);
    
    // Store tokens after successful login
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken } = response.data.data;
      this.setAuth(accessToken, refreshToken);
    }
    
    return response;
  }

  /**
   * User logout
   */
  async logout(): Promise<APIResponse<BackendResponse<any>>> {
    this.isLoggingOut = true;
    
    try {
      const response = await this.post<BackendResponse<any>>('/auth/logout');
      return response;
    } finally {
      // Always clear auth, even if logout API fails
      this.clearAuth();
    }
  }

  /**
   * Refresh access token (public method)
   */
  async refreshToken(refreshToken: string): Promise<APIResponse<BackendResponse<{ accessToken: string; refreshToken: string }>>> {
    return this.post<BackendResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh-token', { refreshToken });
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<APIResponse<BackendResponse<User>>> {
    return this.get<BackendResponse<User>>('/auth/profile');
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<User>): Promise<APIResponse<BackendResponse<User>>> {
    return this.put<BackendResponse<User>>('/auth/profile', profileData);
  }

  async updateProfileImage(imageUrl: string): Promise<APIResponse<BackendResponse<{ profile: string; user: User }>>> {
  return this.put<BackendResponse<{ profile: string; user: User }>>('/auth/me/image', { imageUrl });
}

  // ============ BOOKING API METHODS ============

  /**
   * Create a new booking
   */
  async createBooking(bookingData: BookingData): Promise<APIResponse<BackendResponse<BookingInfo>>> {
    return this.post<BackendResponse<BookingInfo>>('/bookings', bookingData);
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string): Promise<APIResponse<BackendResponse<BookingInfo>>> {
    return this.get<BackendResponse<BookingInfo>>(`/bookings/${bookingId}`);
  }

  /**
   * Get booking by confirmation code (public)
   */
  async getBookingByConfirmation(bookingId: string): Promise<APIResponse<BackendResponse<BookingInfo>>> {
    return this.get<BackendResponse<BookingInfo>>(`/bookings/confirmation/${bookingId}`);
  }

  /**
   * Update booking
   */
  async updateBooking(bookingId: string, updateData: any, role: 'guest' | 'host' = 'guest'): Promise<APIResponse<BackendResponse<BookingInfo>>> {
    return this.put<BackendResponse<BookingInfo>>(`/bookings/${bookingId}?role=${role}`, updateData);
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string, reason: string, role: 'guest' | 'host' = 'guest'): Promise<APIResponse<BackendResponse<BookingInfo>>> {
    return this.patch<BackendResponse<BookingInfo>>(`/bookings/${bookingId}/cancel?role=${role}`, { reason });
  }

  /**
   * Validate booking availability and pricing
   */
  async validateBooking(propertyId: number, checkIn: string, checkOut: string, guests: number): Promise<APIResponse<BackendResponse<BookingValidation>>> {
    return this.post<BackendResponse<BookingValidation>>('/bookings/validate', {
      propertyId,
      checkIn,
      checkOut,
      guests
    });
  }

  /**
   * Confirm booking (host action)
   */
  async confirmBooking(bookingId: string): Promise<APIResponse<BackendResponse<BookingInfo>>> {
    return this.patch<BackendResponse<BookingInfo>>(`/bookings/${bookingId}/confirm`);
  }

  /**
   * Complete booking (host action)
   */
  async completeBooking(bookingId: string): Promise<APIResponse<BackendResponse<BookingInfo>>> {
    return this.patch<BackendResponse<BookingInfo>>(`/bookings/${bookingId}/complete`);
  }

  /**
   * Search bookings with filters
   */
  async searchBookings(filters?: any): Promise<APIResponse<BackendResponse<{ bookings: any[]; total: number; page: number; limit: number; totalPages: number }>>> {
    const params: Record<string, any> = {};
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params[key] = value;
        }
      });
    }

    return this.get<BackendResponse<{ bookings: any[]; total: number; page: number; limit: number; totalPages: number }>>('/bookings/search', { params });
  }

  /**
   * Get property bookings
   */
  async getPropertyBookings(propertyId: number): Promise<APIResponse<BackendResponse<any[]>>> {
    return this.get<BackendResponse<any[]>>(`/bookings/property/${propertyId}`);
  }

  // ============ PROPERTY API METHODS ============

  /**
   * Fetch all properties with optional filters
   */
  async getProperties(filters?: PropertyFilters): Promise<APIResponse<BackendResponse<PropertiesResponse>>> {
    const params: Record<string, any> = {};
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Map 'keyword' to 'search' for backend compatibility
          if (key === 'keyword') {
            params.search = value;
          } else {
            params[key] = value;
          }
        }
      });
    }

    return this.get<BackendResponse<PropertiesResponse>>('/properties', { params });
  }

  /**
   * Get a single property by ID
   */
  async getProperty(id: number | string): Promise<APIResponse<BackendResponse<PropertyInfo>>> {
    return this.get<BackendResponse<PropertyInfo>>(`/properties/${id}`);
  }

  /**
   * Search properties with keyword and location
   */
  async searchProperties(
    keyword?: string, 
    location?: string, 
    category?: string
  ): Promise<APIResponse<BackendResponse<PropertiesResponse>>> {
    const filters: PropertyFilters = {};
    
    if (keyword) filters.search = keyword;
    if (location) filters.location = location;
    if (category && category !== 'all') filters.category = category;
    
    return this.getProperties(filters);
  }

  /**
   * Get featured/recommended properties
   */
  async getFeaturedProperties(limit: number = 12): Promise<APIResponse<BackendResponse<PropertiesResponse>>> {
    return this.get<BackendResponse<PropertiesResponse>>('/properties/featured', { 
      params: { limit } 
    });
  }

  /**
   * Get properties by category
   */
  async getPropertiesByCategory(
    category: string, 
    limit?: number
  ): Promise<APIResponse<BackendResponse<PropertiesResponse>>> {
    const params: Record<string, any> = { category };
    if (limit) params.limit = limit;
    
    return this.get<BackendResponse<PropertiesResponse>>('/properties', { params });
  }

  /**
   * Get available locations for properties
   */
  async getLocations(): Promise<APIResponse<BackendResponse<string[]>>> {
    return this.get<BackendResponse<string[]>>('/properties/locations');
  }

  /**
   * Get property categories
   */
  async getCategories(): Promise<APIResponse<BackendResponse<string[]>>> {
    return this.get<BackendResponse<string[]>>('/properties/categories');
  }

  /**
   * Create new property (host)
   */
  async createProperty(propertyData: any): Promise<APIResponse<BackendResponse<PropertyInfo>>> {
    return this.post<BackendResponse<PropertyInfo>>('/properties', propertyData);
  }

  /**
   * Update property (host)
   */
  async updateProperty(propertyId: number, propertyData: any): Promise<APIResponse<BackendResponse<PropertyInfo>>> {
    return this.put<BackendResponse<PropertyInfo>>(`/properties/${propertyId}`, propertyData);
  }

  /**
   * Delete property (host)
   */
  async deleteProperty(propertyId: number): Promise<APIResponse<BackendResponse<any>>> {
    return this.delete<BackendResponse<any>>(`/properties/${propertyId}`);
  }

// ============ KYC API METHODS ============

/**
 * Submit KYC data
 */
async submitKYC(kycData: {
  personalDetails: any;
  addressDocumentUrl?: string;
}): Promise<APIResponse<BackendResponse<any>>> {
  return this.post<BackendResponse<any>>('/auth/kyc/submit', kycData);
}

/**
 * Get KYC status
 */
async getKYCStatus(): Promise<APIResponse<BackendResponse<{
  kycCompleted: boolean;
  kycStatus: string;
  kycSubmittedAt?: string;
  requiresDocumentUpload: boolean;
}>>> {
  return this.get<BackendResponse<{
    kycCompleted: boolean;
    kycStatus: string;
    kycSubmittedAt?: string;
    requiresDocumentUpload: boolean;
  }>>('/auth/kyc/status');
}

  // ============ REVIEW API METHODS ============

  /**
   * Create a new review for a property
   */
  async addPropertyReview(
    propertyId: number,
    reviewData: {
      rating: number;
      comment: string;
      images?: string[];
    }
  ): Promise<APIResponse<BackendResponse<any>>> {
    return this.post<BackendResponse<any>>(
      `/properties/${propertyId}/reviews`,
      reviewData
    );
  }

  /**
   * Get all reviews for a specific property (with pagination)
   */
  async getPropertyReviews(
    propertyId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<
    APIResponse<
      BackendResponse<{
        reviews: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >
  > {
    return this.get<
      BackendResponse<{
        reviews: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(`/properties/${propertyId}/reviews`, {
      params: { page, limit },
    });
  }

  /**
   * Get all reviews written by a specific user (with pagination)
   */
  async getUserReviews(
    userId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<
    APIResponse<
      BackendResponse<{
        reviews: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >
  > {
    return this.get<
      BackendResponse<{
        reviews: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(`/reviews/user/${userId}`, {
      params: { page, limit },
    });
  }

  /**
   * Update an existing review (owner only)
   */
  async updateReview(
    reviewId: string,
    updateData: {
      rating?: number;
      comment?: string;
      images?: string[];
    }
  ): Promise<APIResponse<BackendResponse<any>>> {
    return this.put<BackendResponse<any>>(`/reviews/${reviewId}`, updateData);
  }

  /**
   * Delete a review (owner only)
   */
  async deleteReview(
    reviewId: string
  ): Promise<APIResponse<BackendResponse<any>>> {
    return this.delete<BackendResponse<any>>(`/reviews/${reviewId}`);
  }

  // ============ REVIEW HELPER METHODS ============

  /**
   * Check if user can review a property (has completed booking)
   */
  async canUserReviewProperty(
    propertyId: number
  ): Promise<APIResponse<BackendResponse<{ canReview: boolean; reason?: string }>>> {
    return this.get<BackendResponse<{ canReview: boolean; reason?: string }>>(
      `/properties/${propertyId}/can-review`
    );
  }

  /**
   * Get review statistics for a property
   */
  async getPropertyReviewStats(
    propertyId: number
  ): Promise<
    APIResponse<
      BackendResponse<{
        averageRating: number;
        totalReviews: number;
        ratingDistribution: { [key: number]: number };
      }>
    >
  > {
    return this.get<
      BackendResponse<{
        averageRating: number;
        totalReviews: number;
        ratingDistribution: { [key: number]: number };
      }>
    >(`/properties/${propertyId}/review-stats`);
  }

  // ============ PAYMENT METHODS ============

  /**
   * Process payment
   */
  async processPayment(paymentData: {
    bookingId: string;
    amount: number;
    paymentMethod: string;
    paymentDetails?: any;
  }): Promise<APIResponse<BackendResponse<any>>> {
    return this.post<BackendResponse<any>>('/payments/process', paymentData);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<APIResponse<BackendResponse<any>>> {
    return this.get<BackendResponse<any>>(`/payments/${paymentId}/status`);
  }

  /**
   * Request refund
   */
  async requestRefund(bookingId: string, reason: string, amount?: number): Promise<APIResponse<BackendResponse<any>>> {
    return this.post<BackendResponse<any>>('/payments/refund', {
      bookingId,
      reason,
      amount
    });
  }

  // ============ FILE UPLOAD METHODS ============

  /**
   * Upload single file
   */
  async uploadFile(file: File, category: string = 'general'): Promise<APIResponse<BackendResponse<{ url: string }>>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    
    return this.post<BackendResponse<{ url: string }>>('/upload', formData);
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files: File[], category: string = 'general'): Promise<APIResponse<BackendResponse<{ urls: string[] }>>> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    formData.append('category', category);
    
    return this.post<BackendResponse<{ urls: string[] }>>('/upload/multiple', formData);
  }

  // ============ ENHANCED BOOKING API METHODS ============

/**
 * Search property bookings with filters (for user bookings page)
 */
async searchPropertyBookings(filters?: {
  status?: string[];
  checkInDate?: string;
  checkOutDate?: string;
  propertyId?: number;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'checkIn' | 'checkOut' | 'totalPrice' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  page?: number;
  limit?: number;
}): Promise<APIResponse<BackendResponse<{
  bookings: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>>> {
  const params: Record<string, any> = {};
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Handle array parameters (like status)
        if (Array.isArray(value)) {
          params[key] = value.join(',');
        } else {
          params[key] = value;
        }
      }
    });
  }

  return this.get<BackendResponse<{
    bookings: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>>('/bookings/properties', { params });
}

/**
 * Get specific property booking by ID
 */
async getPropertyBooking(bookingId: string): Promise<APIResponse<BackendResponse<any>>> {
  return this.get<BackendResponse<any>>(`/bookings/properties/${bookingId}`);
}

/**
 * Cancel property booking
 */
async cancelPropertyBooking(bookingId: string, reason?: string): Promise<APIResponse<BackendResponse<any>>> {
  return this.patch<BackendResponse<any>>(`/bookings/properties/${bookingId}/cancel`, { 
    reason: reason || 'Cancelled by user' ,
    type: 'property'
  });
}

/**
 * Update property booking
 */
async updatePropertyBooking(bookingId: string, updateData: {
  status?: string;
  message?: string;
  specialRequests?: string;
}): Promise<APIResponse<BackendResponse<any>>> {
  return this.put<BackendResponse<any>>(`/bookings/properties/${bookingId}`, updateData);
}

/**
 * Get user booking statistics
 */
async getUserBookingStats(): Promise<APIResponse<BackendResponse<{
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  averageBookingValue: number;
  favoriteDestinations: string[];
  upcomingBookings: number;
  memberSince: string;
}>>> {
  return this.get<BackendResponse<{
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalSpent: number;
    averageBookingValue: number;
    favoriteDestinations: string[];
    upcomingBookings: number;
    memberSince: string;
  }>>('/bookings/stats');
}

/**
 * Get upcoming bookings
 */
async getUpcomingBookings(limit: number = 5): Promise<APIResponse<BackendResponse<any[]>>> {
  return this.get<BackendResponse<any[]>>('/bookings/upcoming', { 
    params: { limit } 
  });
}

/**
 * Get user booking calendar
 */
async getUserBookingCalendar(): Promise<APIResponse<BackendResponse<{
  userId: number;
  events: any[];
  upcomingBookings: any[];
  conflicts?: any[];
}>>> {
  return this.get<BackendResponse<{
    userId: number;
    events: any[];
    upcomingBookings: any[];
    conflicts?: any[];
  }>>('/bookings/calendar');
}

  // ============ UTILITY METHODS ============

  /**
   * Transform backend property to match frontend expectations
   */
  static transformProperty(backendProperty: Property): Property & { 
    title: string; 
    pricePerNight: string; 
    reviews: number; 
    image: string 
  } {
    return {
      ...(backendProperty as Property),
      title: backendProperty.name,
      pricePerNight: `$${backendProperty.pricePerNight}`,
      reviews: backendProperty.reviewsCount,
      image: backendProperty.image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'
    } as Property & { 
      title: string; 
      pricePerNight: string; 
      reviews: number; 
      image: string 
    };
  }

  /**
   * Transform backend response to include calculated pagination fields
   */
  static transformPropertiesResponse(backendResponse: PropertiesResponse): PropertiesResponse & {
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } {
    return {
      ...backendResponse,
      hasNextPage: backendResponse.page < backendResponse.totalPages,
      hasPrevPage: backendResponse.page > 1
    };
  }

  /**
   * Format currency
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Format date
   */
  static formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    return new Date(dateString).toLocaleDateString('en-US', options || defaultOptions);
  }
  /**
 * Request withdrawal OTP
 */
async requestWithdrawalOTP(amount: number): Promise<APIResponse<BackendResponse<{
  messageId: string;
  expiresIn: number;
  maskedPhone: string;
  amount: number;
  currency: string;
}>>> {
  return this.post<BackendResponse<{
    messageId: string;
    expiresIn: number;
    maskedPhone: string;
    amount: number;
    currency: string;
  }>>('/payments/withdrawal/request-otp', { amount });
}

/**
 * Verify OTP and process withdrawal
 */
async verifyAndWithdraw(data: {
  otp: string;
  amount: number;
  method?: 'MOBILE' | 'BANK';
  destination?: any;
}): Promise<APIResponse<BackendResponse<{
  withdrawalId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  reference: string;
  estimatedDelivery: string;
  newBalance: number;
}>>> {
  return this.post<BackendResponse<{
    withdrawalId: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    reference: string;
    estimatedDelivery: string;
    newBalance: number;
  }>>('/payments/withdrawal/verify-and-withdraw', data);
}

/**
 * Resend withdrawal OTP
 */
async resendWithdrawalOTP(amount: number): Promise<APIResponse<BackendResponse<{
  messageId: string;
  expiresIn: number;
}>>> {
  return this.post<BackendResponse<{
    messageId: string;
    expiresIn: number;
  }>>('/payments/withdrawal/resend-otp', { amount });
}

/**
 * Get withdrawal info
 */
async getWithdrawalInfo(): Promise<APIResponse<BackendResponse<{
  wallet: { balance: number; currency: string; isActive: boolean; };
  limits: { minimum: number; maximum: number; daily: number; monthly: number; };
  kyc: { completed: boolean; status: string; required: boolean; };
  phoneVerified: boolean;
  supportedMethods: string[];
  currency: string;
}>>> {
  return this.get<BackendResponse<any>>('/payments/withdrawal/info');
  }
}

// Export singleton instance for frontend use
const api = new FrontendAPIService();
export default api;