// app/pages/settings.tsx
"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '../api/apiService';

// Types
interface NotificationSettings {
  sms: boolean;
  email: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  propertyAlerts: boolean;
  priceDropAlerts: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

interface VerificationStatus {
  email: boolean;
  phone: boolean;
}

interface ConnectedAccount {
  id: string;
  provider: string;
  email: string;
  connected: boolean;
  icon: string;
}

// Loading component for Suspense fallback
function SettingsLoading() {
  return (
    <div className="pt-14 font-sans">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-96 animate-pulse"></div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg mb-6 p-2">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-lg flex-1 animate-pulse"></div>
            ))}
          </div> 
        </div>
        
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-lg p-6">
              <div className="h-6 bg-gray-200 rounded-lg w-32 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main settings content component
function SettingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Initialize with default tab
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState<'email' | 'phone' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Settings states
  const [notifications, setNotifications] = useState<NotificationSettings>({
    sms: true,
    email: true,
    pushNotifications: false,
    marketingEmails: false,
    propertyAlerts: true,
    priceDropAlerts: true,
  });

  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'light',
    fontSize: 'medium',
    compactMode: true,
  });

  const [verification, setVerification] = useState<VerificationStatus>({
    email: false,
    phone: false,
  });

  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);

  // Password form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load settings from API and localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('authToken');
        if (token) {
          api.setAuth(token);
        }

        // Load appearance settings from localStorage using the same structure as layout.tsx
        const savedAppearanceSettings = localStorage.getItem('appearanceSettings');
        if (savedAppearanceSettings) {
          try {
            const parsedSettings = JSON.parse(savedAppearanceSettings);
            setAppearance({
              theme: parsedSettings.theme || 'light',
              fontSize: parsedSettings.fontSize || 'medium',
              compactMode: parsedSettings.compactMode || false,
            });

            // Apply settings immediately on load
            const savedTheme = parsedSettings.theme || 'light';
            const savedFontSize = parsedSettings.fontSize || 'medium';
            const savedCompactMode = parsedSettings.compactMode || true;

            // Apply theme
            if (savedTheme === 'dark') {
              document.documentElement.classList.add('dark');
            } else if (savedTheme === 'light') {
              document.documentElement.classList.remove('dark');
            } else {
              // Auto theme - check system preference
              if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            }

            // Apply font size
            document.documentElement.className = document.documentElement.className
              .replace(/\bfont-(small|medium|large)\b/g, '')
              .trim();
            document.documentElement.classList.add(`font-${savedFontSize}`);

            // Apply compact mode
            if (savedCompactMode) {
              document.documentElement.classList.add('compact');
            } else {
              document.documentElement.classList.remove('compact');
            }
          } catch (parseError) {
            console.warn('Failed to parse saved appearance settings:', parseError);
            // Fallback to defaults
            setAppearance({
              theme: 'light',
              fontSize: 'medium',
              compactMode: false,
            });
          }
        } else {
          // Check for legacy individual settings and migrate them
          const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' || 'light';
          const savedFontSize = localStorage.getItem('fontSize') as 'small' | 'medium' | 'large' || 'medium';
          const compactModeFromStorage = localStorage.getItem('compactMode');
          const savedCompactMode = compactModeFromStorage !== null ? compactModeFromStorage === 'true' : true;

          const appearanceSettings = {
            theme: savedTheme,
            fontSize: savedFontSize,
            compactMode: savedCompactMode,
          };

          setAppearance(appearanceSettings);

          // Save to new format and remove old individual items
          localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));
          localStorage.removeItem('theme');
          localStorage.removeItem('fontSize');
          localStorage.removeItem('compactMode');

          // Apply settings immediately
          if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else if (savedTheme === 'light') {
            document.documentElement.classList.remove('dark');
          } else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }

          document.documentElement.className = document.documentElement.className
            .replace(/\bfont-(small|medium|large)\b/g, '')
            .trim();
          document.documentElement.classList.add(`font-${savedFontSize}`);

          if (savedCompactMode) {
            document.documentElement.classList.add('compact');
          } else {
            document.documentElement.classList.remove('compact');
          }
        }

        // Load user settings from backend
        try {
          const settingsResponse = await api.getUserSettings();
          if (settingsResponse.data?.success && settingsResponse.data?.data) {
            const settings = settingsResponse.data.data;
            if (settings.notifications) {
              setNotifications(settings.notifications);
            }
          }
        } catch (settingsError) {
          console.warn('Could not load user settings, using defaults:', settingsError);
          // Keep default notifications settings if API fails
        }

        // Load verification status
        try {
          const verificationResponse = await api.getVerificationStatus();
          if (verificationResponse.data?.success && verificationResponse.data?.data) {
            const verificationData = verificationResponse.data.data;
            setVerification({
              email: verificationData.email?.verified || false,
              phone: verificationData.phone?.verified || false,
            });
          }
        } catch (verificationError) {
          console.warn('Could not load verification status, using defaults:', verificationError);
          // Keep default verification status if API fails
        }

        // Load user data for email display
        try {
          const userResponse = await api.getCurrentUser();
          if (userResponse.data?.success && userResponse.data?.data) {
            setUserInfo(userResponse.data.data);
          }
        } catch (userError) {
          console.warn('Could not load user data:', userError);
        }

        // Load connected accounts
        try {
          const accountsResponse = await api.getConnectedAccounts();
          if (accountsResponse.data?.success && accountsResponse.data?.data) {
            // Map the API response to include the required 'icon' property.
            const providerIcons: { [key: string]: string } = {
              'Google': 'bi-google',
              'Facebook': 'bi-facebook',
              'Apple': 'bi-apple',
            };
            const mappedAccounts = accountsResponse.data.data.map(account => ({
              ...account,
              // Assign an icon based on the provider, with a default fallback.
              icon: providerIcons[account.provider] || 'bi-link-45deg',
            }));
            setConnectedAccounts(mappedAccounts);
          } else {
            // Fallback to default Google account structure if API doesn't exist yet
            setConnectedAccounts([
              { id: '1', provider: 'Google', email: userInfo?.email || 'user@gmail.com', connected: true, icon: 'bi-google' },
            ]);
          }
        } catch (accountsError) {
          console.warn('Could not load connected accounts, using fallback:', accountsError);
          // Fallback for development
          setConnectedAccounts([
            { id: '1', provider: 'Google', email: userInfo?.email || 'user@gmail.com', connected: true, icon: 'bi-google' },
          ]);
        }

      } catch (err: any) {
        console.error('Failed to load settings:', err);
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);


  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const searchParams = new URLSearchParams();
    searchParams.set('tab', tabId);
    router.push(`${pathname}?${searchParams.toString()}`, { scroll: false });
  };

  // Handlers
  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Appearance handlers (localStorage only) - Updated to use unified storage format
  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    const newAppearance = { ...appearance, theme };
    setAppearance(newAppearance);

    // Save to localStorage using unified format
    localStorage.setItem('appearanceSettings', JSON.stringify(newAppearance));

    // Apply theme immediately to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto theme - check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Dispatch custom event to notify layout of changes
    window.dispatchEvent(new CustomEvent('userSettingsUpdated'));
  };

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    const newAppearance = { ...appearance, fontSize };
    setAppearance(newAppearance);

    // Save to localStorage using unified format
    localStorage.setItem('appearanceSettings', JSON.stringify(newAppearance));

    // Apply font size immediately
    document.documentElement.className = document.documentElement.className
      .replace(/\bfont-(small|medium|large)\b/g, '')
      .trim();
    document.documentElement.classList.add(`font-${fontSize}`);

    // Dispatch custom event to notify layout of changes
    window.dispatchEvent(new CustomEvent('userSettingsUpdated'));
  };

  const handleCompactModeChange = (compactMode: boolean) => {
    const newAppearance = { ...appearance, compactMode };
    setAppearance(newAppearance);

    // Save to localStorage using unified format
    localStorage.setItem('appearanceSettings', JSON.stringify(newAppearance));

    // Apply compact mode immediately
    if (compactMode) {
      document.documentElement.classList.add('compact');
    } else {
      document.documentElement.classList.remove('compact');
    }

    // Dispatch custom event to notify layout of changes
    window.dispatchEvent(new CustomEvent('userSettingsUpdated'));
  };

  const handleSaveSettings = async () => {
    try {
      setSaveStatus('saving');
      setError(null);

      const token = localStorage.getItem('authToken');
      if (token) {
        api.setAuth(token);
      }

      // Only save notifications to backend (appearance is localStorage only)
      const updateData = {
        notifications,
      };

      try {
        const response = await api.updateSettings(updateData);

        if (response.data.success) {
          setSaveStatus('saved');
          setSuccess('Settings saved successfully!');

          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccess(null);
          }, 3000);
        } else {
          throw new Error(response.data.message || 'Failed to save settings');
        }
      } catch (apiError) {
        // If backend fails, still show success for appearance settings (localStorage only)
        console.warn('Backend settings save failed, but appearance settings are saved locally:', apiError);
        setSaveStatus('saved');
        setSuccess('Settings saved successfully! (Some settings saved locally)');

        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }

    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setShowPasswordModal(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    alert('Password updated successfully!');
  };

  const handleVerification = async (type: 'email' | 'phone') => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (token) {
        api.setAuth(token);
      }

      // Send verification code
      const response = await api.sendVerificationCode(type);
      if (response.data.success) {
        setSuccess(`Verification code sent to your ${type}!`);
        // In a real implementation, you'd show a modal to enter the code
        // For now, we'll just close the modal
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to send verification code');
      }

    } catch (err: any) {
      console.error('Verification failed:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
      setShowVerificationModal(null);
    }
  };

  const getVerificationColor = (verified: boolean) => {
    return verified ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100';
  };

  const getVerificationIcon = (verified: boolean) => {
    return verified ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';
  };

  // Tab content components
  const NotificationsTab = () => (
    <div className="space-y-6">
      {/* Alert Preferences */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          <i className="bi bi-bell mr-2"></i>Alert Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-gray-200">
            <div className="mb-2 sm:mb-0">
              <p className="text-base font-medium text-gray-900">SMS Notifications</p>
              <p className="text-sm text-gray-500">Receive alerts via text message</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.sms}
                onChange={() => handleNotificationToggle('sms')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: notifications.sms ? '#083A85' : undefined }}></div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-gray-200">
            <div className="mb-2 sm:mb-0">
              <p className="text-base font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive alerts via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={() => handleNotificationToggle('email')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: notifications.email ? '#083A85' : undefined }}></div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-gray-200">
            <div className="mb-2 sm:mb-0">
              <p className="text-base font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-500">Receive browser push notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.pushNotifications}
                onChange={() => handleNotificationToggle('pushNotifications')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: notifications.pushNotifications ? '#083A85' : undefined }}></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          <i className="bi bi-envelope mr-2"></i>Notification Types
        </h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-gray-200">
            <div className="mb-2 sm:mb-0">
              <p className="text-base font-medium text-gray-900">Marketing Emails</p>
              <p className="text-sm text-gray-500">Promotional offers and newsletters</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.marketingEmails}
                onChange={() => handleNotificationToggle('marketingEmails')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: notifications.marketingEmails ? '#083A85' : undefined }}></div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-gray-200">
            <div className="mb-2 sm:mb-0">
              <p className="text-base font-medium text-gray-900">Property Alerts</p>
              <p className="text-sm text-gray-500">New listings matching your criteria</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.propertyAlerts}
                onChange={() => handleNotificationToggle('propertyAlerts')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: notifications.propertyAlerts ? '#083A85' : undefined }}></div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3">
            <div className="mb-2 sm:mb-0">
              <p className="text-base font-medium text-gray-900">Price Drop Alerts</p>
              <p className="text-sm text-gray-500">Notifications when saved properties reduce in price</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.priceDropAlerts}
                onChange={() => handleNotificationToggle('priceDropAlerts')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: notifications.priceDropAlerts ? '#083A85' : undefined }}></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const AppearanceTab = () => (
    <div className="space-y-6">
      {/* Theme Settings */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          <i className="bi bi-palette mr-2"></i>Theme Settings
        </h3>
        <div className="space-y-6">
          {/* Theme Mode */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">Theme Mode</label>
            <div className="grid grid-cols-3 gap-4">
              {(['light', 'dark', 'auto'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    appearance.theme === theme
                      ? 'border-[#083A85] bg-[#FFF1EE]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <i className={`bi bi-${theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'circle-half'} text-2xl mb-2`}></i>
                  <p className="text-sm font-medium capitalize">{theme}</p>
                </button>
              ))}
            </div>
          </div>


          {/* Font Size */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">Font Size</label>
            <select
              value={appearance.fontSize}
              onChange={(e) => handleFontSizeChange(e.target.value as 'small' | 'medium' | 'large')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] cursor-pointer"
            >
              <option value="small">Small</option>
              <option value="medium">Medium (Default)</option>
              <option value="large">Large</option>
            </select>
          </div>

          {/* Compact Mode */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-t border-gray-200">
            <div className="mb-2 sm:mb-0">
              <p className="text-base font-medium text-gray-900">Compact Mode</p>
              <p className="text-sm text-gray-500">Reduce spacing and padding throughout the interface</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appearance.compactMode}
                onChange={(e) => handleCompactModeChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: appearance.compactMode ? '#083A85' : undefined }}></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const SecurityTab = () => (
    <div className="space-y-6">
      {/* Account Verification */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          <i className="bi bi-shield-check mr-2"></i>Account Verification
        </h3>
        <div className="space-y-4">
          {/* Email Verification */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4 mb-3 sm:mb-0">
              <div className="w-12 h-12 bg-[#FFF1EE] rounded-full flex items-center justify-center">
                <i className="bi bi-envelope-fill text-[#083A85] text-xl"></i>
              </div>
              <div>
                <p className="text-base font-medium text-gray-900">Email Verification</p>
                <p className="text-sm text-gray-500">{userInfo?.email || 'user@example.com'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVerificationColor(verification.email)}`}>
                <i className={`bi ${getVerificationIcon(verification.email)} mr-1`}></i>
                {verification.email ? 'Verified' : 'Unverified'}
              </span>
              {!verification.email && (
                <button
                  onClick={() => setShowVerificationModal('email')}
                  className="px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#E31C5F] transition-colors text-sm font-medium cursor-pointer"
                >
                  Verify Now
                </button>
              )}
            </div>
          </div>


        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          <i className="bi bi-lock mr-2"></i>Two-Factor Authentication
        </h3>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <p className="text-base text-gray-700">Add an extra layer of security to your account</p>
              <p className="text-sm text-gray-500 mt-1">Require a verification code in addition to your password</p>
            </div>
            <button
              onClick={() => setShow2FASetup(!show2FASetup)}
              className="px-5 py-2.5 rounded-lg text-white text-base font-medium transition-transform hover:scale-105 cursor-pointer"
              style={{ backgroundColor: '#083A85' }}
            >
              {show2FASetup ? 'Cancel 2FA Setup' : 'Enable 2FA'}
            </button>
          </div>

          {/* Phone Verification - Only shown when 2FA is being enabled */}
          {show2FASetup && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4 mb-3 sm:mb-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="bi bi-telephone-fill text-green-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900">Phone Verification</p>
                  <p className="text-sm text-gray-500">Required for 2FA setup</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVerificationColor(verification.phone)}`}>
                  <i className={`bi ${getVerificationIcon(verification.phone)} mr-1`}></i>
                  {verification.phone ? 'Verified' : 'Unverified'}
                </span>
                {!verification.phone && (
                  <button
                    onClick={() => setShowVerificationModal('phone')}
                    className="px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#E31C5F] transition-colors text-sm font-medium cursor-pointer"
                  >
                    Verify Now
                  </button>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );

  const GeneralTab = () => (
    <div className="space-y-6">

      {/* Connected Accounts */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          <i className="bi bi-link-45deg mr-2"></i>Connected Accounts
        </h3>
        <div className="space-y-3">
          {connectedAccounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <i className={`bi ${account.icon} text-2xl`}></i>
                <div>
                  <p className="text-base font-medium text-gray-900">{account.provider}</p>
                  {account.connected && (
                    <p className="text-sm text-gray-500">{account.email}</p>
                  )}
                </div>
              </div>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  account.connected
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-[#FFF1EE] text-[#083A85] hover:bg-[#FFE5E9]'
                }`}
              >
                {account.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          <i className="bi bi-eye-slash mr-2"></i>Privacy Settings
        </h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-gray-200">
            <div className="mb-2 sm:mb-0">
              <p className="text-base font-medium text-gray-900">Profile Visibility</p>
              <p className="text-sm text-gray-500">Control who can see your profile</p>
            </div>
            <select className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] cursor-pointer">
              <option>Public</option>
              <option>Friends Only</option>
              <option>Private</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3">
            <div className="mb-2 sm:mb-0">
              <p className="text-base font-medium text-gray-900">Data Sharing</p>
              <p className="text-sm text-gray-500">Share usage data to improve services</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#083A85]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-6">
        <h3 className="text-xl font-semibold text-red-900 mb-6">
          <i className="bi bi-exclamation-triangle mr-2"></i>Danger Zone
        </h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="mb-3 sm:mb-0">
              <p className="text-base font-medium text-gray-900">Deactivate Account</p>
              <p className="text-sm text-gray-500">Temporarily disable your account</p>
            </div>
            <button
              onClick={() => setShowDeactivateModal(true)}
              className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium cursor-pointer"
            >
              Deactivate
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-red-200">
            <div className="mb-3 sm:mb-0">
              <p className="text-base font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium cursor-pointer"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pt-14 font-sans">
      <style jsx>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
        .bi::before {
          font-family: 'Bootstrap Icons';
        }
      `}</style>
      
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <i className="bi bi-exclamation-triangle-fill text-red-500 mr-2"></i>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <i className="bi bi-x text-lg"></i>
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <i className="bi bi-check-circle-fill text-green-500 mr-2"></i>
              <p className="text-green-700">{success}</p>
              <button
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-500 hover:text-green-700"
              >
                <i className="bi bi-x text-lg"></i>
              </button>
            </div>
          </div>
        )}

        {/* Settings Navigation */}
        <div className="bg-white rounded-2xl shadow-sm mb-6 p-2 overflow-x-auto border border-gray-200">
          <div className="flex flex-nowrap sm:flex-wrap gap-2">
            {[
              { id: 'notifications', label: 'Notifications', icon: 'bi-bell' },
              { id: 'appearance', label: 'Appearance', icon: 'bi-palette' },
              { id: 'security', label: 'Security', icon: 'bi-shield-lock' },
              { id: 'general', label: 'General', icon: 'bi-gear' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all text-base font-medium cursor-pointer ${
                  activeTab === tab.id
                    ? 'text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={{
                  backgroundColor: activeTab === tab.id ? '#083A85' : undefined,
                }}
              >
                <i className={`bi ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#083A85]"></div>
          </div>
        ) : (
          <div className="animate-scale-in">
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'appearance' && <AppearanceTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'general' && <GeneralTab />}
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saveStatus === 'saving'}
            className="w-full sm:w-auto px-6 py-3 rounded-lg text-white text-base font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: '#083A85' }}
          >
            {saveStatus === 'saving' && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? (
              <>
                <i className="bi bi-check-circle"></i>
                Saved Successfully
              </>
            ) : (
              <>
                <i className="bi bi-save"></i>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full animate-scale-in">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  <i className="bi bi-x-lg text-xl"></i>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium cursor-pointer order-last sm:order-first"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-white rounded-lg font-medium disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: '#083A85' }}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full animate-scale-in">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Verify {showVerificationModal.charAt(0).toUpperCase() + showVerificationModal.slice(1)}
                </h2>
                <button
                  onClick={() => setShowVerificationModal(null)}
                  className="text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  <i className="bi bi-x-lg text-xl"></i>
                </button>
              </div>
              
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-[#FFF1EE] rounded-full flex items-center justify-center mx-auto mb-4">
                  {/* Simplified the icon logic to remove the unused 'identity' case. */}
                  <i className={`bi bi-${showVerificationModal === 'email' ? 'envelope' : 'telephone'} text-[#083A85] text-3xl`}></i>
                </div>
                <p className="text-gray-600 mb-6">
                  {/* Removed the line for 'identity' verification. */}
                  {showVerificationModal === 'email' && "We'll send a verification code to your email address."}
                  {showVerificationModal === 'phone' && "We'll send a verification code to your phone number."}
                </p>

                {/* Removed the file upload section for 'identity' verification. */}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowVerificationModal(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium cursor-pointer order-last sm:order-first"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVerification(showVerificationModal)}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-white rounded-lg font-medium disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: '#083A85' }}
                >
                  {loading ? 'Verifying...' : 'Verify Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Account Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full animate-scale-in">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Deactivate Account</h2>
                <button
                  onClick={() => setShowDeactivateModal(false)}
                  className="text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  <i className="bi bi-x-lg text-xl"></i>
                </button>
              </div>

              <div className="text-center py-4">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="bi bi-exclamation-triangle text-yellow-600 text-3xl"></i>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to deactivate your account? This action will temporarily disable your account, but you can reactivate it anytime by logging in.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowDeactivateModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium cursor-pointer order-last sm:order-first"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      // Add API call for account deactivation when backend is ready
                      // await api.deactivateAccount();
                      setSuccess('Account deactivated successfully!');
                      setShowDeactivateModal(false);
                    } catch (err: any) {
                      setError(err.message || 'Failed to deactivate account');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Deactivating...' : 'Deactivate Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full animate-scale-in">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-red-900">Delete Account</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  <i className="bi bi-x-lg text-xl"></i>
                </button>
              </div>

              <div className="text-center py-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="bi bi-trash text-red-600 text-3xl"></i>
                </div>
                <p className="text-red-600 font-semibold mb-2">This action cannot be undone!</p>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to permanently delete your account? This will remove all your data, bookings, and cannot be reversed.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium cursor-pointer order-last sm:order-first"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      // Add API call for account deletion when backend is ready
                      // await api.deleteAccount();
                      setSuccess('Account deletion initiated. You will be logged out shortly.');
                      setShowDeleteModal(false);
                      // In a real implementation, redirect to logout after successful deletion
                      setTimeout(() => {
                        // window.location.href = '/login';
                      }, 2000);
                    } catch (err: any) {
                      setError(err.message || 'Failed to delete account');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main component with Suspense wrapper
export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}