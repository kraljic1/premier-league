# Cookie Consent Testing Guide

## Why You Might Not See the Cookie Consent Banner

The cookie consent banner only appears if:
1. You haven't made a choice before (no value in localStorage)
2. The component has mounted on the client side
3. There's no existing `cookie-consent` value in localStorage

## How to Test the Cookie Consent Banner

### Option 1: Clear localStorage (Recommended)

1. Open your browser's Developer Tools (F12 or Right-click → Inspect)
2. Go to the **Console** tab
3. Run this command:
   ```javascript
   localStorage.removeItem('cookie-consent');
   localStorage.removeItem('cookie-consent-date');
   ```
4. Refresh the page (F5 or Ctrl+R)
5. The cookie consent banner should appear after ~500ms

### Option 2: Use Incognito/Private Mode

1. Open your site in an incognito/private browser window
2. Since there's no localStorage in a fresh session, the banner should appear

### Option 3: Use a Different Browser

1. Open your site in a browser you haven't used before
2. The banner should appear automatically

## Verify It's Working

After clearing localStorage and refreshing:

1. ✅ The banner should appear at the bottom of the page
2. ✅ It should have a purple "Accept All" button and a grey "Reject" button
3. ✅ Clicking "Accept All" should reload the page
4. ✅ After reload, the banner should NOT appear again
5. ✅ Check localStorage: `localStorage.getItem('cookie-consent')` should return `"accepted"` or `"rejected"`

## Debugging

If the banner still doesn't appear:

1. **Check the browser console** for any errors:
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for any red error messages

2. **Verify the component is imported**:
   - Check that `CookieConsent` is imported in `app/layout.tsx`
   - Check that `<CookieConsent />` is rendered in the layout

3. **Check CSS**:
   - The banner uses `.cookie-consent-banner` class
   - Verify the styles exist in `app/globals.css`
   - Check if z-index is high enough (should be 10000)

4. **Check if component is rendering**:
   - Add a console.log in the component to verify it's running:
   ```javascript
   useEffect(() => {
     console.log('CookieConsent mounted');
     // ... rest of code
   }, []);
   ```

## Expected Behavior

- **First visit**: Banner appears after 500ms
- **After accepting**: Page reloads, banner doesn't appear again
- **After rejecting**: Banner disappears, doesn't appear again
- **Subsequent visits**: Banner doesn't appear (choice is remembered)

## Reset Cookie Consent (For Testing)

To reset and see the banner again:

```javascript
// In browser console:
localStorage.removeItem('cookie-consent');
localStorage.removeItem('cookie-consent-date');
location.reload();
```
