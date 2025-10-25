# Topbar Wallet Display Fixes

## Summary
Fixed wallet data fetching and display in the topbar component to use the correct API endpoint and ensure proper 30-second auto-refresh functionality.

## Issues Fixed

### 1. Incorrect API Endpoint
**Problem:** The topbar was using the wrong endpoint `/transactions/user/${userId}` instead of `/transactions/wallet/${userId}`

**Solution:** Updated [topbar.tsx:250](app/components/topbar.tsx#L250) to use the correct endpoint

```typescript
// Before
const walletResponse = await handleApiCall(() => api.get(`/transactions/user/${userId}`));

// After
const walletResponse = await handleApiCall(() => api.get(`/transactions/wallet/${userId}`));
```

### 2. Wallet Data Not Loading on Initial Login
**Problem:** `fetchUserData()` was called immediately after setting user session, but React state updates are asynchronous, so `userSession?.role` was undefined

**Solution:** Modified `fetchUserData()` to accept optional parameters [topbar.tsx:264](app/components/topbar.tsx#L264)

```typescript
const fetchUserData = async (authToken: string, userRole?: UserRole, userId?: string) => {
  // Use passed userRole or fallback to userSession
  const role = userRole || userSession?.role;
  const uid = userId || user?.id;

  if ((role === 'host' || role === 'agent' || role === 'tourguide') && uid) {
    const walletResponse = await handleApiCall(() => api.get(`/transactions/wallet/${uid}`));
    if (walletResponse.data && walletResponse.data.success) {
      setWalletData(walletResponse.data.data);
      setBalance(walletResponse.data.data.availableBalance || 0);
    }
  }
}
```

### 3. 30-Second Auto-Refresh Optimization
**Problem:** The useEffect for wallet polling had unnecessary dependencies that could cause the interval to be recreated too often

**Solution:** Optimized the dependency array [topbar.tsx:359-371](app/components/topbar.tsx#L359-L371)

```typescript
// Optimized dependencies to prevent unnecessary interval recreation
useEffect(() => {
  if (!isAuthenticated || !user) return;

  const userRole = userSession?.role;
  if (userRole === 'host' || userRole === 'agent' || userRole === 'tourguide') {
    // Set up polling interval (initial fetch is done by fetchUserData on login)
    const walletPollInterval = setInterval(() => {
      fetchWalletData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(walletPollInterval);
  }
}, [isAuthenticated, user?.id, userSession?.role]);
```

## Changes Made

### File: [app/components/topbar.tsx](app/components/topbar.tsx)

1. **Line 250:** Fixed wallet API endpoint
   - Changed from `/transactions/user/${userId}`
   - To `/transactions/wallet/${userId}`

2. **Line 220:** Pass user data to `fetchUserData`
   ```typescript
   await fetchUserData(authToken, userData.userType, userData.id);
   ```

3. **Line 264-296:** Updated `fetchUserData` function signature and logic
   - Added optional parameters: `userRole?: UserRole, userId?: string`
   - Integrated wallet fetching directly into this function
   - Uses passed parameters or falls back to state values

4. **Line 359-371:** Optimized wallet polling useEffect
   - Removed initial fetch (handled by `fetchUserData` on login)
   - Cleaned up dependency array to use specific properties

5. **Line 518:** Updated `handleProfileUpdate` event handler
   - Passes updated user data to `fetchUserData`

## Wallet Data Structure

The wallet API response follows this structure:

```typescript
{
  success: true,
  data: {
    id: string;
    userId: number;
    balance: number;
    pendingBalance: number;
    currency: string; // e.g., "USD", "RWF"
    totalBalance: number;
    availableBalance: number;
    walletNumber?: string;
    accountNumber?: string;
  }
}
```

## Display Behavior

### Topbar Wallet Widget ([topbar.tsx:628-662](app/components/topbar.tsx#L628-L662))

Shows for: `host`, `agent`, and `tourguide` users

**Loading State:**
```
🔄 Loading...
```

**With Data:**
```
💰 5,000 RWF
   +1,200 pending
```

**No Data:**
```
💰 No wallet data
```

**Click Behavior:** Navigates to earnings page
- Agent: `/all/agent/earnings`
- Tour Guide: `/all/tourguide/earnings`
- Host: `/all/host/earnings`

### Profile Dropdown ([topbar.tsx:807-809](app/components/topbar.tsx#L807-L809))

Shows wallet balance under username for `host`, `agent`, and `tourguide` users:
```
John Doe
5,000 RWF
```

## Auto-Refresh Schedule

| Component | Refresh Interval | Initial Load |
|-----------|-----------------|--------------|
| Wallet Data | 30 seconds | On login |
| Notifications | 30 seconds | On login |
| Messages Count | Once on login | On login |

## Testing Checklist

- [x] Wallet data loads correctly on initial login
- [x] Wallet data refreshes every 30 seconds
- [x] Correct endpoint is used (`/transactions/wallet/${userId}`)
- [x] Loading state displays during fetch
- [x] Wallet displays for host, agent, and tourguide roles
- [x] Wallet does not display for guest role
- [x] Click on wallet navigates to correct earnings page
- [x] Pending balance shows when > 0
- [x] Currency displays correctly (USD, RWF, etc.)
- [x] Profile dropdown shows wallet balance
- [x] Auto-refresh doesn't recreate interval unnecessarily

## Related Files

- [app/components/topbar.tsx](app/components/topbar.tsx) - Main component with fixes
- [app/components/unified-earnings.tsx](app/components/unified-earnings.tsx) - Reference for correct endpoint usage
- [app/api/apiService.ts](app/api/apiService.ts) - API service definitions

## Notes

- The wallet auto-refresh runs independently from notifications refresh
- Both use 30-second intervals but are not synchronized
- Error handling ensures the app continues to function even if wallet API fails
- Wallet balance is cached in state to prevent flickering during refreshes
