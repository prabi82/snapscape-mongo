# Competition Reminder System Documentation

## Overview

The Competition Reminder System automatically sends email reminders to registered users about upcoming competition deadlines. The system sends two types of reminders:

1. **Day Before Reminder**: Sent 1 day before the competition ends at 6 PM Oman time
2. **Last Day Reminder**: Sent on the final day of the competition at 6 PM Oman time

## Features

- ✅ Automated email reminders with beautiful HTML templates
- ✅ In-app notifications for users
- ✅ Timezone-aware scheduling (Oman Time - GMT+4)
- ✅ Admin testing interface
- ✅ Comprehensive error handling and logging
- ✅ Security with optional token authentication
- ✅ Detailed reporting and analytics

## System Components

### 1. Email Service (`src/lib/emailService.ts`)
- **Function**: `sendCompetitionReminderEmail()`
- **Purpose**: Sends beautifully formatted HTML emails with competition details
- **Features**: 
  - Responsive email design
  - Competition-specific information
  - Direct links to competition pages
  - Submission tips and guidelines

### 2. Reminder Service (`src/lib/competition-reminder-service.ts`)
- **Functions**:
  - `getCompetitionsNeedingReminders()`: Finds competitions that need reminders
  - `sendCompetitionReminders()`: Processes reminders for a specific competition
  - `processAllCompetitionReminders()`: Handles all reminders for a given type
- **Features**:
  - Timezone-aware date calculations
  - Batch processing with rate limiting
  - Comprehensive error tracking

### 3. API Endpoint (`src/app/api/cron/competition-reminders/route.ts`)
- **Endpoints**:
  - `POST /api/cron/competition-reminders?type=day_before`
  - `POST /api/cron/competition-reminders?type=last_day`
  - `GET /api/cron/competition-reminders?type=day_before` (for testing)
  - `GET /api/cron/competition-reminders?type=last_day` (for testing)
- **Security**: Optional Bearer token authentication

### 4. Admin Interface (`src/app/admin/competition-reminders/page.tsx`)
- **Purpose**: Testing and monitoring interface for administrators
- **Features**:
  - Manual trigger buttons for testing
  - Real-time results display
  - Error reporting
  - Setup instructions

## Setup Instructions

### 1. Environment Variables

Add these environment variables to your `.env.local` (development) and Vercel dashboard (production):

```env
# Email Configuration (Required)
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=465
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-email-password

# Cron Security (Optional but recommended)
CRON_SECRET_TOKEN=your-secret-token-here

# App URLs (Required for email links)
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Vercel Cron Jobs (✅ CONFIGURED)

The cron jobs are already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/competition-reminders?type=day_before",
      "schedule": "0 14 * * *"
    },
    {
      "path": "/api/cron/competition-reminders?type=last_day", 
      "schedule": "0 14 * * *"
    }
  ]
}
```

**Schedule**: Daily at 14:00 UTC (6:00 PM Oman time)
**Status**: ✅ Active and configured

### 3. Alternative External Cron Services (Optional)

If you prefer external cron services, you can use:
- **EasyCron**: https://www.easycron.com/
- **Cron-job.org**: https://cron-job.org/
- **UptimeRobot**: https://uptimerobot.com/

**URLs to call**:
```
GET https://snapscape.app/api/cron/competition-reminders?type=day_before
GET https://snapscape.app/api/cron/competition-reminders?type=last_day
```

### 4. Testing

#### Local Testing
1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/admin/competition-reminders`
3. Use the test buttons to trigger reminders manually

#### Production Testing
1. Navigate to: `https://your-domain.com/admin/competition-reminders`
2. Use the test buttons to verify email delivery
3. Check logs in Vercel dashboard for any errors

## Email Template Features

The reminder emails include:

- **Responsive Design**: Works on all devices and email clients
- **Brand Consistency**: Uses SnapScape colors and styling
- **Clear Call-to-Action**: Direct link to competition submission page
- **Competition Details**: Title, end date, and timezone information
- **Submission Tips**: Helpful guidelines for users
- **Urgency Indicators**: Different styling for day-before vs last-day reminders

## Monitoring and Analytics

### Admin Dashboard
Access the admin interface at `/admin/competition-reminders` to:
- Test reminder functionality
- View detailed results
- Monitor error rates
- Check email delivery statistics

### API Response Format
```json
{
  "success": true,
  "message": "Processed 2 competitions. Sent 150 emails and created 150 notifications.",
  "data": {
    "totalCompetitions": 2,
    "totalEmailsSent": 150,
    "totalNotificationsCreated": 150,
    "errors": [],
    "competitionResults": [
      {
        "competitionId": "...",
        "competitionTitle": "Nature Photography Contest",
        "success": true,
        "emailsSent": 75,
        "notificationsCreated": 75,
        "errors": []
      }
    ]
  }
}
```

## Troubleshooting

### Common Issues

#### 1. No Emails Being Sent
- **Check**: Email environment variables are set correctly
- **Check**: SMTP server credentials are valid
- **Check**: Competition status is 'active'
- **Check**: Users are verified and active

#### 2. Wrong Timezone
- **Solution**: The system automatically calculates Oman time (GMT+4)
- **Check**: Server time is correct
- **Note**: Reminders only trigger within 1 hour of 6 PM Oman time

#### 3. Cron Jobs Not Running
- **Check**: External cron service is configured correctly
- **Check**: URLs are accessible
- **Check**: Authentication tokens match
- **Test**: Use the admin interface to manually trigger

#### 4. High Error Rates
- **Check**: Email service limits and quotas
- **Check**: User email addresses are valid
- **Monitor**: Error messages in the admin interface

### Logs and Debugging

#### Development
- Check browser console for client-side errors
- Check terminal output for server-side logs
- Use the admin interface for detailed error reporting

#### Production
- Check Vercel function logs
- Monitor email service delivery reports
- Use the admin interface for real-time monitoring

## Security Considerations

1. **Token Authentication**: Use CRON_SECRET_TOKEN for production
2. **Rate Limiting**: Built-in delays prevent email service overload
3. **Input Validation**: All inputs are validated and sanitized
4. **Error Handling**: Sensitive information is not exposed in error messages

## Performance Optimization

1. **Batch Processing**: Users are processed in batches with delays
2. **Database Queries**: Optimized queries with lean() for better performance
3. **Error Recovery**: Individual user failures don't stop the entire process
4. **Caching**: Competition data is fetched once per reminder type

## Future Enhancements

Potential improvements for the system:

1. **User Preferences**: Allow users to opt-out of reminder emails
2. **Custom Timing**: Admin-configurable reminder schedules
3. **Multiple Reminders**: Additional reminder types (e.g., 3 days before)
4. **SMS Notifications**: Integration with SMS services
5. **Analytics Dashboard**: Detailed email engagement metrics
6. **A/B Testing**: Different email templates for optimization

## Support

For technical support or questions about the reminder system:

1. Check this documentation first
2. Use the admin testing interface to diagnose issues
3. Review server logs for detailed error information
4. Contact the development team with specific error messages and timestamps

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Compatibility**: Next.js 15.2.0, Node.js 18+ 