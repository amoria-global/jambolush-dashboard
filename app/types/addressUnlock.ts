/**
 * Address Unlock Feature - Type Definitions
 * JamboLush Property Address Unlock System
 */

// Payment method types
export type PaymentMethod = 'non_refundable' | 'monthly_booking' | 'deal_code';

// Unlock status
export type UnlockStatus = 'locked' | 'unlocked' | 'pending' | 'cancelled' | 'completed';

// Appreciation levels
export type AppreciationLevel = 'appreciated' | 'neutral' | 'not_appreciated';

// Property unlock information
export interface PropertyUnlock {
  id: string;
  propertyId: string;
  userId: string;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  currency: string;
  unlockDate: string;
  appreciationLevel?: AppreciationLevel;
  appreciationFeedback?: string;
  dealCodeUsed?: string;
  refundAmount?: number;
  refundDate?: string;
  refundStatus?: 'pending' | 'processed' | 'failed';
}

// Deal code structure
export interface DealCode {
  code: string;
  userId: string;
  totalUnlocks: number;
  remainingUnlocks: number;
  expiryDate: string;
  createdDate: string;
  isActive: boolean;
  source: 'not_appreciated_feedback' | 'promotional' | 'referral';
}

// Host contact information
export interface HostContactInfo {
  name: string;
  phone: string;
  email: string;
  whatsapp?: string;
  preferredContact: 'phone' | 'email' | 'whatsapp';
  profileImage?: string;
  verified: boolean;
}

// Full property address
export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  directions?: string;
  landmarks?: string;
}

// Unlock fee calculation
export interface UnlockFeeCalculation {
  pricePerNight: number;
  nonRefundableFee: number;
  monthlyBookingFee: number;
  exchangeRate: number;
  currency: string;
  lastUpdated: string;
}

// Unlock history entry
export interface UnlockHistoryEntry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  unlockDate: string;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  currency: string;
  address: PropertyAddress;
  location?: string;
  hostContact: HostContactInfo;
  appreciationSubmitted: boolean;
  appreciationLevel?: AppreciationLevel;
  status: UnlockStatus;
  canCancel: boolean; // true if 30% payment was made
  canRequestDealCode: boolean; // true if not appreciated
  canBook: boolean; // true if appreciated
  bookingId?: string;
  bookingCompleted?: boolean;
  rewardReceived?: {
    type: 'deal_code' | 'refund' | 'both';
    dealCode?: string;
    refundAmount?: number;
  };
}

// API request/response types
export interface UnlockPropertyRequest {
  propertyId: string;
  paymentMethod: PaymentMethod;
  dealCode?: string;
  paymentDetails?: {
    method: string;
    transactionId?: string;
  };
}

export interface UnlockPropertyResponse {
  success: boolean;
  message: string;
  data: {
    unlockId: string;
    property: {
      id: string;
      title: string;
      address: PropertyAddress;
      hostContact: HostContactInfo;
    };
    requiresAppreciation: boolean;
  };
}

export interface AppreciationSubmitRequest {
  unlockId: string;
  propertyId: string;
  appreciationLevel: AppreciationLevel;
  feedback?: string;
}

export interface AppreciationSubmitResponse {
  success: boolean;
  message: string;
  data?: {
    reward?: {
      dealCode?: DealCode;
      refund?: {
        amount: number;
        currency: string;
        status: string;
        estimatedDate: string;
      };
    };
  };
}

export interface ValidateDealCodeRequest {
  code: string;
}

export interface ValidateDealCodeResponse {
  valid: boolean;
  message: string;
  data?: {
    remainingUnlocks: number;
    expiryDate: string;
  };
}

// Host analytics types
export interface HostUnlockAnalytics {
  totalUnlocks: number;
  revenue: {
    total: number;
    nonRefundable: number;
    monthlyBooking: number;
    currency: string;
  };
  appreciationStats: {
    appreciated: number;
    neutral: number;
    notAppreciated: number;
  };
  topUnlockedProperties: Array<{
    propertyId: string;
    title: string;
    unlockCount: number;
    revenue: number;
  }>;
  recentUnlocks: UnlockHistoryEntry[];
}

// Guest unlock stats
export interface GuestUnlockStats {
  totalUnlocked: number;
  totalSpent: number;
  currency: string;
  activeDealCodes: number;
  activeRequests: number; // Unlocks that haven't been cancelled or completed
  completedBookings: number;
  recentUnlocks: UnlockHistoryEntry[];
  dealCodes: DealCode[];
}

// Booking creation request
export interface CreateBookingRequest {
  unlockId: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  guests: number;
  specialRequests?: string;
  totalAmount: number;
  amountPaid: number; // 30% already paid
  // Note: firstName, lastName, email, phone removed - server gets from session
}

// Cancel unlock request
export interface CancelUnlockRequest {
  unlockId: string;
  reason?: string;
}
