// app/services/authService.ts
"use client";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  sessionStartedAt: number; // Track when the session was first created
  lastRefreshedAt: number; // Track when the token was last refreshed
}

export interface UserProfile {
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
  userType: 'guest' | 'host' | 'agent' | 'tourguide';
  provider?: string;
}

export interface UserSession {
  user: UserProfile;
  tokens: AuthTokens;
  role: UserProfile['userType'];
}

type AuthEventType = 
  | 'login' 
  | 'logout' 
  | 'token_refreshed' 
  | 'session_expired' 
  | 'profile_updated';

type AuthEventListener = (data?: any) => void;

class AuthService {
  private static instance: AuthService;
  private currentSession: UserSession | null = null;
  private refreshPromise: Promise<void> | null = null;
  private eventListeners: Map<AuthEventType, AuthEventListener[]> = new Map();
  private isInitialized = false;
  private isLoggingOut = false;
  private refreshIntervalId: NodeJS.Timeout | null = null;

  // Session configuration
  private readonly MAX_SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
  private readonly TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // Refresh every 10 minutes
  private readonly TOKEN_EXPIRY_BUFFER = 2 * 60 * 1000; // Refresh if token expires within 2 minutes

  // Comprehensive storage keys - all possible locations
  private readonly STORAGE_KEYS = {
    // New format
    SESSION: 'jambolush_session',
    TOKENS: 'jambolush_auth_tokens',
    // Legacy formats
    AUTH_TOKEN: 'authToken',
    REFRESH_TOKEN: 'refreshToken',
    USER_SESSION: 'userSession',
    // Additional possible keys
    ACCESS_TOKEN: 'access_token',
    JAMBOLUSH_USER: 'jambolush_user',
    JAMBOLUSH_AUTH: 'jambolush_auth'
  };

  private constructor() {
    this.initializeEventListeners();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private initializeEventListeners() {
    if (typeof window !== 'undefined') {
      // Listen for storage changes across tabs
      window.addEventListener('storage', (e) => {
        if (this.isStorageKey(e.key) && !e.newValue && !this.isLoggingOut) {
          this.handleLogout(false); // Don't clear storage again
        }
      });

      // Listen for user logout events from other components
      window.addEventListener('userLogout', () => {
        if (!this.isLoggingOut) {
          this.handleLogout(true);
        }
      });

      // Listen for beforeunload to cleanup
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  private isStorageKey(key: string | null): boolean {
    if (!key) return false;
    return Object.values(this.STORAGE_KEYS).includes(key);
  }

  /**
   * Initialize auth service - call this once in your app
   */
  async initialize(): Promise<UserSession | null> {
    if (this.isInitialized) {
      return this.currentSession;
    }

    try {
      // Check for URL tokens first
      const urlTokens = this.extractTokensFromURL();
      if (urlTokens) {
        await this.handleURLTokens(urlTokens);
        this.cleanURL();
      }

      // Try to restore session from storage
      const session = await this.restoreSession();
      
      this.isInitialized = true;
      return session;
    } catch (error) {
      this.handleLogout();
      this.isInitialized = true;
      return null;
    }
  }

  /**
   * Extract tokens from URL parameters
   */
  private extractTokensFromURL(): { accessToken: string; refreshToken: string } | null {
    if (typeof window === 'undefined') return null;
    
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('token');
    const refreshToken = params.get('refresh_token');
    
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
    
    return null;
  }

  /**
   * Handle tokens from URL and establish session
   */
  private async handleURLTokens(tokens: { accessToken: string; refreshToken: string }) {
    if (this.isLoggingOut) return;

    try {
      // Clear any existing session first
      this.clearAllStorageData();

      // Store tokens with session tracking
      const now = Date.now();
      const authTokens: AuthTokens = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: this.calculateTokenExpiry(tokens.accessToken),
        sessionStartedAt: now,
        lastRefreshedAt: now
      };

      this.storeTokens(authTokens);

      // Set API auth and fetch user profile
      const api = (await import('../api/apiService')).default;
      api.setAuth(tokens.accessToken, tokens.refreshToken);

      const response = await api.get('auth/me');

      if (response.data) {
        const session: UserSession = {
          user: response.data,
          tokens: authTokens,
          role: response.data.userType
        };

        this.setCurrentSession(session);
        this.startTokenRefreshTimer();
        this.emit('login', session);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clean URL parameters
   */
  private cleanURL() {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('refresh_token');
      window.history.replaceState({}, '', url.toString());
    }
  }

  /**
   * Restore session from localStorage
   */
  private async restoreSession(): Promise<UserSession | null> {
    if (this.isLoggingOut) return null;

    try {
      const tokens = this.getStoredTokens();
      if (!tokens) {
        return null;
      }

      // Check if session has exceeded maximum duration (4 hours)
      if (this.hasSessionExpired(tokens.sessionStartedAt)) {
        console.log('Session exceeded maximum duration (4 hours). Logging out...');
        this.handleSessionExpired();
        return null;
      }

      // Check if token is expired and refresh if needed
      if (this.isTokenExpired(tokens.expiresAt)) {
        await this.refreshTokens();
        // Get updated tokens after refresh
        const newTokens = this.getStoredTokens();
        if (!newTokens) {
          throw new Error('Token refresh failed');
        }
      }

      // Fetch current user profile
      const api = (await import('../api/apiService')).default;
      api.setAuth(tokens.accessToken, tokens.refreshToken);

      const response = await api.get('auth/me');

      if (response.data) {
        const session: UserSession = {
          user: response.data,
          tokens: tokens,
          role: response.data.userType
        };

        this.setCurrentSession(session);
        this.startTokenRefreshTimer();
        return session;
      } else {
        throw new Error('Invalid session');
      }
    } catch (error) {
      this.clearAllStorageData();
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshTokens(): Promise<void> {
    if (this.isLoggingOut) {
      throw new Error('Cannot refresh tokens during logout');
    }

    // Prevent multiple concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      await this.refreshPromise;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<void> {
    const tokens = this.getStoredTokens();
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    // Check if session has exceeded maximum duration
    if (this.hasSessionExpired(tokens.sessionStartedAt)) {
      console.log('Session exceeded maximum duration during refresh. Logging out...');
      this.handleSessionExpired();
      throw new Error('Session expired');
    }

    try {
      const api = (await import('../api/apiService')).default;
      const response = await api.post('/auth/refresh-token', {
        refreshToken: tokens.refreshToken
      });

      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken } = response.data.data;

        const newTokens: AuthTokens = {
          accessToken,
          refreshToken: refreshToken || tokens.refreshToken,
          expiresAt: this.calculateTokenExpiry(accessToken),
          sessionStartedAt: tokens.sessionStartedAt, // Preserve original session start time
          lastRefreshedAt: Date.now() // Update last refresh time
        };

        this.storeTokens(newTokens);
        api.setAuth(accessToken, refreshToken || tokens.refreshToken);

        // Update current session tokens
        if (this.currentSession) {
          this.currentSession.tokens = newTokens;
          this.storeSession(this.currentSession);
        }

        this.emit('token_refreshed', newTokens);
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      this.handleLogout();
      throw error;
    }
  }

  /**
   * Calculate token expiry from JWT
   */
  private calculateTokenExpiry(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : Date.now() + (15 * 60 * 1000); // 15 minutes default
    } catch {
      return Date.now() + (15 * 60 * 1000); // 15 minutes default
    }
  }

  /**
   * Check if token is expired or will expire soon (within 1 minute)
   */
  private isTokenExpired(expiresAt: number): boolean {
    const oneMinuteFromNow = Date.now() + (60 * 1000);
    return expiresAt <= oneMinuteFromNow;
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(tokens: AuthTokens) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
      // Also store in legacy format for backward compatibility
      localStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
      localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    } catch (error) {
      // Handle silently - storage might be disabled
    }
  }

  /**
   * Get stored tokens
   */
  private getStoredTokens(): AuthTokens | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.TOKENS);
      if (stored) {
        const tokens = JSON.parse(stored);
        // Ensure all required fields exist
        if (!tokens.sessionStartedAt) {
          tokens.sessionStartedAt = Date.now();
        }
        if (!tokens.lastRefreshedAt) {
          tokens.lastRefreshedAt = tokens.sessionStartedAt;
        }
        return tokens;
      }

      // Fallback to legacy format
      const accessToken = localStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN);
      const refreshToken = localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);

      if (accessToken && refreshToken) {
        const now = Date.now();
        return {
          accessToken,
          refreshToken,
          expiresAt: this.calculateTokenExpiry(accessToken),
          sessionStartedAt: now,
          lastRefreshedAt: now
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Store session in localStorage
   */
  private storeSession(session: UserSession) {
    try {
      const sessionData = {
        role: session.role,
        name: this.getUserDisplayName(session.user),
        id: session.user.id,
        email: session.user.email,
        tourGuideType: (session.user as any).tourGuideType
      };
      localStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
      localStorage.setItem(this.STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionData)); // Backward compatibility
    } catch (error) {
      // Handle silently - storage might be disabled
    }
  }

  /**
   * Set current session
   */
  private setCurrentSession(session: UserSession) {
    this.currentSession = session;
    this.storeTokens(session.tokens);
    this.storeSession(session);
  }

  /**
   * Clear all stored data - comprehensive cleanup
   */
  private clearAllStorageData() {
    try {
      // Clear localStorage
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear sessionStorage as well
      if (typeof sessionStorage !== 'undefined') {
        Object.values(this.STORAGE_KEYS).forEach(key => {
          sessionStorage.removeItem(key);
        });
      }

      // Clear any other possible auth-related keys
      const keysToCheck = [
        'token', 'tokens', 'auth', 'user', 'session',
        'jambolush', 'jambo', 'auth_data', 'user_data'
      ];
      
      keysToCheck.forEach(key => {
        localStorage.removeItem(key);
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      // Handle silently - storage operations might fail
    }
  }

  /**
   * Handle logout with comprehensive cleanup
   */
  private handleLogout(clearStorage = true) {
    if (this.isLoggingOut) return; // Prevent recursive calls
    
    this.isLoggingOut = true;
    
    try {
      // Cancel any ongoing token refresh
      this.refreshPromise = null;
      
      // Clear session
      this.currentSession = null;
      
      // Clear storage
      if (clearStorage) {
        this.clearAllStorageData();
      }
      
      // Clear API auth
      this.clearAPIAuth();
      
      // Emit logout event
      this.emit('logout');
      
      // Broadcast logout event for other components
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('userLogout', { 
            detail: { timestamp: Date.now(), source: 'authService' } 
          }));
        }, 0);
      }
      
    } finally {
      // Reset logout flag after a short delay
      setTimeout(() => {
        this.isLoggingOut = false;
      }, 100);
    }
  }

  /**
   * Clear API authentication
   */
  private async clearAPIAuth() {
    try {
      const api = (await import('../api/apiService')).default;
      api.clearAuth();
    } catch (error) {
      // Handle silently - API might not be available
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup() {
    this.refreshPromise = null;
    this.stopTokenRefreshTimer();
    this.eventListeners.clear();
  }

  /**
   * Check if session has exceeded maximum duration (4 hours)
   */
  private hasSessionExpired(sessionStartedAt: number): boolean {
    const sessionDuration = Date.now() - sessionStartedAt;
    return sessionDuration >= this.MAX_SESSION_DURATION;
  }

  /**
   * Handle session expiration
   */
  private handleSessionExpired() {
    console.log('Session expired after 4 hours. Logging out...');
    this.stopTokenRefreshTimer();
    this.handleLogout(true);

    // Emit session expired event
    this.emit('session_expired');

    // Trigger session expired modal
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('sessionExpired', {
          detail: { reason: 'max_duration_exceeded', timestamp: Date.now() }
        }));
      }, 0);
    }
  }

  /**
   * Start automatic token refresh timer
   */
  private startTokenRefreshTimer() {
    // Clear any existing timer
    this.stopTokenRefreshTimer();

    // Set up periodic token refresh
    this.refreshIntervalId = setInterval(() => {
      this.checkAndRefreshToken();
    }, this.TOKEN_REFRESH_INTERVAL);

    // Also check immediately
    this.checkAndRefreshToken();
  }

  /**
   * Stop automatic token refresh timer
   */
  private stopTokenRefreshTimer() {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
    }
  }

  /**
   * Check token status and refresh if needed
   */
  private async checkAndRefreshToken() {
    if (this.isLoggingOut) return;

    try {
      const tokens = this.getStoredTokens();
      if (!tokens) {
        this.handleLogout(true);
        return;
      }

      // Check if session has exceeded maximum duration
      if (this.hasSessionExpired(tokens.sessionStartedAt)) {
        this.handleSessionExpired();
        return;
      }

      // Check if token will expire soon (within buffer time)
      const timeUntilExpiry = tokens.expiresAt - Date.now();
      if (timeUntilExpiry <= this.TOKEN_EXPIRY_BUFFER) {
        console.log('Token expiring soon, refreshing...');
        await this.refreshTokens();
      }
    } catch (error) {
      console.error('Error checking token status:', error);
      // Don't logout on check errors, will retry on next interval
    }
  }

  /**
   * Get user display name
   */
  private getUserDisplayName(user: UserProfile): string {
    if (user.name) return user.name;
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`.trim();
    }
    return user.email;
  }

  // Public API
  
  /**
   * Get current session
   */
  getSession(): UserSession | null {
    return this.currentSession;
  }

  /**
   * Get current user
   */
  getUser(): UserProfile | null {
    return this.currentSession?.user || null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentSession !== null && !this.isLoggingOut;
  }

  /**
   * Update user profile
   */
  updateProfile(updatedUser: Partial<UserProfile>) {
    if (this.currentSession && !this.isLoggingOut) {
      this.currentSession.user = { ...this.currentSession.user, ...updatedUser };
      this.storeSession(this.currentSession);
      this.emit('profile_updated', this.currentSession.user);
    }
  }

  /**
   * Logout user
   */
  async logout() {
    if (this.isLoggingOut) return;
    
    try {
      // Call logout API if we have a session
      if (this.currentSession) {
        const api = (await import('../api/apiService')).default;
        await api.post('auth/logout');
      }
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      this.handleLogout(true);
    }
  }

  /**
   * Force logout (for error scenarios)
   */
  forceLogout() {
    this.handleLogout(true);
  }

  /**
   * Event system
   */
  on(event: AuthEventType, listener: AuthEventListener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off(event: AuthEventType, listener: AuthEventListener) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: AuthEventType, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          // Handle listener errors silently
        }
      });
    }
  }

  /**
   * Reset auth service (for testing or complete reset)
   */
  reset() {
    this.isLoggingOut = false;
    this.isInitialized = false;
    this.currentSession = null;
    this.refreshPromise = null;
    this.clearAllStorageData();
    this.eventListeners.clear();
    this.initializeEventListeners();
  }
}

export default AuthService.getInstance();