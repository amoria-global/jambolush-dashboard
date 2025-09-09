// apiService.ts - Enhanced Frontend API service with automatic token refresh

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

class FrontendAPIService {
  private baseURL: string;
  private defaultHeaders: Record<string, string> = {
    'Accept': 'application/json'
  };
  
  // Token refresh state
  private refreshPromise: Promise<AuthTokens> | null = null;
  private isRefreshing = false;
  
  // Event callbacks
  private onTokenRefresh?: (tokens: AuthTokens) => void;
  private onAuthError?: () => void;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL || 'https://backend.jambolush.com/api';
  }

  // ============ TOKEN MANAGEMENT ============

  /**
   * Set authentication tokens and callbacks
   */
  setAuth(accessToken: string, refreshToken?: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
    
    if (refreshToken) {
      this.storeTokens({
        accessToken,
        refreshToken,
        expiresAt: this.calculateTokenExpiry(accessToken)
      });
    }
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    delete this.defaultHeaders['Authorization'];
    this.clearStoredTokens();
    this.refreshPromise = null;
    this.isRefreshing = false;
  }

  /**
   * Set event callbacks for token refresh and auth errors
   */
  setAuthCallbacks(
    onTokenRefresh?: (tokens: AuthTokens) => void,
    onAuthError?: () => void
  ): void {
    this.onTokenRefresh = onTokenRefresh;
    this.onAuthError = onAuthError;
  }

  /**
   * Get stored tokens from localStorage
   */
  private getStoredTokens(): AuthTokens | null {
    try {
      const stored = localStorage.getItem('jambolush_auth_tokens');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem('jambolush_auth_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  /**
   * Clear stored tokens
   */
  private clearStoredTokens(): void {
    try {
      localStorage.removeItem('jambolush_auth_tokens');
      localStorage.removeItem('authToken'); // Legacy token storage
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Calculate token expiry time from JWT
   */
  private calculateTokenExpiry(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : Date.now() + (3600 * 1000); // Default 1 hour
    } catch {
      return Date.now() + (3600 * 1000); // Default 1 hour
    }
  }

  /**
   * Check if token is expired or will expire soon (within 5 minutes)
   */
  private isTokenExpired(expiresAt?: number): boolean {
    if (!expiresAt) return false;
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    return expiresAt <= fiveMinutesFromNow;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<AuthTokens> {
    // Prevent multiple concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const storedTokens = this.getStoredTokens();
    if (!storedTokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;
    
    this.refreshPromise = (async () => {
      try {
        console.log('Refreshing access token...');
        
        const response = await this.request<BackendResponse<TokenRefreshResponse>>(
          '/auth/refresh-token', 
          {
            method: 'POST',
            body: { refreshToken: storedTokens.refreshToken },
            skipTokenRefresh: true // Prevent infinite loop
          }
        );

        if (!response.data.success || !response.data.data) {
          throw new Error('Invalid refresh response');
        }

        const { accessToken, refreshToken, expiresIn } = response.data.data;
        
        const newTokens: AuthTokens = {
          accessToken,
          refreshToken: refreshToken || storedTokens.refreshToken,
          expiresAt: expiresIn ? 
            Date.now() + (expiresIn * 1000) : 
            this.calculateTokenExpiry(accessToken)
        };

        // Update authorization header
        this.defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
        
        // Store new tokens
        this.storeTokens(newTokens);
        
        // Notify callback
        if (this.onTokenRefresh) {
          this.onTokenRefresh(newTokens);
        }

        console.log('Token refreshed successfully');
        return newTokens;
        
      } catch (error) {
        console.error('Token refresh failed:', error);
        
        // Clear auth and notify error callback
        this.clearAuth();
        if (this.onAuthError) {
          this.onAuthError();
        }
        
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Ensure valid access token before making requests
   */
  private async ensureValidToken(): Promise<void> {
    const tokens = this.getStoredTokens();
    
    if (!tokens) {
      return; // No tokens, continue without auth
    }

    // Check if token needs refresh
    if (this.isTokenExpired(tokens.expiresAt)) {
      await this.refreshAccessToken();
    }
  }

  // ============ HTTP REQUEST METHODS ============

  setHeaders(headers: Record<string, string>): void {
    Object.assign(this.defaultHeaders, headers);
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
    const { method = 'GET', headers = {}, body, params, timeout = 50000, skipTokenRefresh = false } = config;
    
    // Ensure valid token before request (unless skipping refresh)
    if (!skipTokenRefresh && !endpoint.includes('/auth/')) {
      await this.ensureValidToken();
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

      // Handle 401 Unauthorized - attempt token refresh
      if (response.status === 401 && !skipTokenRefresh && !endpoint.includes('/auth/')) {
        console.log('Received 401, attempting token refresh...');
        
        try {
          await this.refreshAccessToken();
          
          // Retry the original request with new token
          return this.request<T>(endpoint, { ...config, skipTokenRefresh: true });
          
        } catch (refreshError) {
          console.error('Token refresh failed, clearing auth:', refreshError);
          
          // Clear auth and throw original error
          this.clearAuth();
          if (this.onAuthError) {
            this.onAuthError();
          }
          
          throw {
            message: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status,
            data,
            response
          };
        }
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
}

// Export singleton instance for frontend use
const api = new FrontendAPIService();
export default api;