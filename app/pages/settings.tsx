"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

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
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

interface VerificationStatus {
  email: boolean;
  phone: boolean;
  identity: boolean;
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

// Main settings content that uses useSearchParams
function SettingsContent() {
  const [mounted, setMounted] = useState(false);
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [router, setRouter] = useState<any>(null);
  const [pathname, setPathname] = useState<string>('');

  // Safely get hooks after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize hooks after mount to avoid SSR issues
  const actualSearchParams = mounted ? useSearchParams() : null;
  const actualRouter = mounted ? useRouter() : null;
  const actualPathname = mounted ? usePathname() : '';

  useEffect(() => {
    if (mounted) {
      setSearchParams(actualSearchParams);
      setRouter(actualRouter);
      setPathname(actualPathname);
    }
  }, [mounted, actualSearchParams, actualRouter, actualPathname]);
  
  // Get initial tab from URL or default to 'notifications'
  const initialTab = mounted && searchParams ? searchParams.get('tab') || 'notifications' : 'notifications';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState<'email' | 'phone' | 'identity' | null>(null);
  
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
    accentColor: '#083A85',
    fontSize: 'medium',
    compactMode: false,
  });

  const [verification, setVerification] = useState<VerificationStatus>({
    email: true,
    phone: false,
    identity: false,
  });

  const [connectedAccounts] = useState<ConnectedAccount[]>([
    { id: '1', provider: 'Google', email: 'user@gmail.com', connected: true, icon: 'bi-google' },
    { id: '2', provider: 'Facebook', email: '', connected: false, icon: 'bi-facebook' },
    { id: '3', provider: 'Apple', email: '', connected: false, icon: 'bi-apple' },
    { id: '4', provider: 'LinkedIn', email: '', connected: false, icon: 'bi-linkedin' },
  ]);

  // Password form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Theme colors
  const themeColors = [
    { name: 'Blue', value: '#083A85' },
    { name: 'Pink', value: '#F20C8F' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Teal', value: '#14B8A6' },
  ];

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (mounted && router && searchParams && pathname) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.push(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    }
  };

  // Update tab when URL changes
  useEffect(() => {
    if (mounted && searchParams) {
      const tabFromUrl = searchParams.get('tab');
      if (tabFromUrl && ['notifications', 'appearance', 'security', 'general'].includes(tabFromUrl)) {
        setActiveTab(tabFromUrl);
      }
    }
  }, [mounted, searchParams]);

  // Don't render content until mounted to avoid hydration mismatch
  if (!mounted) {
    return <SettingsLoading />;
  }

  // Handlers
  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
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

  const handleVerification = async (type: 'email' | 'phone' | 'identity') => {
    setLoading(true);
    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setVerification(prev => ({ ...prev, [type]: true }));
    setLoading(false);
    setShowVerificationModal(null);
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
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="bi bi-bell mr-2"></i>Alert Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b">
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b">
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b">
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
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="bi bi-envelope mr-2"></i>Notification Types
        </h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b">
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b">
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
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="bi bi-palette mr-2"></i>Theme Settings
        </h3>
        <div className="space-y-6">
          {/* Theme Mode */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">Theme Mode</label>
            <div className="grid grid-cols-3 gap-4">
              {['light', 'dark', 'auto'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => setAppearance(prev => ({ ...prev, theme: theme as 'light' | 'dark' | 'auto' }))}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    appearance.theme === theme
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <i className={`bi bi-${theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'circle-half'} text-2xl mb-2`}></i>
                  <p className="text-sm font-medium capitalize">{theme}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">Accent Color</label>
            <div className="grid grid-cols-6 gap-3">
              {themeColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setAppearance(prev => ({ ...prev, accentColor: color.value }))}
                  className={`relative h-12 rounded-lg transition-transform hover:scale-110 cursor-pointer ${
                    appearance.accentColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {appearance.accentColor === color.value && (
                    <i className="bi bi-check text-white absolute inset-0 flex items-center justify-center text-xl"></i>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">Font Size</label>
            <select
              value={appearance.fontSize}
              onChange={(e) => setAppearance(prev => ({ ...prev, fontSize: e.target.value as 'small' | 'medium' | 'large' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="small">Small</option>
              <option value="medium">Medium (Default)</option>
              <option value="large">Large</option>
            </select>
          </div>

          {/* Compact Mode */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-t">
            <div className="mb-2 sm:mb-0">
              <p className="text-base font-medium text-gray-900">Compact Mode</p>
              <p className="text-sm text-gray-500">Reduce spacing and padding throughout the interface</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appearance.compactMode}
                onChange={() => setAppearance(prev => ({ ...prev, compactMode: !prev.compactMode }))}
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
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="bi bi-shield-check mr-2"></i>Account Verification
        </h3>
        <div className="space-y-4">
          {/* Email Verification */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4 mb-3 sm:mb-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <i className="bi bi-envelope-fill text-blue-600 text-xl"></i>
              </div>
              <div>
                <p className="text-base font-medium text-gray-900">Email Verification</p>
                <p className="text-sm text-gray-500">user@example.com</p>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
                >
                  Verify Now
                </button>
              )}
            </div>
          </div>

          {/* Phone Verification */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4 mb-3 sm:mb-0">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <i className="bi bi-telephone-fill text-green-600 text-xl"></i>
              </div>
              <div>
                <p className="text-base font-medium text-gray-900">Phone Verification</p>
                <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
                >
                  Verify Now
                </button>
              )}
            </div>
          </div>

          {/* Identity Verification */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4 mb-3 sm:mb-0">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <i className="bi bi-person-badge-fill text-purple-600 text-xl"></i>
              </div>
              <div>
                <p className="text-base font-medium text-gray-900">Identity Verification</p>
                <p className="text-sm text-gray-500">Government-issued ID required</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVerificationColor(verification.identity)}`}>
                <i className={`bi ${getVerificationIcon(verification.identity)} mr-1`}></i>
                {verification.identity ? 'Verified' : 'Unverified'}
              </span>
              {!verification.identity && (
                <button
                  onClick={() => setShowVerificationModal('identity')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
                >
                  Verify Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="bi bi-lock mr-2"></i>Two-Factor Authentication
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="mb-4 sm:mb-0">
            <p className="text-base text-gray-700">Add an extra layer of security to your account</p>
            <p className="text-sm text-gray-500 mt-1">Require a verification code in addition to your password</p>
          </div>
          <button className="px-5 py-2.5 rounded-lg text-white text-base font-medium transition-transform hover:scale-105 cursor-pointer" style={{ backgroundColor: '#083A85' }}>
            Enable 2FA
          </button>
        </div>
      </div>
    </div>
  );

  const GeneralTab = () => (
    <div className="space-y-6">
      {/* Password Settings */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="bi bi-key mr-2"></i>Password Settings
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="mb-4 sm:mb-0">
            <p className="text-base text-gray-700">Update your password</p>
            <p className="text-sm text-gray-500 mt-1">Last changed: 45 days ago</p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-5 py-2.5 rounded-lg text-white text-base font-medium transition-transform hover:scale-105 cursor-pointer"
            style={{ backgroundColor: '#083A85' }}
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="bi bi-link-45deg mr-2"></i>Connected Accounts
        </h3>
        <div className="space-y-3">
          {connectedAccounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                    ? 'bg-red-200 text-red-700 hover:bg-red-300'
                    : 'bg-blue-200 text-blue-700 hover:bg-blue-300'
                }`}
              >
                {account.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="bi bi-eye-slash mr-2"></i>Privacy Settings
        </h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b">
            <div className="mb-2 sm:mb-0">
              <p className="text-base font-medium text-gray-900">Profile Visibility</p>
              <p className="text-sm text-gray-500">Control who can see your profile</p>
            </div>
            <select className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option>Public</option>
              <option>Friends Only</option>
              <option>Private</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b">
            <div className="mb-2 sm:mb-0">
              <p className="text-base font-medium text-gray-900">Show Activity Status</p>
              <p className="text-sm text-gray-500">Let others see when you're online</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#083A85]"></div>
            </label>
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4">
          <i className="bi bi-exclamation-triangle mr-2"></i>Danger Zone
        </h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="mb-3 sm:mb-0">
              <p className="text-base font-medium text-gray-900">Deactivate Account</p>
              <p className="text-sm text-gray-500">Temporarily disable your account</p>
            </div>
            <button className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium cursor-pointer">
              Deactivate
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-red-200">
            <div className="mb-3 sm:mb-0">
              <p className="text-base font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium cursor-pointer">
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
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Settings Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-6 p-2 overflow-x-auto">
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
                    ? 'text-white shadow-lg'
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
        <div className="animate-scale-in">
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'appearance' && <AppearanceTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'general' && <GeneralTab />}
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saveStatus === 'saving'}
            className="w-full sm:w-auto px-6 py-3 rounded-lg text-white text-base font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: '#F20C8F' }}
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
          <div className="bg-white rounded-lg max-w-md w-full animate-scale-in">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="bg-white rounded-lg max-w-md w-full animate-scale-in">
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
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className={`bi bi-${showVerificationModal === 'email' ? 'envelope' : showVerificationModal === 'phone' ? 'telephone' : 'person-badge'} text-blue-600 text-3xl`}></i>
                </div>
                <p className="text-gray-600 mb-6">
                  {showVerificationModal === 'email' && "We'll send a verification code to your email address."}
                  {showVerificationModal === 'phone' && "We'll send a verification code to your phone number."}
                  {showVerificationModal === 'identity' && "Please upload a government-issued ID to verify your identity."}
                </p>
                
                {showVerificationModal === 'identity' && (
                  <div className="mb-6">
                    <label className="block px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                      <i className="bi bi-cloud-upload text-3xl text-gray-400"></i>
                      <p className="mt-2 text-sm text-gray-600">Click to upload ID</p>
                      <input type="file" className="hidden" accept="image/*" />
                    </label>
                  </div>
                )}
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