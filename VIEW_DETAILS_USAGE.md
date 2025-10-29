# View Details Page - Usage Guide

## Overview

The unified view details page allows you to display detailed information for different entity types (transactions, bookings, properties/tours, and users) using a single endpoint with query parameters.

## URL Format

```
/view-details?ref={encodedId}&type={type}
```

### Parameters

- **ref**: Securely encoded ID of the entity (uses server's encoder.ts)
- **type**: Type of entity to display
  - `transaction` - Display transaction details
  - `booking` - Display booking details
  - `property` - Display property details
  - `tour` - Display tour details (uses same component as property)
  - `user` - Display user profile details

## Implementation

### Files Created

1. **Server Encoder** - `app/utils/encoder.ts`
   - Secure encoding with XOR cipher, scrambling, and checksum
   - Helper functions: `createViewDetailsUrl()`, `parseViewDetailsParams()`

2. **Detail Components**
   - `app/components/details/transaction-detail.tsx`
   - `app/components/details/booking-detail.tsx`
   - `app/components/details/property-detail.tsx`
   - `app/components/details/user-detail.tsx`

3. **Unified Page** - `app/view-details/page.tsx`
   - Handles routing and parameter parsing
   - Renders appropriate detail component

## Usage Examples

### 1. Create a Link to Transaction Details

```typescript
import { createViewDetailsUrl } from '@/app/utils/encoder';

// In your component
const transactionId = 'txn_12345';
const url = createViewDetailsUrl(transactionId, 'transaction');
// Result: /view-details?ref=securely_encoded&type=transaction

// Use in a Link or anchor
<Link href={url}>View Transaction</Link>
```

### 2. Create a Link to Booking Details

```typescript
import { createViewDetailsUrl } from '@/app/utils/encoder';

const bookingId = 'bk_67890';
const url = createViewDetailsUrl(bookingId, 'booking');

<a href={url} target="_blank">View Booking Details</a>
```

### 3. Create a Link to Property Details

```typescript
import { createViewDetailsUrl } from '@/app/utils/encoder';

const propertyId = 123;
const url = createViewDetailsUrl(propertyId, 'property');

<Link href={url}>View Property</Link>
```

### 4. Create a Link to User Profile

```typescript
import { createViewDetailsUrl } from '@/app/utils/encoder';

const userId = 456;
const url = createViewDetailsUrl(userId, 'user');

<Link href={url}>View Profile</Link>
```

### 5. Manual Encoding (if needed)

```typescript
import { encodeId, decodeId } from '@/app/utils/encoder';

// Encode (uses secure server encoder)
const encoded = encodeId('12345');
console.log(encoded); // Secure encoded string

// Decode (validates checksum and returns null if tampered)
const decoded = decodeId(encoded);
console.log(decoded); // 12345 (or null if invalid)

// Note: Each encoding includes random salt,
// so the same ID may produce different encoded strings
```

## Integration Examples

### In Transaction List Component

```typescript
import { createViewDetailsUrl } from '@/app/utils/encoder';

const TransactionList = ({ transactions }) => {
  return (
    <div>
      {transactions.map((txn) => (
        <div key={txn.id}>
          <span>{txn.description}</span>
          <Link
            href={createViewDetailsUrl(txn.id, 'transaction')}
            className="text-blue-600 hover:underline"
          >
            View Details
          </Link>
        </div>
      ))}
    </div>
  );
};
```

### In Booking Card Component

```typescript
import { createViewDetailsUrl } from '@/app/utils/encoder';

const BookingCard = ({ booking }) => {
  const detailsUrl = createViewDetailsUrl(booking.id, 'booking');

  return (
    <div className="booking-card">
      <h3>{booking.propertyName}</h3>
      <p>Confirmation: {booking.confirmationCode}</p>
      <Link href={detailsUrl}>
        <button>View Full Details</button>
      </Link>
    </div>
  );
};
```

### In Email Notifications

```typescript
import { createViewDetailsUrl } from '@/app/utils/encoder';

const sendBookingConfirmationEmail = async (booking) => {
  const bookingDetailsUrl = createViewDetailsUrl(booking.id, 'booking');
  const fullUrl = `https://yourdomain.com${bookingDetailsUrl}`;

  const emailHtml = `
    <h1>Booking Confirmed!</h1>
    <p>Your booking for ${booking.propertyName} has been confirmed.</p>
    <p>Confirmation Code: ${booking.confirmationCode}</p>
    <a href="${fullUrl}">View Booking Details</a>
  `;

  // Send email...
};
```

## Security Notes

1. **Secure ID Encoding**: Uses server's `encoder.ts` with multiple security layers:
   - **XOR Cipher**: Encrypts data with custom key
   - **Scrambling**: Multi-iteration character scrambling algorithm
   - **Salt**: Random salt for each encoding operation
   - **Checksum**: Validation to detect any tampering
   - **Metadata**: Includes length and timestamp validation
   - **URL-Safe**: Base64 encoding compatible with URLs
2. **Type Validation**: The page validates the type parameter against allowed values
3. **Permission Checks**: Each detail component should implement proper authorization checks
4. **Error Handling**: Invalid or missing parameters show user-friendly error messages
5. **Tamper Detection**: Modified or corrupted encoded IDs are automatically rejected

## Testing

Test the page with various scenarios:

```typescript
// Valid URLs (IDs will be securely encoded)
createViewDetailsUrl('txn_12345', 'transaction')
createViewDetailsUrl('bk_67890', 'booking')
createViewDetailsUrl(123, 'property')

// Invalid URLs (should show error page)
/view-details (missing parameters)
/view-details?ref=tampered&type=transaction (tampered encoding)
/view-details?ref=valid&type=invalid (invalid type)
```

## Support

For issues or questions, refer to the component source code or contact the development team.
