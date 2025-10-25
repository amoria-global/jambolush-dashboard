# Google Maps Integration Setup Guide

Complete guide for setting up Google Maps for property location selection.

## Overview

The property location selection feature uses **Google Maps** to allow hosts and agents to:
- Click/tap on a map to select the exact property location
- Automatically detect coordinates (latitude, longitude)
- Automatically detect the full address using Google's Geocoding API
- Save location data including:
  - UPI (if using UPI option)
  - Full address string
  - Coordinates (latitude, longitude)
  - Address components (street, city, district, region, country, postal code)

## Why Google Maps?

✅ **Best Address Data** - Most accurate and comprehensive worldwide
✅ **Superior Geocoding** - Better reverse geocoding than alternatives
✅ **Familiar Interface** - Users know and trust Google Maps
✅ **$200 Free Credit Monthly** - Enough for ~28,000 map loads/month
✅ **Professional Quality** - Enterprise-grade mapping solution

## Prerequisites

- A Google account
- A credit/debit card (required for verification, but you won't be charged within free tier)

**Note:** Yes, Google requires a credit card to enable the API, but:
- You get **$200 free credit every month**
- This equals ~28,000 map loads and ~40,000 geocoding requests
- You'll only be charged if you exceed this (very unlikely for most apps)
- You can set spending limits to prevent unexpected charges

## Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. Click on the project dropdown at the top
   - Click "New Project"
   - Name: `Jambolush Maps` (or your preferred name)
   - Click "Create"
   - Wait for the project to be created (about 10 seconds)

### Step 2: Enable Billing (Required)

1. In Google Cloud Console, go to **Billing**
   - Click "Link a billing account" or "Create billing account"
   - Enter your credit/debit card information
   - Accept the terms

**Important Notes:**
- Your card will only be charged if you exceed $200/month in usage
- You can set up budget alerts to monitor usage
- You can set spending limits to prevent charges
- For typical property listing usage, you'll stay well within the free tier

### Step 3: Enable Required APIs

1. Go to [APIs & Services > Library](https://console.cloud.google.com/apis/library)

2. Search for and enable these APIs:

   **a) Maps JavaScript API**
   - Search "Maps JavaScript API"
   - Click on it
   - Click "Enable"
   - Wait for it to enable (~5 seconds)

   **b) Geocoding API**
   - Click "← Go back to library"
   - Search "Geocoding API"
   - Click on it
   - Click "Enable"
   - Wait for it to enable (~5 seconds)

### Step 4: Create API Key

1. Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)

2. Click "**+ CREATE CREDENTIALS**" at the top

3. Select "**API key**"

4. Your API key will be created (looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

5. Click "**Copy**" to copy the API key

### Step 5: Restrict Your API Key (Recommended)

1. After creating the key, click "**Edit API key**" (or the pencil icon)

2. Under **Application restrictions**:
   - Select "**HTTP referrers (web sites)**"
   - Click "**+ ADD AN ITEM**"
   - For development: Add `localhost:3000/*`
   - For production: Add your domain (e.g., `yourdomain.com/*` and `*.yourdomain.com/*`)
   - Click "Done"

3. Under **API restrictions**:
   - Select "**Restrict key**"
   - Check these APIs:
     - ✅ Maps JavaScript API
     - ✅ Geocoding API
   - Uncheck all others

4. Click "**Save**"

### Step 6: Add API Key to Your Project

1. Open your `.env.local` file in the project root

2. Add your API key:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

3. Replace `AIzaSy...` with your actual API key

4. Save the file

### Step 7: Restart Development Server

```bash
npm run dev
```

That's it! Google Maps is now working. 🎉

## Usage

### For Hosts

1. Navigate to `/all/host/add-property`
2. Fill in owner details (Step 1)
3. In Step 2 (Property Details):
   - Select "**Property Address**" as location type
   - Click "**Select Location on Map**"
   - Map modal opens with Google Maps
   - Click anywhere on the map
   - Google automatically detects coordinates and address
   - Review the information
   - Click "**Confirm Location**"

### For Agents

1. Navigate to `/all/add-property`
2. Follow the same steps as above

## Features

### Map Features
- ✅ Interactive Google Map
- ✅ Click/tap to select location
- ✅ Automatic current location detection
- ✅ Street view toggle
- ✅ Map type selector (Map/Satellite)
- ✅ Zoom controls
- ✅ Smooth animations
- ✅ Responsive design

### Geocoding Features
- ✅ Reverse geocoding (coordinates → address)
- ✅ Detailed address components
- ✅ Worldwide coverage
- ✅ High accuracy
- ✅ Multiple languages support

### Data Saved

```typescript
{
  type: 'address',
  upi: '',
  address: "123 Main Street, Kigali, Rwanda",
  coordinates: {
    latitude: -1.9403,
    longitude: 29.8739
  },
  addressComponents: {
    street: "123 Main Street",
    neighborhood: "Kimihurura",
    city: "Kigali",
    district: "Gasabo",
    region: "Kigali City",
    country: "Rwanda",
    postalCode: "12345"
  }
}
```

## Pricing & Limits

### Free Tier (Monthly)
- **$200 free credit** every month
- Equals approximately:
  - **28,000 map loads** (Dynamic Maps)
  - **40,000 geocoding requests** (Reverse Geocoding)

### Typical Usage Estimate
- Property listing added: 1 map load + 1 geocoding request
- **You can add ~28,000 properties/month for FREE**

### Cost After Free Tier
Only if you exceed the free tier:
- Map loads: $7 per 1,000 loads
- Geocoding: $5 per 1,000 requests

**For a typical property listing site, you'll never exceed the free tier.**

## Setting Up Budget Alerts (Recommended)

1. Go to [Billing > Budgets & alerts](https://console.cloud.google.com/billing/budgets)

2. Click "**Create Budget**"

3. Configure:
   - Name: "Maps API Budget"
   - Projects: Select your project
   - Budget amount: $1 (or any small amount)
   - Email alerts: Your email

4. This will alert you if you start approaching any charges

## Setting Spending Limits

1. Go to [Billing > Account Management](https://console.cloud.google.com/billing)

2. Click on your billing account

3. Set a spending limit (e.g., $10/month)

4. This prevents unexpected charges

## Troubleshooting

### "Google Maps API Key Required" message

**Problem**: Map shows setup instructions instead of the map

**Solution**:
1. Make sure you added the API key to `.env.local`
2. Restart your dev server (`npm run dev`)
3. Clear browser cache and refresh

### "This API project is not authorized to use this API"

**Problem**: Error in browser console

**Solution**:
1. Make sure you enabled both APIs:
   - Maps JavaScript API
   - Geocoding API
2. Wait a few minutes for changes to propagate
3. Refresh the page

### "RefererNotAllowedMapError"

**Problem**: Map shows error about referrer

**Solution**:
1. Go to API Key settings in Google Cloud Console
2. Under Application restrictions → HTTP referrers
3. Add `localhost:3000/*` for development
4. Remove any typos or extra spaces
5. Save and wait 5 minutes

### Geocoding returns no results

**Problem**: Address not detected when clicking

**Solution**:
1. Make sure Geocoding API is enabled
2. Check API key restrictions allow Geocoding API
3. Try clicking on a major street or known building
4. Some remote areas have limited address data

### "Billing must be enabled"

**Problem**: Map doesn't load, console shows billing error

**Solution**:
1. Go to Google Cloud Console
2. Enable billing for your project
3. Add credit/debit card information
4. Wait 5-10 minutes for activation

## Security Best Practices

### 1. Never Commit API Key
- `.env.local` is already in `.gitignore`
- Never share your API key publicly
- Never commit it to version control

### 2. Restrict Your API Key
- Set HTTP referrer restrictions
- Only enable required APIs
- Different keys for dev/staging/production

### 3. Monitor Usage
- Set up budget alerts
- Review usage monthly
- Check for unusual activity

### 4. Rotate Keys Regularly
- Generate new key every 6-12 months
- Delete old unused keys
- Update keys in all environments

## Production Deployment

When deploying to production:

1. **Create production API key**
   - Don't use the same key as development
   - Restrict to production domain only

2. **Add to production environment**
   - Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in your hosting platform
   - Vercel: Environment Variables section
   - Netlify: Site settings → Environment variables
   - Other: Follow platform docs

3. **Restrict the key**
   - HTTP referrers: `yourdomain.com/*` and `*.yourdomain.com/*`
   - API restrictions: Only Maps JavaScript API and Geocoding API

4. **Monitor usage**
   - Set up alerts for production usage
   - Monitor costs in Google Cloud Console

## Alternative: Using Without Credit Card

If you absolutely cannot provide a credit card, you have these options:

### Option 1: OpenStreetMap (Already Implemented)
The codebase includes a fallback to OpenStreetMap. To use it:
1. Don't add Google Maps API key
2. The system will automatically use OpenStreetMap
3. 100% free, no card required
4. See `GOOGLE_MAPS_SETUP.md` for details

### Option 2: Use Development Mode Only
Google allows limited testing without billing:
- Very limited requests
- "For development purposes only" watermark
- Not suitable for production

## Support

### Getting Help

1. **Google Maps Documentation**
   - [Maps JavaScript API Guide](https://developers.google.com/maps/documentation/javascript)
   - [Geocoding API Guide](https://developers.google.com/maps/documentation/geocoding)

2. **Google Cloud Support**
   - [Support Portal](https://cloud.google.com/support)
   - [Community Forum](https://groups.google.com/g/google-maps-js-api-v3)

3. **Billing Questions**
   - [Billing Support](https://cloud.google.com/billing/docs/how-to/get-support)
   - [Pricing Calculator](https://mapsplatform.google.com/pricing/)

## FAQ

**Q: Will I really not be charged?**
A: For typical property listing usage (adding properties, viewing maps), you'll stay well within the $200/month free tier. You'd need to add thousands of properties daily to exceed it.

**Q: Why does Google require a credit card if it's free?**
A: It's for verification and to prevent abuse. You won't be charged unless you explicitly exceed the generous free tier.

**Q: Can I use Google Maps without a credit card?**
A: Not for production use. However, the system includes OpenStreetMap as a free alternative.

**Q: What if I accidentally exceed the free tier?**
A: Set up budget alerts and spending limits. You'll be notified before any charges occur.

**Q: Can I remove my card later?**
A: You can disable billing, but then the APIs won't work. Better to keep billing enabled with spending limits.

## Summary

You now have a complete Google Maps integration that:
- ✅ Uses Google's superior mapping and geocoding
- ✅ Stays within $200/month free tier for typical usage
- ✅ Provides professional-quality maps
- ✅ Includes worldwide coverage
- ✅ Has detailed address detection
- ✅ Works on mobile and desktop
- ✅ Includes safety measures (budget alerts, restrictions)

Just follow the setup steps above to get your API key and start using Google Maps! 🗺️
