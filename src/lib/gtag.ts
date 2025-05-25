export const GA_MEASUREMENT_ID = 'G-RRYXC5YM1B'

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_location: url,
    })
  }
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = (action: string, {
  event_category,
  event_label,
  value,
}: {
  event_category?: string
  event_label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined') {
    window.gtag('event', action, {
      event_category,
      event_label,
      value,
    })
  }
}

// Custom events for your SnapScape application
export const trackPhotoUpload = (competitionId: string, competitionTitle: string) => {
  event('photo_upload', {
    event_category: 'engagement',
    event_label: `${competitionTitle} (${competitionId})`,
  })
}

export const trackPhotoRating = (photoId: string, rating: number) => {
  event('photo_rating', {
    event_category: 'engagement',
    event_label: photoId,
    value: rating,
  })
}

export const trackCompetitionView = (competitionId: string, competitionTitle: string) => {
  event('competition_view', {
    event_category: 'engagement',
    event_label: `${competitionTitle} (${competitionId})`,
  })
}

export const trackUserRegistration = () => {
  event('user_registration', {
    event_category: 'conversion',
  })
}

export const trackLogin = (method: string) => {
  event('login', {
    event_category: 'engagement',
    event_label: method,
  })
}

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: object) => void
  }
} 