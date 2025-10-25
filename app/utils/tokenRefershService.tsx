// tokenRefreshService.ts - Automatic token refresh and session management
// This service manages:
// 1. Automatic token refresh every 14 minutes
// 2. 4-hour maximum session duration
// 3. 15-minute idle timeout detection
// 4. Token refresh on 401 errors

import api from '@/app/api/apiService';

interface TokenRefreshConfig {
  refreshIntervalMinutes: number;  // How often to refresh (default: 14 minutes)
  maxSessionHours: number;         // Maximum session duration (default: 4 hours)
  idleTimeoutMinutes: number;      // Idle timeout (default: 15 minutes)
}

interface SessionData {
  loginTime: number;
  lastActivityTime: number;
  lastRefreshTime: number;
  refreshCount: number;
}

class TokenRefreshService {
  private refreshIntervalId: NodeJS.Timeout | null = null;
  private idleCheckIntervalId: NodeJS.Timeout | null = null;
  private isRefreshing: boolean = false;
  private config: TokenRefreshConfig;
  private sessionData: SessionData | null = null;
  private onSessionExpired: ((reason: string) => void) | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config?: Partial<TokenRefreshConfig>) {
    this.config = {
      refreshIntervalMinutes: config?.refreshIntervalMinutes || 14,
      maxSessionHours: config?.maxSessionHours || 4,
      idleTimeoutMinutes: config?.idleTimeoutMinutes || 15,
    };
  }

  /**
   * Initialize the token refresh service after user login
   */
  public initialize(): void {
    const authToken = this.getAuthToken();

    if (!authToken) {
      console.warn('[TokenRefreshService] No auth token found. Service not initialized.');
      return;
    }

    // Initialize or restore session data
    this.initializeSessionData();

    // Start automatic token refresh
    this.startAutoRefresh();

    // Start idle timeout monitoring
    this.startIdleTimeoutMonitoring();

    // Add activity listeners
    this.addActivityListeners();

    console.log('[TokenRefreshService] Initialized successfully', {
      refreshInterval: `${this.config.refreshIntervalMinutes} minutes`,
      maxSession: `${this.config.maxSessionHours} hours`,
      idleTimeout: `${this.config.idleTimeoutMinutes} minutes`,
    });
  }

  /**
   * Start or reinitialize session after login
   */
  public startSession(): void {
    const now = Date.now();

    this.sessionData = {
      loginTime: now,
      lastActivityTime: now,
      lastRefreshTime: now,
      refreshCount: 0,
    };

    // Store session data in localStorage
    this.saveSessionData();

    // Initialize the service
    this.initialize();
  }

  /**
   * Stop the token refresh service (on logout)
   */
  public stop(): void {
    // Clear all intervals
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
    }

    if (this.idleCheckIntervalId) {
      clearInterval(this.idleCheckIntervalId);
      this.idleCheckIntervalId = null;
    }

    // Remove activity listeners
    this.removeActivityListeners();

    // Clear session data
    this.sessionData = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sessionData');
    }

    console.log('[TokenRefreshService] Stopped');
  }

  /**
   * Set callback for session expiry
   */
  public setSessionExpiredCallback(callback: (reason: string) => void): void {
    this.onSessionExpired = callback;
  }

  /**
   * Manually trigger a token refresh
   * Returns true if refresh was successful, false otherwise
   */
  public async refreshToken(): Promise<boolean> {
    // If already refreshing, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Check if session has exceeded maximum duration
    if (this.hasSessionExceededMaxDuration()) {
      this.handleSessionExpiry('Maximum session duration reached (4 hours)');
      return false;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;

    return result;
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing) {
      console.log('[TokenRefreshService] Refresh already in progress');
      return false;
    }

    this.isRefreshing = true;

    try {
      const refreshToken = this.getRefreshToken();

      if (!refreshToken) {
        console.error('[TokenRefreshService] No refresh token available');
        this.handleSessionExpiry('No refresh token available');
        return false;
      }

      console.log('[TokenRefreshService] Refreshing token...');

      // Call the refresh endpoint
      const response = await api.post('/auth/refresh-token', {
        refreshToken
      });

      if (response.data?.success && response.data?.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Update tokens
        localStorage.setItem('authToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Update session data
        if (this.sessionData) {
          this.sessionData.lastRefreshTime = Date.now();
          this.sessionData.refreshCount += 1;
          this.saveSessionData();
        }

        console.log('[TokenRefreshService] Token refreshed successfully', {
          refreshCount: this.sessionData?.refreshCount,
          sessionAge: this.getSessionAge(),
        });

        return true;
      } else {
        console.error('[TokenRefreshService] Invalid refresh response', response);
        this.handleSessionExpiry('Invalid refresh token response');
        return false;
      }
    } catch (error: any) {
      console.error('[TokenRefreshService] Token refresh failed', error);

      // Check if it's a 401 or 403 error (invalid refresh token)
      if (error?.status === 401 || error?.status === 403 || error?.response?.status === 401 || error?.response?.status === 403) {
        this.handleSessionExpiry('Refresh token expired or invalid');
      }

      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Start automatic token refresh interval
   */
  private startAutoRefresh(): void {
    // Clear existing interval if any
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }

    const intervalMs = this.config.refreshIntervalMinutes * 60 * 1000;

    this.refreshIntervalId = setInterval(async () => {
      console.log('[TokenRefreshService] Auto-refresh triggered');
      await this.refreshToken();
    }, intervalMs);

    console.log(`[TokenRefreshService] Auto-refresh scheduled every ${this.config.refreshIntervalMinutes} minutes`);
  }

  /**
   * Start idle timeout monitoring
   */
  private startIdleTimeoutMonitoring(): void {
    // Clear existing interval if any
    if (this.idleCheckIntervalId) {
      clearInterval(this.idleCheckIntervalId);
    }

    // Check every minute if user has been idle
    this.idleCheckIntervalId = setInterval(() => {
      this.checkIdleTimeout();
    }, 60 * 1000); // Check every minute

    console.log(`[TokenRefreshService] Idle timeout monitoring started (${this.config.idleTimeoutMinutes} minutes)`);
  }

  /**
   * Check if user has been idle for too long
   * Only logs out if user has been completely idle for 15 minutes straight
   */
  private checkIdleTimeout(): void {
    if (!this.sessionData) return;

    const now = Date.now();
    const idleTimeMs = now - this.sessionData.lastActivityTime;
    const idleTimeMinutes = idleTimeMs / (60 * 1000);

    // Only logout if BOTH conditions are met:
    // 1. User has been idle for more than 15 minutes
    // 2. No activity detected at all during this time
    if (idleTimeMinutes >= this.config.idleTimeoutMinutes) {
      console.log(`[TokenRefreshService] User idle for ${idleTimeMinutes.toFixed(1)} minutes - logging out`);
      this.handleSessionExpiry(`Session expired due to ${this.config.idleTimeoutMinutes} minutes of complete inactivity`);
    }
  }

  /**
   * Check if session has exceeded maximum duration
   */
  private hasSessionExceededMaxDuration(): boolean {
    if (!this.sessionData) return false;

    const now = Date.now();
    const sessionDurationMs = now - this.sessionData.loginTime;
    const sessionDurationHours = sessionDurationMs / (60 * 60 * 1000);

    return sessionDurationHours >= this.config.maxSessionHours;
  }

  /**
   * Get session age in human-readable format
   */
  private getSessionAge(): string {
    if (!this.sessionData) return 'N/A';

    const ageMs = Date.now() - this.sessionData.loginTime;
    const ageMinutes = Math.floor(ageMs / (60 * 1000));
    const ageHours = Math.floor(ageMinutes / 60);
    const remainingMinutes = ageMinutes % 60;

    if (ageHours > 0) {
      return `${ageHours}h ${remainingMinutes}m`;
    }
    return `${ageMinutes}m`;
  }

  /**
   * Update last activity time
   */
  private updateActivity(): void {
    if (this.sessionData) {
      this.sessionData.lastActivityTime = Date.now();
      this.saveSessionData();
    }
  }

  /**
   * Add event listeners for user activity
   */
  private addActivityListeners(): void {
    if (typeof window === 'undefined') return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach(event => {
      window.addEventListener(event, this.handleActivity, { passive: true });
    });
  }

  /**
   * Remove event listeners for user activity
   */
  private removeActivityListeners(): void {
    if (typeof window === 'undefined') return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach(event => {
      window.removeEventListener(event, this.handleActivity);
    });
  }

  /**
   * Handle user activity
   */
  private handleActivity = (): void => {
    this.updateActivity();
  };

  /**
   * Initialize or restore session data from localStorage
   */
  private initializeSessionData(): void {
    if (typeof window === 'undefined') return;

    const storedData = localStorage.getItem('sessionData');

    if (storedData) {
      try {
        this.sessionData = JSON.parse(storedData);

        // Check if session is still valid
        if (this.hasSessionExceededMaxDuration()) {
          console.log('[TokenRefreshService] Stored session exceeded max duration, starting fresh');
          this.startSession();
        } else {
          console.log('[TokenRefreshService] Restored session data', {
            sessionAge: this.getSessionAge(),
            refreshCount: this.sessionData?.refreshCount,
          });
        }
      } catch (error) {
        console.error('[TokenRefreshService] Failed to parse session data', error);
        this.startSession();
      }
    } else {
      this.startSession();
    }
  }

  /**
   * Save session data to localStorage
   */
  private saveSessionData(): void {
    if (typeof window === 'undefined' || !this.sessionData) return;

    try {
      localStorage.setItem('sessionData', JSON.stringify(this.sessionData));
    } catch (error) {
      console.error('[TokenRefreshService] Failed to save session data', error);
    }
  }

  /**
   * Handle session expiry
   */
  private handleSessionExpiry(reason: string): void {
    console.log('[TokenRefreshService] Session expired:', reason);

    // Clear tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }

    // Stop the service
    this.stop();

    // Trigger callback
    if (this.onSessionExpired) {
      this.onSessionExpired(reason);
    }
  }

  /**
   * Get auth token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  /**
   * Get refresh token from localStorage
   */
  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  /**
   * Get current session information
   */
  public getSessionInfo(): SessionData | null {
    return this.sessionData ? { ...this.sessionData } : null;
  }

  /**
   * Check if service is running
   */
  public isRunning(): boolean {
    return this.refreshIntervalId !== null && this.idleCheckIntervalId !== null;
  }
}

// Export singleton instance
export const tokenRefreshService = new TokenRefreshService();
export default tokenRefreshService;
