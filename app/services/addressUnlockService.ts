/**
 * Address Unlock Service
 * Handles exchange rates, fee calculations, and utility functions
 */

import { UnlockFeeCalculation } from '@/app/types/addressUnlock';

// Exchange rate cache
let exchangeRateCache: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const FALLBACK_RATE = 1350; // RWF per USD

/**
 * Fetch current USD to RWF exchange rate from Hexarate API
 */
export async function fetchExchangeRate(): Promise<number> {
  // Check cache first
  if (exchangeRateCache && Date.now() - exchangeRateCache.timestamp < CACHE_DURATION) {
    return exchangeRateCache.rate;
  }

  try {
    const response = await fetch('https://hexarate.paikama.co/api/rates/latest/USD');
    const data = await response.json();

    if (data && data.data && data.data.mid && data.data.mid.RWF) {
      const rate = data.data.mid.RWF;

      // Update cache
      exchangeRateCache = {
        rate,
        timestamp: Date.now(),
      };

      return rate;
    }

    // Fallback to default rate
    console.warn('Invalid exchange rate response, using fallback rate');
    return FALLBACK_RATE;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return FALLBACK_RATE;
  }
}

/**
 * Calculate unlock fees based on property price
 * @param pricePerNight - Property price per night in USD
 * @returns Unlock fee calculation with both options
 */
export async function calculateUnlockFees(pricePerNight: number): Promise<UnlockFeeCalculation> {
  const exchangeRate = await fetchExchangeRate();

  // Determine non-refundable fee based on price tier
  let nonRefundableFeeRWF: number;
  if (pricePerNight >= 50 && pricePerNight <= 300) {
    nonRefundableFeeRWF = 8000;
  } else if (pricePerNight > 300) {
    nonRefundableFeeRWF = 15000;
  } else {
    // For properties below $50, use 8000 RWF
    nonRefundableFeeRWF = 8000;
  }

  // Calculate 30% of 3 months booking (90 days)
  const monthlyBookingUSD = pricePerNight * 90 * 0.30;
  const monthlyBookingRWF = monthlyBookingUSD * exchangeRate;

  return {
    pricePerNight,
    nonRefundableFee: nonRefundableFeeRWF,
    monthlyBookingFee: Math.round(monthlyBookingRWF),
    exchangeRate,
    currency: 'RWF',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Format currency amount for display
 * @param amount - Amount to format
 * @param currency - Currency code (USD or RWF)
 * @returns Formatted string
 */
export function formatCurrency(amount: number | undefined | null, currency: 'USD' | 'RWF' = 'RWF'): string {
  // Handle undefined/null amounts
  if (amount === undefined || amount === null || isNaN(amount)) {
    return currency === 'USD' ? '$0.00' : '0 RWF';
  }

  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} RWF`;
  }
}

/**
 * Generate a unique deal code
 * @returns Unique 12-character code
 */
export function generateDealCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 3;
  const segmentLength = 4;

  let code = '';
  for (let i = 0; i < segments; i++) {
    if (i > 0) code += '-';
    for (let j = 0; j < segmentLength; j++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  }

  return code;
}

/**
 * Calculate deal code expiry date (6 months from now)
 * @returns ISO date string
 */
export function calculateDealCodeExpiry(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 6);
  return date.toISOString();
}

/**
 * Check if a deal code is expired
 * @param expiryDate - ISO date string
 * @returns true if expired
 */
export function isDealCodeExpired(expiryDate: string): boolean {
  return new Date(expiryDate) < new Date();
}

/**
 * Format date for display
 * @param dateString - ISO date string
 * @returns Formatted date
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date with time for display
 * @param dateString - ISO date string
 * @returns Formatted date with time
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get time ago string (e.g., "2 hours ago")
 * @param dateString - ISO date string
 * @returns Time ago string
 */
export function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(dateString);
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise resolving to success boolean
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Validate deal code format
 * @param code - Deal code to validate
 * @returns true if format is valid
 */
export function isValidDealCodeFormat(code: string): boolean {
  // Format: XXXX-XXXX-XXXX (12 alphanumeric characters with 2 hyphens)
  const regex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return regex.test(code.toUpperCase());
}

/**
 * Mask address for locked display
 * @param address - Full address string
 * @returns Masked address
 */
export function maskAddress(address: string): string {
  const parts = address.split(',');
  if (parts.length < 2) return 'Address Hidden';

  // Show only city/area, hide street details
  return `${parts[parts.length - 2].trim()}, ${parts[parts.length - 1].trim()}`;
}

/**
 * Get general location description
 * @param city - City name
 * @param country - Country name
 * @returns General location string
 */
export function getGeneralLocation(city: string, country: string): string {
  return `${city}, ${country}`;
}
