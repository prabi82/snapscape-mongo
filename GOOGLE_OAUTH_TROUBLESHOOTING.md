# Google OAuth Troubleshooting Guide for SnapScape

## Issue: "Access blocked: This request is blocked by Google's policies" (Error 403: disallowed_useragent)

### Root Causes
1. **User Agent Restrictions**: Google blocks OAuth requests from certain browsers/webviews
2. **Missing Domain Configuration**: Incomplete JavaScript origins in Google Cloud Console
3. **Embedded Browser Access**: Users accessing via social media apps or embedded browsers

### Immediate Solutions

#### 1. Update Google Cloud Console Configuration

**Go to:** [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client IDs

**Update Authorized JavaScript Origins:**
```
https://snapscape.app
https://www.snapscape.app
```

**Update Authorized Redirect URIs:**
```
https://snapscape.app/api/auth/callback/google
https://www.snapscape.app/api/auth/callback/google
```

#### 2. User Education & Browser Detection

**Implemented Solutions:**
- ✅ Added browser detection for restricted user agents
- ✅ Warning messages on login/register pages for incompatible browsers
- ✅ Enhanced error page with specific guidance
- ✅ Step-by-step instructions for users

**Detected Restricted Browsers:**
- Instagram in-app browser
- Facebook in-app browser
- Twitter in-app browser
- LinkedIn in-app browser
- WeChat browser
- Line browser

#### 3. User Instructions

**For Users Experiencing This Error:**

1. **Copy the URL:** `https://snapscape.app`
2. **Open your default browser** (Chrome, Safari, Firefox, Edge)
3. **Paste the URL** and navigate to the site
4. **Try Google Sign-In again**

**Alternative:** Use email registration instead of Google Sign-In

### Technical Implementation

#### Files Modified:
- `src/app/page.tsx` - Added browser detection and warning
- `src/app/auth/register/page.tsx` - Added browser detection and warning
- `src/app/auth/error/page.tsx` - Enhanced error handling for OAuth issues

#### Browser Detection Code:
```javascript
const userAgent = navigator.userAgent.toLowerCase();
const isInApp = userAgent.includes('instagram') || 
               userAgent.includes('fban') || 
               userAgent.includes('fbav') || 
               userAgent.includes('twitter') || 
               userAgent.includes('linkedin') ||
               userAgent.includes('wechat') ||
               userAgent.includes('line');
```

### Prevention Strategies

#### 1. Domain Verification
- Ensure both `snapscape.app` and `www.snapscape.app` are configured
- Verify SSL certificates are valid for both domains
- Test OAuth flow from both domains

#### 2. User Experience Improvements
- Clear messaging about browser compatibility
- Fallback to email authentication
- Progressive enhancement for OAuth features

#### 3. Monitoring & Analytics
- Track OAuth error rates
- Monitor user agent patterns
- Set up alerts for authentication failures

### Testing Checklist

- [ ] Test Google Sign-In from Chrome desktop
- [ ] Test Google Sign-In from Safari mobile
- [ ] Test Google Sign-In from Firefox
- [ ] Test from Instagram in-app browser (should show warning)
- [ ] Test from Facebook in-app browser (should show warning)
- [ ] Verify error page shows helpful instructions
- [ ] Test both `snapscape.app` and `www.snapscape.app`

### Additional Considerations

#### 1. Alternative Authentication Methods
- Email/password registration (already implemented)
- Consider adding other OAuth providers (Facebook, Apple)
- Implement magic link authentication

#### 2. User Communication
- Add FAQ section about browser compatibility
- Email notifications about authentication issues
- In-app help documentation

#### 3. Technical Monitoring
- Set up error tracking for OAuth failures
- Monitor user agent statistics
- Track conversion rates by authentication method

### Support Response Template

**For users reporting Google Sign-In issues:**

"Hi [User],

We've identified that you're experiencing a browser compatibility issue with Google Sign-In. This happens when accessing SnapScape through certain app browsers (like Instagram or Facebook).

**Quick Fix:**
1. Copy this link: https://snapscape.app
2. Open your phone's default browser (Chrome, Safari, etc.)
3. Paste the link and try signing in again

**Alternative:** You can also create an account using your email address instead of Google Sign-In.

This is a security restriction from Google, not an issue with SnapScape. We've added warnings to help users avoid this in the future.
SnapScape Team"

### Future Improvements

1. **Progressive Web App (PWA)** - Better browser compatibility
2. **Deep Linking** - Automatic browser switching
3. **Enhanced Error Tracking** - Better diagnostics
4. **User Education** - Onboarding flow about browser requirements 