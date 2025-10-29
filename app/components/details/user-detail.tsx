'use client';

import React, { useEffect, useState } from 'react';
import api from '@/app/api/apiService';

interface UserDetailProps {
  id: string;
}

interface UserProfile {
  id: number | string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneCountryCode?: string;
  profile?: string | null;
  country?: string;
  city?: string;
  street?: string;
  zipCode?: string;
  status?: string;
  userType?: string;
  kingdom?: string;
}

export default function UserDetail({ id }: UserDetailProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        // If viewing own profile (no id or id matches current user), fetch current user
        const response = await api.getCurrentUser();

        if (response.ok && response.data.success) {
          setUser(response.data.data);
        } else {
          setError(response.data.message || 'Failed to load user profile');
        }
      } catch (err: any) {
        console.error('Error fetching user:', err);
        setError(err.message || 'An error occurred while loading user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'active' || statusLower === 'verified') return 'bg-green-100 text-green-800';
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (statusLower === 'suspended' || statusLower === 'banned') return 'bg-red-100 text-red-800';
    if (statusLower === 'inactive') return 'bg-gray-100 text-gray-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'host':
        return 'bg-purple-100 text-purple-800';
      case 'guest':
        return 'bg-blue-100 text-blue-800';
      case 'agent':
        return 'bg-green-100 text-green-800';
      case 'tourguide':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'host':
        return 'bi-house-door';
      case 'guest':
        return 'bi-person';
      case 'agent':
        return 'bi-briefcase';
      case 'tourguide':
        return 'bi-compass';
      default:
        return 'bi-person-circle';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading user profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <i className="bi bi-exclamation-triangle text-3xl text-red-600"></i>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Error Loading User Profile
                </h3>
                <p className="text-red-800">{error || 'User not found'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Profile Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Profile Header with Image */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {user.profile ? (
              <img
                src={user.profile}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                <i className="bi bi-person-fill text-5xl text-gray-500"></i>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {user.userType && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUserTypeColor(user.userType)}`}>
                    <i className={`bi ${getUserTypeIcon(user.userType)} mr-1`}></i>
                    {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
                  </span>
                )}
                {user.status && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="bi bi-person-vcard mr-2"></i>
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-600 block mb-1">User ID</label>
              <p className="text-base font-mono text-gray-900">{user.id}</p>
            </div>

            {(user.firstName || user.lastName) && (
              <div>
                <label className="text-sm text-gray-600 block mb-1">Full Name</label>
                <p className="text-base text-gray-900">{user.firstName} {user.lastName}</p>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-600 block mb-1">Email Address</label>
              <p className="text-base text-gray-900">
                <i className="bi bi-envelope mr-1"></i>
                {user.email}
              </p>
            </div>

            {user.phone && (
              <div>
                <label className="text-sm text-gray-600 block mb-1">Phone Number</label>
                <p className="text-base text-gray-900">
                  <i className="bi bi-telephone mr-1"></i>
                  {user.phoneCountryCode ? `${user.phoneCountryCode} ` : ''}{user.phone}
                </p>
              </div>
            )}

            {user.kingdom && (
              <div>
                <label className="text-sm text-gray-600 block mb-1">Kingdom</label>
                <p className="text-base text-gray-900">{user.kingdom}</p>
              </div>
            )}
          </div>
        </div>

        {/* Address Information */}
        {(user.country || user.city || user.street || user.zipCode) && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="bi bi-geo-alt mr-2"></i>
              Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user.street && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Street</label>
                  <p className="text-base text-gray-900">{user.street}</p>
                </div>
              )}

              {user.city && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">City</label>
                  <p className="text-base text-gray-900">{user.city}</p>
                </div>
              )}

              {user.zipCode && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Zip Code</label>
                  <p className="text-base text-gray-900">{user.zipCode}</p>
                </div>
              )}

              {user.country && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Country</label>
                  <p className="text-base text-gray-900">{user.country}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account Type Information */}
        {(user.userType || user.status) && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="bi bi-shield-check mr-2"></i>
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user.userType && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Account Type</label>
                  <div className="flex items-center gap-2">
                    <i className={`bi ${getUserTypeIcon(user.userType)} text-xl`}></i>
                    <p className="text-base text-gray-900 capitalize">{user.userType}</p>
                  </div>
                </div>
              )}

              {user.status && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Account Status</label>
                  <p className="text-base text-gray-900 capitalize">{user.status}</p>
                </div>
              )}
            </div>

            {/* Account Type Description */}
            {user.userType && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <i className={`bi ${getUserTypeIcon(user.userType)} text-2xl text-blue-600`}></i>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">
                      {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)} Account
                    </h4>
                    <p className="text-sm text-blue-800">
                      {user.userType === 'host' && 'This account can list properties and manage bookings as a property owner.'}
                      {user.userType === 'guest' && 'This account can book properties and tours as a guest.'}
                      {user.userType === 'agent' && 'This account can manage properties and bookings on behalf of hosts.'}
                      {user.userType === 'tourguide' && 'This account can offer and manage tour experiences.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
