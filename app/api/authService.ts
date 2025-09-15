// app/services/authService.ts
"use client";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
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

  // Consistent storage keys
  private readonly STORAGE_KEYS = {
    SESSION: 'jambolush_session',
    TOKENS: 'jambolush_auth_tokens'
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
        if (e.key === this.STORAGE_KEYS.SESSION || e.key === this.STORAGE_KEYS.TOKENS) {
          if (!e.newValue) {
            this.handleLogout(false); // Don't clear storage again
          }
        }
      });
    }
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
      console.error('Auth initialization failed:', error);
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
    try {
      // Store tokens
      const authTokens: AuthTokens = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: this.calculateTokenExpiry(tokens.accessToken)
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
        this.emit('login', session);
        
        console.log('Session established from URL tokens');
      }
    } catch (error) {
      console.error('Failed to handle URL tokens:', error);
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
    try {
      const tokens = this.getStoredTokens();
      if (!tokens) {
        return null;
      }

      // Check if token is expired and refresh if needed
      if (this.isTokenExpired(tokens.expiresAt)) {
        console.log('Token expired, attempting refresh...');
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
        console.log('Session restored from storage');
        return session;
      } else {
        throw new Error('Invalid session');
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      this.clearStorage();
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshTokens(): Promise<void> {
    // Prevent multiple concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<void> {
    const tokens = this.getStoredTokens();
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
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
          expiresAt: this.calculateTokenExpiry(accessToken)
        };

        this.storeTokens(newTokens);
        api.setAuth(accessToken, refreshToken || tokens.refreshToken);
        
        // Update current session tokens
        if (this.currentSession) {
          this.currentSession.tokens = newTokens;
          this.storeSession(this.currentSession);
        }

        this.emit('token_refreshed', newTokens);
        console.log('Tokens refreshed successfully');
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
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
      // Also store in old format for backward compatibility
      localStorage.setItem('authToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  /**
   * Get stored tokens
   */
  private getStoredTokens(): AuthTokens | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.TOKENS);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Fallback to old format
      const accessToken = localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (accessToken && refreshToken) {
        return {
          accessToken,
          refreshToken,
          expiresAt: this.calculateTokenExpiry(accessToken)
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
        email: session.user.email
      };
      localStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
      localStorage.setItem('userSession', JSON.stringify(sessionData)); // Backward compatibility
    } catch (error) {
      console.error('Failed to store session:', error);
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
   * Clear all stored data
   */
  private clearStorage() {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.TOKENS);
      localStorage.removeItem(this.STORAGE_KEYS.SESSION);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userSession');
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * Handle logout
   */
  private handleLogout(clearStorage = true) {
    this.currentSession = null;
    
    if (clearStorage) {
      this.clearStorage();
    }
    
    this.emit('logout');
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
    return this.currentSession !== null;
  }

  /**
   * Update user profile
   */
  updateProfile(updatedUser: Partial<UserProfile>) {
    if (this.currentSession) {
      this.currentSession.user = { ...this.currentSession.user, ...updatedUser };
      this.storeSession(this.currentSession);
      this.emit('profile_updated', this.currentSession.user);
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      const api = (await import('../api/apiService')).default;
      await api.post('auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      this.handleLogout();
    }
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
      listeners.forEach(listener => listener(data));
    }
  }
}

export default AuthService.getInstance();