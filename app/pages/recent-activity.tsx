"use client";

import { useState, useMemo, useEffect } from 'react';
import api from '@/app/api/apiService'; 

const ModalBackdrop = ({ children, onClose }: { children: React.ReactNode; onClose: () => void; }) => (
  <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300"
    onClick={onClose} 
  >
    <div 
      className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300"
      onClick={e => e.stopPropagation()} 
    >
      {children}
    </div>
  </div>
);

// Modal for Securing Account with multi-step logic
const SecureAccountModal = ({ onClose }: { onClose: () => void; }) => {
  const [step, setStep] = useState('main');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const handlePasswordSave = async () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await api.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (response.data.success) {
        alert('Password updated successfully! For your security, you have been logged out.');
        window.location.href = '/login';
      } else {
        throw new Error(response.data.message || 'Password update failed.');
      }
    } catch (error: any) {
      const errorMessage = error.data?.message || error.message || "An unknown error occurred.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnable2FA = () => {
    alert('2-Factor Authentication has been enabled! (Frontend simulation)');
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 'changePassword':
        return (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-4">
              <button 
            onClick={() => setStep('main')}className="text-gray-500 hover:text-gray-800 transition-colors">
            <i className="bi bi-arrow-left-circle-fill text-2xl"></i>
            </button>

              <h2 className="text-xl font-bold text-gray-900">Change Your Password</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">Enter your current password and a new one.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full mt-1 border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F20C8F] transition-all" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full mt-1 border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F20C8F] transition-all" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Confirm New Password</label>
                <input type="password" placeholder="••••••••" className="w-full mt-1 border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F20C8F] transition-all" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
            </div>
            <button
              onClick={handlePasswordSave}
              className="mt-8 w-full cursor-pointer bg-gradient-to-r from-[#F20C8F] to-[#F20C8F]/90 text-white px-4 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              {isSaving ? 'Saving...' : 'Save Password'}
            </button>
          </div>
        );
      case 'enable2FA':
        return (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => setStep('main')} className="text-gray-500 hover:text-gray-800 transition-colors">
                <i className="bi bi-arrow-left-circle-fill text-2xl"></i>
              </button>
              <h2 className="text-xl font-bold text-gray-900">Enable 2-Factor Authentication</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">Scan the QR code with your authenticator app, then enter the code below.</p>
            <div className="flex justify-center p-4 bg-gray-100 rounded-lg border">
                <i className="bi bi-qr-code text-8xl text-gray-700"></i>
            </div>
             <div className="mt-6">
                <label className="text-xs font-semibold text-gray-600">Verification Code</label>
                <input type="text" placeholder="Enter 6-digit code" maxLength={6} className="w-full mt-1 border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F20C8F] transition-all" />
              </div>
            <button
              onClick={handleEnable2FA}
              className="mt-8 w-full cursor-pointer bg-gradient-to-r from-[#F20C8F] to-[#F20C8F]/90 text-white px-4 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Verify & Enable
            </button>
          </div>
        );
      default: // 'main' step
        return (
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Secure Your Account</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <i className="bi bi-x-lg text-xl"></i>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">We recommend taking the following steps to ensure your account is safe.</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                <i className="bi bi-key-fill text-xl text-[#083A85]"></i>
                <div>
                  <h3 className="font-semibold text-gray-800">Change Your Password</h3>
                  <p className="text-xs text-gray-500">Use a strong, unique password.</p>
                </div>
                <button onClick={() => setStep('changePassword')} className="ml-auto cursor-pointer text-sm font-semibold text-[#F20C8F] hover:text-[#F20C8F]/80 whitespace-nowrap">Change</button>
              </div>
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                <i className="bi bi-shield-check-fill text-xl text-[#083A85]"></i>
                <div>
                  <h3 className="font-semibold text-gray-800">Enable 2-Factor Authentication</h3>
                  <p className="text-xs text-gray-500">Add an extra layer of security.</p>
                </div>
                <button onClick={() => setStep('enable2FA')} className="ml-auto cursor-pointer text-sm font-semibold text-[#F20C8F] hover:text-[#F20C8F]/80 whitespace-nowrap">Enable</button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-8 w-full cursor-pointer bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-semibold transition-all"
            >
              Done
            </button>
          </div>
        );
    }
  };

  return <ModalBackdrop onClose={onClose}>{renderStep()}</ModalBackdrop>;
};

// Modal for Logging Out
const LogoutAllSessionsModal = ({ onClose }: { onClose: () => void; }) => {
  // ADDED: Loading state
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ADDED: Async handler for the logout action
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await api.logoutAllDevices();
      if (response.data.success) {
        alert('You have been logged out from all sessions.');
        window.location.href = '/login';
      } else {
        throw new Error(response.data.message || 'Logout failed.');
      }
    } catch (error: any) {
      const errorMessage = error.data?.message || error.message || "An unknown error occurred.";
      alert(`Error: ${errorMessage}`);
      setIsLoggingOut(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="p-6 sm:p-8 text-center">
          <i className="bi bi-box-arrow-right text-4xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-bold text-gray-900">Log Out of All Sessions?</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6 max-w-sm mx-auto">
              This will log you out from all devices, including this one. You will need to sign in again everywhere. Are you sure?
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
              <button 
                  onClick={onClose} 
                  className="flex-1 cursor-pointer bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-all duration-200"
              >
                  Cancel
              </button>
              <button 
                  onClick={handleConfirmLogout}
                  className="flex-1 cursor-pointer bg-[#F20C8F] text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-200"
 >
                  {isLoggingOut ? 'Logging out...' : 'Confirm & Log Out'}
              </button>
          </div>
      </div>
    </ModalBackdrop>
  );
};


// --- INTERFACES & MOCK DATA (Updated) ---
type ActivityStatus = 'normal' | 'review' | 'risky';
type ActivityType = 'Login' | 'Logout' | 'AccountChange' | 'Security';
interface ActivityLog { id: string; type: ActivityType; status: ActivityStatus; description: string; timestamp: string; device?: string; location?: string; ipAddress?: string; details?: string; }
interface LastLoginInfo { timestamp: string; device: string; browser: string; location: string; ipAddress: string; }
const mockLastLogin: LastLoginInfo = { timestamp: new Date().toISOString(), device: 'Desktop', browser: 'Chrome on Windows 11', location: 'Kigali, Rwanda', ipAddress: '197.243.30.14', };
const mockActivityLogs: ActivityLog[] = [ { id: '1', type: 'Login', status: 'normal', description: 'Successful login', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), device: 'Desktop', location: 'Kigali, RW', ipAddress: '197.243.30.14' },  { id: '3', type: 'Security', status: 'review', description: 'Password changed', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), device: 'Mobile', location: 'Nairobi, KE', ipAddress: '102.68.77.12' },  { id: '5', type: 'Login', status: 'review', description: 'Login from a new device', timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), device: 'Mobile', location: 'Nairobi, KE', ipAddress: '102.68.77.12' }, { id: '6', type: 'AccountChange', status: 'normal', description: 'Profile address updated', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), details: 'Address changed to Kigali' }, { id: '7', type: 'Login', status: 'risky', description: 'Failed login attempt', timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), device: 'Unknown', location: 'Lagos, NG', ipAddress: '41.138.188.45' }, ];

// --- HELPER FUNCTIONS (Updated) ---
const formatDate = (dateString: string) => { if (!dateString) return 'N/A'; return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); };
const getActivityIcon = (type: ActivityType) => { const iconColor = "text-gray-600"; const icons: Record<ActivityType, string> = { Login: 'bi-box-arrow-in-right', Logout: 'bi-box-arrow-right', AccountChange: 'bi-person-badge', Security: 'bi-shield-lock', }; return <i className={`bi ${icons[type]} ${iconColor} text-lg`}></i>; };
const getActivityColor = (status: ActivityStatus) => { const colors = { normal: { iconBg: 'bg-gray-100', border: 'border-green-500', text: 'text-green-700', bg: 'bg-green-50', }, review: { iconBg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', }, risky: { iconBg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700', bg: 'bg-red-50', } }; return colors[status]; };

// --- MAIN COMPONENT ---

export default function AccountActivityPage() {
  // CHANGED: Removed mock data and added state for live data, loading, and errors
  const [lastLogin, setLastLogin] = useState<LastLoginInfo | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to manage modal visibility
  const [isSecureModalOpen, setIsSecureModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const tabs = ['All', 'Logins', 'Account Changes'];
  const [activeTab, setActiveTab] = useState<string>('All');

  const filteredActivities = useMemo(() => {
    if (activeTab === 'All') return activities;
    if (activeTab === 'Logins') return activities.filter(a => a.type === 'Login' || a.type === 'Logout' || a.type === 'Security');
    if (activeTab === 'Account Changes') return activities.filter(a => a.type === 'AccountChange');
    return [];
  }, [activeTab, activities]);
  
  // Effect to prevent body scroll when a modal is open
  useEffect(() => {
    if (isSecureModalOpen || isLogoutModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup function to reset scroll on component unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSecureModalOpen, isLogoutModalOpen]);

  // ADDED: useEffect to fetch data from the backend when the component loads
  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setIsLoading(true);
        const response = await api.getUserSessions();

        if (response.data.success) {
          const sessions = response.data.data;

          if (sessions && sessions.length > 0) {
            const latestSession = sessions[0];
            setLastLogin({
              timestamp: latestSession.lastActivity,
              device: latestSession.device || 'Unknown Device',
              browser: latestSession.browser || 'Unknown Browser',
              location: latestSession.location || 'Unknown Location',
              ipAddress: latestSession.ipAddress || 'N/A',
            });

            const formattedActivities = sessions.map((session: any) => ({
              id: session.id.toString(),
              type: 'Login' as ActivityType,
              status: 'normal' as ActivityStatus,
              description: `Login via ${session.browser || 'Unknown'}`,
              timestamp: session.createdAt,
              device: session.device,
              location: session.location,
              ipAddress: session.ipAddress,
            }));
            setActivities(formattedActivities);
          }
        } else {
          throw new Error(response.data.message || 'Failed to fetch data');
        }
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch activity:", err);
        setError(err.message || "Could not load your account activity.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivityData();
  }, []);

  return (
    <>
      <div className="bg-gray-50 min-h-screen pt-20">
        <main className="container mx-auto px-4 sm:px-6 py-8">
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Review Account Activity</h1>
              <p className="mt-2 text-sm text-gray-500">Track your logins and account changes to keep your account secure.</p>
            </div>

            {/* Top Summary Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6 grid md:grid-cols-2 gap-8 items-center">
                {/* CHANGED: Render last login info only if it exists */}
                {lastLogin ? (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Last login</h3>
                    <p className="text-sm text-gray-500 mb-4">{formatDate(lastLogin.timestamp)}</p>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <i className="bi bi-browser text-[#083A85] text-xl"></i>
                        <span className="text-gray-800">{lastLogin.browser}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <i className="bi bi-geo-alt text-[#083A85] text-xl"></i>
                        <span className="text-gray-800">{lastLogin.location} ({lastLogin.ipAddress})</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent login activity found.</p>
                )}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                  <p className="text-sm text-gray-700 font-medium">Don't recognize this activity? Take steps to protect your account now.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => setIsSecureModalOpen(true)}
                      className="flex-1 cursor-pointer bg-gradient-to-r from-[#F20C8F] to-[#F20C8F]/90 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 text-sm flex items-center justify-center gap-2"
                    >
                      <i className="bi bi-shield-lock-fill"></i>
                      Secure Account
                    </button>
                    <button 
                      onClick={() => setIsLogoutModalOpen(true)}
                      className="flex-1 cursor-pointer bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm"
                    >
                      Log out of all other sessions
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs and Activity Timeline (Updated) */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-6">
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {tabs.map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`cursor-pointer whitespace-nowrap pb-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
                          activeTab === tab
                            ? 'border-[#F20C8F] text-[#F20C8F]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="space-y-4">
                  {filteredActivities.length > 0 ? filteredActivities.map(log => {
                    const colors = getActivityColor(log.status);
                    return (
                      <div key={log.id} className={`p-4 rounded-lg bg-white border ${colors.border.replace('border-', 'border-l-4 border-')} border-gray-200 flex items-start gap-4`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colors.iconBg}`}>
                          {getActivityIcon(log.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <p className="font-semibold text-gray-800">{log.description}</p>
                              <p className="text-sm text-gray-500">{formatDate(log.timestamp)}</p>
                            </div>
                            <div className={`hidden sm:inline-flex items-center gap-2 text-xs font-bold px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                              <div className={`w-2 h-2 rounded-full ${colors.border.replace('border-','bg-')}`}></div>
                              {log.status.toUpperCase()}
                            </div>
                          </div>
                          {(log.location || log.details) && (
                            <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200 space-y-1">
                              {log.location && <p><span className="font-medium">Location:</span> {log.location} (IP: {log.ipAddress})</p>}
                              {log.details && <p><span className="font-medium">Details:</span> {log.details}</p>}
                            </div>
                          )}
                        </div>
                        {log.status !== 'normal' && (
                          <button className="cursor-pointer self-center text-xs text-gray-500 hover:text-red-600 font-semibold transition-colors whitespace-nowrap">
                            Report Activity
                          </button>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="text-center py-12">
                      <i className="bi bi-info-circle text-4xl text-gray-400"></i>
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">No activity</h3>
                      <p className="mt-1 text-sm text-gray-500">There is no activity to show for this category.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Render Modals Conditionally */}
      {isSecureModalOpen && <SecureAccountModal onClose={() => setIsSecureModalOpen(false)} />}
      {isLogoutModalOpen && <LogoutAllSessionsModal onClose={() => setIsLogoutModalOpen(false)} />}
    </>
  );
}