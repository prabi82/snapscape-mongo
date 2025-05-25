# Google Analytics Integration for SnapScape

## Overview
This document explains the Google Analytics (GA4) integration implemented in the SnapScape application with tracking ID `G-RRYXC5YM1B`.

## Files Added

### 1. `src/components/GoogleAnalytics.tsx`
- React component that loads Google Analytics scripts
- Only loads in production environment (`NODE_ENV === 'production'`)
- Uses Next.js `Script` component with `afterInteractive` strategy for optimal performance

### 2. `src/lib/gtag.ts`
- Utility functions for Google Analytics event tracking
- Contains custom tracking functions specific to SnapScape features
- TypeScript-friendly with proper type definitions

### 3. `src/app/layout.tsx` (Updated)
- Added GoogleAnalytics component to the root layout
- Ensures tracking is active across all pages

## Features Tracked

### Automatic Tracking
- **Page Views**: All pages are automatically tracked
- **User Sessions**: Session duration and engagement
- **Traffic Sources**: Direct, referral, social, search traffic

### Custom Events Available

#### User Authentication
```typescript
import { trackUserRegistration, trackLogin } from '@/lib/gtag'

// Track new user registrations
trackUserRegistration()

// Track user logins with method
trackLogin('google') // or 'email'
```

#### Photo Management
```typescript
import { trackPhotoUpload, trackPhotoRating } from '@/lib/gtag'

// Track photo uploads
trackPhotoUpload('competitionId', 'Competition Title')

// Track photo ratings
trackPhotoRating('photoId', 4) // rating value 1-5
```

#### Competition Engagement
```typescript
import { trackCompetitionView } from '@/lib/gtag'

// Track competition page views
trackCompetitionView('competitionId', 'Competition Title')
```

#### Custom Events
```typescript
import { event } from '@/lib/gtag'

// Track any custom event
event('custom_action', {
  event_category: 'engagement',
  event_label: 'specific_action',
  value: 1
})
```

## Implementation Examples

### In a Competition Page
```typescript
// pages/competition/[id].tsx
import { useEffect } from 'react'
import { trackCompetitionView } from '@/lib/gtag'

export default function CompetitionPage({ competition }) {
  useEffect(() => {
    if (competition) {
      trackCompetitionView(competition.id, competition.title)
    }
  }, [competition])
  
  // rest of component
}
```

### In Photo Upload Component
```typescript
// components/PhotoUpload.tsx
import { trackPhotoUpload } from '@/lib/gtag'

const handlePhotoUpload = async (photo, competition) => {
  try {
    await uploadPhoto(photo)
    
    // Track successful upload
    trackPhotoUpload(competition.id, competition.title)
    
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
```

### In Rating Component
```typescript
// components/PhotoRating.tsx
import { trackPhotoRating } from '@/lib/gtag'

const handleRating = (photoId: string, rating: number) => {
  submitRating(photoId, rating)
  
  // Track the rating event
  trackPhotoRating(photoId, rating)
}
```

## Analytics Dashboard

### Key Metrics to Monitor
1. **User Engagement**
   - Photo uploads per user
   - Rating frequency
   - Competition participation rates

2. **Content Performance**
   - Most viewed competitions
   - Average time on competition pages
   - Photo interaction rates

3. **User Journey**
   - Registration to first upload time
   - Path from viewing to participating
   - Drop-off points in the user flow

### Custom Reports Available
- Photo upload conversion rates
- Competition engagement metrics
- User retention by activity type
- Rating distribution analysis

## Environment Configuration

### Production Only
The Google Analytics script only loads when `NODE_ENV === 'production'`. This means:
- ✅ **Production**: Full tracking active
- ❌ **Development**: No tracking (clean development environment)
- ❌ **Testing**: No tracking (clean test environment)

### Testing Analytics
To test analytics in development:
1. Temporarily modify the environment check in `GoogleAnalytics.tsx`
2. Use Google Analytics Debug View
3. Check browser console for gtag events

## Privacy Considerations

### Data Collected
- Page views and user interactions
- Custom events (photo uploads, ratings, etc.)
- Basic demographic data (if enabled)
- Session duration and engagement metrics

### GDPR Compliance
- Consider adding cookie consent banner
- Provide privacy policy explaining data collection
- Allow users to opt-out of tracking

### Recommended Privacy Settings
```typescript
// In GoogleAnalytics.tsx, you can add:
gtag('config', 'G-RRYXC5YM1B', {
  anonymize_ip: true,           // Anonymize IP addresses
  allow_google_signals: false,  // Disable advertising features
  allow_ad_personalization_signals: false
})
```

## Troubleshooting

### Common Issues
1. **Events not showing in GA**
   - Check if in production environment
   - Verify measurement ID is correct
   - Use browser dev tools to see gtag calls

2. **Performance Concerns**
   - Scripts load with `afterInteractive` strategy
   - Only loads in production
   - Minimal impact on page load speed

3. **TypeScript Errors**
   - Ensure gtag is properly declared in global scope
   - Check import statements from `@/lib/gtag`

### Debug Mode
Enable debug mode by adding to `GoogleAnalytics.tsx`:
```typescript
gtag('config', 'G-RRYXC5YM1B', {
  debug_mode: true
})
```

## Next Steps

1. **Add More Custom Events**: Track competition voting, profile updates, etc.
2. **Enhanced E-commerce Tracking**: If you add premium features
3. **Goal Configuration**: Set up conversion goals in GA dashboard
4. **Audience Segmentation**: Create user segments based on activity
5. **Custom Dimensions**: Add custom data for deeper analysis

## Support

- **Google Analytics Help**: https://support.google.com/analytics
- **GA4 Documentation**: https://developers.google.com/analytics/devguides/collection/ga4
- **Next.js Analytics Guide**: https://nextjs.org/docs/basic-features/script#afterinteractive 