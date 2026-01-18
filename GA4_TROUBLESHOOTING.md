# GA4 Troubleshooting Guide

## Issues Found and Fixed

### 1. **CSP (Content Security Policy) Blocking GA4** ✅ FIXED
**Problem**: The middleware was only setting strict CSP for API routes, leaving HTML pages without proper CSP headers that allow Google Analytics scripts.

**Solution**: Added CSP headers for HTML pages that allow:
- `script-src` for Google Tag Manager
- `connect-src` for GA4 data transmission
- `img-src` for tracking pixels

### 2. **Console Logs Removed in Production**
**Problem**: `next.config.mjs` line 132 removes all console logs in production:
```javascript
removeConsole: process.env.NODE_ENV === 'production'
```

**Impact**: You can't see GA4 debug messages like `[GA4] Initializing...` in production.

**Recommendation**: Either:
- Test in development mode first
- Temporarily disable console removal
- Use GA4 DebugView in Google Analytics dashboard

### 3. **Environment Variable**
**Required**: Ensure `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set in your environment (format: `G-XXXXXXXXXX`)

**Check in**:
- `.env.local` for local development
- Netlify environment variables for production

### 4. **Cookie Consent Flow**
Your implementation correctly waits for cookie consent before loading GA4. This is GDPR compliant.

**Flow**:
1. User visits site
2. Cookie consent banner appears
3. User accepts cookies
4. GA4 initializes
5. Data starts flowing

## How to Verify GA4 is Working

### Development Mode (Recommended First)

1. **Start the dev server**:
```bash
npm run dev
```

2. **Open browser console** (F12)

3. **Accept cookies** when prompted

4. **Look for GA4 logs**:
```
[GA4] Cookie consent status: accepted
[GA4] Initializing Google Analytics with ID: G-XXXXXXXXXX
[GA4] Configuration queued
[GA4] Script loaded successfully - events will now be sent
[GA4] Tracking page view: /
```

5. **Check Network tab**:
- Filter by `google-analytics.com` or `collect`
- You should see POST requests to `https://www.google-analytics.com/g/collect`

### Production Mode

1. **Check Network tab** (since console logs are removed):
- Look for requests to `https://www.google-analytics.com/g/collect`
- Each page view should trigger a collect request

2. **Use GA4 DebugView**:
- Go to Google Analytics dashboard
- Navigate to: Admin → Data Streams → Your Stream → DebugView
- Visit your site and check if events appear in real-time

3. **Use Google Analytics Debugger Extension**:
- Install: [GA Debugger Chrome Extension](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
- Enable it and visit your site
- Check console for GA debug info

### GA4 Real-Time Reports

1. Go to Google Analytics dashboard
2. Click "Reports" → "Realtime"
3. Visit your site
4. You should see active users appear within 30 seconds

## Common Issues

### Issue: "No requests to google-analytics.com"

**Check**:
1. ✅ CSP headers allow GA4 (fixed in middleware.ts)
2. ✅ Cookie consent accepted (check localStorage: `cookie-consent: "accepted"`)
3. ✅ `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set
4. ✅ No browser ad blockers (disable temporarily)
5. ✅ Script loads successfully (check Network tab)

### Issue: "Script blocked by ad blocker"

**Solution**: Ad blockers will block GA4. Test in:
- Incognito mode without extensions
- Different browser
- Ask users to whitelist your site

### Issue: "CSP violation errors"

**Check browser console for**:
```
Refused to load the script 'https://www.googletagmanager.com/gtag/js'
because it violates the following Content Security Policy directive
```

**Solution**: The middleware.ts has been updated to allow GA4 scripts. If you still see this:
1. Clear browser cache
2. Hard reload (Cmd+Shift+R / Ctrl+Shift+R)
3. Check that middleware changes are deployed

### Issue: "Cookie consent not working"

**Debug**:
1. Open browser console
2. Check: `localStorage.getItem('cookie-consent')`
3. Should return: `"accepted"`, `"rejected"`, or `null`
4. Clear localStorage and test again: `localStorage.clear()`

## Testing Checklist

- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` set in environment
- [ ] Development server running
- [ ] Browser console open
- [ ] Accept cookie consent
- [ ] See `[GA4]` initialization logs
- [ ] See network requests to `google-analytics.com`
- [ ] Navigate between pages (should track page views)
- [ ] Check GA4 Real-Time reports
- [ ] Test in production/staging

## Environment Variables

### Local Development (.env.local)
```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Netlify (Production)
1. Go to Netlify dashboard
2. Site settings → Environment variables
3. Add: `NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-XXXXXXXXXX`
4. Redeploy site

## Additional Notes

### Why GA4 Might Not Show Immediate Data

- **Real-time reports**: 30 seconds to 2 minutes delay
- **Standard reports**: 24-48 hours delay
- **First-time setup**: Can take up to 24 hours for data to appear

### Privacy Considerations

Your implementation is privacy-friendly:
- GA4 only loads after explicit consent
- No tracking for users who reject cookies
- Compliant with GDPR, CCPA, and other privacy laws

## Debugging Commands

```bash
# Check environment variable
echo $NEXT_PUBLIC_GA_MEASUREMENT_ID

# Check in browser console
window.gtag
window.dataLayer
localStorage.getItem('cookie-consent')

# Check if script loaded
document.querySelector('script[src*="googletagmanager.com"]')
```

## Next Steps

1. Test in development mode first
2. Verify CSP headers are applied (check Network → Headers)
3. Accept cookies and check console logs
4. Look for network requests to GA4
5. Check GA4 Real-Time reports
6. Deploy to production
7. Verify in production using DebugView or Network tab
