# Backend Withdrawal Route Updates Required

## Changes Needed for USD Currency Enforcement

Update the following validation in `src/routes/withdrawal.routes.ts`:

### 1. Request OTP Endpoint - Update Validation

**Location**: POST `/api/payments/withdrawal/request-otp`

```typescript
// REPLACE THIS:
if (amount < 500) {
  return res.status(400).json({
    success: false,
    message: 'Minimum withdrawal amount is 500 RWF'
  });
}

if (amount > 5000000) {
  return res.status(400).json({
    success: false,
    message: 'Maximum withdrawal amount is 5,000,000 RWF'
  });
}

// WITH THIS:
if (amount < 1) {
  return res.status(400).json({
    success: false,
    message: 'Minimum withdrawal amount is $1 USD'
  });
}

if (amount > 10000) {
  return res.status(400).json({
    success: false,
    message: 'Maximum withdrawal amount is $10,000 USD'
  });
}

// ADD AFTER USER FETCH:
// Enforce USD currency only
const wallet = await prisma.wallet.findUnique({
  where: { userId }
});

if (!wallet) {
  return res.status(404).json({
    success: false,
    message: 'Wallet not found'
  });
}

if (wallet.currency !== 'USD') {
  return res.status(400).json({
    success: false,
    message: 'Withdrawals are only available for USD wallets. Please contact support to convert your wallet currency.',
    currentCurrency: wallet.currency,
    requiredCurrency: 'USD'
  });
}
```

### 2. Get Withdrawal Info Endpoint - Update Limits

**Location**: GET `/api/payments/withdrawal/info`

```typescript
// REPLACE THIS:
limits: {
  minimum: 500,
  maximum: 5000000,
  daily: 2000000,
  monthly: 10000000
},

// WITH THIS:
limits: {
  minimum: 1,
  maximum: 10000,
  daily: 5000,
  monthly: 20000
},
currency: wallet.currency,
currencyRequired: 'USD',
currencyMatch: wallet.currency === 'USD'
```

### 3. Verify and Withdraw Endpoint - Add Currency Check

**Location**: POST `/api/payments/withdrawal/verify-and-withdraw`

```typescript
// ADD AFTER WALLET BALANCE CHECK:
// Enforce USD currency
if (wallet.currency !== 'USD') {
  return res.status(400).json({
    success: false,
    message: 'Withdrawals are only available for USD wallets',
    currentCurrency: wallet.currency
  });
}
```

### 4. Update SMS Messages (in sms.service.ts)

Update withdrawal SMS messages to show USD:

```typescript
// Example SMS message:
const message = `Withdrawal OTP: ${otp}. Amount: $${amount} USD. Valid for 10 minutes. Do not share this code. -Jambolush`;
```

### 5. Database Seed/Migration (Optional)

If you need to ensure all wallets are USD:

```sql
-- Migration to convert existing wallets to USD
UPDATE wallets
SET currency = 'USD'
WHERE currency != 'USD';
```

## Summary of Changes

✅ Minimum withdrawal: **$1 USD** (was 500 RWF)
✅ Maximum withdrawal: **$10,000 USD** (was 5,000,000 RWF)
✅ Daily limit: **$5,000 USD** (was 2,000,000 RWF)
✅ Monthly limit: **$20,000 USD** (was 10,000,000 RWF)
✅ Currency enforcement: **USD only**
✅ Frontend validates USD before API call
✅ Backend double-validates USD currency
✅ Clear error messages for non-USD wallets

## Frontend Changes Already Completed ✅

- ✅ Minimum withdrawal set to $1 USD
- ✅ Maximum withdrawal set to $10,000 USD
- ✅ Currency validation before OTP request
- ✅ USD symbol ($) in amount input
- ✅ Formatted currency display (e.g., "$1,234.56 USD")
- ✅ Warning message if wallet is not USD
- ✅ Disabled withdraw button for non-USD wallets
- ✅ Min/max hints in withdrawal modal

## Next Steps

1. Update the backend withdrawal routes as documented above
2. Update SMS templates to show USD currency
3. Test withdrawal flow end-to-end
4. Verify OTP delivery with USD amounts
5. Test error handling for non-USD wallets
