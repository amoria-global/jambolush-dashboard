# Unified View Details System

## Overview

A comprehensive unified page system for viewing detailed information about different entity types using a single endpoint with query parameters. This implementation provides secure, type-safe, and user-friendly detail views for transactions, bookings, properties/tours, and users.

## Features

- **Unified Endpoint**: Single `/view-details` page handles all entity types
- **Secure ID Encoding**: Uses server's `encoder.ts` with XOR cipher, scrambling, and checksum validation
- **Type Safety**: Full TypeScript support with proper interfaces
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Error Handling**: Comprehensive error states and user feedback
- **Shareable Links**: Easy to share and bookmark specific entity details
- **SEO Friendly**: Proper metadata and structured content

## Quick Start

### 1. Basic Usage

```typescript
import { createViewDetailsUrl } from '@/app/utils/encoder';
import Link from 'next/link';

// In your component
const MyComponent = ({ transactionId }) => {
  const detailsUrl = createViewDetailsUrl(transactionId, 'transaction');

  return (
    <Link href={detailsUrl}>
      View Transaction Details
    </Link>
  );
};
```

### 2. Supported Entity Types

| Type | Description | Example ID |
|------|-------------|------------|
| `transaction` | Financial transactions | `txn_12345`, `transaction-uuid` |
| `booking` | Property/tour bookings | `bk_67890`, `booking-uuid` |
| `property` | Property listings | `123`, `prop-456` |
| `tour` | Tour offerings | `789`, `tour-101` |
| `user` | User profiles | `456`, `user-789` |

## File Structure

```
app/
├── view-details/
│   └── page.tsx                          # Unified view details page
├── components/
│   ├── details/
│   │   ├── transaction-detail.tsx        # Transaction detail component
│   │   ├── booking-detail.tsx            # Booking detail component
│   │   ├── property-detail.tsx           # Property/Tour detail component
│   │   └── user-detail.tsx               # User profile detail component
│   └── examples/
│       └── view-details-link-examples.tsx # Example implementations
├── utils/
│   └── encoder.ts                        # Secure ID encoding/decoding (server encoder)
VIEW_DETAILS_README.md                    # This file
VIEW_DETAILS_USAGE.md                     # Detailed usage guide
```

## API Reference

### Encoding Utilities (`app/utils/encoder.ts`)

**Note:** Uses the server's secure encoder which implements:
- XOR cipher encryption
- Multi-iteration scrambling
- Checksum validation
- URL-safe base64 encoding

#### `encodeId(id: string | number): string`
Encodes an ID using the server's secure encoding algorithm.

```typescript
const encoded = encodeId('txn_12345');
// Returns: Secure encoded string (e.g., "aGt5Y3J6bXRpM3B...")
```

#### `decodeId(encodedId: string): string | null`
Decodes a securely encoded ID back to its original value.

```typescript
const decoded = decodeId('aGt5Y3J6bXRpM3B...');
// Returns: "txn_12345" (or null if invalid/tampered)
```

#### `createViewDetailsUrl(id: string | number, type: EntityType): string`
Creates a complete view details URL with encoded ID and type.

```typescript
const url = createViewDetailsUrl(123, 'property');
// Returns: "/view-details?ref=encoded_string&type=property"
```

#### `parseViewDetailsParams(searchParams: URLSearchParams): ParsedParams | null`
Parses and validates URL search parameters.

```typescript
const params = parseViewDetailsParams(searchParams);
// Returns: { id: "123", type: "property" } or null if invalid
```

## URL Format

```
/view-details?ref={encodedId}&type={type}
```

### Parameters

- **ref**: Securely encoded entity ID (required)
- **type**: Entity type (required, must be one of: transaction, booking, property, tour, user)

### Examples

```
Transaction: /view-details?ref=aGt5Y3J6bXRpM3B...&type=transaction
Booking:     /view-details?ref=bGdhdnNkY3VhZXM...&type=booking
Property:    /view-details?ref=cXdlcnR5dWlvcG...&type=property
Tour:        /view-details?ref=enhjdmJubTEyMzQ...&type=tour
User:        /view-details?ref=YXNkZmdoamtsbnh...&type=user
```

## Implementation Examples

### 1. In a List Component

```typescript
import { createViewDetailsUrl } from '@/app/utils/encoder';

const TransactionList = ({ transactions }) => {
  return (
    <div className="space-y-4">
      {transactions.map((txn) => (
        <div key={txn.id} className="border rounded-lg p-4">
          <h3>{txn.description}</h3>
          <p>${txn.amount.toFixed(2)}</p>
          <Link
            href={createViewDetailsUrl(txn.id, 'transaction')}
            className="text-blue-600 hover:underline"
          >
            View Details →
          </Link>
        </div>
      ))}
    </div>
  );
};
```

### 2. With Next.js Router

```typescript
import { useRouter } from 'next/navigation';
import { createViewDetailsUrl } from '@/app/utils/encoder';

const PropertyCard = ({ property }) => {
  const router = useRouter();

  const handleClick = () => {
    const url = createViewDetailsUrl(property.id, 'property');
    router.push(url);
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <img src={property.image} alt={property.name} />
      <h3>{property.name}</h3>
    </div>
  );
};
```

### 3. Share Functionality

```typescript
import { createViewDetailsUrl } from '@/app/utils/encoder';

const ShareButton = ({ id, type }) => {
  const handleShare = async () => {
    const url = createViewDetailsUrl(id, type);
    const fullUrl = `${window.location.origin}${url}`;

    if (navigator.share) {
      await navigator.share({
        title: `View ${type} details`,
        url: fullUrl,
      });
    } else {
      await navigator.clipboard.writeText(fullUrl);
      alert('Link copied!');
    }
  };

  return (
    <button onClick={handleShare}>
      <i className="bi bi-share" /> Share
    </button>
  );
};
```

## Security Considerations

1. **Secure ID Encoding**: Uses the server's `encoder.ts` with multiple security layers:
   - XOR cipher encryption with custom key
   - Multi-iteration scrambling algorithm
   - Salt generation for randomization
   - Checksum validation to detect tampering
   - Timestamp metadata for tracking
   - URL-safe base64 encoding
2. **Type Validation**: Type parameter is strictly validated against allowed values
3. **Authorization**: Each detail component should implement proper auth checks
4. **Input Sanitization**: All user inputs are sanitized and validated
5. **Error Messages**: Error messages don't expose sensitive system information
6. **Tamper Detection**: Invalid or modified encoded IDs are automatically rejected

## Testing

### Manual Testing Checklist

- [ ] Valid transaction URL loads correctly
- [ ] Valid booking URL loads correctly
- [ ] Valid property URL loads correctly
- [ ] Valid tour URL loads correctly
- [ ] Valid user URL loads correctly
- [ ] Invalid ref shows error page
- [ ] Invalid type shows error page
- [ ] Missing parameters show error page
- [ ] Non-existent entity shows not found
- [ ] Back button works correctly
- [ ] Share functionality works
- [ ] Mobile responsive design
- [ ] Loading states display
- [ ] Error states display

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

- Next.js 13+
- React 18+
- TypeScript 5+
- Tailwind CSS 3+
- Bootstrap Icons

---

**Version**: 2.0.0
**Last Updated**: 2025-10-29
**Maintainer**: Development Team
