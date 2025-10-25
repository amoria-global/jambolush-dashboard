# Withdrawal Method Limits - Implementation Notes

## Overview
Users are now limited to **one bank account** and **one mobile money account** as withdrawal methods.

## Frontend Implementation (Completed)

### 1. Validation in `unified-earnings.tsx`
**Location:** [app/components/unified-earnings.tsx:344-353](app/components/unified-earnings.tsx#L344-L353)

Added validation in `handleAddWithdrawalMethod()` that:
- Checks if user already has a withdrawal method of the selected type
- Prevents duplicate method types (BANK or MOBILE_MONEY)
- Shows clear error message when limit is reached

```typescript
// Check if user already has a withdrawal method of this type
const existingMethodOfType = withdrawalMethods.find(m => m.methodType === newMethod.methodType);
if (existingMethodOfType) {
  const methodTypeName = newMethod.methodType === 'BANK' ? 'bank account' : 'mobile money account';
  showNotification(
    `You already have a ${methodTypeName}. You can only have one bank account and one mobile money account. Please delete the existing ${methodTypeName} first if you want to add a different one.`,
    'error'
  );
  return;
}
```

### 2. UI Enhancements

#### Add Method Button
**Location:** [app/components/unified-earnings.tsx:1155-1171](app/components/unified-earnings.tsx#L1155-L1171)
- Disabled when user has 2 withdrawal methods
- Shows informative message about the limit

#### Add Method Modal
**Location:** [app/components/unified-earnings.tsx:1457-1507](app/components/unified-earnings.tsx#L1457-L1507)
- Displays subtitle: "You can have one bank account and one mobile money account"
- Disables button for method types that are already added
- Shows "Already added" indicator on disabled method type buttons

#### Method Display
**Location:** [app/components/unified-earnings.tsx:1173-1232](app/components/unified-earnings.tsx#L1173-L1232)
- Different colored icons for Bank (purple) vs Mobile Money (blue)
- Badge showing method type
- Clear display of account details

#### Withdrawal Modal
**Location:** [app/components/unified-earnings.tsx:1281-1292](app/components/unified-earnings.tsx#L1281-L1292)
- Dropdown shows emojis to differentiate: 🏦 for Bank, 📱 for Mobile Money
- Displays provider name and account number

## Backend Validation Required

### API Endpoint: `POST /transactions/withdrawal-methods`

The backend needs to implement the same validation to ensure data integrity:

```typescript
// Pseudocode for backend validation
async function createWithdrawalMethod(userId, methodType, accountDetails) {
  // Check existing methods for this user
  const existingMethods = await getWithdrawalMethods(userId);

  // Count methods by type
  const existingMethodOfType = existingMethods.find(m => m.methodType === methodType);

  if (existingMethodOfType) {
    throw new Error(`User already has a ${methodType} withdrawal method. Maximum one per type allowed.`);
  }

  // Maximum 2 methods total (1 BANK + 1 MOBILE_MONEY)
  if (existingMethods.length >= 2) {
    throw new Error('Maximum withdrawal methods limit reached. Users can only have one bank account and one mobile money account.');
  }

  // Proceed with creating the withdrawal method
  // ... rest of the logic
}
```

### Database Constraints (Recommended)

Consider adding a unique constraint at the database level:

```sql
-- Add unique constraint to ensure one method per type per user
ALTER TABLE withdrawal_methods
ADD CONSTRAINT unique_method_per_user_type
UNIQUE (user_id, method_type);
```

## Business Rules

1. **Maximum Methods:** 2 total per user
   - 1 BANK account
   - 1 MOBILE_MONEY account

2. **Adding New Method:**
   - User must delete existing method of that type first
   - Cannot have duplicate method types

3. **Default Method:**
   - First method added is automatically set as default
   - User can change default between their methods

4. **Verification Required:**
   - Only verified methods can be used for withdrawals
   - Verification status is checked before showing in withdrawal modal

## Testing Checklist

- [ ] Frontend prevents adding duplicate BANK methods
- [ ] Frontend prevents adding duplicate MOBILE_MONEY methods
- [ ] Backend API validates and rejects duplicate method types
- [ ] Database constraint prevents duplicate entries
- [ ] Error messages are clear and helpful
- [ ] Users can delete and replace methods
- [ ] Maximum limit of 2 methods is enforced
- [ ] Method type is clearly visible in UI

## Files Modified

1. [app/components/unified-earnings.tsx](app/components/unified-earnings.tsx)
   - Added validation in `handleAddWithdrawalMethod()`
   - Updated "Add Method" button with disable logic
   - Enhanced modal with method type indicators
   - Improved method display with type differentiation
   - Updated withdrawal dropdown with emojis

## Related Documentation

- [WITHDRAWAL_ROUTE_UPDATES.md](WITHDRAWAL_ROUTE_UPDATES.md) - General withdrawal route updates
- API Service: [app/api/apiService.ts](app/api/apiService.ts)
