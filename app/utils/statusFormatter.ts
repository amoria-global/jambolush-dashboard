/**
 * Utility functions for formatting booking status values
 */

/**
 * Formats a booking status for display
 * Converts underscores/hyphens to spaces and capitalizes each word
 *
 * Examples:
 * - checked_in -> CHECKEDIN
 * - checked-in -> CHECKEDIN
 * - completed -> COMPLETED
 * - pending -> PENDING
 */
export function formatStatusDisplay(status: string): string {
  if (!status) return '';

  // Remove underscores and hyphens, convert to uppercase
  return status.replace(/[_-]/g, '').toUpperCase();
}

/**
 * Formats status for API/backend use
 * Keeps original format with underscores
 */
export function formatStatusForAPI(status: string): string {
  return status;
}

/**
 * Gets the appropriate color classes for a status
 */
export function getStatusColor(status: string): string {
  const normalized = status.toLowerCase().replace(/-/g, '_');

  switch (normalized) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'checked_in':
    case 'checkedin':
      return 'bg-purple-100 text-purple-800';
    case 'checked_out':
    case 'checkout':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Gets the appropriate icon for a status
 */
export function getStatusIcon(status: string): string {
  const normalized = status.toLowerCase().replace(/-/g, '_');

  switch (normalized) {
    case 'confirmed':
      return 'bi-check-circle';
    case 'pending':
      return 'bi-clock';
    case 'cancelled':
      return 'bi-x-circle';
    case 'completed':
      return 'bi-check-square';
    case 'checked_in':
    case 'checkedin':
      return 'bi-door-open';
    case 'checked_out':
    case 'checkout':
      return 'bi-door-closed';
    default:
      return 'bi-calendar';
  }
}

/**
 * Property booking status mapping
 */
export const PROPERTY_BOOKING_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

/**
 * Tour booking status mapping
 */
export const TOUR_BOOKING_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

/**
 * Display names for property bookings
 */
export const PROPERTY_STATUS_DISPLAY: Record<string, string> = {
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  checked_in: 'CHECKEDIN',
  checked_out: 'CHECKOUT',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
};

/**
 * Display names for tour bookings
 */
export const TOUR_STATUS_DISPLAY: Record<string, string> = {
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  checked_in: 'CHECKEDIN',
  checked_out: 'CHECKOUT',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
};

/**
 * Gets the appropriate color classes for payment status
 */
export function getPaymentStatusColor(status: string): string {
  const normalized = status.toLowerCase();

  switch (normalized) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'unpaid':
      return 'bg-red-100 text-red-800';
    case 'refunded':
      return 'bg-purple-100 text-purple-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Gets the appropriate color classes for check-in status
 */
export function getCheckInStatusColor(status: string): string {
  const normalized = status.toLowerCase().replace(/-/g, '_');

  switch (normalized) {
    case 'checked_in':
    case 'checkedin':
      return 'bg-green-100 text-green-800';
    case 'not_checked_in':
    case 'notcheckedin':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
