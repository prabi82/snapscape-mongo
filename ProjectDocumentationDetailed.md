# SnapScape - Comprehensive Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [User Roles and Authentication](#user-roles-and-authentication)
6. [Feature Implementation Details](#feature-implementation-details)
7. [Deployment](#deployment)
8. [Security](#security)
9. [Performance Optimization](#performance-optimization)
10. [Development Guidelines](#development-guidelines)
11. [Troubleshooting](#troubleshooting)

## Project Overview

SnapScape is a comprehensive photography competition platform built with Next.js, TypeScript, and MongoDB. It provides a complete ecosystem for managing photography competitions, user submissions, judging, and community engagement.

### Key Features
- Photography competition management
- User submission and portfolio management
- Multi-role authentication (Admin, Judge, User)
- Real-time voting and rating system
- Achievement and badge system
- Comprehensive notification system
- Admin dashboard with analytics
- Responsive design for all devices

### Technology Stack
- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with multiple providers
- **Image Storage**: Cloudinary
- **Deployment**: Vercel

## Architecture

### Application Structure
```
src/
├── app/                    # Next.js 13+ app directory
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   ├── judge/             # Judge-specific pages
│   └── competitions/      # Competition pages
├── components/            # Reusable components
├── lib/                  # Utilities and configurations
├── models/               # MongoDB schemas
└── utils/                # Helper functions
```

### Database Design
The application uses MongoDB with the following main collections:
- Users
- Competitions
- PhotoSubmissions
- Ratings
- Notifications
- Results
- Badges
- UserBadges

### Authentication Flow
1. Multiple authentication providers (Google OAuth, credentials)
2. Role-based access control (admin, judge, user)
3. Session management with NextAuth.js
4. Protected routes with middleware

## Database Schema

### User Model
```typescript
interface User {
  _id: ObjectId;
  name: string;
  email: string;
  password?: string;        // For credential auth
  image?: string;
  provider: 'google' | 'credentials';
  role: 'admin' | 'judge' | 'user';
  isVerified: boolean;
  isActive: boolean;
  bio?: string;
  mobile?: string;
  country?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Competition Model
```typescript
interface Competition {
  _id: ObjectId;
  title: string;
  description: string;
  theme: string;
  rules: string;
  prizes: string;
  startDate: Date;
  endDate: Date;
  votingEndDate: Date;
  status: 'upcoming' | 'active' | 'voting' | 'completed';
  submissionLimit: number;
  votingCriteria: string[];
  coverImage?: string;
  judges: ObjectId[];       // References to User
  submissionFormat: string;
  copyrightNotice: string;
  hideOtherSubmissions: boolean;
  manualStatusOverride: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### PhotoSubmission Model
```typescript
interface PhotoSubmission {
  _id: ObjectId;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  user: ObjectId;           // Reference to User
  competition: ObjectId;    // Reference to Competition
  status: 'pending' | 'approved' | 'rejected';
  averageRating: number;
  ratingCount: number;
  totalRating: number;
  rejectionReason?: string;
  tags: string[];
  exifData?: object;
  createdAt: Date;
  updatedAt: Date;
}
```

### Rating Model
```typescript
interface Rating {
  _id: ObjectId;
  user: ObjectId;           // Reference to User (rater)
  photo: ObjectId;          // Reference to PhotoSubmission
  competition: ObjectId;    // Reference to Competition
  score: number;            // 1-5 rating
  createdAt: Date;
}
```

### Notification Model
```typescript
interface Notification {
  _id: ObjectId;
  user: ObjectId;           // Reference to User
  type: 'competition' | 'submission' | 'badge' | 'general';
  title: string;
  message: string;
  read: boolean;
  relatedCompetition?: ObjectId;
  relatedSubmission?: ObjectId;
  relatedBadge?: ObjectId;
  relatedPhoto?: ObjectId;
  photoModel?: 'Photo' | 'PhotoSubmission';
  directThumbnailUrl?: string;
  createdAt: Date;
}
```

### Result Model
```typescript
interface Result {
  _id: ObjectId;
  competition: ObjectId;    // Reference to Competition
  photo: ObjectId;          // Reference to PhotoSubmission
  createdAt: Date;
}
```

## 2. Core Functionalities (Detailed)

### 2.1. User Authentication & Authorization
*   **Implementation:** NextAuth.js.
*   **Providers:**
    *   Google OAuth: Allows users to sign in/up with their Google accounts. Requires Google Cloud Console setup for OAuth credentials, authorized JavaScript origins (`http://localhost:3000` or production equivalent), and redirect URIs (`/api/auth/callback/google`).
    *   Credentials: Standard email/password login.
*   **Session Management:** Handled by NextAuth.js, providing session data client-side (`useSession`) and server-side (`getServerSession`).
*   **Role-Based Access Control (RBAC):**
    *   User model includes a `role` field with three possible values: `user`, `admin`, and `judge`.
    *   Admin-only sections (e.g., `/admin/*`) are protected by checking `session.user.role === 'admin'`.
    *   Judge sections (e.g., `/judge/*`) are accessible to users with `session.user.role === 'judge'` or admin users.
    *   API endpoints for sensitive operations (e.g., competition creation/update/deletion) verify admin privileges.
    *   **Judge Role Features (December 2024):**
        *   **Judge Dashboard (`/judge`):** Dedicated interface for judges to view competitions and evaluate submissions
        *   **Competition Statistics:** Overview of total, active, and completed competitions with submission counts
        *   **Judge Actions:** Quick access to view competitions, judge submissions in voting phase, and browse all submissions
        *   **Access Control:** Judges can access regular user features plus specialized judging functionality
        *   **UI Consistency (January 2025):** Judge dashboard feed now matches user dashboard design with proper card-based layout, shadows, borders, and consistent styling
            *   **Large Rounded Cards**: Updated from simple cards to large rounded cards (`rounded-2xl shadow-lg`) matching user dashboard exactly
            *   **Colored Backgrounds**: Added colored backgrounds based on competition status (`bg-yellow-50` for voting, `bg-green-50` for completed, `bg-blue-50` for active)
            *   **Enhanced Layout**: Implemented proper flex layouts (`flex-col md:flex-row`) with larger images and better spacing
            *   **Gradient Buttons**: Replaced simple buttons with gradient action buttons matching user dashboard styling
            *   **Consistent Typography**: Updated to use large headers (`text-lg`) and proper color schemes matching SnapScape branding
            *   **Status-based Styling**: Dynamic border colors and backgrounds that change based on competition and activity status
            *   **Image Enhancement**: Larger competition images (`w-32 h-24`) with proper rounded corners and responsive sizing
            *   **Exact Style Matching (Latest Update)**: Competition cards now use identical styling to user dashboard
                *   **Voting Competitions**: Compact horizontal layout (`w-32 h-24` images) with yellow styling (`bg-yellow-50 border-yellow-400`)
                *   **Active/Upcoming Competitions**: Larger layout (`w-2/5 h-48` images) with sky blue styling (`bg-sky-50 border-sky-400`)
                *   **Completed Competitions**: Compact horizontal layout with green styling (`bg-green-50 border-green-400`)
                *   **Responsive Design**: Proper `flex-col md:flex-row` layouts with appropriate image sizing and content organization
                *   **Typography Consistency**: Exact font sizes, colors, and spacing matching user dashboard (`text-lg font-bold text-[#1a4d5c]`)
                *   **Button Styling**: Identical gradient buttons with proper sizing and responsive text (`text-xs md:text-sm`)
                *   **Status Badges**: Consistent badge placement and styling across both dashboards
        *   **Role Assignment:** Admins can assign judge role through user management interface (`/admin/users/[id]` and `/admin/users`)
        *   **Routing Logic:** Automatic redirection to judge dashboard (`/judge`) when judges access root dashboard (`/dashboard`)
        *   **Visual Distinction:** Judge role displayed with blue color scheme (blue-100 background, blue-800 text) in admin interfaces
        *   **Middleware Protection:** Judge routes protected via middleware, only accessible to users with judge or admin role
        *   **Token Management:** JWT token verification for judge role similar to admin role verification
        *   **User Interface Updates:**
            *   Added judge role filter option in admin user management page
            *   Added "Set as Judge" button in individual user management page
            *   Added "Make Judge" option in user dropdown menus
            *   Updated role display colors across dashboard, user lists, and admin interfaces
    *   **Role Assignment Interface:**
        *   **Admin User Management (`/admin/users`):** Filter users by role including judge, view judge users with blue badges
        *   **Individual User Management (`/admin/users/[id]`):** Set user role to judge using dedicated button
        *   **Role Change API:** Existing user role update API (`/api/users/[id]`) supports judge role assignment

### 2.2. Bulk Notification System Optimization (January 2025)

**Problem Solved:** 
The original notification system was experiencing `FUNCTION_INVOCATION_TIMEOUT` errors (504) when sending notifications to all registered users, particularly for competitions with large user bases. This was due to sequential processing of notifications within serverless function timeout limits.

**Solution Implementation:**

#### Batch Processing Architecture
*   **File:** `src/lib/bulk-notification-service.ts`
*   **Core Functions:**
    *   `queueBulkNotifications()`: Initiates background batch processing for large user counts
    *   `sendBulkNotificationsSync()`: Direct processing for small user counts (≤100 users)
    *   `processBulkNotificationsBatches()`: Background batch processor

#### Key Features:
*   **Intelligent Processing Selection:**
    *   ≤100 users: Synchronous parallel processing for immediate completion
    *   >100 users: Asynchronous batch processing to avoid timeouts
*   **Batch Configuration:**
    *   Batch size: 50 users per batch
    *   Batch delay: 1 second between batches
    *   Parallel processing within each batch
*   **Timeout Prevention:**
    *   Background processing returns immediately with queue confirmation
    *   Extended Vercel function timeouts (60 seconds) for notification endpoints
    *   Progress tracking and error handling

#### API Endpoint Updates:
*   **New Competition Notifications:** `/api/admin/send-new-competition-notifications`
*   **Voting/Status Notifications:** `/api/admin/send-voting-notifications`
*   **Enhanced Response:** Includes total users, processing batches, and estimated completion time

#### Vercel Configuration Updates:
```json
{
  "functions": {
    "src/app/api/admin/send-new-competition-notifications/route.js": {
      "memory": 1024,
      "maxDuration": 60
    },
    "src/app/api/admin/send-voting-notifications/route.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

#### Error Handling:
*   Graceful batch failure recovery
*   Detailed error logging with user email identification
*   Partial success reporting (some notifications succeed even if others fail)
*   Background process monitoring and logging

#### Benefits:
*   **Eliminates timeout errors** for large user bases
*   **Improved performance** through parallel processing within batches
*   **Better user experience** with immediate confirmation of notification queuing
*   **Scalable architecture** that handles growing user bases
*   **Detailed progress tracking** for administrators

### 2.3. Competition Lifecycle Management (Admin Focus)
*   **Creation (`/admin/competitions/create`):**
    *   **Judge Assignment**: Admins can assign multiple judges from the available judge-type users to each competition
        *   **Judge Selection Interface**: Grid-based selection with judge profiles (name, email, avatar)
        *   **Multi-Select**: Support for assigning multiple judges to a single competition
        *   **Optional Assignment**: Judge assignment is not mandatory for competition creation
        *   **Visual Feedback**: Selected judges are highlighted with checkmarks and shown in a summary panel
        *   **Real-time Updates**: Judge list fetched dynamically from users with 'judge' role
        *   **Automatic Notifications**: When judges are assigned to a competition, they automatically receive notifications in their dashboard feed
            *   **Notification Type**: "Judge Assignment" notifications appear in judge dashboard with competition-specific context
            *   **Smart Messaging**: Notification message varies based on competition status (active, voting, upcoming)
            *   **Direct Links**: Notifications include direct links to competition details or judging interface
            *   **Real-time Delivery**: Notifications appear immediately in judge dashboard after assignment
    *   **Form Fields**: Title, description, theme, rules, prizes, dates/times, submission limits, voting criteria, etc.
    *   Admins can define: Title, Theme, Description, Rules, Prizes, Start Date, Submission End Date, Voting End Date, Submission Limit per User, Voting Criteria (comma-separated string, e.g., "composition,creativity,technical"), Cover Image.
    *   **Cover Image Cropping:** Uses `react-image-crop`. Admins upload an image, a crop UI appears (defaulting to a 4/3 aspect ratio), and crop parameters (`cropX`, `cropY`, `cropWidth`, `cropHeight`) are sent to the backend.
    *   **Status:** Competitions are typically created with an "upcoming" status.
    *   **`hideOtherSubmissions` Flag:** A boolean option to control if users can see other submissions before voting ends for certain competition types.
    *   **Manual Status Override:** New option to prevent automatic status updates based on dates.
*   **Editing (`/admin/competitions/[id]/edit`):**
    *   Admins can modify all fields from the creation form.
    *   Crucially, this form handles `multipart/form-data` using `formidable` on the backend due to the cover image upload. This required careful handling of field parsing, as `formidable` can parse single text fields as arrays. Logic was added to ensure these fields are converted back to strings before database updates.
    *   Status can be changed (e.g., from "active" to "voting").
    *   **Manual Status Override Checkbox:** Allows admins to prevent automatic status updates for specific competitions.
*   **Automatic Status Updates:** 
    *   Competitions automatically transition through statuses based on dates:
        *   **Upcoming** → **Active**: When current time reaches start date
        *   **Active** → **Voting**: When current time reaches submission end date
        *   **Voting** → **Completed**: When current time reaches voting end date
    *   Automatic notifications sent when status changes to voting or completed
    *   Manual override option available to prevent automatic updates
    *   **Cron Job Configuration:** Automated via Vercel cron jobs running every 5 minutes
*   **Deletion:** Admin functionality to delete competitions (likely with checks, e.g., cannot delete if submissions exist).
*   **Viewing Competitions (Admin):** A list view of all competitions, likely with their current status.

### 2.4. User Interaction with Competitions
*   **Discovery:** Users see "active" and "upcoming" competitions on the dashboard feed and potentially a dedicated "Competitions" tab/page.
*   **Viewing Details (`/dashboard/competitions/[id]`):** Displays comprehensive information about a competition.
*   **Submitting Photos:**
    *   Users can submit to "active" competitions.
    *   Respects `submissionLimit` per user.
*   **Voting (`/dashboard/competitions/[id]/view-submissions`):**
    *   When a competition is in "voting" status, this page serves as the voting interface.
    *   Users can view submissions (respecting `hideOtherSubmissions` if applicable before voting opens to all).
    *   A voting mechanism (e.g., star rating against defined criteria) allows users to cast votes.
*   **Viewing Results (`/dashboard/competitions/[id]/view-submissions` with query param like `?result=1`):**
    *   Displays ranked submissions for "completed" competitions.
    *   Shows average ratings, rating counts, and ranks.
    *   Includes trophy icons (🥇, 🥈, 🥉) for top ranks.
    *   Highlights the current user's submissions.

### 2.5. User Profile & Settings
*   **Profile Page (`/dashboard/profile`):**
    *   Displays basic user information with settings gear icon
    *   **Photo Gallery:** Shows all photos submitted by the user across various competitions.
        *   Fullscreen modal for viewing images, which also displays the rank achieved in that photo's competition. This required fetching all approved submissions for that specific competition to calculate the rank accurately.
    *   **Competition Achievements:** Displays counts of 1st, 2nd, and 3rd place finishes. These icons are clickable and scroll the user to the relevant image in their gallery.
    *   **Points Display:** Shows total points earned from completed competitions only
*   **User Settings System (`/dashboard/settings`):**
    *   **Main Settings Page:** Central hub for user preferences
    *   **Notification Preferences (`/dashboard/settings/notifications`):**
        *   Granular control over email notifications
        *   Categories include: Competition Reminders, Voting Notifications, Achievement Notifications, Weekly Digest, Marketing Emails
        *   Real-time save functionality with success feedback
        *   Integration with user model for persistent preferences

### 2.6. Dashboard Feed (`/dashboard/page.tsx`)
*   **Unified Feed:** A central part of the user experience, combining various event types into a single, chronologically sorted list.
    *   **Feed Item Types:** `competition_active`, `competition_upcoming`, `competition_voting`, `competition_completed_results`, and specific `activity` types (submission, badge earned, win).
    *   **Data Aggregation:** A `useEffect` hook fetches data from multiple API endpoints (`/api/competitions`, `/api/users/activities`, etc.) and merges them into a `feedItems` state array.
    *   **Sorting:** Feed items are sorted by a `sortDate` property.
        *   **Timestamp Accuracy:** This was a critical area of refinement. Initially, some items used `createdAt` or `startDate` incorrectly. The logic was updated to use `updatedAt` for events like a competition moving to "voting" or "completed", ensuring the feed reflects the true recency of the event. `startDate` is used for "upcoming" competitions, and `createdAt` or `endDate` are fallbacks.
    *   **Layout & Styling:**
        *   Desktop layout for active/upcoming cards: Image on the left, details on the right.
        *   Consistent styling (background, borders) for different card types (e.g., voting, completed results, active).
        *   Resolved image display issues (e.g., black boxes due to overlays covering images).
        *   Enforced a single-column layout by removing a two-column toggle option.
    *   **Duplicate Item Resolution:** Removed redundant notification blocks that caused items (like completed results or voting notifications) to appear twice. The unified `feedItems` array is now the single source of truth for feed rendering.
*   **User Statistics:** Displays key metrics like total submissions, photos rated, badges earned, etc.

### 2.7. Admin Notification System
*   **Competition Reminders (`/admin/settings/competition-reminders`):**
    *   Automated email reminders for competition deadlines
    *   Day-before and last-day reminder options
    *   Manual trigger capability for testing
    *   Comprehensive logging and reporting
*   **Voting Notifications (`/admin/settings/competition-reminders`):**
    *   **Test Notifications:** Send voting open/completed notifications to specific email addresses for testing
    *   **Mass Notifications:** Send notifications to all registered users
    *   **Notification Types:** 
        *   Voting Open (Active → Voting transition)
        *   Competition Completed (Voting → Completed transition)
        *   New Competition Created (sends new competition announcements)
    *   **Integration:** Uses existing email templates and notification services
    *   **Recipient Options:** Send to specific user by email or all registered users
    *   **Real-time Feedback:** Detailed results showing success/failure counts and error messages
    *   **Smart Routing:** Automatically routes to appropriate API endpoint based on notification type
*   **New Competition Notifications (`/admin/settings/competition-reminders`):**
    *   **Automatic Notifications:** Automatically send notifications to all registered users when a new competition is created
    *   **Manual Testing:** Send new competition notifications to specific email addresses for testing
    *   **User Preference Integration:** Only sends to users who have opted in for new competition notifications in their settings
    *   **Email Template:** Beautiful, responsive email template featuring:
        *   Competition title, theme, and description
        *   Start and end dates with proper formatting
        *   Direct links to competition and dashboard
        *   Participation tips and guidelines
        *   Unsubscribe information and preference management
    *   **In-app Notifications:** Creates system notifications alongside email notifications
    *   **Comprehensive Reporting:** Detailed success/failure tracking with error logging
*   **Debug Tools (`/admin/settings`):**
    *   **Notification Preferences Debug Tool (`/admin/debug/notification-fix`):**
        *   **Diagnose:** Analyzes user notification preferences in the database
        *   **Problem Detection:** Identifies users missing notification preferences (common issue for users created before the feature was added)
        *   **Safe Fix:** Updates users with missing preferences to default values without affecting users who explicitly opted out
        *   **Real-time Analysis:** Shows counts of users with different preference states
        *   **Verification:** Displays before/after statistics to confirm the fix worked
        *   **Use Case:** Resolves issues where new competition notifications are sent to fewer users than expected
        *   **Security:** Admin-only access with proper authentication checks

### 2.8. Automatic Competition Status Management
*   **Competition Status Management (`/admin/settings/competition-status`):**
    *   **Preview System:** Shows competitions that need status updates before applying changes
    *   **Manual Trigger:** Allows admins to manually run status updates with bypass options
    *   **Results Display:** Shows detailed results of last update operation
    *   **Cron Job Integration:** Instructions and endpoints for production automation
*   **Automatic Status Update Service (`src/lib/competition-auto-status-service.ts`):**
    *   Checks all competitions against current date/time
    *   Updates status based on competition dates
    *   Sends notifications for voting/completed transitions
    *   Respects manual override settings
    *   Comprehensive logging and error handling
*   **API Endpoints (`/api/cron/update-competition-statuses`):**
    *   **GET:** Cron job endpoint with Bearer token authentication
    *   **POST:** Manual trigger for admins with bypass options
    *   **PUT:** Preview endpoint to see competitions needing updates
*   **Database Schema Updates:**
    *   Added `manualStatusOverride` field to Competition model
    *   Added `lastAutoStatusUpdate` timestamp tracking
    *   Added `notificationPreferences` to User model

### 2.9. Competition Status Update Fix (December 2024)
*   **Issue Identified:** Competitions were not automatically transitioning from "voting" to "completed" status when voting end dates passed
*   **Root Cause:** Missing cron job configuration in `vercel.json` for automatic status updates
*   **Solution Implemented:**
    *   Added cron job to `vercel.json`: `"schedule": "*/5 * * * *"` (runs every 5 minutes)
    *   Cron job calls `/api/cron/update-competition-statuses` endpoint
    *   Automatic status transitions now work as designed
*   **Manual Resolution:** For immediate issues, admins can use:
    *   Admin interface: `/admin/settings/competition-status`
    *   Manual API trigger: `POST /api/cron/update-competition-statuses`
*   **Deployment Note:** Cron job changes require redeployment to take effect
*   **Monitoring:** Status updates are logged and can be monitored through admin interface

### 2.10. Universal Access to Competition Results (December 2024)
*   **Feature:** All registered users can now view results of completed competitions, regardless of whether they participated
*   **Previous Behavior:** Only users who submitted photos to a competition could see its results
*   **Changes Made:**
    *   **Dashboard Feed:** Removed `participated=true` filter from completed competitions API call
    *   **Profile Page:** Updated achievement syncing to access all completed competitions
    *   **Results Page Logic:** Enhanced to show all submissions when `showResults=true` or competition status is "completed"
    *   **Benefits:**
        *   Increased engagement by allowing all users to browse competition results
        *   Educational value - users can learn from winning submissions
        *   Better community building through shared access to competition outcomes
        *   Transparent and inclusive platform experience
*   **Technical Implementation:**
    *   Modified `/api/competitions` calls in dashboard and profile pages
    *   Updated view-submissions page logic to include `showResults` in `shouldShowAll` condition
    *   Maintained proper access controls for active/voting phases (users still only see own submissions during submission phase)
*   **User Experience:** Users can now discover and explore all completed competition results from the dashboard feed and direct links

### 2.11. Dashboard and Results Page Ranking Consistency Fix (December 2024)
*   **Issue Identified:** Rankings displayed on the dashboard for completed competitions did not match the rankings shown on the results page
*   **Root Cause:** Different ranking calculation methods were being used:
    *   Dashboard: Sorted by `averageRating` first, then `ratingCount`, and used separate comparison for dense ranking
    *   Results page: Sorted by **total rating** (`averageRating × ratingCount`) first, then average rating, then rating count as tiebreakers
*   **Solution Implemented:**
    *   **Updated Dashboard Sorting Logic:** Changed from sorting by average rating to sorting by total rating (averageRating × ratingCount) as primary criteria
    *   **Updated Dashboard Ranking Logic:** Modified dense ranking calculation to use total rating comparison instead of separate average rating and rating count comparisons
    *   **Ensures Consistency:** Both dashboard and results page now use identical ranking methodology
*   **Technical Changes:**
    *   Modified sorting logic in `fetchCompletedCompetitions` function in `src/app/dashboard/page.tsx`
    *   Updated ranking calculation in dashboard feed item display for completed competitions
    *   Maintained dense ranking method (same rank for tied submissions)
*   **Benefits:**
    *   Consistent ranking display across all pages
    *   Accurate user ranking information in dashboard notifications
    *   Eliminates confusion about different rankings being shown

### 2.12. Photographer Ranking Tab for Competition Results (December 2024)
*   **Feature Added:** New "Photographer Rank" tab on competition results page that ranks photographers based on their performance in the competition
*   **Implementation Details:**
    *   **Ranking Logic:** Photographers ranked by their best submission's total rating (averageRating × ratingCount)
    *   **Tiebreakers:** If best submission ratings are tied, uses average rating across all submissions, then number of submissions
    *   **Dense Ranking:** Tied photographers receive the same rank with proper dense ranking implementation
    *   **Display Information:** Shows photographer name, best submission image, best submission rating, total rating, number of submissions, and overall average
*   **User Interface:**
    *   **Tab Navigation:** Clean tab interface switching between "Results" (submission rankings) and "Photographer Rank"
    *   **Responsive Design:** Optimized layouts for both mobile and desktop viewing
    *   **Visual Consistency:** Matches existing design patterns with trophy icons, color-coded ranks, and user highlighting
    *   **Profile Integration:** Displays photographer profile images when available
*   **Technical Changes:**
    *   Added `activeResultsTab` state management for tab switching
    *   Created `photographerRankings` memoized calculation for efficient ranking computation
    *   Implemented grouping logic to consolidate multiple submissions per photographer
    *   Added comprehensive UI components for both mobile and desktop photographer rank display
*   **Benefits:**
    *   **Enhanced Competition Analysis:** Users can now see which photographers performed best overall
    *   **Community Recognition:** Highlights top-performing photographers in each competition
    *   **Comprehensive Results:** Provides both individual submission rankings and photographer performance metrics
    *   **User Engagement:** Encourages healthy competition among photographers

### 2.13. Photographer Ranking Calculation Update (December 2024)
*   **Issue Identified:** Photographer rankings were calculated based on individual best submission performance instead of cumulative performance across all submissions
*   **Root Cause:** Previous logic used only the best submission's total rating as the ranking criteria, not accounting for photographers' overall competition performance
*   **Solution Implemented:**
    *   **Updated Ranking Calculation:** Changed from best submission total rating to **cumulative total points** across all submissions
    *   **Point Calculation:** Each submission contributes points based on its individual rank (1st place = 5x multiplier, 2nd = 3x, 3rd = 2x, others = 1x)
    *   **Cumulative Metrics:** Now displays:
        *   **Total Points:** Sum of all submission points (primary ranking criteria)
        *   **Total Votes:** Sum of all votes received across all submissions
        *   **Total Rating:** Sum of all total ratings across all submissions
    *   **Ranking Tiebreakers:** 1) Total Points → 2) Total Rating → 3) Total Votes
*   **Impact:** Photographers with multiple submissions now get proper credit for their overall competition performance, not just their single best photo
*   **Files Modified:**
    *   `src/app/dashboard/competitions/[id]/view-submissions/page.tsx` - Updated photographer ranking logic and display
*   **Deployment Status:** ✅ Implemented and tested locally

### 2.14. Social Media Sharing Feature for Competition Results (December 2024)
*   **Feature Added:** Integrated social media sharing functionality within both "Results" and "Photographer Rank" tabs on competition results page
*   **Implementation Approach:**
    *   **Embedded Sharing:** Share buttons integrated directly into tab headers (no separate tab)
    *   **Enhanced Content Generation:** Now includes details about top 3 winners/photographers instead of just the winner
    *   **Tab-Specific Content:** Different share content generated for Results vs Photographer Rankings
    *   **Responsive Layout:** Share buttons positioned on right side (desktop) or below content (mobile)
    *   **Featured Image Support:** Automatic Open Graph and Twitter Card meta tags for rich social media previews
*   **Supported Platforms:**
    *   **Twitter:** Opens tweet composer with pre-filled competition results text and URL
    *   **WhatsApp:** Opens WhatsApp with shareable message ready to send
    *   **Instagram:** Copies formatted text to clipboard (since Instagram doesn't support direct URL sharing)
    *   **Copy to Clipboard:** General clipboard functionality for any platform
*   **Enhanced Content Features:**
    *   **Top 3 Winners:** Shows detailed information about top 3 submissions including names, titles, ratings, and vote counts
    *   **Top 3 Photographers:** Shows detailed information about top 3 photographers including points, votes, and submission counts
    *   **Rich Metadata:** Automatic generation of Open Graph and Twitter Card tags for social media previews
    *   **Featured Images:** Uses winning submission image or SnapScape logo for social media preview images
*   **Generated Content Examples:**
    *   **Results Share:** 
      ```
      🏆 Results from "[Competition]" photography competition!
      
      Theme: [Theme]
      
      🥇 1st Place: [Winner Name]
         "[Photo Title]" - 4.8★ (15 votes, 72.0 total)
      
      🥈 2nd Place: [Second Place Name]
         "[Photo Title]" - 4.6★ (12 votes, 55.2 total)
      
      🥉 3rd Place: [Third Place Name]
         "[Photo Title]" - 4.4★ (10 votes, 44.0 total)
      
      Join SnapScape for amazing photography competitions! 📸
      ```
    *   **Photographer Share:** 
      ```
      🏆 Photographer Rankings from "[Competition]" competition!
      
      Theme: [Theme]
      
      🥇 1st Place: [Photographer Name]
         150 points • 25 votes • 3 submissions
      
      🥈 2nd Place: [Photographer Name]
         120 points • 20 votes • 2 submissions
      
      🥉 3rd Place: [Photographer Name]
         90 points • 18 votes • 2 submissions
      
      Join SnapScape for amazing photography competitions! 📸
      ```
*   **Social Media Meta Tags:**
    *   **Open Graph Tags:** Complete Facebook/social media preview support
    *   **Twitter Cards:** Optimized for Twitter sharing with large image previews
    *   **Dynamic Content:** Page title and description generated based on competition and results
    *   **Image Selection:** Uses winning submission image as featured image, falls back to SnapScape logo
*   **User Interface Features:**
    *   **Compact Design:** Small icon buttons with tooltips for space efficiency
    *   **Visual Feedback:** Hover effects with platform-specific colors
    *   **Mobile Optimization:** Responsive positioning and touch-friendly buttons
    *   **Accessibility:** Proper titles and ARIA labels for screen readers
*   **Technical Implementation:**
    *   **Enhanced Content Generation:** Comprehensive top 3 details with rankings, statistics, and emojis
    *   **Meta Tag Management:** Dynamic Open Graph and Twitter Card generation using Next.js Head component
    *   **Cross-browser Compatibility:** Modern Clipboard API with fallback support
    *   **Performance Optimized:** Lightweight components with efficient rendering
    *   **Type Safety:** Full TypeScript support with proper typing
*   **SEO Benefits:**
    *   **Rich Previews:** Social media shares display attractive preview cards with images and descriptions
    *   **Increased Engagement:** Detailed content encourages more social media interaction
    *   **Brand Recognition:** SnapScape logo appears in social previews when no winning image available
    *   **Organic Growth:** Enhanced sharing drives more traffic to competition results
*   **User Benefits:**
    *   **Comprehensive Sharing:** Full context about competition results in social media posts
    *   **Visual Appeal:** Rich previews with images make shared content more attractive
    *   **Community Building:** Detailed results promote healthy competition and community engagement
    *   **Platform Flexibility:** Support for all major social media platforms with optimized content for each
*   **Files Modified:**
    *   `src/app/dashboard/competitions/[id]/view-submissions/page.tsx` - Enhanced sharing functionality and meta tags
    *   `ProjectDocumentationDetailed.md` - Updated documentation
*   **Dependencies:** Uses existing `/logo.png` for default featured image
*   **Deployment Status:** ✅ Implemented and ready for testing

### 2.15. Profile Incomplete Notification System (December 2024)
*   **Feature:** Automatic notification banner for Google OAuth users with incomplete profile information
*   **Target Users:** Users who signed up using Google OAuth but haven't provided mobile number and/or country information
*   **Notification Display:**
    *   **Location:** Appears at the top of all dashboard pages, right after the main content area starts
    *   **Design:** Yellow gradient banner with warning icon, informative text, and action buttons
    *   **Message:** Displays which specific fields are missing (mobile number, country, or both)
    *   **Actions:** "Complete Profile" button linking to `/dashboard/edit-profile`, dismissible close button
*   **Technical Implementation:**
    *   **Component:** `ProfileIncompleteNotification` (`src/components/ProfileIncompleteNotification.tsx`)
        *   Fetches user profile data via `/api/users/profile` to check completeness
        *   Only shows for users with `provider: 'google'` and missing mobile/country
        *   Includes loading states and error handling
        *   Dismissible functionality (notification hidden until page refresh)
    *   **Integration:** Added to dashboard layout (`src/app/dashboard/layout.tsx`) for universal coverage
    *   **Detection Logic:**
        *   Checks if `mobile` field is empty, null, or whitespace
        *   Checks if `country` field is empty, null, whitespace, or "Select Country" default value
        *   Only displays for Google OAuth users (`provider === 'google'`)
*   **User Experience:**
    *   **Non-intrusive:** Appears only for applicable users and can be dismissed
    *   **Helpful:** Clearly indicates which information is needed and provides direct access to edit profile
    *   **Context-aware:** Links directly to the edit profile page where users can complete their information
    *   **Visual Design:** Uses consistent SnapScape styling with yellow/orange gradient and appropriate icons
*   **Benefits:**
    *   **Profile Completeness:** Encourages Google OAuth users to provide contact information for better platform engagement
    *   **Communication:** Ensures administrators can reach users for important notifications
    *   **User Engagement:** Helps users understand the value of complete profiles for enhanced SnapScape experience
    *   **Data Quality:** Improves overall user data completeness for platform analytics and communication

### 2.16. Analytics Dashboard (December 2024)
*   **Feature:** Comprehensive analytics dashboard for administrators to monitor platform performance and user engagement
*   **Access:** Available at `/admin/analytics` for admin users only
*   **Key Metrics Displayed:**
    *   **User Statistics:**
        *   Total registered users
        *   New users in selected time period
        *   Active users (users who created or updated profiles)
        *   Growth rate percentage compared to previous period
    *   **Photo Statistics:**
        *   Total photo submissions across all competitions
        *   New photo submissions in selected time period
        *   Average photos per user
        *   Top photo categories based on competition themes
    *   **Competition Statistics:**
        *   Total competitions created
        *   Active, upcoming, and completed competition counts
        *   Average participation rate (photos per competition)
    *   **Engagement Statistics:**
        *   Total ratings/votes cast
        *   Average rating score across all submissions
*   **Time Range Filtering:**
    *   Selectable time periods: Last 7 days, 30 days, 90 days, or 1 year
    *   Dynamic data updates when time range is changed
    *   Loading states during data refresh
*   **Visual Charts:**
    *   **Monthly Active Users:** Bar chart showing user activity over the last 12 months
    *   **Monthly Photo Uploads:** Bar chart displaying photo submission trends
    *   Interactive hover tooltips showing exact values
    *   Responsive design adapting to different screen sizes
*   **Category Analysis:**
    *   Top 5 photo categories ranked by submission count
    *   Visual progress bars showing relative popularity
    *   Based on competition themes aggregated across all competitions
*   **Competition Performance Metrics:**
    *   Detailed breakdown of competition statuses
    *   Average participation rates to identify engagement trends
    *   Total competition count for platform growth tracking
*   **Technical Implementation:**
    *   **API Endpoint:** `/api/analytics` with time range query parameters
    *   **Database Aggregation:** MongoDB aggregation pipelines for efficient data processing
    *   **Real-time Data:** Fetches live data from User, PhotoSubmission, Competition, and Rating collections
    *   **Admin Authentication:** Secure access with session validation and role checking
    *   **Error Handling:** Comprehensive error states with retry functionality
*   **Benefits:**
    *   **Platform Insights:** Administrators can track user growth and engagement trends
    *   **Content Analysis:** Understanding popular photo categories and competition themes
    *   **Performance Monitoring:** Identifying successful competitions and participation patterns
    *   **Data-Driven Decisions:** Supporting strategic decisions with concrete metrics
    *   **Growth Tracking:** Monitoring platform expansion and user acquisition over time

## 3. Data Handling and Privacy

*   **Database:** MongoDB. Mongoose models define schemas for `Competition`, `User`, `PhotoSubmission`, `Activity`, `ReminderLog`, etc.
*   **Data Protection:**
    *   HTTPS is assumed for production to encrypt data in transit.
    *   MongoDB security features (authentication, IP whitelisting for Atlas) should be configured.
*   **User Data:**
    *   Passwords (if using credentials provider) are hashed by NextAuth.js.
    *   API routes ensure data is fetched/modified only by authenticated and authorized users.
    *   **Notification Preferences:** Stored securely in user model with granular controls
*   **File Uploads:**
    *   Managed by `formidable` on the backend. Files are temporarily stored on the server during processing. A robust solution would involve uploading to a cloud storage service (e.g., S3, Cloudinary) and storing the URL in the database.
    *   Crop parameters for cover images are stored alongside competition data.
*   **Audit Logging:**
    *   Comprehensive logging for reminder and notification activities
    *   Status change tracking with timestamps and user attribution
    *   Error logging for debugging and monitoring

## 4. User Interface (UI) and User Experience (UX) Design

*   **Responsive Design:** Tailwind CSS utility classes are used extensively to ensure the application adapts to different screen sizes (e.g., `md:hidden`, `hidden md:block`). Mobile views, particularly for the results page, underwent iterative improvements for better organization and aesthetics.
*   **Clarity & Navigation:**
    *   Dashboard with clear tabs for "Feed", "Competitions", "Activity".
    *   Sidebar navigation for main sections.
    *   Consistent button styling and calls to action.
    *   **Settings Integration:** Gear icon in profile for easy access to user settings
*   **Visual Feedback:**
    *   Loading spinners/states during data fetching.
    *   Success and error messages for form submissions and API interactions.
    *   Visual cues for rankings (trophy icons, color-coded badges).
    *   **Real-time Notifications:** Toast notifications for settings saves and other actions
*   **Admin Interface Enhancements:**
    *   **Color-coded Sections:** Purple theme for voting notifications, yellow for reminders
    *   **Comprehensive Tables:** Detailed views of notification results and competition status
    *   **Interactive Controls:** Real-time preview and manual trigger capabilities
*   **Accessibility:** While not explicitly detailed as a primary focus in interactions, best practices like semantic HTML and keyboard navigability are inherent goals with modern frameworks and should be continually assessed.
*   **Specific UI Challenges Addressed:**
    *   Ensuring image display on feed cards (e.g., removing covering overlays, applying `rounded-lg overflow-hidden`).
    *   Reformatting the mobile view of the competition results page for better readability and attractiveness.
    *   Fixing JSX syntax errors during UI development (e.g., unclosed tags).
    *   **Button Height Matching:** Ensured consistent button heights in profile page
    *   **Points Display Logic:** Fixed frontend calculation to only show points from completed competitions

## 5. Error Handling Strategies

*   **Client-Side (`handleSubmit` functions, API call wrappers):**
    *   Required field validation in forms.
    *   Error state variables (`setError`, `setSuccess`) to display messages to the user.
    *   Parsing API error responses: `if (!res.ok) { try { errorData = await res.json() } catch { errorData = { message: await res.text() } } ... }`.
    *   Example: `TypeError: Failed to fetch` logged in `fetchDashboardData` indicates network or API issues.
    *   **Cache-busting:** Added timestamp parameters to prevent stale data issues
*   **Server-Side (API Routes):**
    *   `try...catch` blocks around database operations and critical logic.
    *   Returning `NextResponse.json({ success: false, message: ... }, { status: ... })` for errors.
    *   **`formidable` errors:** Parsing errors are caught and reported.
    *   **Mongoose Validation Errors:** `CastError` (e.g., "Cast to string failed for value [ 'voting' ] (type Array) at path 'status'") handled by ensuring data types match the schema before database operations. This was particularly relevant after introducing `formidable`, which tended to parse all form fields into arrays. The fix involved checking `Array.isArray(fields.fieldName) ? fields.fieldName[0] : fields.fieldName`.
    *   **Route `params` await error:** A Next.js warning (`Route "/api/competitions/[id]" used params.id. params should be awaited...`) was noted, though the destructuring approach `{ params: { id } }` is standard for App Router.
    *   Initial backend errors where API routes returned plain text instead of JSON for errors, causing client-side JSON parsing failures.
    *   **Comprehensive Error Logging:** Added detailed logging for notification and status update operations
*   **File `README-local-setup.md`:** Includes troubleshooting tips for common setup errors (Next.js cache, MongoDB connection, Google Auth).

## 6. Testing and Validation

*   **Iterative Manual Testing:** The primary mode of testing observed. Each feature addition or bug fix was followed by requests for the user (developer) to test and report back. This covered:
    *   Badge display on profiles.
    *   Ranking logic on results pages and dashboard cards (including ties).
    *   Feed content, sorting, and timestamp accuracy.
    *   Admin form submissions (creation and editing of competitions, including image cropping).
    *   Navigation and link correctness.
    *   **Notification System Testing:** Comprehensive testing of email notifications and user preferences
    *   **Points Calculation Validation:** Extensive debugging to ensure points only show from completed competitions
    *   **Automatic Status Updates:** Testing of cron job functionality and manual triggers
*   **Debugging:** Extensive use of `console.log` on both client and server to trace data flow and identify issues.
    *   **Advanced Debugging:** Added comprehensive debugging systems for points calculation and notification tracking
*   **Linter Fixes:** Addressed ESLint errors (type mismatches, incorrect `formData` access, `setError` usage, `instanceof Date` checks).
*   **No Formal Automated Testing Suite:** While highly beneficial, automated tests (unit, integration, E2E) were not part of the interactions. This is a key area for future improvement to ensure long-term stability.

## 7. Performance Metrics

*   **API Response Optimization:**
    *   Increased `limit` parameter in `/api/submissions` and `/api/competitions` calls from the dashboard to reduce the chance of missing items due to default low limits, improving perceived performance and data completeness.
    *   **Cache Management:** Added cache-busting parameters to ensure fresh data
*   **Client-Side Rendering:**
    *   Next.js's built-in optimizations (code splitting, `next/image`) are leveraged.
*   **Data Fetching:**
    *   Specific fetching functions for different data types on the dashboard (`fetchDashboardData`, `fetchVotingCompetitions`, `fetchCompletedCompetitions`, `fetchActivities`).
    *   Polling implemented on the dashboard to auto-refresh data every 30 seconds.
    *   **Optimized Queries:** Database queries optimized to only fetch completed competitions for points calculation
*   **Background Processing:**
    *   Automatic status updates run via cron jobs to reduce server load
    *   Notification processing with rate limiting to prevent email service overload
*   **No Formal Benchmarking:** Performance improvements were mostly reactive to observed issues (e.g., missing data in feeds).

## 8. API Integrations and Design

### Internal APIs (Next.js API Routes)
*   **Structure:** RESTful principles, e.g., `GET /api/competitions`, `POST /api/competitions`, `PUT /api/competitions/[id]`.
*   **Request Handling:**
    *   Use `NextRequest` and `NextResponse`.
    *   `params` object for dynamic route segments (e.g., `params.id`).
*   **New API Endpoints:**
    *   **`/api/admin/send-voting-notifications`:** Handles voting notification dispatch
    *   **`/api/admin/reminder-logs`:** Manages reminder and notification logging
    *   **`/api/user/notification-preferences`:** Manages user notification settings
    *   **`/api/cron/update-competition-statuses`:** Handles automatic status updates
    *   **`/api/admin/send-new-competition-notifications`:** Handles new competition notification dispatch
*   **`multipart/form-data` Handling:**
    *   The `PUT /api/competitions/[id]` and `POST /api/competitions` routes (for editing/creating competitions with cover images) disable Next.js's default `bodyParser`.
    *   `formidable` library is used to parse `multipart/form-data`. This involved:
        *   Setting `multiples: false` in `formidable` options.
        *   Manually constructing a `PassThrough` stream from `req.body` and piping it to `formidable.parse()`, as `NextRequest` doesn't directly expose Node.js stream events (`req.on`).
        *   Copying headers from `req.headers` to the `PassThrough` stream for `formidable`.
    *   **Critical Fix:** Handling cases where `formidable` parses all text fields as arrays. A loop or specific checks now convert array values to single strings for fields defined as `String` in Mongoose schemas (e.g., `title`, `status`, `prizes`, `votingCriteria`).
*   **Security:** API routes are protected using `getServerSession` from NextAuth.js to check for authenticated users and their roles.
    *   **Cron Job Security:** Bearer token authentication for automated endpoints
    *   **Admin-only Endpoints:** Strict role checking for administrative functions
*   **Response Format:** Consistent JSON responses, typically `{ success: boolean, data?: any, message?: string }`.

### External APIs
*   Google OAuth is an external API integration managed by NextAuth.js.
*   **Email Service Integration:** Custom email service for notifications (likely SMTP or third-party service)

## 9. Feedback Mechanisms

*   **Developer-AI Collaboration:** The development process heavily relied on a tight feedback loop:
    1.  User (developer) states a requirement or reports a bug.
    2.  AI proposes a solution (code changes, explanations).
    3.  User applies the solution and tests.
    4.  User provides feedback on the outcome (success, new errors, further refinements).
    This iterative process was key to debugging complex issues like form handling and feed logic.
*   **User Notification Preferences:** In-app system for users to control their notification preferences
*   **Admin Feedback Systems:** Comprehensive reporting and logging for administrative actions
*   **No In-App User Feedback System:** Currently, there are no formal mechanisms for end-users of SnapScape to provide general feedback directly within the app.

## 10. Update and Maintenance Protocols

*   **Dependency Management:** `npm install` for managing packages. Regular updates to dependencies (`npm update` or targeted updates) are implied for security and feature benefits.
*   **Codebase Maintenance:** Refactoring (e.g., improving field processing in API routes, unifying feed logic) has occurred to enhance clarity and robustness.
*   **Environment Configuration:** `.env.local` for managing environment-specific variables (database connection strings, API keys). A `.env.template` or similar should exist to guide setup.
*   **Automated Maintenance:**
    *   **Cron Jobs:** Automatic competition status updates every 5 minutes in production
    *   **Database Cleanup:** Logging systems for tracking and potential cleanup of old records
*   **Deployment:**
    *   **Vercel Integration:** Configured for easy deployment with environment variables
    *   **Production Monitoring:** Logging systems for tracking application health

## 11. Localization and Internationalization (i18n)

*   **Current Status:** The application is primarily in English.
*   **Future Consideration:** No specific i18n libraries or structures have been implemented yet. If internationalization becomes a requirement, libraries like `next-i18next` would be suitable.

## 12. Development Environment and File Management

*   **Custom Instruction Adherence:**
    *   "Ensure any time an API is created, the corresponding page/UI is also implemented immediately": This was generally followed. For instance, when a `/dashboard/competitions/[id]/vote` route was thought to be needed, a placeholder page was created. When it was clarified that `/view-submissions` was the correct page, the incorrect one was removed and the link fixed.
    *   "Before creating a new file, verify that the file does not already exist...": This was a manual check during development.
    *   **Documentation Updates:** All new features are documented in this file as per user requirements
*   **Local Setup:** Documented in `README-local-setup.md`, covering cloning, environment variables, dependency installation, and running the dev server (`npm run dev`). Includes troubleshooting for common issues.
*   **Shell:** Interactions noted use of PowerShell on Windows.

## 13. Key Architectural Components & Technologies (Reiteration)

*   **Next.js (App Router):** For SSR, SSG, client-side navigation, API routes.
*   **TypeScript:** For static typing and improved code quality.
*   **MongoDB & Mongoose:** NoSQL database and ODM for data modeling and interaction.
*   **NextAuth.js:** Authentication (Google, Credentials).
*   **Tailwind CSS:** Utility-first CSS framework for styling.
*   **`formidable`:** Node.js module for parsing form data, especially `multipart/form-data`.
*   **`react-image-crop`:** React component for client-side image cropping.
*   **`date-fns`:** For robust date manipulations.
*   **React Hooks (`useState`, `useEffect`):** For component state and side effects.
*   **Email Service:** Custom email notification system
*   **Cron Job System:** Automated task scheduling for status updates

## 14. Critical File Structures (More Detail)

*   **`src/app/`**:
    *   **`layout.tsx`**: Root layout for the application.
    *   **`page.tsx`**: Homepage.
    *   **`api/`**:
        *   `auth/[...nextauth]/route.ts`: Core NextAuth.js configuration.
        *   `competitions/route.ts`: Handles `GET` (list all/filtered) and `POST` (create new) competitions.
        *   `competitions/[id]/route.ts`: Handles `GET` (single competition), `PUT` (update competition, uses `formidable`), `DELETE` (delete competition).
        *   `submissions/route.ts`: Handles fetching and potentially creating photo submissions. Includes query params for filtering by competition, status, and pagination (`limit`, `showAll`).
        *   `users/stats/route.ts`: Fetches user-specific statistics for the dashboard.
        *   `users/activities/route.ts`: Fetches a feed of user activities.
        *   **`admin/send-voting-notifications/route.ts`:** Handles voting notification dispatch
        *   **`admin/reminder-logs/route.ts`:** Manages reminder and notification logging
        *   **`user/notification-preferences/route.ts`:** Manages user notification settings
        *   **`cron/update-competition-statuses/route.ts`:** Handles automatic status updates
        *   **`admin/send-new-competition-notifications/route.ts`:** Handles new competition notification dispatch
    *   **`dashboard/`**:
        *   `layout.tsx`: Layout specific to the dashboard section (e.g., sidebar).
        *   `page.tsx`: The main dashboard page, heavily modified to include the unified feed, stats, and tabbed navigation.
        *   `competitions/[id]/page.tsx`: Detail page for a single competition.
        *   `competitions/[id]/view-submissions/page.tsx`: Displays submissions for viewing, results, and voting. Logic on this page adapts based on competition status.
        *   `profile/page.tsx`: User profile page, displays achievements and photo gallery.
        *   **`settings/page.tsx`:** Main user settings page
        *   **`settings/notifications/page.tsx`:** User notification preferences
    *   **`admin/`**:
        *   `competitions/create/page.tsx`: Form for creating new competitions, including `react-image-crop`.
        *   `competitions/[id]/edit/page.tsx`: Form for editing competitions, also including `react-image-crop` and handling `multipart/form-data`.
        *   **`settings/competition-reminders/page.tsx`:** Admin notification management
        *   **`settings/competition-status/page.tsx`:** Competition status management
        *   **`settings/layout.tsx`:** Settings navigation layout
*   **`src/components/`**: Likely contains reusable UI elements (e.g., specific card types if not directly in pages, modals, form inputs if abstracted).
*   **`src/lib/`**:
    *   `auth.ts`: Detailed configuration for NextAuth.js providers and callbacks.
    *   `mongodb.ts`: Utility to establish and reuse MongoDB connections.
    *   `helpers.ts` (or similar): Could contain utility functions like `formatTimeSince`.
    *   **`competition-auto-status-service.ts`:** Automatic status update logic
    *   **`competition-status-notification-service.ts`:** Status change notification handling
    *   **`emailService.ts`:** Email notification service
    *   **`notification-service.ts`:** In-app notification handling
    *   **`new-competition-notification-service.ts`:** New competition notification handling
*   **`src/models/`**:
    *   `Competition.ts`: Mongoose schema for competitions (includes fields like `title`, `theme`, `status`, `startDate`, `endDate`, `votingEndDate`, `coverImage`, `cropX`, `cropY`, etc., and importantly `createdAt`, `updatedAt` for timestamp tracking, plus `manualStatusOverride` and `lastAutoStatusUpdate`).
    *   `User.ts`: Mongoose schema for users (includes `name`, `email`, `image`, `role`, `notificationPreferences`).
    *   `PhotoSubmission.ts`: Mongoose schema for photo submissions (includes `user`, `competition`, `imageUrl`, `thumbnailUrl`, `averageRating`, `ratingCount`).
    *   `Activity.ts`: Mongoose schema for user activities.
    *   **`ReminderLog.ts`:** Schema for tracking notification and reminder activities
*   **`.env.local`**: For storing sensitive environment variables (DB connection string, NextAuth secrets, Google OAuth credentials, CRON_SECRET).

## 15. Latest Features Implementation Summary (2024)

### 15.1. Voting Notification System
*   **Admin Interface:** Purple-themed section in competition reminders page
*   **Functionality:** Send voting open/completed notifications to specific users or all users
*   **Integration:** Uses existing email templates and notification infrastructure
*   **Testing:** Comprehensive test email functionality with detailed reporting
*   **API:** `/api/admin/send-voting-notifications` with POST method

### 15.2. User Settings & Notification Preferences
*   **Settings Page:** Accessible via gear icon in user profile
*   **Notification Control:** Granular control over email notification types
*   **Categories:** Competition reminders, voting notifications, achievements, weekly digest, marketing
*   **Persistence:** Stored in user model with real-time updates
*   **API:** `/api/user/notification-preferences` with GET/POST methods

### 15.3. Automatic Competition Status Updates
*   **Service:** `competition-auto-status-service.ts` for automated status transitions
*   **Admin Interface:** Competition status management page with preview and manual trigger
*   **Cron Integration:** `/api/cron/update-competition-statuses` for automated execution
*   **Manual Override:** Competition-level setting to prevent automatic updates
*   **Notifications:** Automatic email notifications on status changes
*   **Logging:** Comprehensive audit trail for all status changes

### 15.4. Points System Refinement
*   **Calculation Fix:** Points only calculated from completed competitions
*   **Frontend Logic:** Removed incorrect estimation logic for active/voting competitions
*   **Debugging System:** Comprehensive logging for points calculation tracking
*   **User Experience:** Accurate points display with breakdown modal
*   **API Enhancement:** Updated `/api/users/[id]/stats` to filter by completion status

### 15.5. Enhanced Admin Features
*   **Competition Management:** Manual status override option in edit forms
*   **Notification Management:** Centralized admin interface for all notification types
*   **Logging System:** Detailed tracking of all administrative actions
*   **Preview Functionality:** See changes before applying them
*   **Error Handling:** Comprehensive error reporting and recovery

### 15.6. UI/UX Improvements
*   **Profile Enhancements:** Settings gear icon, improved button consistency
*   **Admin Interface:** Color-coded sections, improved table layouts
*   **Real-time Feedback:** Toast notifications, loading states, success/error messages
*   **Mobile Responsiveness:** Improved mobile layouts for new features
*   **Navigation:** Enhanced settings navigation with clear categorization

### 15.7. New Competition Notification System
*   **Automatic Integration:** Notifications automatically sent when competitions are created
*   **User Preference Respect:** Only sends to users who have opted in for new competition notifications
*   **Email Template:** Beautiful, responsive email template with competition details, dates, and action buttons
*   **Admin Testing:** Manual testing interface for sending to specific email addresses
*   **Service Architecture:** `new-competition-notification-service.ts` for handling notification logic
*   **API Endpoint:** `/api/admin/send-new-competition-notifications` for manual triggers
*   **In-app Integration:** Creates both email and in-app notifications simultaneously
*   **Error Handling:** Comprehensive error tracking and reporting for failed notifications

### 15.8. Judge Dashboard (`/judge`)
*   **Authentication & Role Check**: Automatically redirects non-judge users to regular dashboard
*   **Unified Design**: Matches the main user dashboard design with SnapScape branding and color scheme
*   **Judge-Specific Features**:
    *   **Circular Statistics**: Similar layout to user dashboard with judge-specific metrics
        *   **Competitions**: Total competitions available for judging
        *   **Active to Judge**: Competitions currently in voting phase requiring judge input
        *   **Completed**: Number of completed judging sessions
        *   **Photos Reviewed**: Total photos reviewed across all competitions
        *   **Avg Rating**: Average rating given across all judgments
    *   **Feed & Competitions Tabs**: Toggle between activity feed and competition list
    *   **Real-time Activity Feed**: 
        *   **Judge Assignment Notifications**: Real-time notifications when assigned to new competitions
            *   **Visual Indicators**: Purple checkmark icon for judge assignments
            *   **Competition Context**: Shows competition title and current status
            *   **Action Links**: Direct links to view competition or start judging
            *   **Status-aware Messaging**: Different messages for active, voting, or upcoming competitions
        *   **Notification Integration**: Fetches real activities from `/api/users/activities` endpoint
        *   **Activity Types**: Judge assignments, photo approvals, competition updates, and other system notifications
        *   **Time-based Sorting**: Most recent activities appear first with relative timestamps
        *   **Notification Deletion**: Delete buttons for notifications when enabled by admin settings
            *   **Admin Control**: Only shows delete buttons when `allowNotificationDeletion` setting is enabled
            *   **Database Integration**: Actually deletes notifications from database via `/api/notifications/[id]` DELETE endpoint
            *   **Smart Filtering**: Only deletable items (notifications, submissions, badges, wins, results) can be deleted
            *   **UI Feedback**: Immediate removal from feed upon successful deletion
*   **React Key Error Fix (January 2025)**:
    *   **Issue**: React warning about invalid keys in feedItems array causing console errors
    *   **Root Cause**: Potential duplicate IDs and missing null checks in feedItems data
    *   **Solution Implemented**:
        *   **Unique ID Generation**: Added index to activity IDs to ensure uniqueness (`activity-${activity._id}-${index}`)
        *   **Duplicate Removal**: Added filter to remove any potential duplicate feedItems based on ID
        *   **Null Safety**: Added comprehensive null checks and filters to prevent rendering of invalid data
        *   **Error Handling**: Added fallback empty arrays on API errors to prevent rendering issues
        *   **Data Validation**: Added safety filters before mapping to ensure all required properties exist
        *   **Improved Sorting**: Enhanced data combination and sorting logic for feed items
    *   **Technical Details**:
        *   Fixed feedItems being set twice (competition items + activities)
        *   Added proper TypeScript type assertions for feedItem types
        *   Added default values for missing properties (title, theme, status, etc.)
        *   Enhanced error boundaries for data fetching failures
    *   **Files Modified**: `src/app/judge/page.tsx`
    *   **Impact**: Eliminated React console errors and improved judge dashboard stability

### 15.9. Dashboard Notification Deletion Feature (January 2025)
*   **Feature**: Comprehensive notification deletion functionality in dashboard feed
*   **Admin Control**: 
    *   **Settings Management**: Admin can enable/disable notification deletion via `/admin/settings`
    *   **Setting Field**: `allowNotificationDeletion` boolean controls feature availability
    *   **API Integration**: `/api/settings` endpoint returns setting to frontend
*   **User Experience**:
    *   **Visual Integration**: Delete buttons appear as red circular X icons in top-right corner of feed items
    *   **Conditional Display**: Only shows when admin has enabled the setting
    *   **Smart Targeting**: Delete buttons only appear on deletable items (notifications, submissions, badges, wins, results)
    *   **Immediate Feedback**: Items disappear from feed immediately upon successful deletion
*   **Technical Implementation**:
    *   **Database Deletion**: Uses existing `/api/notifications/[id]` DELETE endpoint
    *   **State Management**: Updates both activities and feedItems state after deletion
    *   **Error Handling**: Falls back to local hiding if database deletion fails
    *   **API Integration**: Fetches admin settings on component mount
*   **Supported Items**:
    *   **Notifications**: Judge assignments, photo approvals, system messages
    *   **Activities**: Photo submissions, badge awards, competition wins, results
    *   **Non-deletable**: Competition cards (active, voting, completed) - these only hide locally
*   **Judge Dashboard Integration**:
    *   **Feature Parity**: Judge dashboard includes same deletion functionality
    *   **Role-appropriate**: Judges can delete their own notifications when feature is enabled
    *   **Consistent UI**: Same delete button design and behavior as user dashboard
*   **Files Modified**:
    *   `src/app/dashboard/page.tsx` - Main dashboard deletion functionality
    *   `src/app/judge/page.tsx` - Judge dashboard deletion functionality
    *   `src/app/api/settings/route.ts` - Updated to include allowNotificationDeletion setting
    *   `ProjectDocumentationDetailed.md` - Documentation updates
*   **Benefits**:
    *   **User Control**: Users can manage their notification feed
    *   **Clean Interface**: Reduces feed clutter by removing unwanted notifications
    *   **Admin Oversight**: Administrators maintain control over feature availability
    *   **Consistent Experience**: Same functionality across user and judge dashboards

### 15.10. Enhanced Photo Submission Interface (January 2025)

**Complete User Experience in "View as User" Mode:**
When judges access competitions in "View as User" mode (`?viewAsUser=true`), they now receive the full photo submission interface that regular users experience:

**Form Components:**
- **File Upload with Compression**: Advanced image handling supporting JPG, PNG, and WebP formats up to 10MB
- **Automatic Image Optimization**: Files over 3MB are compressed for optimal viewing while preserving quality
- **Photo Title Field**: Required field with 100-character limit and real-time character count
- **Photo Description Field**: Required field with 500-character limit for detailed photo context
- **Terms Agreement Checkbox**: Interactive links to competition rules and copyright terms
- **Professional Validation**: Real-time error checking for file types, sizes, and required fields
- **Success/Error Feedback**: Clear user feedback for submission status

**Technical Features:**
- Seamless mode switching with proper state management
- Visual banners indicating current mode (Judge vs User)
- Assignment-aware restrictions (assigned judges cannot participate)
- Complete navigation preservation with `?viewAsUser=true` parameter
- Mobile-responsive design matching full user experience

#### Navigation Enhancement for Judge "View as User" Mode (January 2025)

**Sidebar Navigation Fix:**
Fixed a critical issue where sidebar navigation links were not working properly when judges were in "View as User" mode.

**Problem Resolved:**
- Sidebar links (Dashboard, Competitions, My Submissions, Profile, Feedback, Notifications) were losing the `?viewAsUser=true` parameter
- This caused judges to be kicked out of "View as User" mode when navigating
- Links would redirect to judge mode instead of maintaining user mode

**Solution Implemented:**
- Added `getNavigationUrl()` function to preserve `viewAsUser` parameter in all navigation links
- Updated both desktop sidebar and mobile bottom navigation
- All navigation now properly maintains judge's current viewing mode
- Judges can now navigate freely while in "View as User" mode without being forced back to judge mode

**Technical Details:**
- Dynamic URL generation based on current mode detection
- Consistent parameter preservation across desktop and mobile navigation
- Seamless user experience for dual-role functionality

#### Judge Dashboard Navigation Cleanup (January 2025)

**Sidebar Navigation Fix for Judge Dashboard:**
Fixed multiple issues with the judge dashboard sidebar navigation that were preventing judges from navigating properly.

**Problems Resolved:**
- **Broken Links**: Navigation links were using incomplete URLs (e.g., `/competitions` instead of proper routes)
- **Non-functional Menu Items**: "Judge Submissions" and "All Submissions" links were pointing to non-existent routes
- **Redundant Menu Items**: Removed unnecessary navigation items that didn't serve judge-specific functions

**Solution Implemented:**
- **Cleaned Navigation Menu**: Simplified judge navigation to essential items only:
  - Judge Dashboard (main judge functionality)
  - View as User (switch to user mode)
  - Profile (user profile management)
  - Notifications (system notifications)
- **Fixed URL Structure**: Updated all navigation links to use proper, working routes
- **Mobile Navigation**: Updated mobile bottom navigation to match desktop navigation
- **Consistent Experience**: Ensured both desktop and mobile navigation work reliably

**Technical Changes:**
- Removed broken `/competitions`, `/competitions?status=voting`, and `/submissions` links
- Streamlined navigation array to focus on working, essential features
- Updated both desktop sidebar and mobile bottom navigation
- Maintained proper styling and active state detection

**User Experience Improvements:**
- Judges can now navigate reliably without encountering broken links
- Cleaner, more focused navigation reduces confusion
- All navigation items serve specific, working purposes
- Consistent navigation experience across devices

### 15.11. Role Selection System for Multi-Role Users (January 2025)

**Login-Time Role Selection for Judges:**
Implemented a comprehensive role selection system to eliminate conflicts and provide seamless user experience for users with multiple roles (particularly judges).

**The Problem We Solved:**
- Complex URL parameter management (`?viewAsUser=true`)
- Conflicting navigation between judge and user layouts
- State management issues when switching roles mid-session
- User confusion about current active role

**New Solution: Login-Time Role Selection**

**How It Works:**
1. **Judge Logs In** → Automatically redirected to role selection screen
2. **User Chooses Role**: "Login as User" or "Login as Judge"
3. **Session Configured**: Interface completely adapts to selected role
4. **No Mid-Session Switching**: Clean, dedicated experience per role
5. **Preference Remembered**: Choice saved for future sessions

**User Experience Flow:**

**For Regular Users:**
- Login → Direct to user dashboard (unchanged)

**For Judges:**
- Login → Role selection screen appears
- Choose "Login as User" → Full user experience with submission capabilities
- Choose "Login as Judge" → Full judge dashboard with evaluation tools
- Preference saved for future logins

**Technical Implementation:**

**Role Selection Page** (`/role-selection`):
- Beautiful, branded interface with clear role descriptions
- User information display for context
- Loading states and smooth transitions
- Local storage for preference management

**Components Created:**
- `RoleSelector` component with interactive role cards
- Role selection page with authentication guards
- Middleware integration for automatic redirects

**Features:**
- **Intelligent Redirects**: Middleware automatically guides judges to role selection
- **Preference Memory**: Remembers user's last choice for quick access
- **Role Switching**: Easy role change option available in both interfaces
- **Visual Indicators**: Clear messaging about current active role
- **Seamless Integration**: Works with existing authentication system

**Benefits:**
- ✅ **Eliminates Role Conflicts**: No more navigation confusion
- ✅ **Better User Experience**: Clear, dedicated interfaces per role
- ✅ **Reduced Complexity**: No need for complex URL parameter management
- ✅ **Improved Performance**: No client-side role switching overhead
- ✅ **Future-Proof**: Easily extensible for additional roles (admin, moderator, etc.)

**Technical Details:**
- Middleware redirects judges to `/role-selection` on first access
- localStorage stores role preferences (`preferredRole`, `selectedRole`)
- Role-specific routing eliminates URL parameter dependencies
- Clean separation between user and judge experiences
- Maintained backward compatibility with existing systems

### 15.12. Judge Evaluation System (January 2025)

**Dedicated Judge Rating Interface:**
Implemented a comprehensive judge evaluation system that allows judges to rate and evaluate photo submissions directly within judge mode, eliminating the need to redirect to user mode.

**Key Features:**

**Judge Evaluation Page (`/judge/competitions/[id]/evaluate`):**
- **Access Control**: Only judges assigned to specific competitions can access evaluation interface
- **Comprehensive Submission View**: Side-by-side layout with submission list and detailed evaluation panel
- **Professional Rating System**: 1-5 star rating system with clear evaluation criteria
- **Progress Tracking**: Visual indicators showing evaluation progress and completion status
- **Navigation Controls**: Easy navigation between submissions with arrow controls and direct selection

**Rating Interface:**
- **Interactive Star Rating**: Click-to-rate system with visual feedback
- **Rating Status Display**: Clear indicators showing which submissions have been rated
- **Evaluation Guidelines**: Built-in rating criteria (5=Exceptional, 4=Very Good, 3=Good, 2=Below Average, 1=Poor)
- **Real-time Updates**: Immediate feedback on rating submission and status updates

**Technical Implementation:**
- **Assignment Verification**: Automatic verification that judge is assigned to competition before allowing access
- **Rating API Integration**: Seamless integration with existing ratings system
- **State Management**: Real-time UI updates reflecting rating changes
- **Error Handling**: Comprehensive error handling with user-friendly messages

**User Experience Improvements:**
- **Direct Judge Access**: "Judge Submissions" button now directs to proper evaluation interface instead of user mode
- **Streamlined Workflow**: No more switching between user and judge modes for evaluation
- **Professional Interface**: Dedicated judge-focused UI design and terminology
- **Efficient Navigation**: Quick access from judge dashboard to evaluation interface

**Security & Permissions:**
- **Role-based Access**: Only authenticated judges can access evaluation interface
- **Competition Assignment**: Only judges assigned to specific competitions can evaluate those submissions
- **Data Protection**: Judge ratings are properly attributed and stored securely

This system provides judges with a professional, dedicated interface for evaluating photo submissions without the confusion and complexity of role-switching that was previously required.

### 15.13. Role Selection System for Multi-Role Users (January 2025)

**Login-Time Role Selection for Judges:**
Implemented a comprehensive role selection system to eliminate conflicts and provide seamless user experience for users with multiple roles (particularly judges).

**The Problem We Solved:**
- Complex URL parameter management (`?viewAsUser=true`)
- Conflicting navigation between judge and user layouts
- State management issues when switching roles mid-session
- User confusion about current active role

**New Solution: Login-Time Role Selection**

**How It Works:**
1. **Judge Logs In** → Automatically redirected to role selection screen
2. **User Chooses Role**: "Login as User" or "Login as Judge"
3. **Session Configured**: Interface completely adapts to selected role
4. **No Mid-Session Switching**: Clean, dedicated experience per role
5. **Preference Remembered**: Choice saved for future sessions

**User Experience Flow:**

**For Regular Users:**
- Login → Direct to user dashboard (unchanged)

**For Judges:**
- Login → Role selection screen appears
- Choose "Login as User" → Full user experience with submission capabilities
- Choose "Login as Judge" → Full judge dashboard with evaluation tools
- Preference saved for future logins

**Technical Implementation:**

**Role Selection Page** (`/role-selection`):
- Beautiful, branded interface with clear role descriptions
- User information display for context
- Loading states and smooth transitions
- Local storage for preference management

**Components Created:**
- `RoleSelector` component with interactive role cards
- Role selection page with authentication guards
- Middleware integration for automatic redirects

**Features:**
- **Intelligent Redirects**: Middleware automatically guides judges to role selection
- **Preference Memory**: Remembers user's last choice for quick access
- **Role Switching**: Easy role change option available in both interfaces
- **Visual Indicators**: Clear messaging about current active role
- **Seamless Integration**: Works with existing authentication system

**Benefits:**
- ✅ **Eliminates Role Conflicts**: No more navigation confusion
- ✅ **Better User Experience**: Clear, dedicated interfaces per role
- ✅ **Reduced Complexity**: No need for complex URL parameter management
- ✅ **Improved Performance**: No client-side role switching overhead
- ✅ **Future-Proof**: Easily extensible for additional roles (admin, moderator, etc.)

**Technical Details:**
- Middleware redirects judges to `/role-selection` on first access
- localStorage stores role preferences (`preferredRole`, `selectedRole`)
- Role-specific routing eliminates URL parameter dependencies
- Clean separation between user and judge experiences
- Maintained backward compatibility with existing systems

## 16. Detailed Summary of Development Journey & Key Decisions

This section outlines the evolution of the project based on our problem-solving interactions, which is crucial for understanding the context.

*   **Initial Focus - Results & Ranking:**
    *   **Problem:** Discrepancies in how winners were displayed (dashboard vs. results page), especially with ties. Badges weren't showing.
    *   **Solution:** Implemented dense ranking logic. Ensured API calls fetched enough data (`limit` parameter in `/api/submissions`). Used `ratingCount` for tie-breaking. Added trophy icons.
*   **Profile Enhancements:**
    *   **Problem:** Profile page lacked dynamism for achievements. Ranks in image modals were incorrect.
    *   **Solution:** Added dynamic competition achievements (1st, 2nd, 3rd place counts) replacing a static "Your Badges" section. Made achievement icons clickable. Fixed modal ranks by fetching full competition submissions.
*   **Dashboard Feed - Major Overhaul:**
    *   **Problem:** Feed was not comprehensive, timestamps were often incorrect (showing creation date instead of update date), and some items were missing. Duplicate items appeared. Layout issues.
    *   **Solution (Iterative):**
        1.  **Unified Feed (`feedItems`):** Introduced a new state `feedItems` and a `useEffect` to combine data from `competitions`, `votingCompetitions`, `completedCompetitions`, `completedResults`, and `activities`.
        2.  **Timestamp Accuracy:** This was a significant pain point. The logic was repeatedly refined to use `comp.updatedAt` for `sortDate` when a competition's status changed (e.g., to 'voting' or 'completed'), falling back to `startDate` or `endDate` as appropriate. This ensured the "time since" display was accurate.
        3.  **Content & Layout:** Filtered feed to show relevant items. Adjusted card layouts for desktop (image left, details right for active/upcoming). Fixed image display issues (removed an overlay div). Ensured styling consistency. Removed a two-column toggle for a simpler single-column main feed.
        4.  **Duplicate Removal:** Identified and removed redundant rendering blocks (e.g., a separate loop for voting competition notifications) that caused items to appear twice and use incorrect timestamps. The `feedItems` array became the single source of truth.
*   **Admin Competition Forms (Create & Edit) - `formidable` and `multipart/form-data`:**
    *   **Problem:** The competition edit form, especially when updating the cover image or just changing status, was plagued with errors. Initially, backend errors like "No number after minus sign in JSON" (backend returning plain text error), then `req.json()` failing with `FormData`. Later, Mongoose `CastError` for multiple fields.
    *   **Key Challenge:** Next.js API routes, by default, parse JSON bodies. For file uploads (`coverImage`), `multipart/form-data` is needed.
    *   **Solution (`formidable`):**
        1.  Disabled Next.js's default `bodyParser` for the competition create/edit API routes.
        2.  Integrated `formidable` to parse `multipart/form-data`. This required careful setup to pipe `req.body` (a `ReadableStream` in Next.js) to `formidable` using a `PassThrough` stream.
        3.  **Critical Bug Fix:** `formidable` (even with `multiples: false`) was parsing all text fields from the form as arrays (e.g., `title: ['Actual Title']`). This caused Mongoose `CastError` because the schema expected `String`. The fix involved looping through the parsed `fields` from `formidable` and, for string-type fields, explicitly taking `value[0]` if `value` was an array. This was applied to `title`, `theme`, `description`, `rules`, `prizes`, `status`, and `votingCriteria`.
    *   **Image Cropping:** `react-image-crop` was added to allow admins to crop cover images. Crop parameters are sent with the form data.
*   **Navigation & UI Flow:**
    *   **Problem:** "Vote Now" button initially linked to a non-existent `/vote` page.
    *   **Solution:** Corrected the link to point to the existing `/dashboard/competitions/[id]/view-submissions` page, which serves as the voting interface. Removed the mistakenly created `/vote` page. Ensured the preferred card layout for "Voting Open" notifications was used in the unified feed.
*   **Notification System Development:**
    *   **Problem:** Need for comprehensive notification management for admins and user preference control.
    *   **Solution:** Implemented multi-layered notification system with admin controls, user preferences, and automated triggers.
*   **Points Calculation Issues:**
    *   **Problem:** Points were showing for active/voting competitions, causing confusion.
    *   **Solution:** Implemented strict filtering to only calculate points from completed competitions, with comprehensive debugging.
*   **Automatic Status Management:**
    *   **Problem:** Manual status updates were time-consuming and error-prone.
    *   **Solution:** Implemented automated status update system with manual override capabilities and comprehensive logging.

This detailed account of features, challenges, and solutions should provide a rich context for training another AI agent on the SnapScape project. The evolution of the notification system, automatic status updates, and the complexities of handling points calculation accurately are particularly important learning points for the latest development phase.

## 17. Competition Ranking System Fix (Fixed)

### 17.1. Issue Identified
Competitions were ranked by average rating instead of total rating, causing submissions with higher total ratings to be ranked lower than those with higher average ratings but lower total ratings.

### 17.2. Example of the Problem
Submission A: 4.1 average rating × 12 votes = 49.2 total rating (was ranked higher)
Submission B: 4.0 average rating × 13 votes = 52.0 total rating (was ranked lower)

### 17.3. Root Cause
The sorting and ranking logic in the results view was prioritizing average rating over total rating.

### 17.4. Solution Implemented
Updated sorting logic in `src/app/dashboard/competitions/[id]/view-submissions/page.tsx`
Changed from sorting by `averageRating` first to sorting by `totalRating` (averageRating × ratingCount) first
Updated ranking calculation to use total rating for determining dense ranks
Updated badge assignment logic to use total rating thresholds
Maintained proper tiebreaker hierarchy: total rating → average rating → rating count

### 17.5. Technical Details
```typescript
// Old sorting logic (incorrect)
.sort((a, b) => {
  if (b.averageRating !== a.averageRating) {
    return b.averageRating - a.averageRating;
  }
  return (b.ratingCount || 0) - (a.ratingCount || 0);
});

// New sorting logic (correct)
.sort((a, b) => {
  const totalRatingA = a.averageRating * (a.ratingCount || 0);
  const totalRatingB = b.averageRating * (b.ratingCount || 0);
  
  if (totalRatingB !== totalRatingA) {
    return totalRatingB - totalRatingA;
  }
  
  if (b.averageRating !== a.averageRating) {
    return b.averageRating - a.averageRating;
  }
  
  return (b.ratingCount || 0) - (a.ratingCount || 0);
});
```

### 17.6. Files Modified
`src/app/dashboard/competitions/[id]/view-submissions/page.tsx` - Updated sorting and ranking logic
`ProjectDocumentationDetailed.md` - Updated documentation

### 17.7. Impact
This ensures fair competition results where submissions with higher total community engagement (total rating) are properly ranked higher, regardless of whether they achieved this through many moderate ratings or fewer high ratings.

## 18. Profile Page Ranking Consistency Fix (December 2024)

### 18.1. Issue Identified
The profile page was showing different rankings for the same photo compared to what appeared on the competition results page. This created inconsistent user experience where users would see one rank in their profile and a different rank on the actual results page.

### 18.2. Root Cause
The profile page image modal was using a different ranking calculation method than the results page:

**Profile Page (Incorrect):**
- Sorted by `averageRating` first, then `ratingCount` as tiebreaker
- This meant submissions with higher average ratings but lower total engagement would be ranked higher

**Results Page (Correct):**
- Sorted by **total rating** (`averageRating × ratingCount`) first, then `averageRating`, then `ratingCount` as tiebreakers
- This properly reflects total community engagement and matches the competition's actual ranking system

### 18.3. Solution Implemented
Updated the profile page ranking calculation in `src/app/dashboard/profile/page.tsx` to exactly match the results page logic:

```typescript
// Old logic (incorrect - overly complex)
const rankMap = new Map();
// Complex Map-based ranking with multiple comparisons
for (let i = 0; i < sorted.length; i++) {
  // Complex logic with multiple variables and comparisons
}

// New logic (correct - simple dense ranking like results page)
let actualRank = 0;
let lastTotalRating = -Infinity;

for (let i = 0; i < sorted.length; i++) {
  const image = sorted[i];
  const totalRating = image.averageRating * (image.ratingCount || 0);
  
  // Increment rank only when total rating changes (dense ranking)
  if (totalRating !== lastTotalRating) {
    actualRank++;
  }
  lastTotalRating = totalRating;
  
  // If this is our target image, break and use this rank
  if (image._id === currentModalImage._id) {
    break;
  }
}
```

### 18.4. Root Cause Analysis
The initial fix attempted to use a complex Map-based ranking system with multiple comparison criteria, but the results page uses a much simpler dense ranking approach:

**Results Page (Correct):**
- Simple counter that increments only when total rating changes
- Single comparison: `totalRating !== lastTotalRating`
- Direct, straightforward dense ranking implementation

**Profile Page (Initially Incorrect):**
- Complex Map-based system with multiple variables
- Multiple comparisons including total rating, average rating, and rating count
- Over-engineered solution that produced different ranking results

### 18.5. Technical Details
- **Simplified Logic:** Replaced complex Map-based ranking with simple counter approach
- **Exact Matching:** Now uses identical dense ranking logic as results page
- **Single Comparison:** Only compares total rating for rank determination
- **Efficient Implementation:** Breaks loop when target image is found

### 18.6. Files Modified
- `src/app/dashboard/profile/page.tsx` - Updated image modal ranking calculation
- `ProjectDocumentationDetailed.md` - Added documentation

### 18.7. Impact
- **Consistent Rankings:** Profile page now shows the same ranks as results page
- **Accurate User Information:** Users see correct ranking information across all pages
- **Improved Trust:** Eliminates confusion about ranking discrepancies
- **System Integrity:** Ensures all ranking displays use the same authoritative calculation

### 18.8. Verification
Users can now verify that the rank shown in their profile page image modals exactly matches the rank displayed on the competition results page, providing a consistent and trustworthy user experience.

## 19. Latest Features Implementation Summary (2024) - Updated

### 19.1. Judge Dashboard (`/judge`)
*   **Authentication & Role Check**: Automatically redirects non-judge users to regular dashboard
*   **Unified Design**: Matches the main user dashboard design with SnapScape branding and color scheme
*   **Judge-Specific Features**:
    *   **Circular Statistics**: Similar layout to user dashboard with judge-specific metrics
        *   **Competitions**: Total competitions available for judging
        *   **Active to Judge**: Competitions currently in voting phase requiring judge input
        *   **Completed**: Number of completed judging sessions
        *   **Photos Reviewed**: Total photos reviewed across all competitions
        *   **Avg Rating**: Average rating given across all judgments
    *   **Feed & Competitions Tabs**: Toggle between activity feed and competition list
    *   **Real-time Activity Feed**: 
        *   **Judge Assignment Notifications**: Real-time notifications when assigned to new competitions
            *   **Visual Indicators**: Purple checkmark icon for judge assignments
            *   **Competition Context**: Shows competition title and current status
            *   **Action Links**: Direct links to view competition or start judging
            *   **Status-aware Messaging**: Different messages for active, voting, or upcoming competitions
        *   **Notification Integration**: Fetches real activities from `/api/users/activities` endpoint
        *   **Activity Types**: Judge assignments, photo approvals, competition updates, and other system notifications
        *   **Time-based Sorting**: Most recent activities appear first with relative timestamps
        *   **Notification Deletion**: Delete buttons for notifications when enabled by admin settings
            *   **Admin Control**: Only shows delete buttons when `allowNotificationDeletion` setting is enabled
            *   **Database Integration**: Actually deletes notifications from database via `/api/notifications/[id]` DELETE endpoint
            *   **Smart Filtering**: Only deletable items (notifications, submissions, badges, wins, results) can be deleted
            *   **UI Feedback**: Immediate removal from feed upon successful deletion
*   **React Key Error Fix (January 2025)**:
    *   **Issue**: React warning about invalid keys in feedItems array causing console errors
    *   **Root Cause**: Potential duplicate IDs and missing null checks in feedItems data
    *   **Solution Implemented**:
        *   **Unique ID Generation**: Added index to activity IDs to ensure uniqueness (`activity-${activity._id}-${index}`)
        *   **Duplicate Removal**: Added filter to remove any potential duplicate feedItems based on ID
        *   **Null Safety**: Added comprehensive null checks and filters to prevent rendering of invalid data
        *   **Error Handling**: Added fallback empty arrays on API errors to prevent rendering issues
        *   **Data Validation**: Added safety filters before mapping to ensure all required properties exist
        *   **Improved Sorting**: Enhanced data combination and sorting logic for feed items
    *   **Technical Details**:
        *   Fixed feedItems being set twice (competition items + activities)
        *   Added proper TypeScript type assertions for feedItem types
        *   Added default values for missing properties (title, theme, status, etc.)
        *   Enhanced error boundaries for data fetching failures
    *   **Files Modified**: `src/app/judge/page.tsx`
    *   **Impact**: Eliminated React console errors and improved judge dashboard stability

### 19.2. Dashboard Notification Deletion Feature (January 2025)
*   **Feature**: Comprehensive notification deletion functionality in dashboard feed
*   **Admin Control**: 
    *   **Settings Management**: Admin can enable/disable notification deletion via `/admin/settings`
    *   **Setting Field**: `allowNotificationDeletion` boolean controls feature availability
    *   **API Integration**: `/api/settings` endpoint returns setting to frontend
*   **User Experience**:
    *   **Visual Integration**: Delete buttons appear as red circular X icons in top-right corner of feed items
    *   **Conditional Display**: Only shows when admin has enabled the setting
    *   **Smart Targeting**: Delete buttons only appear on deletable items (notifications, submissions, badges, wins, results)
    *   **Immediate Feedback**: Items disappear from feed immediately upon successful deletion
*   **Technical Implementation**:
    *   **Database Deletion**: Uses existing `/api/notifications/[id]` DELETE endpoint
    *   **State Management**: Updates both activities and feedItems state after deletion
    *   **Error Handling**: Falls back to local hiding if database deletion fails
    *   **API Integration**: Fetches admin settings on component mount
*   **Supported Items**:
    *   **Notifications**: Judge assignments, photo approvals, system messages
    *   **Activities**: Photo submissions, badge awards, competition wins, results
    *   **Non-deletable**: Competition cards (active, voting, completed) - these only hide locally
*   **Judge Dashboard Integration**:
    *   **Feature Parity**: Judge dashboard includes same deletion functionality
    *   **Role-appropriate**: Judges can delete their own notifications when feature is enabled
    *   **Consistent UI**: Same delete button design and behavior as user dashboard
*   **Files Modified**:
    *   `src/app/dashboard/page.tsx` - Main dashboard deletion functionality
    *   `src/app/judge/page.tsx` - Judge dashboard deletion functionality
    *   `src/app/api/settings/route.ts` - Updated to include allowNotificationDeletion setting
    *   `ProjectDocumentationDetailed.md` - Documentation updates
*   **Benefits**:
    *   **User Control**: Users can manage their notification feed
    *   **Clean Interface**: Reduces feed clutter by removing unwanted notifications
    *   **Admin Oversight**: Administrators maintain control over feature availability
    *   **Consistent Experience**: Same functionality across user and judge dashboards

## Judge Role Management and Photo Submission Restrictions

### Overview
The SnapScape platform implements a comprehensive judge role management system that prevents conflicts of interest while allowing judges to participate as regular users when appropriate.

### "View as User" Functionality

#### Purpose
The "View as User" mode allows judges to temporarily operate as regular platform users, enabling them to participate in competitions where they are not assigned as judges.

#### Implementation Details

**Middleware Integration:**
- Updated `src/middleware.ts` to detect `viewAsUser=true` parameter
- Bypasses automatic judge-to-judge-dashboard redirects when in this mode
- **Fixed judge access to competition details**: Judges can now view competition details without being forced into user mode
- Added special handling for competition detail pages (`/dashboard/competitions/[id]`) to preserve judge context
- Adds tracking header `X-View-As-User` for monitoring when explicitly in user mode

**Judge Layout Integration:**
- "View as User" link in judge sidebar redirects to `/dashboard?viewAsUser=true`
- Maintains judge identity while providing user experience
- **Fixed layout switching bug**: "View Details" button no longer switches layout inappropriately

**Competition Detail Page Logic:**
- Added `isJudgeMode` state to detect when judge is in normal judge mode (not "View as User")
- **Improved judge experience**: Judges viewing competition details maintain judge context and see appropriate judge-specific content
- **Enhanced Navigation**: Added "Participate as User" button that directly links to competition with `?viewAsUser=true` parameter
- **Clear Visual Indicators**: 
  - Purple notice banner for judges in normal mode with assignment-specific messaging
  - Blue notice banner for judges in "View as User" mode to indicate their current participation status
- Judge-specific submission restrictions only apply when judge is NOT in "View as User" mode
- Added "Return to Judge Dashboard" button for better navigation
- **Assignment-aware Logic**: Different messaging and options based on whether judge is assigned to specific competition
- Simplified submission interface for regular users while maintaining judge restrictions

#### Enhanced Photo Submission Interface (January 2025)

**Complete User Experience in "View as User" Mode:**
When judges access competitions in "View as User" mode (`?viewAsUser=true`), they now receive the full photo submission interface that regular users experience:

**Form Components:**
- **File Upload with Compression**: Advanced image handling supporting JPG, PNG, and WebP formats up to 10MB
- **Automatic Image Optimization**: Files over 3MB are compressed for optimal viewing while preserving quality
- **Photo Title Field**: Required field with 100-character limit and real-time counter
- **Photo Description Field**: Required field with 500-character limit for detailed photo context
- **Terms Agreement Checkbox**: Required agreement to competition rules and copyright terms with clickable links
- **Real-time Validation**: Form validation with disabled submission until all requirements are met

**Visual Feedback Systems:**
- **Compression Status**: Shows "Optimizing image..." with spinner during compression
- **Compression Info**: Displays before/after file sizes when compression occurs
- **Error Handling**: Comprehensive error messages for file size limits, invalid formats, and upload failures
- **Success Notifications**: Clear confirmation when submissions are successful
- **Progress Indicators**: Loading states during submission with "Submitting..." text

**Multi-Submission Support:**
- **Submission Tracking**: "Your submissions: X of 3" counter showing current progress
- **Submission Limit Management**: Users can submit up to 3 photos per competition
- **Edit/Delete Functionality**: Full submission management for active competitions
- **Image Gallery**: Grid view of user's submitted photos with hover effects and action buttons

**Interactive Features:**
- **Full-Screen Modal**: Click to view submissions in full-screen with sidebar information
- **Navigation**: Arrow keys and scroll wheel support for browsing multiple submissions
- **Edit Mode**: In-line editing of title, description, and photo replacement
- **Terms Integration**: Direct links to expand competition rules and copyright sections

**Technical Implementation:**
- Updated `src/app/dashboard/competitions/[id]/page.tsx` to provide full submission interface
- Replaced simplified submission handlers with complete `handleSubmitPhoto` and `handlePhotoFileChange` functions
- Added comprehensive state management for form validation, compression, and error handling
- Integrated with existing image compression utilities and submission APIs

**Benefits:**
- **Consistent Experience**: Judges in "View as User" mode receive identical functionality to regular users
- **Professional Quality**: Advanced image compression ensures high-quality submissions
- **User-Friendly**: Intuitive interface with clear guidance and feedback
- **Complete Functionality**: Full submission management lifecycle including creation, editing, and deletion

This enhancement ensures that when judges participate as users, they receive the complete, professional-grade submission experience that the platform offers to all users.

## User Roles and Authentication

### 2.2. User Management Features
*   **Profile Management:** Users can edit profiles including bio, mobile, country, and profile image
*   **Account Settings:** Email preferences, password changes (for credential users), account deactivation
*   **Activity Tracking:** User activity feed showing submissions, ratings, achievements

## 3. Competition Management System

## 16. Security Features

## Photo Submission Voting Interface Restoration (January 2025)

### **Issue**: User Voting Interface Removed
**Problem**: The view-submissions page for users had lost the interactive voting/rating functionality. Users could previously click on photos to expand them in a modal and rate them with a 5-star system, but this feature had been removed and replaced with a simple static grid.

**Impact**: 
- Users could no longer expand photos to view them in detail
- The 5-star rating system was no longer accessible to users
- No modal functionality for image viewing
- Users couldn't navigate between photos or rate submissions during voting phase

### **Root Cause Analysis**
Through git history analysis, discovered that the page had been simplified during privacy improvements but the interactive voting interface was not properly preserved for the user experience.

### **Solution Implemented**
**Restored Previous Working Version**: Retrieved the complete working version from git commit `a2ab7d7` which contained the full interactive interface.

**Key Features Restored**:
1. **Click-to-Expand Modal System**:
   - Users can click on any photo thumbnail to open it in a full-screen modal
   - High-resolution image display with proper aspect ratio handling
   - Responsive design for both desktop and mobile devices

2. **Star Rating Interface**:
   - 5-star rating system in modal sidebar
   - Interactive star buttons with hover effects
   - Real-time feedback showing user's current rating
   - Prevention of self-rating (users can't rate their own submissions)

3. **Image Navigation**:
   - Left/right arrow buttons in modal for navigation
   - Keyboard support (arrow keys, escape key)
   - Mouse wheel navigation support
   - Proper boundary handling (disabled arrows at start/end)

4. **Modal Features**:
   - Proper landscape and portrait mode support
   - Background click to close
   - Close button with intuitive positioning
   - Prevention of background scrolling when modal is open

5. **Voting Phase Controls**:
   - Rating only available during "voting" competition status
   - Real-time rating updates and submission state management
   - Proper handling of user permissions and restrictions

6. **Judge Access Control**:
   - Judges assigned to competitions can view but not vote
   - Clear notifications for judges about their viewing permissions
   - Proper role-based access control throughout the interface

### **Technical Implementation Details**
- **Modal State Management**: Uses React useState for modal open/close and selected submission
- **Image Navigation**: Callback-based navigation with proper boundary checking
- **Keyboard Integration**: Global event listeners with proper cleanup
- **Rating API Integration**: Full integration with existing `/api/ratings` endpoint
- **Responsive Design**: Complete mobile and landscape mode support with custom CSS

### **Files Modified**
- `src/app/dashboard/competitions/[id]/view-submissions/page.tsx` - Restored complete interactive interface

### **Testing Completed**
- ✅ Photo expansion modal functionality
- ✅ Star rating system during voting phase
- ✅ Image navigation (arrows, keyboard, scroll)
- ✅ Mobile and landscape responsiveness
- ✅ Judge role restrictions and notifications
- ✅ Privacy controls for active vs voting phases
- ✅ Rating persistence and real-time updates

### **User Experience Improvements**
- **Full Photo Viewing**: Users can now properly view high-resolution photos in an immersive modal experience
- **Intuitive Rating**: Easy-to-use 5-star rating with clear feedback
- **Smooth Navigation**: Multiple ways to navigate between photos (click, keyboard, scroll)
- **Mobile Optimized**: Proper mobile experience with touch-friendly controls
- **Clear Feedback**: Visual indicators for rating status and user permissions

This restoration ensures that users have the complete, expected voting experience they previously enjoyed, with all interactive features fully functional for photo competitions.

## Judge Evaluation Interface Redesign (January 2025)

### **Issue**: Judge Evaluation Interface Inconsistency
**Problem**: The judge evaluation page had a different layout compared to the user voting interface. It used a side-by-side layout with a submissions list and evaluation panel, which was less intuitive and visually different from the beautiful grid-based modal interface that users experienced.

**User Request**: Make the judge evaluation page appear the same way as the user view-submissions page with the grid layout and modal interface.

### **Solution Implemented**
**Complete Interface Redesign**: Replaced the entire judge evaluation page with the same grid-based layout and modal interface that users have, while maintaining judge-specific functionality.

**Key Features Implemented**:

1. **Grid Layout Interface**:
   - Same 3-column grid layout as user interface
   - Thumbnail hover effects with submission details
   - Judge-specific rating indicators (Rated/Not Rated) on hover
   - Clean, modern design consistent with user experience

2. **Modal Rating System**:
   - Full-screen modal for image viewing and evaluation
   - Same navigation system (arrow keys, click arrows, scroll wheel)
   - Professional judge evaluation sidebar with rating guidelines
   - Enhanced judge-specific elements:
     - Purple-themed design to distinguish judge mode
     - Evaluation guidelines prominently displayed
     - Rating criteria explanation (5-star system with descriptions)
     - Current average rating display for context

3. **Judge-Specific Enhancements**:
   - Purple color scheme to distinguish from user mode
   - "Judge Mode - Evaluation" badge in header
   - Professional evaluation guidelines box
   - Judge evaluation section in modal sidebar
   - Rating criteria explicitly stated (Exceptional, Very Good, Good, Below Average, Poor)
   - Current average rating display for context

4. **Navigation & User Experience**:
   - Same smooth navigation as user interface
   - Keyboard shortcuts (arrow keys, escape)
   *   **Mobile Optimization:** Responsive positioning and touch-friendly buttons
    *   **Accessibility:** Proper titles and ARIA labels for screen readers
*   **Technical Implementation:**
    *   **Enhanced Content Generation:** Comprehensive top 3 details with rankings, statistics, and emojis
    *   **Meta Tag Management:** Dynamic Open Graph and Twitter Card generation using Next.js Head component
    *   **Cross-browser Compatibility:** Modern Clipboard API with fallback support
    *   **Performance Optimized:** Lightweight components with efficient rendering
    *   **Type Safety:** Full TypeScript support with proper typing
*   **SEO Benefits:**
    *   **Rich Previews:** Social media shares display attractive preview cards with images and descriptions
    *   **Increased Engagement:** Detailed content encourages more social media interaction
    *   **Brand Recognition:** SnapScape logo appears in social previews when no winning image available
    *   **Organic Growth:** Enhanced sharing drives more traffic to competition results
*   **User Benefits:**
    *   **Comprehensive Sharing:** Full context about competition results in social media posts
    *   **Visual Appeal:** Rich previews with images make shared content more attractive
    *   **Community Building:** Detailed results promote healthy competition and community engagement
    *   **Platform Flexibility:** Support for all major social media platforms with optimized content for each
*   **Files Modified:**
    *   `src/app/dashboard/competitions/[id]/view-submissions/page.tsx` - Enhanced sharing functionality and meta tags
    *   `ProjectDocumentationDetailed.md` - Updated documentation
*   **Dependencies:** Uses existing `/logo.png` for default featured image
*   **Deployment Status:** ✅ Implemented and ready for testing

### 2.15. Profile Incomplete Notification System (December 2024)
*   **Feature:** Automatic notification banner for Google OAuth users with incomplete profile information
*   **Target Users:** Users who signed up using Google OAuth but haven't provided mobile number and/or country information
*   **Notification Display:**
    *   **Location:** Appears at the top of all dashboard pages, right after the main content area starts
    *   **Design:** Yellow gradient banner with warning icon, informative text, and action buttons
    *   **Message:** Displays which specific fields are missing (mobile number, country, or both)
    *   **Actions:** "Complete Profile" button linking to `/dashboard/edit-profile`, dismissible close button
*   **Technical Implementation:**
    *   **Component:** `ProfileIncompleteNotification` (`src/components/ProfileIncompleteNotification.tsx`)
        *   Fetches user profile data via `/api/users/profile` to check completeness
        *   Only shows for users with `provider: 'google'` and missing mobile/country
        *   Includes loading states and error handling
        *   Dismissible functionality (notification hidden until page refresh)
    *   **Integration:** Added to dashboard layout (`src/app/dashboard/layout.tsx`) for universal coverage
    *   **Detection Logic:**
        *   Checks if `mobile` field is empty, null, or whitespace
        *   Checks if `country` field is empty, null, whitespace, or "Select Country" default value
        *   Only displays for Google OAuth users (`provider === 'google'`)
*   **User Experience:**
    *   **Non-intrusive:** Appears only for applicable users and can be dismissed
    *   **Helpful:** Clearly indicates which information is needed and provides direct access to edit profile
    *   **Context-aware:** Links directly to the edit profile page where users can complete their information
    *   **Visual Design:** Uses consistent SnapScape styling with yellow/orange gradient and appropriate icons
*   **Benefits:**
    *   **Profile Completeness:** Encourages Google OAuth users to provide contact information for better platform engagement
    *   **Communication:** Ensures administrators can reach users for important notifications
    *   **User Engagement:** Helps users understand the value of complete profiles for enhanced SnapScape experience
    *   **Data Quality:** Improves overall user data completeness for platform analytics and communication

### 2.16. Analytics Dashboard (December 2024)
*   **Feature:** Comprehensive analytics dashboard for administrators to monitor platform performance and user engagement
*   **Access:** Available at `/admin/analytics` for admin users only
*   **Key Metrics Displayed:**
    *   **User Statistics:**
        *   Total registered users
        *   New users in selected time period
        *   Active users (users who created or updated profiles)
        *   Growth rate percentage compared to previous period
    *   **Photo Statistics:**
        *   Total photo submissions across all competitions
        *   New photo submissions in selected time period
        *   Average photos per user
        *   Top photo categories based on competition themes
    *   **Competition Statistics:**
        *   Total competitions created
        *   Active, upcoming, and completed competition counts
        *   Average participation rate (photos per competition)
    *   **Engagement Statistics:**
        *   Total ratings/votes cast
        *   Average rating score across all submissions
*   **Time Range Filtering:**
    *   Selectable time periods: Last 7 days, 30 days, 90 days, or 1 year
    *   Dynamic data updates when time range is changed
    *   Loading states during data refresh
*   **Visual Charts:**
    *   **Monthly Active Users:** Bar chart showing user activity over the last 12 months
    *   **Monthly Photo Uploads:** Bar chart displaying photo submission trends
    *   Interactive hover tooltips showing exact values
    *   Responsive design adapting to different screen sizes
*   **Category Analysis:**
    *   Top 5 photo categories ranked by submission count
    *   Visual progress bars showing relative popularity
    *   Based on competition themes aggregated across all competitions
*   **Competition Performance Metrics:**
    *   Detailed breakdown of competition statuses
    *   Average participation rates to identify engagement trends
    *   Total competition count for platform growth tracking
*   **Technical Implementation:**
    *   **API Endpoint:** `/api/analytics` with time range query parameters
    *   **Database Aggregation:** MongoDB aggregation pipelines for efficient data processing
    *   **Real-time Data:** Fetches live data from User, PhotoSubmission, Competition, and Rating collections
    *   **Admin Authentication:** Secure access with session validation and role checking
    *   **Error Handling:** Comprehensive error states with retry functionality
*   **Benefits:**
    *   **Platform Insights:** Administrators can track user growth and engagement trends
    *   **Content Analysis:** Understanding popular photo categories and competition themes
    *   **Performance Monitoring:** Identifying successful competitions and participation patterns
    *   **Data-Driven Decisions:** Supporting strategic decisions with concrete metrics
    *   **Growth Tracking:** Monitoring platform expansion and user acquisition over time

## 3. Data Handling and Privacy

*   **Database:** MongoDB. Mongoose models define schemas for `Competition`, `User`, `PhotoSubmission`, `Activity`, `ReminderLog`, etc.
*   **Data Protection:**
    *   HTTPS is assumed for production to encrypt data in transit.
    *   MongoDB security features (authentication, IP whitelisting for Atlas) should be configured.
*   **User Data:**
    *   Passwords (if using credentials provider) are hashed by NextAuth.js.
    *   API routes ensure data is fetched/modified only by authenticated and authorized users.
    *   **Notification Preferences:** Stored securely in user model with granular controls
*   **File Uploads:**
    *   Managed by `formidable` on the backend. Files are temporarily stored on the server during processing. A robust solution would involve uploading to a cloud storage service (e.g., S3, Cloudinary) and storing the URL in the database.
    *   Crop parameters for cover images are stored alongside competition data.
*   **Audit Logging:**
    *   Comprehensive logging for reminder and notification activities
    *   Status change tracking with timestamps and user attribution
    *   Error logging for debugging and monitoring

## 4. User Interface (UI) and User Experience (UX) Design

*   **Responsive Design:** Tailwind CSS utility classes are used extensively to ensure the application adapts to different screen sizes (e.g., `md:hidden`, `hidden md:block`). Mobile views, particularly for the results page, underwent iterative improvements for better organization and aesthetics.
*   **Clarity & Navigation:**
    *   Dashboard with clear tabs for "Feed", "Competitions", "Activity".
    *   Sidebar navigation for main sections.
    *   Consistent button styling and calls to action.
    *   **Settings Integration:** Gear icon in profile for easy access to user settings
*   **Visual Feedback:**
    *   Loading spinners/states during data fetching.
    *   Success and error messages for form submissions and API interactions.
    *   Visual cues for rankings (trophy icons, color-coded badges).
    *   **Real-time Notifications:** Toast notifications for settings saves and other actions
*   **Admin Interface Enhancements:**
    *   **Color-coded Sections:** Purple theme for voting notifications, yellow for reminders
    *   **Comprehensive Tables:** Detailed views of notification results and competition status
    *   **Interactive Controls:** Real-time preview and manual trigger capabilities
*   **Accessibility:** While not explicitly detailed as a primary focus in interactions, best practices like semantic HTML and keyboard navigability are inherent goals with modern frameworks and should be continually assessed.
*   **Specific UI Challenges Addressed:**
    *   Ensuring image display on feed cards (e.g., removing covering overlays, applying `rounded-lg overflow-hidden`).
    *   Reformatting the mobile view of the competition results page for better readability and attractiveness.
    *   Fixing JSX syntax errors during UI development (e.g., unclosed tags).
    *   **Button Height Matching:** Ensured consistent button heights in profile page
    *   **Points Display Logic:** Fixed frontend calculation to only show points from completed competitions

## 5. Error Handling Strategies

*   **Client-Side (`handleSubmit` functions, API call wrappers):**
    *   Required field validation in forms.
    *   Error state variables (`setError`, `setSuccess`) to display messages to the user.
    *   Parsing API error responses: `if (!res.ok) { try { errorData = await res.json() } catch { errorData = { message: await res.text() } } ... }`.
    *   Example: `TypeError: Failed to fetch` logged in `fetchDashboardData` indicates network or API issues.
    *   **Cache-busting:** Added timestamp parameters to prevent stale data issues
*   **Server-Side (API Routes):**
    *   `try...catch` blocks around database operations and critical logic.
    *   Returning `NextResponse.json({ success: false, message: ... }, { status: ... })` for errors.
    *   **`formidable` errors:** Parsing errors are caught and reported.
    *   **Mongoose Validation Errors:** `CastError` (e.g., "Cast to string failed for value [ 'voting' ] (type Array) at path 'status'") handled by ensuring data types match the schema before database operations. This was particularly relevant after introducing `formidable`, which tended to parse all form fields into arrays. The fix involved checking `Array.isArray(fields.fieldName) ? fields.fieldName[0] : fields.fieldName`.
    *   **Route `params` await error:** A Next.js warning (`Route "/api/competitions/[id]" used params.id. params should be awaited...`) was noted, though the destructuring approach `{ params: { id } }` is standard for App Router.
    *   Initial backend errors where API routes returned plain text instead of JSON for errors, causing client-side JSON parsing failures.
    *   **Comprehensive Error Logging:** Added detailed logging for notification and status update operations
*   **File `README-local-setup.md`:** Includes troubleshooting tips for common setup errors (Next.js cache, MongoDB connection, Google Auth).

## 6. Testing and Validation

*   **Iterative Manual Testing:** The primary mode of testing observed. Each feature addition or bug fix was followed by requests for the user (developer) to test and report back. This covered:
    *   Badge display on profiles.
    *   Ranking logic on results pages and dashboard cards (including ties).
    *   Feed content, sorting, and timestamp accuracy.
    *   Admin form submissions (creation and editing of competitions, including image cropping).
    *   Navigation and link correctness.
    *   **Notification System Testing:** Comprehensive testing of email notifications and user preferences
    *   **Points Calculation Validation:** Extensive debugging to ensure points only show from completed competitions
    *   **Automatic Status Updates:** Testing of cron job functionality and manual triggers
*   **Debugging:** Extensive use of `console.log` on both client and server to trace data flow and identify issues.
    *   **Advanced Debugging:** Added comprehensive debugging systems for points calculation and notification tracking
*   **Linter Fixes:** Addressed ESLint errors (type mismatches, incorrect `formData` access, `setError` usage, `instanceof Date` checks).
*   **No Formal Automated Testing Suite:** While highly beneficial, automated tests (unit, integration, E2E) were not part of the interactions. This is a key area for future improvement to ensure long-term stability.

## 7. Performance Metrics

*   **API Response Optimization:**
    *   Increased `limit` parameter in `/api/submissions` and `/api/competitions` calls from the dashboard to reduce the chance of missing items due to default low limits, improving perceived performance and data completeness.
    *   **Cache Management:** Added cache-busting parameters to ensure fresh data
*   **Client-Side Rendering:**
    *   Next.js's built-in optimizations (code splitting, `next/image`) are leveraged.
*   **Data Fetching:**
    *   Specific fetching functions for different data types on the dashboard (`fetchDashboardData`, `fetchVotingCompetitions`, `fetchCompletedCompetitions`, `fetchActivities`).
    *   Polling implemented on the dashboard to auto-refresh data every 30 seconds.
    *   **Optimized Queries:** Database queries optimized to only fetch completed competitions for points calculation
*   **Background Processing:**
    *   Automatic status updates run via cron jobs to reduce server load
    *   Notification processing with rate limiting to prevent email service overload
*   **No Formal Benchmarking:** Performance improvements were mostly reactive to observed issues (e.g., missing data in feeds).

## 8. API Integrations and Design

### Internal APIs (Next.js API Routes)
*   **Structure:** RESTful principles, e.g., `GET /api/competitions`, `POST /api/competitions`, `PUT /api/competitions/[id]`.
*   **Request Handling:**
    *   Use `NextRequest` and `NextResponse`.
    *   `params` object for dynamic route segments (e.g., `params.id`).
*   **New API Endpoints:**
    *   **`/api/admin/send-voting-notifications`:** Handles voting notification dispatch
    *   **`/api/admin/reminder-logs`:** Manages reminder and notification logging
    *   **`/api/user/notification-preferences`:** Manages user notification settings
    *   **`/api/cron/update-competition-statuses`:** Handles automatic status updates
    *   **`/api/admin/send-new-competition-notifications`:** Handles new competition notification dispatch
*   **`multipart/form-data` Handling:**
    *   The `PUT /api/competitions/[id]` and `POST /api/competitions` routes (for editing/creating competitions with cover images) disable Next.js's default `bodyParser`.
    *   `formidable` library is used to parse `multipart/form-data`. This involved:
        *   Setting `multiples: false` in `formidable` options.
        *   Manually constructing a `PassThrough` stream from `req.body` and piping it to `formidable.parse()`, as `NextRequest` doesn't directly expose Node.js stream events (`req.on`).
        *   Copying headers from `req.headers` to the `PassThrough` stream for `formidable`.
    *   **Critical Fix:** Handling cases where `formidable` parses all text fields as arrays. A loop or specific checks now convert array values to single strings for fields defined as `String` in Mongoose schemas (e.g., `title`, `status`, `prizes`, `votingCriteria`).
*   **Security:** API routes are protected using `getServerSession` from NextAuth.js to check for authenticated users and their roles.
    *   **Cron Job Security:** Bearer token authentication for automated endpoints
    *   **Admin-only Endpoints:** Strict role checking for administrative functions
*   **Response Format:** Consistent JSON responses, typically `{ success: boolean, data?: any, message?: string }`.

### External APIs
*   Google OAuth is an external API integration managed by NextAuth.js.
*   **Email Service Integration:** Custom email service for notifications (likely SMTP or third-party service)

## 9. Feedback Mechanisms

*   **Developer-AI Collaboration:** The development process heavily relied on a tight feedback loop:
    1.  User (developer) states a requirement or reports a bug.
    2.  AI proposes a solution (code changes, explanations).
    3.  User applies the solution and tests.
    4.  User provides feedback on the outcome (success, new errors, further refinements).
    This iterative process was key to debugging complex issues like form handling and feed logic.
*   **User Notification Preferences:** In-app system for users to control their notification preferences
*   **Admin Feedback Systems:** Comprehensive reporting and logging for administrative actions
*   **No In-App User Feedback System:** Currently, there are no formal mechanisms for end-users of SnapScape to provide general feedback directly within the app.

## 10. Update and Maintenance Protocols

*   **Dependency Management:** `npm install` for managing packages. Regular updates to dependencies (`npm update` or targeted updates) are implied for security and feature benefits.
*   **Codebase Maintenance:** Refactoring (e.g., improving field processing in API routes, unifying feed logic) has occurred to enhance clarity and robustness.
*   **Environment Configuration:** `.env.local` for managing environment-specific variables (database connection strings, API keys). A `.env.template` or similar should exist to guide setup.
*   **Automated Maintenance:**
    *   **Cron Jobs:** Automatic competition status updates every 5 minutes in production
    *   **Database Cleanup:** Logging systems for tracking and potential cleanup of old records
*   **Deployment:**
    *   **Vercel Integration:** Configured for easy deployment with environment variables
    *   **Production Monitoring:** Logging systems for tracking application health

## 11. Localization and Internationalization (i18n)

*   **Current Status:** The application is primarily in English.
*   **Future Consideration:** No specific i18n libraries or structures have been implemented yet. If internationalization becomes a requirement, libraries like `next-i18next` would be suitable.

## 12. Development Environment and File Management

*   **Custom Instruction Adherence:**
    *   "Ensure any time an API is created, the corresponding page/UI is also implemented immediately": This was generally followed. For instance, when a `/dashboard/competitions/[id]/vote` route was thought to be needed, a placeholder page was created. When it was clarified that `/view-submissions` was the correct page, the incorrect one was removed and the link fixed.
    *   "Before creating a new file, verify that the file does not already exist...": This was a manual check during development.
    *   **Documentation Updates:** All new features are documented in this file as per user requirements
*   **Local Setup:** Documented in `README-local-setup.md`, covering cloning, environment variables, dependency installation, and running the dev server (`npm run dev`). Includes troubleshooting for common issues.
*   **Shell:** Interactions noted use of PowerShell on Windows.

## 13. Key Architectural Components & Technologies (Reiteration)

*   **Next.js (App Router):** For SSR, SSG, client-side navigation, API routes.
*   **TypeScript:** For static typing and improved code quality.
*   **MongoDB & Mongoose:** NoSQL database and ODM for data modeling and interaction.
*   **NextAuth.js:** Authentication (Google, Credentials).
*   **Tailwind CSS:** Utility-first CSS framework for styling.
*   **`formidable`:** Node.js module for parsing form data, especially `multipart/form-data`.
*   **`react-image-crop`:** React component for client-side image cropping.
*   **`date-fns`:** For robust date manipulations.
*   **React Hooks (`useState`, `useEffect`):** For component state and side effects.
*   **Email Service:** Custom email notification system
*   **Cron Job System:** Automated task scheduling for status updates

## 14. Critical File Structures (More Detail)

*   **`src/app/`**:
    *   **`layout.tsx`**: Root layout for the application.
    *   **`page.tsx`**: Homepage.
    *   **`api/`**:
        *   `auth/[...nextauth]/route.ts`: Core NextAuth.js configuration.
        *   `competitions/route.ts`: Handles `GET` (list all/filtered) and `POST` (create new) competitions.
        *   `competitions/[id]/route.ts`: Handles `GET` (single competition), `PUT` (update competition, uses `formidable`), `DELETE` (delete competition).
        *   `submissions/route.ts`: Handles fetching and potentially creating photo submissions. Includes query params for filtering by competition, status, and pagination (`limit`, `showAll`).
        *   `users/stats/route.ts`: Fetches user-specific statistics for the dashboard.
        *   `users/activities/route.ts`: Fetches a feed of user activities.
        *   **`admin/send-voting-notifications/route.ts`:** Handles voting notification dispatch
        *   **`admin/reminder-logs/route.ts`:** Manages reminder and notification logging
        *   **`user/notification-preferences/route.ts`:** Manages user notification settings
        *   **`cron/update-competition-statuses/route.ts`:** Handles automatic status updates
        *   **`admin/send-new-competition-notifications/route.ts`:** Handles new competition notification dispatch
    *   **`dashboard/`**:
        *   `layout.tsx`: Layout specific to the dashboard section (e.g., sidebar).
        *   `page.tsx`: The main dashboard page, heavily modified to include the unified feed, stats, and tabbed navigation.
        *   `competitions/[id]/page.tsx`: Detail page for a single competition.
        *   `competitions/[id]/view-submissions/page.tsx`: Displays submissions for viewing, results, and voting. Logic on this page adapts based on competition status.
        *   `profile/page.tsx`: User profile page, displays achievements and photo gallery.
        *   **`settings/page.tsx`:** Main user settings page
        *   **`settings/notifications/page.tsx`:** User notification preferences
    *   **`admin/`**:
        *   `competitions/create/page.tsx`: Form for creating new competitions, including `react-image-crop`.
        *   `competitions/[id]/edit/page.tsx`: Form for editing competitions, also including `react-image-crop` and handling `multipart/form-data`.
        *   **`settings/competition-reminders/page.tsx`:** Admin notification management
        *   **`settings/competition-status/page.tsx`:** Competition status management
        *   **`settings/layout.tsx`:** Settings navigation layout
*   **`src/components/`**: Likely contains reusable UI elements (e.g., specific card types if not directly in pages, modals, form inputs if abstracted).
*   **`src/lib/`**:
    *   `auth.ts`: Detailed configuration for NextAuth.js providers and callbacks.
    *   `mongodb.ts`: Utility to establish and reuse MongoDB connections.
    *   `helpers.ts` (or similar): Could contain utility functions like `formatTimeSince`.
    *   **`competition-auto-status-service.ts`:** Automatic status update logic
    *   **`competition-status-notification-service.ts`:** Status change notification handling
    *   **`emailService.ts`:** Email notification service
    *   **`notification-service.ts`:** In-app notification handling
    *   **`new-competition-notification-service.ts`:** New competition notification handling
*   **`src/models/`**:
    *   `Competition.ts`: Mongoose schema for competitions (includes fields like `title`, `theme`, `status`, `startDate`, `endDate`, `votingEndDate`, `coverImage`, `cropX`, `cropY`, etc., and importantly `createdAt`, `updatedAt` for timestamp tracking, plus `manualStatusOverride` and `lastAutoStatusUpdate`).
    *   `User.ts`: Mongoose schema for users (includes `name`, `email`, `image`, `role`, `notificationPreferences`).
    *   `PhotoSubmission.ts`: Mongoose schema for photo submissions (includes `user`, `competition`, `imageUrl`, `thumbnailUrl`, `averageRating`, `ratingCount`).
    *   `Activity.ts`: Mongoose schema for user activities.
    *   **`ReminderLog.ts`:** Schema for tracking notification and reminder activities
*   **`.env.local`**: For storing sensitive environment variables (DB connection string, NextAuth secrets, Google OAuth credentials, CRON_SECRET).

## 15. Latest Features Implementation Summary (2024)

### 15.1. Voting Notification System
*   **Admin Interface:** Purple-themed section in competition reminders page
*   **Functionality:** Send voting open/completed notifications to specific users or all users
*   **Integration:** Uses existing email templates and notification infrastructure
*   **Testing:** Comprehensive test email functionality with detailed reporting
*   **API:** `/api/admin/send-voting-notifications` with POST method

### 15.2. User Settings & Notification Preferences
*   **Settings Page:** Accessible via gear icon in user profile
*   **Notification Control:** Granular control over email notification types
*   **Categories:** Competition reminders, voting notifications, achievements, weekly digest, marketing
*   **Persistence:** Stored in user model with real-time updates
*   **API:** `/api/user/notification-preferences` with GET/POST methods

### 15.3. Automatic Competition Status Updates
*   **Service:** `competition-auto-status-service.ts` for automated status transitions
*   **Admin Interface:** Competition status management page with preview and manual trigger
*   **Cron Integration:** `/api/cron/update-competition-statuses` for automated execution
*   **Manual Override:** Competition-level setting to prevent automatic updates
*   **Notifications:** Automatic email notifications on status changes
*   **Logging:** Comprehensive audit trail for all status changes

### 15.4. Points System Refinement
*   **Calculation Fix:** Points only calculated from completed competitions
*   **Frontend Logic:** Removed incorrect estimation logic for active/voting competitions
*   **Debugging System:** Comprehensive logging for points calculation tracking
*   **User Experience:** Accurate points display with breakdown modal
*   **API Enhancement:** Updated `/api/users/[id]/stats` to filter by completion status

### 15.5. Enhanced Admin Features
*   **Competition Management:** Manual status override option in edit forms
*   **Notification Management:** Centralized admin interface for all notification types
*   **Logging System:** Detailed tracking of all administrative actions
*   **Preview Functionality:** See changes before applying them
*   **Error Handling:** Comprehensive error reporting and recovery

### 15.6. UI/UX Improvements
*   **Profile Enhancements:** Settings gear icon, improved button consistency
*   **Admin Interface:** Color-coded sections, improved table layouts
*   **Real-time Feedback:** Toast notifications, loading states, success/error messages
*   **Mobile Responsiveness:** Improved mobile layouts for new features
*   **Navigation:** Enhanced settings navigation with clear categorization

### 15.7. New Competition Notification System
*   **Automatic Integration:** Notifications automatically sent when competitions are created
*   **User Preference Respect:** Only sends to users who have opted in for new competition notifications
*   **Email Template:** Beautiful, responsive email template with competition details, dates, and action buttons
*   **Admin Testing:** Manual testing interface for sending to specific email addresses
*   **Service Architecture:** `new-competition-notification-service.ts` for handling notification logic
*   **API Endpoint:** `/api/admin/send-new-competition-notifications` for manual triggers
*   **In-app Integration:** Creates both email and in-app notifications simultaneously
*   **Error Handling:** Comprehensive error tracking and reporting for failed notifications

### 15.8. Judge Dashboard (`/judge`)
*   **Authentication & Role Check**: Automatically redirects non-judge users to regular dashboard
*   **Unified Design**: Matches the main user dashboard design with SnapScape branding and color scheme
*   **Judge-Specific Features**:
    *   **Circular Statistics**: Similar layout to user dashboard with judge-specific metrics
        *   **Competitions**: Total competitions available for judging
        *   **Active to Judge**: Competitions currently in voting phase requiring judge input
        *   **Completed**: Number of completed judging sessions
        *   **Photos Reviewed**: Total photos reviewed across all competitions
        *   **Avg Rating**: Average rating given across all judgments
    *   **Feed & Competitions Tabs**: Toggle between activity feed and competition list
    *   **Real-time Activity Feed**: 
        *   **Judge Assignment Notifications**: Real-time notifications when assigned to new competitions
            *   **Visual Indicators**: Purple checkmark icon for judge assignments
            *   **Competition Context**: Shows competition title and current status
            *   **Action Links**: Direct links to view competition or start judging
            *   **Status-aware Messaging**: Different messages for active, voting, or upcoming competitions
        *   **Notification Integration**: Fetches real activities from `/api/users/activities` endpoint
        *   **Activity Types**: Judge assignments, photo approvals, competition updates, and other system notifications
        *   **Time-based Sorting**: Most recent activities appear first with relative timestamps
        *   **Notification Deletion**: Delete buttons for notifications when enabled by admin settings
            *   **Admin Control**: Only shows delete buttons when `allowNotificationDeletion` setting is enabled
            *   **Database Integration**: Actually deletes notifications from database via `/api/notifications/[id]` DELETE endpoint
            *   **Smart Filtering**: Only deletable items (notifications, submissions, badges, wins, results) can be deleted
            *   **UI Feedback**: Immediate removal from feed upon successful deletion
*   **React Key Error Fix (January 2025)**:
    *   **Issue**: React warning about invalid keys in feedItems array causing console errors
    *   **Root Cause**: Potential duplicate IDs and missing null checks in feedItems data
    *   **Solution Implemented**:
        *   **Unique ID Generation**: Added index to activity IDs to ensure uniqueness (`activity-${activity._id}-${index}`)
        *   **Duplicate Removal**: Added filter to remove any potential duplicate feedItems based on ID
        *   **Null Safety**: Added comprehensive null checks and filters to prevent rendering of invalid data
        *   **Error Handling**: Added fallback empty arrays on API errors to prevent rendering issues
        *   **Data Validation**: Added safety filters before mapping to ensure all required properties exist
        *   **Improved Sorting**: Enhanced data combination and sorting logic for feed items
    *   **Technical Details**:
        *   Fixed feedItems being set twice (competition items + activities)
        *   Added proper TypeScript type assertions for feedItem types
        *   Added default values for missing properties (title, theme, status, etc.)
        *   Enhanced error boundaries for data fetching failures
    *   **Files Modified**: `src/app/judge/page.tsx`
    *   **Impact**: Eliminated React console errors and improved judge dashboard stability

### 15.9. Dashboard Notification Deletion Feature (January 2025)
*   **Feature**: Comprehensive notification deletion functionality in dashboard feed
*   **Admin Control**: 
    *   **Settings Management**: Admin can enable/disable notification deletion via `/admin/settings`
    *   **Setting Field**: `allowNotificationDeletion` boolean controls feature availability
    *   **API Integration**: `/api/settings` endpoint returns setting to frontend
*   **User Experience**:
    *   **Visual Integration**: Delete buttons appear as red circular X icons in top-right corner of feed items
    *   **Conditional Display**: Only shows when admin has enabled the setting
    *   **Smart Targeting**: Delete buttons only appear on deletable items (notifications, submissions, badges, wins, results)
    *   **Immediate Feedback**: Items disappear from feed immediately upon successful deletion
*   **Technical Implementation**:
    *   **Database Deletion**: Uses existing `/api/notifications/[id]` DELETE endpoint
    *   **State Management**: Updates both activities and feedItems state after deletion
    *   **Error Handling**: Falls back to local hiding if database deletion fails
    *   **API Integration**: Fetches admin settings on component mount
*   **Supported Items**:
    *   **Notifications**: Judge assignments, photo approvals, system messages
    *   **Activities**: Photo submissions, badge awards, competition wins, results
    *   **Non-deletable**: Competition cards (active, voting, completed) - these only hide locally
*   **Judge Dashboard Integration**:
    *   **Feature Parity**: Judge dashboard includes same deletion functionality
    *   **Role-appropriate**: Judges can delete their own notifications when feature is enabled
    *   **Consistent UI**: Same delete button design and behavior as user dashboard
*   **Files Modified**:
    *   `src/app/dashboard/page.tsx` - Main dashboard deletion functionality
    *   `src/app/judge/page.tsx` - Judge dashboard deletion functionality
    *   `src/app/api/settings/route.ts` - Updated to include allowNotificationDeletion setting
    *   `ProjectDocumentationDetailed.md` - Documentation updates
*   **Benefits**:
    *   **User Control**: Users can manage their notification feed
    *   **Clean Interface**: Reduces feed clutter by removing unwanted notifications
    *   **Admin Oversight**: Administrators maintain control over feature availability
    *   **Consistent Experience**: Same functionality across user and judge dashboards

### 15.10. Enhanced Photo Submission Interface (January 2025)

**Complete User Experience in "View as User" Mode:**
When judges access competitions in "View as User" mode (`?viewAsUser=true`), they now receive the full photo submission interface that regular users experience:

**Form Components:**
- **File Upload with Compression**: Advanced image handling supporting JPG, PNG, and WebP formats up to 10MB
- **Automatic Image Optimization**: Files over 3MB are compressed for optimal viewing while preserving quality
- **Photo Title Field**: Required field with 100-character limit and real-time character count
- **Photo Description Field**: Required field with 500-character limit for detailed photo context
- **Terms Agreement Checkbox**: Interactive links to competition rules and copyright terms
- **Professional Validation**: Real-time error checking for file types, sizes, and required fields
- **Success/Error Feedback**: Clear user feedback for submission status

**Technical Features:**
- Seamless mode switching with proper state management
- Visual banners indicating current mode (Judge vs User)
- Assignment-aware restrictions (assigned judges cannot participate)
- Complete navigation preservation with `?viewAsUser=true` parameter
- Mobile-responsive design matching full user experience

#### Navigation Enhancement for Judge "View as User" Mode (January 2025)

**Sidebar Navigation Fix:**
Fixed a critical issue where sidebar navigation links were not working properly when judges were in "View as User" mode.

**Problem Resolved:**
- Sidebar links (Dashboard, Competitions, My Submissions, Profile, Feedback, Notifications) were losing the `?viewAsUser=true` parameter
- This caused judges to be kicked out of "View as User" mode when navigating
- Links would redirect to judge mode instead of maintaining user mode

**Solution Implemented:**
- Added `getNavigationUrl()` function to preserve `viewAsUser` parameter in all navigation links
- Updated both desktop sidebar and mobile bottom navigation
- All navigation now properly maintains judge's current viewing mode
- Judges can now navigate freely while in "View as User" mode without being forced back to judge mode

**Technical Details:**
- Dynamic URL generation based on current mode detection
- Consistent parameter preservation across desktop and mobile navigation
- Seamless user experience for dual-role functionality

#### Judge Dashboard Navigation Cleanup (January 2025)

**Sidebar Navigation Fix for Judge Dashboard:**
Fixed multiple issues with the judge dashboard sidebar navigation that were preventing judges from navigating properly.

**Problems Resolved:**
- **Broken Links**: Navigation links were using incomplete URLs (e.g., `/competitions` instead of proper routes)
- **Non-functional Menu Items**: "Judge Submissions" and "All Submissions" links were pointing to non-existent routes
- **Redundant Menu Items**: Removed unnecessary navigation items that didn't serve judge-specific functions

**Solution Implemented:**
- **Cleaned Navigation Menu**: Simplified judge navigation to essential items only:
  - Judge Dashboard (main judge functionality)
  - View as User (switch to user mode)
  - Profile (user profile management)
  - Notifications (system notifications)
- **Fixed URL Structure**: Updated all navigation links to use proper, working routes
- **Mobile Navigation**: Updated mobile bottom navigation to match desktop navigation
- **Consistent Experience**: Ensured both desktop and mobile navigation work reliably

**Technical Changes:**
- Removed broken `/competitions`, `/competitions?status=voting`, and `/submissions` links
- Streamlined navigation array to focus on working, essential features
- Updated both desktop sidebar and mobile bottom navigation
- Maintained proper styling and active state detection

**User Experience Improvements:**
- Judges can now navigate reliably without encountering broken links
- Cleaner, more focused navigation reduces confusion
- All navigation items serve specific, working purposes
- Consistent navigation experience across devices

### 15.11. Role Selection System for Multi-Role Users (January 2025)

**Login-Time Role Selection for Judges:**
Implemented a comprehensive role selection system to eliminate conflicts and provide seamless user experience for users with multiple roles (particularly judges).

**The Problem We Solved:**
- Complex URL parameter management (`?viewAsUser=true`)
- Conflicting navigation between judge and user layouts
- State management issues when switching roles mid-session
- User confusion about current active role

**New Solution: Login-Time Role Selection**

**How It Works:**
1. **Judge Logs In** → Automatically redirected to role selection screen
2. **User Chooses Role**: "Login as User" or "Login as Judge"
3. **Session Configured**: Interface completely adapts to selected role
4. **No Mid-Session Switching**: Clean, dedicated experience per role
5. **Preference Remembered**: Choice saved for future sessions

**User Experience Flow:**

**For Regular Users:**
- Login → Direct to user dashboard (unchanged)

**For Judges:**
- Login → Role selection screen appears
- Choose "Login as User" → Full user experience with submission capabilities
- Choose "Login as Judge" → Full judge dashboard with evaluation tools
- Preference saved for future logins

**Technical Implementation:**

**Role Selection Page** (`/role-selection`):
- Beautiful, branded interface with clear role descriptions
- User information display for context
- Loading states and smooth transitions
- Local storage for preference management

**Components Created:**
- `RoleSelector` component with interactive role cards
- Role selection page with authentication guards
- Middleware integration for automatic redirects

**Features:**
- **Intelligent Redirects**: Middleware automatically guides judges to role selection
- **Preference Memory**: Remembers user's last choice for quick access
- **Role Switching**: Easy role change option available in both interfaces
- **Visual Indicators**: Clear messaging about current active role
- **Seamless Integration**: Works with existing authentication system

**Benefits:**
- ✅ **Eliminates Role Conflicts**: No more navigation confusion
- ✅ **Better User Experience**: Clear, dedicated interfaces per role
- ✅ **Reduced Complexity**: No need for complex URL parameter management
- ✅ **Improved Performance**: No client-side role switching overhead
- ✅ **Future-Proof**: Easily extensible for additional roles (admin, moderator, etc.)

**Technical Details:**
- Middleware redirects judges to `/role-selection` on first access
- localStorage stores role preferences (`preferredRole`, `selectedRole`)
- Role-specific routing eliminates URL parameter dependencies
- Clean separation between user and judge experiences
- Maintained backward compatibility with existing systems

### 15.12. Judge Evaluation System (January 2025)

**Dedicated Judge Rating Interface:**
Implemented a comprehensive judge evaluation system that allows judges to rate and evaluate photo submissions directly within judge mode, eliminating the need to redirect to user mode.

**Key Features:**

**Judge Evaluation Page (`/judge/competitions/[id]/evaluate`):**
- **Access Control**: Only judges assigned to specific competitions can access evaluation interface
- **Comprehensive Submission View**: Side-by-side layout with submission list and detailed evaluation panel
- **Professional Rating System**: 1-5 star rating system with clear evaluation criteria
- **Progress Tracking**: Visual indicators showing evaluation progress and completion status
- **Navigation Controls**: Easy navigation between submissions with arrow controls and direct selection

**Rating Interface:**
- **Interactive Star Rating**: Click-to-rate system with visual feedback
- **Rating Status Display**: Clear indicators showing which submissions have been rated
- **Evaluation Guidelines**: Built-in rating criteria (5=Exceptional, 4=Very Good, 3=Good, 2=Below Average, 1=Poor)
- **Real-time Updates**: Immediate feedback on rating submission and status updates

**Technical Implementation:**
- **Assignment Verification**: Automatic verification that judge is assigned to competition before allowing access
- **Rating API Integration**: Seamless integration with existing ratings system
- **State Management**: Real-time UI updates reflecting rating changes
- **Error Handling**: Comprehensive error handling with user-friendly messages

**User Experience Improvements:**
- **Direct Judge Access**: "Judge Submissions" button now directs to proper evaluation interface instead of user mode
- **Streamlined Workflow**: No more switching between user and judge modes for evaluation
- **Professional Interface**: Dedicated judge-focused UI design and terminology
- **Efficient Navigation**: Quick access from judge dashboard to evaluation interface

**Security & Permissions:**
- **Role-based Access**: Only authenticated judges can access evaluation interface
- **Competition Assignment**: Only judges assigned to specific competitions can evaluate those submissions
- **Data Protection**: Judge ratings are properly attributed and stored securely

This system provides judges with a professional, dedicated interface for evaluating photo submissions without the confusion and complexity of role-switching that was previously required.

### 15.13. Role Selection System for Multi-Role Users (January 2025)

**Login-Time Role Selection for Judges:**
Implemented a comprehensive role selection system to eliminate conflicts and provide seamless user experience for users with multiple roles (particularly judges).

**The Problem We Solved:**
- Complex URL parameter management (`?viewAsUser=true`)
- Conflicting navigation between judge and user layouts
- State management issues when switching roles mid-session
- User confusion about current active role

**New Solution: Login-Time Role Selection**

**How It Works:**
1. **Judge Logs In** → Automatically redirected to role selection screen
2. **User Chooses Role**: "Login as User" or "Login as Judge"
3. **Session Configured**: Interface completely adapts to selected role
4. **No Mid-Session Switching**: Clean, dedicated experience per role
5. **Preference Remembered**: Choice saved for future sessions

**User Experience Flow:**

**For Regular Users:**
- Login → Direct to user dashboard (unchanged)

**For Judges:**
- Login → Role selection screen appears
- Choose "Login as User" → Full user experience with submission capabilities
- Choose "Login as Judge" → Full judge dashboard with evaluation tools
- Preference saved for future logins

**Technical Implementation:**

**Role Selection Page** (`/role-selection`):
- Beautiful, branded interface with clear role descriptions
- User information display for context
- Loading states and smooth transitions
- Local storage for preference management

**Components Created:**
- `RoleSelector` component with interactive role cards
- Role selection page with authentication guards
- Middleware integration for automatic redirects

**Features:**
- **Intelligent Redirects**: Middleware automatically guides judges to role selection
- **Preference Memory**: Remembers user's last choice for quick access
- **Role Switching**: Easy role change option available in both interfaces
- **Visual Indicators**: Clear messaging about current active role
- **Seamless Integration**: Works with existing authentication system

**Benefits:**
- ✅ **Eliminates Role Conflicts**: No more navigation confusion
- ✅ **Better User Experience**: Clear, dedicated interfaces per role
- ✅ **Reduced Complexity**: No need for complex URL parameter management
- ✅ **Improved Performance**: No client-side role switching overhead
- ✅ **Future-Proof**: Easily extensible for additional roles (admin, moderator, etc.)

**Technical Details:**
- Middleware redirects judges to `/role-selection` on first access
- localStorage stores role preferences (`preferredRole`, `selectedRole`)
- Role-specific routing eliminates URL parameter dependencies
- Clean separation between user and judge experiences
- Maintained backward compatibility with existing systems

## 16. Detailed Summary of Development Journey & Key Decisions

This section outlines the evolution of the project based on our problem-solving interactions, which is crucial for understanding the context.

*   **Initial Focus - Results & Ranking:**
    *   **Problem:** Discrepancies in how winners were displayed (dashboard vs. results page), especially with ties. Badges weren't showing.
    *   **Solution:** Implemented dense ranking logic. Ensured API calls fetched enough data (`limit` parameter in `/api/submissions`). Used `ratingCount` for tie-breaking. Added trophy icons.
*   **Profile Enhancements:**
    *   **Problem:** Profile page lacked dynamism for achievements. Ranks in image modals were incorrect.
    *   **Solution:** Added dynamic competition achievements (1st, 2nd, 3rd place counts) replacing a static "Your Badges" section. Made achievement icons clickable. Fixed modal ranks by fetching full competition submissions.
*   **Dashboard Feed - Major Overhaul:**
    *   **Problem:** Feed was not comprehensive, timestamps were often incorrect (showing creation date instead of update date), and some items were missing. Duplicate items appeared. Layout issues.
    *   **Solution (Iterative):**
        1.  **Unified Feed (`feedItems`):** Introduced a new state `feedItems` and a `useEffect` to combine data from `competitions`, `votingCompetitions`, `completedCompetitions`, `completedResults`, and `activities`.
        2.  **Timestamp Accuracy:** This was a significant pain point. The logic was repeatedly refined to use `comp.updatedAt` for `sortDate` when a competition's status changed (e.g., to 'voting' or 'completed'), falling back to `startDate` or `endDate` as appropriate. This ensured the "time since" display was accurate.
        3.  **Content & Layout:** Filtered feed to show relevant items. Adjusted card layouts for desktop (image left, details right for active/upcoming). Fixed image display issues (removed an overlay div). Ensured styling consistency. Removed a two-column toggle for a simpler single-column main feed.
        4.  **Duplicate Removal:** Identified and removed redundant rendering blocks (e.g., a separate loop for voting competition notifications) that caused items to appear twice and use incorrect timestamps. The `feedItems` array became the single source of truth.
*   **Admin Competition Forms (Create & Edit) - `formidable` and `multipart/form-data`:**
    *   **Problem:** The competition edit form, especially when updating the cover image or just changing status, was plagued with errors. Initially, backend errors like "No number after minus sign in JSON" (backend returning plain text error), then `req.json()` failing with `FormData`. Later, Mongoose `CastError` for multiple fields.
    *   **Key Challenge:** Next.js API routes, by default, parse JSON bodies. For file uploads (`coverImage`), `multipart/form-data` is needed.
    *   **Solution (`formidable`):**
        1.  Disabled Next.js's default `bodyParser` for the competition create/edit API routes.
        2.  Integrated `formidable` to parse `multipart/form-data`. This required careful setup to pipe `req.body` (a `ReadableStream` in Next.js) to `formidable` using a `PassThrough` stream.
        3.  **Critical Bug Fix:** `formidable` (even with `multiples: false`) was parsing all text fields from the form as arrays (e.g., `title: ['Actual Title']`). This caused Mongoose `CastError` because the schema expected `String`. The fix involved looping through the parsed `fields` from `formidable` and, for string-type fields, explicitly taking `value[0]` if `value` was an array. This was applied to `title`, `theme`, `description`, `rules`, `prizes`, `status`, and `votingCriteria`.
    *   **Image Cropping:** `react-image-crop` was added to allow admins to crop cover images. Crop parameters are sent with the form data.
*   **Navigation & UI Flow:**
    *   **Problem:** "Vote Now" button initially linked to a non-existent `/vote` page.
    *   **Solution:** Corrected the link to point to the existing `/dashboard/competitions/[id]/view-submissions` page, which serves as the voting interface. Removed the mistakenly created `/vote` page. Ensured the preferred card layout for "Voting Open" notifications was used in the unified feed.
*   **Notification System Development:**
    *   **Problem:** Need for comprehensive notification management for admins and user preference control.
    *   **Solution:** Implemented multi-layered notification system with admin controls, user preferences, and automated triggers.
*   **Points Calculation Issues:**
    *   **Problem:** Points were showing for active/voting competitions, causing confusion.
    *   **Solution:** Implemented strict filtering to only calculate points from completed competitions, with comprehensive debugging.
*   **Automatic Status Management:**
    *   **Problem:** Manual status updates were time-consuming and error-prone.
    *   **Solution:** Implemented automated status update system with manual override capabilities and comprehensive logging.

This detailed account of features, challenges, and solutions should provide a rich context for training another AI agent on the SnapScape project. The evolution of the notification system, automatic status updates, and the complexities of handling points calculation accurately are particularly important learning points for the latest development phase.

## 17. Competition Ranking System Fix (Fixed)

### 17.1. Issue Identified
Competitions were ranked by average rating instead of total rating, causing submissions with higher total ratings to be ranked lower than those with higher average ratings but lower total ratings.

### 17.2. Example of the Problem
Submission A: 4.1 average rating × 12 votes = 49.2 total rating (was ranked higher)
Submission B: 4.0 average rating × 13 votes = 52.0 total rating (was ranked lower)

### 17.3. Root Cause
The sorting and ranking logic in the results view was prioritizing average rating over total rating.

### 17.4. Solution Implemented
Updated sorting logic in `src/app/dashboard/competitions/[id]/view-submissions/page.tsx`
Changed from sorting by `averageRating` first to sorting by `totalRating` (averageRating × ratingCount) first
Updated ranking calculation to use total rating for determining dense ranks
Updated badge assignment logic to use total rating thresholds
Maintained proper tiebreaker hierarchy: total rating → average rating → rating count

### 17.5. Technical Details
```typescript
// Old sorting logic (incorrect)
.sort((a, b) => {
  if (b.averageRating !== a.averageRating) {
    return b.averageRating - a.averageRating;
  }
  return (b.ratingCount || 0) - (a.ratingCount || 0);
});

// New sorting logic (correct)
.sort((a, b) => {
  const totalRatingA = a.averageRating * (a.ratingCount || 0);
  const totalRatingB = b.averageRating * (b.ratingCount || 0);
  
  if (totalRatingB !== totalRatingA) {
    return totalRatingB - totalRatingA;
  }
  
  if (b.averageRating !== a.averageRating) {
    return b.averageRating - a.averageRating;
  }
  
  return (b.ratingCount || 0) - (a.ratingCount || 0);
});
```

### 17.6. Files Modified
`src/app/dashboard/competitions/[id]/view-submissions/page.tsx` - Updated sorting and ranking logic
`ProjectDocumentationDetailed.md` - Updated documentation

### 17.7. Impact
This ensures fair competition results where submissions with higher total community engagement (total rating) are properly ranked higher, regardless of whether they achieved this through many moderate ratings or fewer high ratings.

## 18. Profile Page Ranking Consistency Fix (December 2024)

### 18.1. Issue Identified
The profile page was showing different rankings for the same photo compared to what appeared on the competition results page. This created inconsistent user experience where users would see one rank in their profile and a different rank on the actual results page.

### 18.2. Root Cause
The profile page image modal was using a different ranking calculation method than the results page:

**Profile Page (Incorrect):**
- Sorted by `averageRating` first, then `ratingCount` as tiebreaker
- This meant submissions with higher average ratings but lower total engagement would be ranked higher

**Results Page (Correct):**
- Sorted by **total rating** (`averageRating × ratingCount`) first, then `averageRating`, then `ratingCount` as tiebreakers
- This properly reflects total community engagement and matches the competition's actual ranking system

### 18.3. Solution Implemented
Updated the profile page ranking calculation in `src/app/dashboard/profile/page.tsx` to exactly match the results page logic:

```typescript
// Old logic (incorrect - overly complex)
const rankMap = new Map();
// Complex Map-based ranking with multiple comparisons
for (let i = 0; i < sorted.length; i++) {
  // Complex logic with multiple variables and comparisons
}

// New logic (correct - simple dense ranking like results page)
let actualRank = 0;
let lastTotalRating = -Infinity;

for (let i = 0; i < sorted.length; i++) {
  const image = sorted[i];
  const totalRating = image.averageRating * (image.ratingCount || 0);
  
  // Increment rank only when total rating changes (dense ranking)
  if (totalRating !== lastTotalRating) {
    actualRank++;
  }
  lastTotalRating = totalRating;
  
  // If this is our target image, break and use this rank
  if (image._id === currentModalImage._id) {
    break;
  }
}
```

### 18.4. Root Cause Analysis
The initial fix attempted to use a complex Map-based ranking system with multiple comparison criteria, but the results page uses a much simpler dense ranking approach:

**Results Page (Correct):**
- Simple counter that increments only when total rating changes
- Single comparison: `totalRating !== lastTotalRating`
- Direct, straightforward dense ranking implementation

**Profile Page (Initially Incorrect):**
- Complex Map-based system with multiple variables
- Multiple comparisons including total rating, average rating, and rating count
- Over-engineered solution that produced different ranking results

### 18.5. Technical Details
- **Simplified Logic:** Replaced complex Map-based ranking with simple counter approach
- **Exact Matching:** Now uses identical dense ranking logic as results page
- **Single Comparison:** Only compares total rating for rank determination
- **Efficient Implementation:** Breaks loop when target image is found

### 18.6. Files Modified
- `src/app/dashboard/profile/page.tsx` - Updated image modal ranking calculation
- `ProjectDocumentationDetailed.md` - Added documentation

### 18.7. Impact
- **Consistent Rankings:** Profile page now shows the same ranks as results page
- **Accurate User Information:** Users see correct ranking information across all pages
- **Improved Trust:** Eliminates confusion about ranking discrepancies
- **System Integrity:** Ensures all ranking displays use the same authoritative calculation

### 18.8. Verification
Users can now verify that the rank shown in their profile page image modals exactly matches the rank displayed on the competition results page, providing a consistent and trustworthy user experience.

## 19. Latest Features Implementation Summary (2024) - Updated

### 19.1. Judge Dashboard (`/judge`)
*   **Authentication & Role Check**: Automatically redirects non-judge users to regular dashboard
*   **Unified Design**: Matches the main user dashboard design with SnapScape branding and color scheme
*   **Judge-Specific Features**:
    *   **Circular Statistics**: Similar layout to user dashboard with judge-specific metrics
        *   **Competitions**: Total competitions available for judging
        *   **Active to Judge**: Competitions currently in voting phase requiring judge input
        *   **Completed**: Number of completed judging sessions
        *   **Photos Reviewed**: Total photos reviewed across all competitions
        *   **Avg Rating**: Average rating given across all judgments
    *   **Feed & Competitions Tabs**: Toggle between activity feed and competition list
    *   **Real-time Activity Feed**: 
        *   **Judge Assignment Notifications**: Real-time notifications when assigned to new competitions
            *   **Visual Indicators**: Purple checkmark icon for judge assignments
            *   **Competition Context**: Shows competition title and current status
            *   **Action Links**: Direct links to view competition or start judging
            *   **Status-aware Messaging**: Different messages for active, voting, or upcoming competitions
        *   **Notification Integration**: Fetches real activities from `/api/users/activities` endpoint
        *   **Activity Types**: Judge assignments, photo approvals, competition updates, and other system notifications
        *   **Time-based Sorting**: Most recent activities appear first with relative timestamps
        *   **Notification Deletion**: Delete buttons for notifications when enabled by admin settings
            *   **Admin Control**: Only shows delete buttons when `allowNotificationDeletion` setting is enabled
            *   **Database Integration**: Actually deletes notifications from database via `/api/notifications/[id]` DELETE endpoint
            *   **Smart Filtering**: Only deletable items (notifications, submissions, badges, wins, results) can be deleted
            *   **UI Feedback**: Immediate removal from feed upon successful deletion
*   **React Key Error Fix (January 2025)**:
    *   **Issue**: React warning about invalid keys in feedItems array causing console errors
    *   **Root Cause**: Potential duplicate IDs and missing null checks in feedItems data
    *   **Solution Implemented**:
        *   **Unique ID Generation**: Added index to activity IDs to ensure uniqueness (`activity-${activity._id}-${index}`)
        *   **Duplicate Removal**: Added filter to remove any potential duplicate feedItems based on ID
        *   **Null Safety**: Added comprehensive null checks and filters to prevent rendering of invalid data
        *   **Error Handling**: Added fallback empty arrays on API errors to prevent rendering issues
        *   **Data Validation**: Added safety filters before mapping to ensure all required properties exist
        *   **Improved Sorting**: Enhanced data combination and sorting logic for feed items
    *   **Technical Details**:
        *   Fixed feedItems being set twice (competition items + activities)
        *   Added proper TypeScript type assertions for feedItem types
        *   Added default values for missing properties (title, theme, status, etc.)
        *   Enhanced error boundaries for data fetching failures
    *   **Files Modified**: `src/app/judge/page.tsx`
    *   **Impact**: Eliminated React console errors and improved judge dashboard stability

### 19.2. Dashboard Notification Deletion Feature (January 2025)
*   **Feature**: Comprehensive notification deletion functionality in dashboard feed
*   **Admin Control**: 
    *   **Settings Management**: Admin can enable/disable notification deletion via `/admin/settings`
    *   **Setting Field**: `allowNotificationDeletion` boolean controls feature availability
    *   **API Integration**: `/api/settings` endpoint returns setting to frontend
*   **User Experience**:
    *   **Visual Integration**: Delete buttons appear as red circular X icons in top-right corner of feed items
    *   **Conditional Display**: Only shows when admin has enabled the setting
    *   **Smart Targeting**: Delete buttons only appear on deletable items (notifications, submissions, badges, wins, results)
    *   **Immediate Feedback**: Items disappear from feed immediately upon successful deletion
*   **Technical Implementation**:
    *   **Database Deletion**: Uses existing `/api/notifications/[id]` DELETE endpoint
    *   **State Management**: Updates both activities and feedItems state after deletion
    *   **Error Handling**: Falls back to local hiding if database deletion fails
    *   **API Integration**: Fetches admin settings on component mount
*   **Supported Items**:
    *   **Notifications**: Judge assignments, photo approvals, system messages
    *   **Activities**: Photo submissions, badge awards, competition wins, results
    *   **Non-deletable**: Competition cards (active, voting, completed) - these only hide locally
*   **Judge Dashboard Integration**:
    *   **Feature Parity**: Judge dashboard includes same deletion functionality
    *   **Role-appropriate**: Judges can delete their own notifications when feature is enabled
    *   **Consistent UI**: Same delete button design and behavior as user dashboard
*   **Files Modified**:
    *   `src/app/dashboard/page.tsx` - Main dashboard deletion functionality
    *   `src/app/judge/page.tsx` - Judge dashboard deletion functionality
    *   `src/app/api/settings/route.ts` - Updated to include allowNotificationDeletion setting
    *   `ProjectDocumentationDetailed.md` - Documentation updates
*   **Benefits**:
    *   **User Control**: Users can manage their notification feed
    *   **Clean Interface**: Reduces feed clutter by removing unwanted notifications
    *   **Admin Oversight**: Administrators maintain control over feature availability
    *   **Consistent Experience**: Same functionality across user and judge dashboards

## Judge Role Management and Photo Submission Restrictions

### Overview
The SnapScape platform implements a comprehensive judge role management system that prevents conflicts of interest while allowing judges to participate as regular users when appropriate.

### "View as User" Functionality

#### Purpose
The "View as User" mode allows judges to temporarily operate as regular platform users, enabling them to participate in competitions where they are not assigned as judges.

#### Implementation Details

**Middleware Integration:**
- Updated `src/middleware.ts` to detect `viewAsUser=true` parameter
- Bypasses automatic judge-to-judge-dashboard redirects when in this mode
- **Fixed judge access to competition details**: Judges can now view competition details without being forced into user mode
- Added special handling for competition detail pages (`/dashboard/competitions/[id]`) to preserve judge context
- Adds tracking header `X-View-As-User` for monitoring when explicitly in user mode

**Judge Layout Integration:**
- "View as User" link in judge sidebar redirects to `/dashboard?viewAsUser=true`
- Maintains judge identity while providing user experience
- **Fixed layout switching bug**: "View Details" button no longer switches layout inappropriately

**Competition Detail Page Logic:**
- Added `isJudgeMode` state to detect when judge is in normal judge mode (not "View as User")
- **Improved judge experience**: Judges viewing competition details maintain judge context and see appropriate judge-specific content
- **Enhanced Navigation**: Added "Participate as User" button that directly links to competition with `?viewAsUser=true` parameter
- **Clear Visual Indicators**: 
  - Purple notice banner for judges in normal mode with assignment-specific messaging
  - Blue notice banner for judges in "View as User" mode to indicate their current participation status
- Judge-specific submission restrictions only apply when judge is NOT in "View as User" mode
- Added "Return to Judge Dashboard" button for better navigation
- **Assignment-aware Logic**: Different messaging and options based on whether judge is assigned to specific competition
- Simplified submission interface for regular users while maintaining judge restrictions

#### Enhanced Photo Submission Interface (January 2025)

**Complete User Experience in "View as User" Mode:**
When judges access competitions in "View as User" mode (`?viewAsUser=true`), they now receive the full photo submission interface that regular users experience:

**Form Components:**
- **File Upload with Compression**: Advanced image handling supporting JPG, PNG, and WebP formats up to 10MB
- **Automatic Image Optimization**: Files over 3MB are compressed for optimal viewing while preserving quality
- **Photo Title Field**: Required field with 100-character limit and real-time counter
- **Photo Description Field**: Required field with 500-character limit for detailed photo context
- **Terms Agreement Checkbox**: Required agreement to competition rules and copyright terms with clickable links
- **Real-time Validation**: Form validation with disabled submission until all requirements are met

**Visual Feedback Systems:**
- **Compression Status**: Shows "Optimizing image..." with spinner during compression
- **Compression Info**: Displays before/after file sizes when compression occurs
- **Error Handling**: Comprehensive error messages for file size limits, invalid formats, and upload failures
- **Success Notifications**: Clear confirmation when submissions are successful
- **Progress Indicators**: Loading states during submission with "Submitting..." text

**Multi-Submission Support:**
- **Submission Tracking**: "Your submissions: X of 3" counter showing current progress
- **Submission Limit Management**: Users can submit up to 3 photos per competition
- **Edit/Delete Functionality**: Full submission management for active competitions
- **Image Gallery**: Grid view of user's submitted photos with hover effects and action buttons

**Interactive Features:**
- **Full-Screen Modal**: Click to view submissions in full-screen with sidebar information
- **Navigation**: Arrow keys and scroll wheel support for browsing multiple submissions
- **Edit Mode**: In-line editing of title, description, and photo replacement
- **Terms Integration**: Direct links to expand competition rules and copyright sections

**Technical Implementation:**
- Updated `src/app/dashboard/competitions/[id]/page.tsx` to provide full submission interface
- Replaced simplified submission handlers with complete `handleSubmitPhoto` and `handlePhotoFileChange` functions
- Added comprehensive state management for form validation, compression, and error handling
- Integrated with existing image compression utilities and submission APIs

**Benefits:**
- **Consistent Experience**: Judges in "View as User" mode receive identical functionality to regular users
- **Professional Quality**: Advanced image compression ensures high-quality submissions
- **User-Friendly**: Intuitive interface with clear guidance and feedback
- **Complete Functionality**: Full submission management lifecycle including creation, editing, and deletion

This enhancement ensures that when judges participate as users, they receive the complete, professional-grade submission experience that the platform offers to all users.

## User Roles and Authentication

### 2.2. User Management Features
*   **Profile Management:** Users can edit profiles including bio, mobile, country, and profile image
*   **Account Settings:** Email preferences, password changes (for credential users), account deactivation
*   **Activity Tracking:** User activity feed showing submissions, ratings, achievements

## 3. Competition Management System

## 16. Security Features

## Photo Submission Voting Interface Restoration (January 2025)

### **Issue**: User Voting Interface Removed
**Problem**: The view-submissions page for users had lost the interactive voting/rating functionality. Users could previously click on photos to expand them in a modal and rate them with a 5-star system, but this feature had been removed and replaced with a simple static grid.

**Impact**: 
- Users could no longer expand photos to view them in detail
- The 5-star rating system was no longer accessible to users
- No modal functionality for image viewing
- Users couldn't navigate between photos or rate submissions during voting phase

### **Root Cause Analysis**
Through git history analysis, discovered that the page had been simplified during privacy improvements but the interactive voting interface was not properly preserved for the user experience.

### **Solution Implemented**
**Restored Previous Working Version**: Retrieved the complete working version from git commit `a2ab7d7` which contained the full interactive interface.

**Key Features Restored**:
1. **Click-to-Expand Modal System**:
   - Users can click on any photo thumbnail to open it in a full-screen modal
   - High-resolution image display with proper aspect ratio handling
   - Responsive design for both desktop and mobile devices

2. **Star Rating Interface**:
   - 5-star rating system in modal sidebar
   - Interactive star buttons with hover effects
   - Real-time feedback showing user's current rating
   - Prevention of self-rating (users can't rate their own submissions)

3. **Image Navigation**:
   - Left/right arrow buttons in modal for navigation
   - Keyboard support (arrow keys, escape key)
   - Mouse wheel navigation support
   - Proper boundary handling (disabled arrows at start/end)

4. **Modal Features**:
   - Proper landscape and portrait mode support
   - Background click to close
   - Close button with intuitive positioning
   - Prevention of background scrolling when modal is open

5. **Voting Phase Controls**:
   - Rating only available during "voting" competition status
   - Real-time rating updates and submission state management
   - Proper handling of user permissions and restrictions

6. **Judge Access Control**:
   - Judges assigned to competitions can view but not vote
   - Clear notifications for judges about their viewing permissions
   - Proper role-based access control throughout the interface

### **Technical Implementation Details**
- **Modal State Management**: Uses React useState for modal open/close and selected submission
- **Image Navigation**: Callback-based navigation with proper boundary checking
- **Keyboard Integration**: Global event listeners with proper cleanup
- **Rating API Integration**: Full integration with existing `/api/ratings` endpoint
- **Responsive Design**: Complete mobile and landscape mode support with custom CSS

### **Files Modified**
- `src/app/dashboard/competitions/[id]/view-submissions/page.tsx` - Restored complete interactive interface

### **Testing Completed**
- ✅ Photo expansion modal functionality
- ✅ Star rating system during voting phase
- ✅ Image navigation (arrows, keyboard, scroll)
- ✅ Mobile and landscape responsiveness
- ✅ Judge role restrictions and notifications
- ✅ Privacy controls for active vs voting phases
- ✅ Rating persistence and real-time updates

### **User Experience Improvements**
- **Full Photo Viewing**: Users can now properly view high-resolution photos in an immersive modal experience
- **Intuitive Rating**: Easy-to-use 5-star rating with clear feedback
- **Smooth Navigation**: Multiple ways to navigate between photos (click, keyboard, scroll)
- **Mobile Optimized**: Proper mobile experience with touch-friendly controls
- **Clear Feedback**: Visual indicators for rating status and user permissions

This restoration ensures that users have the complete, expected voting experience they previously enjoyed, with all interactive features fully functional for photo competitions.

## Judge Evaluation Interface Redesign (January 2025)

### **Issue**: Judge Evaluation Interface Inconsistency
**Problem**: The judge evaluation page had a different layout compared to the user voting interface. It used a side-by-side layout with a submissions list and evaluation panel, which was less intuitive and visually different from the beautiful grid-based modal interface that users experienced.

**User Request**: Make the judge evaluation page appear the same way as the user view-submissions page with the grid layout and modal interface.

### **Solution Implemented**
**Complete Interface Redesign**: Replaced the entire judge evaluation page with the same grid-based layout and modal interface that users have, while maintaining judge-specific functionality.

**Key Features Implemented**:

1. **Grid Layout Interface**:
   - Same 3-column grid layout as user interface
   - Thumbnail hover effects with submission details
   - Judge-specific rating indicators (Rated/Not Rated) on hover
   - Clean, modern design consistent with user experience

2. **Modal Rating System**:
   - Full-screen modal for image viewing and evaluation
   - Same navigation system (arrow keys, click arrows, scroll wheel)
   - Professional judge evaluation sidebar with rating guidelines
   - Enhanced judge-specific elements:
     - Purple-themed design to distinguish judge mode
     - Evaluation guidelines prominently displayed
     - Rating criteria explanation (5-star system with descriptions)
     - Current average rating display for context

3. **Judge-Specific Enhancements**:
   - Purple color scheme to distinguish from user mode
   - "Judge Mode - Evaluation" badge in header
   - Professional evaluation guidelines box
   - Judge evaluation section in modal sidebar
   - Rating criteria explicitly stated (Exceptional, Very Good, Good, Below Average, Poor)
   - Current average rating display for context

4. **Navigation & User Experience**:
   - Same smooth navigation as user interface
   - Keyboard shortcuts (arrow keys, escape)
   *   **Mobile Optimization:** Responsive positioning and touch-friendly buttons
    *   **Accessibility:** Proper titles and ARIA labels for screen readers
*   **Technical Implementation:**
    *   **Enhanced Content Generation:** Comprehensive top 3 details with rankings, statistics, and emojis
    *   **Meta Tag Management:** Dynamic Open Graph and Twitter Card generation using Next.js Head component
    *   **Cross-browser Compatibility:** Modern Clipboard API with fallback support
    *   **Performance Optimized:** Lightweight components with efficient rendering
    *   **Type Safety:** Full TypeScript support with proper typing
*   **SEO Benefits:**
    *   **Rich Previews:** Social media shares display attractive preview cards with images and descriptions
    *   **Increased Engagement:** Detailed content encourages more social media interaction
    *   **Brand Recognition:** SnapScape logo appears in social previews when no winning image available
    *   **Organic Growth:** Enhanced sharing drives more traffic to competition results
*   **User Benefits:**
    *   **Comprehensive Sharing:** Full context about competition results in social media posts
    *   **Visual Appeal:** Rich previews with images make shared content more attractive
    *   **Community Building:** Detailed results promote healthy competition and community engagement
    *   **Platform Flexibility:** Support for all major social media platforms with optimized content for each
*   **Files Modified:**
    *   `src/app/dashboard/competitions/[id]/view-submissions/page.tsx` - Enhanced sharing functionality and meta tags
    *   `ProjectDocumentationDetailed.md` - Updated documentation
*   **Dependencies:** Uses existing `/logo.png` for default featured image
*   **Deployment Status:** ✅ Implemented and ready for testing

### 2.15. Profile Incomplete Notification System (December 2024)
*   **Feature:** Automatic notification banner for Google OAuth users with incomplete profile information
*   **Target Users:** Users who signed up using Google OAuth but haven't provided mobile number and/or country information
*   **Notification Display:**
    *   **Location:** Appears at the top of all dashboard pages, right after the main content area starts
    *   **Design:** Yellow gradient banner with warning icon, informative text, and action buttons
    *   **Message:** Displays which specific fields are missing (mobile number, country, or both)
    *   **Actions:** "Complete Profile" button linking to `/dashboard/edit-profile`, dismissible close button
*   **Technical Implementation:**
    *   **Component:** `ProfileIncompleteNotification` (`src/components/ProfileIncompleteNotification.tsx`)
        *   Fetches user profile data via `/api/users/profile` to check completeness
        *   Only shows for users with `provider: 'google'` and missing mobile/country
        *   Includes loading states and error handling
        *   Dismissible functionality (notification hidden until page refresh)
    *   **Integration:** Added to dashboard layout (`src/app/dashboard/layout.tsx`) for universal coverage
    *   **Detection Logic:**
        *   Checks if `mobile` field is empty, null, or whitespace
        *   Checks if `country` field is empty, null, whitespace, or "Select Country" default value
        *   Only displays for Google OAuth users (`provider === 'google'`)
*   **User Experience:**
    *   **Non-intrusive:** Appears only for applicable users and can be dismissed
    *   **Helpful:** Clearly indicates which information is needed and provides direct access to edit profile
    *   **Context-aware:** Links directly to the edit profile page where users can complete their information
    *   **Visual Design:** Uses consistent SnapScape styling with yellow/orange gradient and appropriate icons
*   **Benefits:**
    *   **Profile Completeness:** Encourages Google OAuth users to provide contact information for better platform engagement
    *   **Communication:** Ensures administrators can reach users for important notifications
    *   **User Engagement:** Helps users understand the value of complete profiles for enhanced SnapScape experience
    *   **Data Quality:** Improves overall user data completeness for platform analytics and communication

### 2.16. Analytics Dashboard (December 2024)
*   **Feature:** Comprehensive analytics dashboard for administrators to monitor platform performance and user engagement
*   **Access:** Available at `/admin/analytics` for admin users only
*   **Key Metrics Displayed:**
    *   **User Statistics:**
        *   Total registered users
        *   New users in selected time period
        *   Active users (users who created or updated profiles)
        *   Growth rate percentage compared to previous period
    *   **Photo Statistics:**
        *   Total photo submissions across all competitions
        *   New photo submissions in selected time period
        *   Average photos per user
        *   Top photo categories based on competition themes
    *   **Competition Statistics:**
        *   Total competitions created
        *   Active, upcoming, and completed competition counts
        *   Average participation rate (photos per competition)
    *   **Engagement Statistics:**
        *   Total ratings/votes cast
        *   Average rating score across all submissions
*   **Time Range Filtering:**
    *   Selectable time periods: Last 7 days, 30 days, 90 days, or 1 year
    *   Dynamic data updates when time range is changed
    *   Loading states during data refresh
*   **Visual Charts:**
    *   **Monthly Active Users:** Bar chart showing user activity over the last 12 months
    *   **Monthly Photo Uploads:** Bar chart displaying photo submission trends
    *   Interactive hover tooltips showing exact values
    *   Responsive design adapting to different screen sizes
*   **Category Analysis:**
    *   Top 5 photo categories ranked by submission count
    *   Visual progress bars showing relative popularity
    *   Based on competition themes aggregated across all competitions
*   **Competition Performance Metrics:**
    *   Detailed breakdown of competition statuses
    *   Average participation rates to identify engagement trends
    *   Total competition count for platform growth tracking
*   **Technical Implementation:**
    *   **API Endpoint:** `/api/analytics` with time range query parameters
    *   **Database Aggregation:** MongoDB aggregation pipelines for efficient data processing
    *   **Real-time Data:** Fetches live data from User, PhotoSubmission, Competition, and Rating collections
    *   **Admin Authentication:** Secure access with session validation and role checking
    *   **Error Handling:** Comprehensive error states with retry functionality
*   **Benefits:**
    *   **Platform Insights:** Administrators can track user growth and engagement trends
    *   **Content Analysis:** Understanding popular photo categories and competition themes
    *   **Performance Monitoring:** Identifying successful competitions and participation patterns
    *   **Data-Driven Decisions:** Supporting strategic decisions with concrete metrics
    *   **Growth Tracking:** Monitoring platform expansion and user acquisition over time

## 3. Data Handling and Privacy

*   **Database:** MongoDB. Mongoose models define schemas for `Competition`, `User`, `PhotoSubmission`, `Activity`, `ReminderLog`, etc.
*   **Data Protection:**
    *   HTTPS is assumed for production to encrypt data in transit.
    *   MongoDB security features (authentication, IP whitelisting for Atlas) should be configured.
*   **User Data:**
    *   Passwords (if using credentials provider) are hashed by NextAuth.js.
    *   API routes ensure data is fetched/modified only by authenticated and authorized users.
    *   **Notification Preferences:** Stored securely in user model with granular controls
*   **File Uploads:**
    *   Managed by `formidable` on the backend. Files are temporarily stored on the server during processing. A robust solution would involve uploading to a cloud storage service (e.g., S3, Cloudinary) and storing the URL in the database.
    *   Crop parameters for cover images are stored alongside competition data.
*   **Audit Logging:**
    *   Comprehensive logging for reminder and notification activities
    *   Status change tracking with timestamps and user attribution
    *   Error logging for debugging and monitoring

## 4. User Interface (UI) and User Experience (UX) Design

*   **Responsive Design:** Tailwind CSS utility classes are used extensively to ensure the application adapts to different screen sizes (e.g., `md:hidden`, `hidden md:block`). Mobile views, particularly for the results page, underwent iterative improvements for better organization and aesthetics.
*   **Clarity & Navigation:**
    *   Dashboard with clear tabs for "Feed", "Competitions", "Activity".
    *   Sidebar navigation for main sections.
    *   Consistent button styling and calls to action.
    *   **Settings Integration:** Gear icon in profile for easy access to user settings
*   **Visual Feedback:**
    *   Loading spinners/states during data fetching.
    *   Success and error messages for form submissions and API interactions.
    *   Visual cues for rankings (trophy icons, color-coded badges).
    *   **Real-time Notifications:** Toast notifications for settings saves and other actions
*   **Admin Interface Enhancements:**
    *   **Color-coded Sections:** Purple theme for voting notifications, yellow for reminders
    *   **Comprehensive Tables:** Detailed views of notification results and competition status
    *   **Interactive Controls:** Real-time preview and manual trigger capabilities
*   **Accessibility:** While not explicitly detailed as a primary focus in interactions, best practices like semantic HTML and keyboard navigability are inherent goals with modern frameworks and should be continually assessed.
*   **Specific UI Challenges Addressed:**
    *   Ensuring image display on feed cards (e.g., removing covering overlays, applying `rounded-lg overflow-hidden`).
    *   Reformatting the mobile view of the competition results page for better readability and attractiveness.
    *   Fixing JSX syntax errors during UI development (e.g., unclosed tags).
    *   **Button Height Matching:** Ensured consistent button heights in profile page
    *   **Points Display Logic:** Fixed frontend calculation to only show points from completed competitions

## 5. Error Handling Strategies

*   **Client-Side (`handleSubmit` functions, API call wrappers):**
    *   Required field validation in forms.
    *   Error state variables (`setError`, `setSuccess`) to display messages to the user.
    *   Parsing API error responses: `if (!res.ok) { try { errorData = await res.json() } catch { errorData = { message: await res.text() } } ... }`.
    *   Example: `TypeError: Failed to fetch` logged in `fetchDashboardData` indicates network or API issues.
    *   **Cache-busting:** Added timestamp parameters to prevent stale data issues
*   **Server-Side (API Routes):**
    *   `try...catch` blocks around database operations and critical logic.
    *   Returning `NextResponse.json({ success: false, message: ... }, { status: ... })` for errors.
    *   **`formidable` errors:** Parsing errors are caught and reported.
    *   **Mongoose Validation Errors:** `CastError` (e.g., "Cast to string failed for value [ 'voting' ] (type Array) at path 'status'") handled by ensuring data types match the schema before database operations. This was particularly relevant after introducing `formidable`, which tended to parse all form fields into arrays. The fix involved checking `Array.isArray(fields.fieldName) ? fields.fieldName[0] : fields.fieldName`.
    *   **Route `params` await error:** A Next.js warning (`Route "/api/competitions/[id]" used params.id. params should be awaited...`) was noted, though the destructuring approach `{ params: { id } }` is standard for App Router.
    *   Initial backend errors where API routes returned plain text instead of JSON for errors, causing client-side JSON parsing failures.
    *   **Comprehensive Error Logging:** Added detailed logging for notification and status update operations
*   **File `README-local-setup.md`:** Includes troubleshooting tips for common setup errors (Next.js cache, MongoDB connection, Google Auth).

## 6. Testing and Validation

*   **Iterative Manual Testing:** The primary mode of testing observed. Each feature addition or bug fix was followed by requests for the user (developer) to test and report back. This covered:
    *   Badge display on profiles.
    *   Ranking logic on results pages and dashboard cards (including ties).
    *   Feed content, sorting, and timestamp accuracy.
    *   Admin form submissions (creation and editing of competitions, including image cropping).
    *   Navigation and link correctness.
    *   **Notification System Testing:** Comprehensive testing of email notifications and user preferences
    *   **Points Calculation Validation:** Extensive debugging to ensure points only show from completed competitions
    *   **Automatic Status Updates:** Testing of cron job functionality and manual triggers
*   **Debugging:** Extensive use of `console.log` on both client and server to trace data flow and identify issues.
    *   **Advanced Debugging:** Added comprehensive debugging systems for points calculation and notification tracking
*   **Linter Fixes:** Addressed ESLint errors (type mismatches, incorrect `formData` access, `setError` usage, `instanceof Date` checks).
*   **No Formal Automated Testing Suite:** While highly beneficial, automated tests (unit, integration, E2E) were not part of the interactions. This is a key area for future improvement to ensure long-term stability.

## 7. Performance Metrics

*   **API Response Optimization:**
    *   Increased `limit` parameter in `/api/submissions` and `/api/competitions` calls from the dashboard to reduce the chance of missing items due to default low limits, improving perceived performance and data completeness.
    *   **Cache Management:** Added cache-busting parameters to ensure fresh data
*   **Client-Side Rendering:**
    *   Next.js's built-in optimizations (code splitting, `next/image`) are leveraged.
*   **Data Fetching:**
    *   Specific fetching functions for different data types on the dashboard (`fetchDashboardData`, `fetchVotingCompetitions`, `fetchCompletedCompetitions`, `fetchActivities`).
    *   Polling implemented on the dashboard to auto-refresh data every 30 seconds.
    *   **Optimized Queries:** Database queries optimized to only fetch completed competitions for points calculation
*   **Background Processing:**
    *   Automatic status updates run via cron jobs to reduce server load
    *   Notification processing with rate limiting to prevent email service overload
*   **No Formal Benchmarking:** Performance improvements were mostly reactive to observed issues (e.g., missing data in feeds).

## 8. API Integrations and Design

### Internal APIs (Next.js API Routes)
*   **Structure:** RESTful principles, e.g., `GET /api/competitions`, `POST /api/competitions`, `PUT /api/competitions/[id]`.
*   **Request Handling:**
    *   Use `NextRequest` and `NextResponse`.
    *   `params` object for dynamic route segments (e.g., `params.id`).
*   **New API Endpoints:**
    *   **`/api/admin/send-voting-notifications`:** Handles voting notification dispatch
    *   **`/api/admin/reminder-logs`:** Manages reminder and notification logging
    *   **`/api/user/notification-preferences`:** Manages user notification settings
    *   **`/api/cron/update-competition-statuses`:** Handles automatic status updates
    *   **`/api/admin/send-new-competition-notifications`:** Handles new competition notification dispatch
*   **`multipart/form-data` Handling:**
    *   The `PUT /api/competitions/[id]` and `POST /api/competitions` routes (for editing/creating competitions with cover images) disable Next.js's default `bodyParser`.
    *   `formidable` library is used to parse `multipart/form-data`. This involved:
        *   Setting `multiples: false` in `formidable` options.
        *   Manually constructing a `PassThrough` stream from `req.body` and piping it to `formidable.parse()`, as `NextRequest` doesn't directly expose Node.js stream events (`req.on`).
        *   Copying headers from `req.headers` to the `PassThrough` stream for `formidable`.
    *   **Critical Fix:** Handling cases where `formidable` parses all text fields as arrays. A loop or specific checks now convert array values to single strings for fields defined as `String` in Mongoose schemas (e.g., `title`, `status`, `prizes`, `votingCriteria`).
*   **Security:** API routes are protected using `getServerSession` from NextAuth.js to check for authenticated users and their roles.
    *   **Cron Job Security:** Bearer token authentication for automated endpoints
    *   **Admin-only Endpoints:** Strict role checking for administrative functions
*   **Response Format:** Consistent JSON responses, typically `{ success: boolean, data?: any, message?: string }`.

### External APIs
*   Google OAuth is an external API integration managed by NextAuth.js.
*   **Email Service Integration:** Custom email service for notifications (likely SMTP or third-party service)

## 9. Feedback Mechanisms

*   **Developer-AI Collaboration:** The development process heavily relied on a tight feedback loop:
    1.  User (developer) states a requirement or reports a bug.
    2.  AI proposes a solution (code changes, explanations).
    3.  User applies the solution and tests.
    4.  User provides feedback on the outcome (success, new errors, further refinements).
    This iterative process was key to debugging complex issues like form handling and feed logic.
*   **User Notification Preferences:** In-app system for users to control their notification preferences
*   **Admin Feedback Systems:** Comprehensive reporting and logging for administrative actions
*   **No In-App User Feedback System:** Currently, there are no formal mechanisms for end-users of SnapScape to provide general feedback directly within the app.

## 10. Update and Maintenance Protocols

*   **Dependency Management:** `npm install` for managing packages. Regular updates to dependencies (`npm update` or targeted updates) are implied for security and feature benefits.
*   **Codebase Maintenance:** Refactoring (e.g., improving field processing in API routes, unifying feed logic) has occurred to enhance clarity and robustness.
*   **Environment Configuration:** `.env.local` for managing environment-specific variables (database connection strings, API keys). A `.env.template` or similar should exist to guide setup.
*   **Automated Maintenance:**
    *   **Cron Jobs:** Automatic competition status updates every 5 minutes in production
    *   **Database Cleanup:** Logging systems for tracking and potential cleanup of old records
*   **Deployment:**
    *   **Vercel Integration:** Configured for easy deployment with environment variables
    *   **Production Monitoring:** Logging systems for tracking application health

## 11. Localization and Internationalization (i18n)

*   **Current Status:** The application is primarily in English.
*   **Future Consideration:** No specific i18n libraries or structures have been implemented yet. If internationalization becomes a requirement, libraries like `next-i18next` would be suitable.

## 12. Development Environment and File Management

*   **Custom Instruction Adherence:**
    *   "Ensure any time an API is created, the corresponding page/UI is also implemented immediately": This was generally followed. For instance, when a `/dashboard/competitions/[id]/vote` route was thought to be needed, a placeholder page was created. When it was clarified that `/view-submissions` was the correct page, the incorrect one was removed and the link fixed.
    *   "Before creating a new file, verify that the file does not already exist...": This was a manual check during development.
    *   **Documentation Updates:** All new features are documented in this file as per user requirements
*   **Local Setup:** Documented in `README-local-setup.md`, covering cloning, environment variables, dependency installation, and running the dev server (`npm run dev`). Includes troubleshooting for common issues.
*   **Shell:** Interactions noted use of PowerShell on Windows.

## 13. Key Architectural Components & Technologies (Reiteration)

*   **Next.js (App Router):** For SSR, SSG, client-side navigation, API routes.
*   **TypeScript:** For static typing and improved code quality.
*   **MongoDB & Mongoose:** NoSQL database and ODM for data modeling and interaction.
*   **NextAuth.js:** Authentication (Google, Credentials).
*   **Tailwind CSS:** Utility-first CSS framework for styling.
*   **`formidable`:** Node.js module for parsing form data, especially `multipart/form-data`.
*   **`react-image-crop`:** React component for client-side image cropping.
*   **`date-fns`:** For robust date manipulations.
*   **React Hooks (`useState`, `useEffect`):** For component state and side effects.
*   **Email Service:** Custom email notification system
*   **Cron Job System:** Automated task scheduling for status updates

## 14. Critical File Structures (More Detail)

*   **`src/app/`**:
    *   **`layout.tsx`**: Root layout for the application.
    *   **`page.tsx`**: Homepage.
    *   **`api/`**:
        *   `auth/[...nextauth]/route.ts`: Core NextAuth.js configuration.
        *   `competitions/route.ts`: Handles `GET` (list all/filtered) and `POST` (create new) competitions.
        *   `competitions/[id]/route.ts`: Handles `GET` (single competition), `PUT` (update competition, uses `formidable`), `DELETE` (delete competition).
        *   `submissions/route.ts`: Handles fetching and potentially creating photo submissions. Includes query params for filtering by competition, status, and pagination (`limit`, `showAll`).
        *   `users/stats/route.ts`: Fetches user-specific statistics for the dashboard.
        *   `users/activities/route.ts`: Fetches a feed of user activities.
        *   **`admin/send-voting-notifications/route.ts`:** Handles voting notification dispatch
        *   **`admin/reminder-logs/route.ts`:** Manages reminder and notification logging
        *   **`user/notification-preferences/route.ts`:** Manages user notification settings
        *   **`cron/update-competition-statuses/route.ts`:** Handles automatic status updates
        *   **`admin/send-new-competition-notifications/route.ts`:** Handles new competition notification dispatch
    *   **`dashboard/`**:
        *   `layout.tsx`: Layout specific to the dashboard section (e.g., sidebar).
        *   `page.tsx`: The main dashboard page, heavily modified to include the unified feed, stats, and tabbed navigation.
        *   `competitions/[id]/page.tsx`: Detail page for a single competition.
        *   `competitions/[id]/view-submissions/page.tsx`: Displays submissions for viewing, results, and voting. Logic on this page adapts based on competition status.
        *   `profile/page.tsx`: User profile page, displays achievements and photo gallery.
        *   **`settings/page.tsx`:** Main user settings page
        *   **`settings/notifications/page.tsx`:** User notification preferences
    *   **`admin/`**:
        *   `competitions/create/page.tsx`: Form for creating new competitions, including `react-image-crop`.
        *   `competitions/[id]/edit/page.tsx`: Form for editing competitions, also including `react-image-crop` and handling `multipart/form-data`.
        *   **`settings/competition-reminders/page.tsx`:** Admin notification management
        *   **`settings/competition-status/page.tsx`:** Competition status management
        *   **`settings/layout.tsx`:** Settings navigation layout
*   **`src/components/`**: Likely contains reusable UI elements (e.g., specific card types if not directly in pages, modals, form inputs if abstracted).
*   **`src/lib/`**:
    *   `auth.ts`: Detailed configuration for NextAuth.js providers and callbacks.
    *   `mongodb.ts`: Utility to establish and reuse MongoDB connections.
    *   `helpers.ts` (or similar): Could contain utility functions like `formatTimeSince`.
    *   **`competition-auto-status-service.ts`:** Automatic status update logic
    *   **`competition-status-notification-service.ts`:** Status change notification handling
    *   **`emailService.ts`:** Email notification service
    *   **`notification-service.ts`:** In-app notification handling
    *   **`new-competition-notification-service.ts`:** New competition notification handling
*   **`src/models/`**:
    *   `Competition.ts`: Mongoose schema for competitions (includes fields like `title`, `theme`, `status`, `startDate`, `endDate`, `votingEndDate`, `coverImage`, `cropX`, `cropY`, etc., and importantly `createdAt`, `updatedAt` for timestamp tracking, plus `manualStatusOverride` and `lastAutoStatusUpdate`).
    *   `User.ts`: Mongoose schema for users (includes `name`, `email`, `image`, `role`, `notificationPreferences`).
    *   `PhotoSubmission.ts`: Mongoose schema for photo submissions (includes `user`, `competition`, `imageUrl`, `thumbnailUrl`, `averageRating`, `ratingCount`).
    *   `Activity.ts`: Mongoose schema for user activities.
    *   **`ReminderLog.ts`:** Schema for tracking notification and reminder activities
*   **`.env.local`**: For storing sensitive environment variables (DB connection string, NextAuth secrets, Google OAuth credentials, CRON_SECRET).

## 15. Latest Features Implementation Summary (2024)

### 15.1. Voting Notification System
*   **Admin Interface:** Purple-themed section in competition reminders page
*   **Functionality:** Send voting open/completed notifications to specific users or all users
*   **Integration:** Uses existing email templates and notification infrastructure
*   **Testing:** Comprehensive test email functionality with detailed reporting
*   **API:** `/api/admin/send-voting-notifications` with POST method

### 15.2. User Settings & Notification Preferences
*   **Settings Page:** Accessible via gear icon in user profile
*   **Notification Control:** Granular control over email notification types
*   **Categories:** Competition reminders, voting notifications, achievements, weekly digest, marketing
*   **Persistence:** Stored in user model with real-time updates
*   **API:** `/api/user/notification-preferences` with GET/POST methods

### 15.3. Automatic Competition Status Updates
*   **Service:** `competition-auto-status-service.ts` for automated status transitions
*   **Admin Interface:** Competition status management page with preview and manual trigger
*   **Cron Integration:** `/api/cron/update-competition-statuses` for automated execution
*   **Manual Override:** Competition-level setting to prevent automatic updates
*   **Notifications:** Automatic email notifications on status changes
*   **Logging:** Comprehensive audit trail for all status changes

### 15.4. Points System Refinement
*   **Calculation Fix:** Points only calculated from completed competitions
*   **Frontend Logic:** Removed incorrect estimation logic for active/voting competitions
*   **Debugging System:** Comprehensive logging for points calculation tracking
*   **User Experience:** Accurate points display with breakdown modal
*   **API Enhancement:** Updated `/api/users/[id]/stats` to filter by completion status

### 15.5. Enhanced Admin Features
*   **Competition Management:** Manual status override option in edit forms
*   **Notification Management:** Centralized admin interface for all notification types
*   **Logging System:** Detailed tracking of all administrative actions
*   **Preview Functionality:** See changes before applying them
*   **Error Handling:** Comprehensive error reporting and recovery

### 15.6. UI/UX Improvements
*   **Profile Enhancements:** Settings gear icon, improved button consistency
*   **Admin Interface:** Color-coded sections, improved table layouts
*   **Real-time Feedback:** Toast notifications, loading states, success/error messages
*   **Mobile Responsiveness:** Improved mobile layouts for new features
*   **Navigation:** Enhanced settings navigation with clear categorization

### 15.7. New Competition Notification System
*   **Automatic Integration:** Notifications automatically sent when competitions are created
*   **User Preference Respect:** Only sends to users who have opted in for new competition notifications
*   **Email Template:** Beautiful, responsive email template with competition details, dates, and action buttons
*   **Admin Testing:** Manual testing interface for sending to specific email addresses
*   **Service Architecture:** `new-competition-notification-service.ts` for handling notification logic
*   **API Endpoint:** `/api/admin/send-new-competition-notifications` for manual triggers
*   **In-app Integration:** Creates both email and in-app notifications simultaneously
*   **Error Handling:** Comprehensive error tracking and reporting for failed notifications

### 15.8. Judge Dashboard (`/judge`)
*   **Authentication & Role Check**: Automatically redirects non-judge users to regular dashboard
*   **Unified Design**: Matches the main user dashboard design with SnapScape branding and color scheme
*   **Judge-Specific Features**:
    *   **Circular Statistics**: Similar layout to user dashboard with judge-specific metrics
        *   **Competitions**: Total competitions available for judging
        *   **Active to Judge**: Competitions currently in voting phase requiring judge input
        *   **Completed**: Number of completed judging sessions
        *   **Photos Reviewed**: Total photos reviewed across all competitions
        *   **Avg Rating**: Average rating given across all judgments
    *   **Feed & Competitions Tabs**: Toggle between activity feed and competition list
    *   **Real-time Activity Feed**: 
        *   **Judge Assignment Notifications**: Real-time notifications when assigned to new competitions
            *   **Visual Indicators**: Purple checkmark icon for judge assignments
            *   **Competition Context**: Shows competition title and current status
            *   **Action Links**: Direct links to view competition or start judging
            *   **Status-aware Messaging**: Different messages for active, voting, or upcoming competitions
        *   **Notification Integration**: Fetches real activities from `/api/users/activities` endpoint
        *   **Activity Types**: Judge assignments, photo approvals, competition updates, and other system notifications
        *   **Time-based Sorting**: Most recent activities appear first with relative timestamps
        *   **Notification Deletion**: Delete buttons for notifications when enabled by admin settings
            *   **Admin Control**: Only shows delete buttons when `allowNotificationDeletion` setting is enabled
            *   **Database Integration**: Actually deletes notifications from database via `/api/notifications/[id]` DELETE endpoint
            *   **Smart Filtering**: Only deletable items (notifications, submissions, badges, wins, results) can be deleted
            *   **UI Feedback**: Immediate removal from feed upon successful deletion
*   **React Key Error Fix (January 2025)**:
    *   **Issue**: React warning about invalid keys in feedItems array causing console errors
    *   **Root Cause**: Potential duplicate IDs and missing null checks in feedItems data
    *   **Solution Implemented**:
        *   **Unique ID Generation**: Added index to activity IDs to ensure uniqueness (`activity-${activity._id}-${index}`)
        *   **Duplicate Removal**: Added filter to remove any potential duplicate feedItems based on ID
        *   **Null Safety**: Added comprehensive null checks and filters to prevent rendering of invalid data
        *   **Error Handling**: Added fallback empty arrays on API errors to prevent rendering issues
        *   **Data Validation**: Added safety filters before mapping to ensure all required properties exist
        *   **Improved Sorting**: Enhanced data combination and sorting logic for feed items
    *   **Technical Details**:
        *   Fixed feedItems being set twice (competition items + activities)
        *   Added proper TypeScript type assertions for feedItem types
        *   Added default values for missing properties (title, theme, status, etc.)
        *   Enhanced error boundaries for data fetching failures
    *   **Files Modified**: `src/app/judge/page.tsx`
    *   **Impact**: Eliminated React console errors and improved judge dashboard stability

### 15.9. Dashboard Notification Deletion Feature (January 2025)
*   **Feature**: Comprehensive notification deletion functionality in dashboard feed
*   **Admin Control**: 
    *   **Settings Management**: Admin can enable/disable notification deletion via `/admin/settings`
    *   **Setting Field**: `allowNotificationDeletion` boolean controls feature availability
    *   **API Integration**: `/api/settings` endpoint returns setting to frontend
*   **User Experience**:
    *   **Visual Integration**: Delete buttons appear as red circular X icons in top-right corner of feed items
    *   **Conditional Display**: Only shows when admin has enabled the setting
    *   **Smart Targeting**: Delete buttons only appear on deletable items (notifications, submissions, badges, wins, results)
    *   **Immediate Feedback**: Items disappear from feed immediately upon successful deletion
*   **Technical Implementation**:
    *   **Database Deletion**: Uses existing `/api/notifications/[id]` DELETE endpoint
    *   **State Management**: Updates both activities and feedItems state after deletion
    *   **Error Handling**: Falls back to local hiding if database deletion fails
    *   **API Integration**: Fetches admin settings on component mount
*   **Supported Items**:
    *   **Notifications**: Judge assignments, photo approvals, system messages
    *   **Activities**: Photo submissions, badge awards, competition wins, results
    *   **Non-deletable**: Competition cards (active, voting, completed) - these only hide locally
*   **Judge Dashboard Integration**:
    *   **Feature Parity**: Judge dashboard includes same deletion functionality
    *   **Role-appropriate**: Judges can delete their own notifications when feature is enabled
    *   **Consistent UI**: Same delete button design and behavior as user dashboard
*   **Files Modified**:
    *   `src/app/dashboard/page.tsx` - Main dashboard deletion functionality
    *   `src/app/judge/page.tsx` - Judge dashboard deletion functionality
    *   `src/app/api/settings/route.ts` - Updated to include allowNotificationDeletion setting
    *   `ProjectDocumentationDetailed.md` - Documentation updates
*   **Benefits**:
    *   **User Control**: Users can manage their notification feed
    *   **Clean Interface**: Reduces feed clutter by removing unwanted notifications
    *   **Admin Oversight**: Administrators maintain control over feature availability
    *   **Consistent Experience**: Same functionality across user and judge dashboards

### 15.10. Enhanced Photo Submission Interface (January 2025)

**Complete User Experience in "View as User" Mode:**
When judges access competitions in "View as User" mode (`?viewAsUser=true`), they now receive the full photo submission interface that regular users experience:

**Form Components:**
- **File Upload with Compression**: Advanced image handling supporting JPG, PNG, and WebP formats up to 10MB
- **Automatic Image Optimization**: Files over 3MB are compressed for optimal viewing while preserving quality
- **Photo Title Field**: Required field with 100-character limit and real-time character count
- **Photo Description Field**: Required field with 500-character limit for detailed photo context
- **Terms Agreement Checkbox**: Interactive links to competition rules and copyright terms
- **Professional Validation**: Real-time error checking for file types, sizes, and required fields
- **Success/Error Feedback**: Clear user feedback for submission status

**Technical Features:**
- Seamless mode switching with proper state management
- Visual banners indicating current mode (Judge vs User)
- Assignment-aware restrictions (assigned judges cannot participate)
- Complete navigation preservation with `?viewAsUser=true` parameter
- Mobile-responsive design matching full user experience

#### Navigation Enhancement for Judge "View as User" Mode (January 2025)

**Sidebar Navigation Fix:**
Fixed a critical issue where sidebar navigation links were not working properly when judges were in "View as User" mode.

**Problem Resolved:**
- Sidebar links (Dashboard, Competitions, My Submissions, Profile, Feedback, Notifications) were losing the `?viewAsUser=true` parameter
- This caused judges to be kicked out of "View as User" mode when navigating
- Links would redirect to judge mode instead of maintaining user mode

**Solution Implemented:**
- Added `getNavigationUrl()` function to preserve `viewAsUser` parameter in all navigation links
- Updated both desktop sidebar and mobile bottom navigation
- All navigation now properly maintains judge's current viewing mode
- Judges can now navigate freely while in "View as User" mode without being forced back to judge mode

**Technical Details:**
- Dynamic URL generation based on current mode detection
- Consistent parameter preservation across desktop and mobile navigation
- Seamless user experience for dual-role functionality

#### Judge Dashboard Navigation Cleanup (January 2025)

**Sidebar Navigation Fix for Judge Dashboard:**
Fixed multiple issues with the judge dashboard sidebar navigation that were preventing judges from navigating properly.

**Problems Resolved:**
- **Broken Links**: Navigation links were using incomplete URLs (e.g., `/competitions` instead of proper routes)
- **Non-functional Menu Items**: "Judge Submissions" and "All Submissions" links were pointing to non-existent routes
- **Redundant Menu Items**: Removed unnecessary navigation items that didn't serve judge-specific functions

**Solution Implemented:**
- **Cleaned Navigation Menu**: Simplified judge navigation to essential items only:
  - Judge Dashboard (main judge functionality)
  - View as User (switch to user mode)
  - Profile (user profile management)
  - Notifications (system notifications)
- **Fixed URL Structure**: Updated all navigation links to use proper, working routes
- **Mobile Navigation**: Updated mobile bottom navigation to match desktop navigation
- **Consistent Experience**: Ensured both desktop and mobile navigation work reliably

**Technical Changes:**
- Removed broken `/competitions`, `/competitions?status=voting`, and `/submissions` links
- Streamlined navigation array to focus on working, essential features
- Updated both desktop sidebar and mobile bottom navigation
- Maintained proper styling and active state detection

**User Experience Improvements:**
- Judges can now navigate reliably without encountering broken links
- Cleaner, more focused navigation reduces confusion
- All navigation items serve specific, working purposes
- Consistent navigation experience across devices

### 15.11. Role Selection System for Multi-Role Users (January 2025)

**Login-Time Role Selection for Judges:**
Implemented a comprehensive role selection system to eliminate conflicts and provide seamless user experience for users with multiple roles (particularly judges).

**The Problem We Solved:**
- Complex URL parameter management (`?viewAsUser=true`)
- Conflicting navigation between judge and user layouts
- State management issues when switching roles mid-session
- User confusion about current active role

**New Solution: Login-Time Role Selection**

**How It Works:**
1. **Judge Logs In** → Automatically redirected to role selection screen
2. **User Chooses Role**: "Login as User" or "Login as Judge"
3. **Session Configured**: Interface completely adapts to selected role
4. **No Mid-Session Switching**: Clean, dedicated experience per role
5. **Preference Remembered**: Choice saved for future sessions

**User Experience Flow:**

**For Regular Users:**
- Login → Direct to user dashboard (unchanged)

**For Judges:**
- Login → Role selection screen appears
- Choose "Login as User" → Full user experience with submission capabilities
- Choose "Login as Judge" → Full judge dashboard with evaluation tools
- Preference saved for future logins

**Technical Implementation:**

**Role Selection Page** (`/role-selection`):
- Beautiful, branded interface with clear role descriptions
- User information display for context
- Loading states and smooth transitions
- Local storage for preference management

**Components Created:**
- `RoleSelector` component with interactive role cards
- Role selection page with authentication guards
- Middleware integration for automatic redirects

**Features:**
- **Intelligent Redirects**: Middleware automatically guides judges to role selection
- **Preference Memory**: Remembers user's last choice for quick access
- **Role Switching**: Easy role change option available in both interfaces
- **Visual Indicators**: Clear messaging about current active role
- **Seamless Integration**: Works with existing authentication system

**Benefits:**
- ✅ **Eliminates Role Conflicts**: No more navigation confusion
- ✅ **Better User Experience**: Clear, dedicated interfaces per role
- ✅ **Reduced Complexity**: No need for complex URL parameter management
- ✅ **Improved Performance**: No client-side role switching overhead
- ✅ **Future-Proof**: Easily extensible for additional roles (admin, moderator, etc.)

**Technical Details:**
- Middleware redirects judges to `/role-selection` on first access
- localStorage stores role preferences (`preferredRole`, `selectedRole`)
- Role-specific routing eliminates URL parameter dependencies
- Clean separation between user and judge experiences
- Maintained backward compatibility with existing systems

### 15.12. Judge Evaluation System (January 2025)

**Dedicated Judge Rating Interface:**
Implemented a comprehensive judge evaluation system that allows judges to rate and evaluate photo submissions directly within judge mode, eliminating the need to redirect to user mode.

**Key Features:**

**Judge Evaluation Page (`/judge/competitions/[id]/evaluate`):**
- **Access Control**: Only judges assigned to specific competitions can access evaluation interface
- **Comprehensive Submission View**: Side-by-side layout with submission list and detailed evaluation panel
- **Professional Rating System**: 1-5 star rating system with clear evaluation criteria
- **Progress Tracking**: Visual indicators showing evaluation progress and completion status
- **Navigation Controls**: Easy navigation between submissions with arrow controls and direct selection

**Rating Interface:**
- **Interactive Star Rating**: Click-to-rate system with visual feedback
- **Rating Status Display**: Clear indicators showing which submissions have been rated
- **Evaluation Guidelines**: Built-in rating criteria (5=Exceptional, 4=Very Good, 3=Good, 2=Below Average, 1=Poor)
- **Real-time Updates**: Immediate feedback on rating submission and status updates

**Technical Implementation:**
- **Assignment Verification**: Automatic verification that judge is assigned to competition before allowing access
- **Rating API Integration**: Seamless integration with existing ratings system
- **State Management**: Real-time UI updates reflecting rating changes
- **Error Handling**: Comprehensive error handling with user-friendly messages

**User Experience Improvements:**
- **Direct Judge Access**: "Judge Submissions" button now directs to proper evaluation interface instead of user mode
- **Streamlined Workflow**: No more switching between user and judge modes for evaluation
- **Professional Interface**: Dedicated judge-focused UI design and terminology
- **Efficient Navigation**: Quick access from judge dashboard to evaluation interface

**Security & Permissions:**
- **Role-based Access**: Only authenticated judges can access evaluation interface
- **Competition Assignment**: Only judges assigned to specific competitions can evaluate those submissions
- **Data Protection**: Judge ratings are properly attributed and stored securely

This system provides judges with a professional, dedicated interface for evaluating photo submissions without the confusion and complexity of role-switching that was previously required.

### 15.13. Role Selection System for Multi-Role Users (January 2025)

**Login-Time Role Selection for Judges:**
Implemented a comprehensive role selection system to eliminate conflicts and provide seamless user experience for users with multiple roles (particularly judges).

**The Problem We Solved:**
- Complex URL parameter management (`?viewAsUser=true`)
- Conflicting navigation between judge and user layouts
- State management issues when switching roles mid-session
- User confusion about current active role

**New Solution: Login-Time Role Selection**

**How It Works:**
1. **Judge Logs In** → Automatically redirected to role selection screen
2. **User Chooses Role**: "Login as User" or "Login as Judge"
3. **Session Configured**: Interface completely adapts to selected role
4. **No Mid-Session Switching**: Clean, dedicated experience per role
5. **Preference Remembered**: Choice saved for future sessions

**User Experience Flow:**

**For Regular Users:**
- Login → Direct to user dashboard (unchanged)

**For Judges:**
- Login → Role selection screen appears
- Choose "Login as User" → Full user experience with submission capabilities
- Choose "Login as Judge" → Full judge dashboard with evaluation tools
- Preference saved for future logins

**Technical Implementation:**

**Role Selection Page** (`/role-selection`):
- Beautiful, branded interface with clear role descriptions
- User information display for context
- Loading states and smooth transitions
- Local storage for preference management

**Components Created:**
- `RoleSelector` component with interactive role cards
- Role selection page with authentication guards
- Middleware integration for automatic redirects

**Features:**
- **Intelligent Redirects**: Middleware automatically guides judges to role selection
- **Preference Memory**: Remembers user's last choice for quick access
- **Role Switching**: Easy role change option available in both interfaces
- **Visual Indicators**: Clear messaging about current active role
- **Seamless Integration**: Works with existing authentication system

**Benefits:**
- ✅ **Eliminates Role Conflicts**: No more navigation confusion
   - Mouse wheel navigation
   - Infinite scroll with pagination
   - Loading states and error handling
   - Back to Judge Dashboard navigation

5. **Technical Implementation**:
   - Complete code rewrite using the same structure as user view-submissions
   - Proper state management for modal and navigation
   - Judge role validation and assignment checking
   - Integration with existing ratings API
   - Responsive design for all devices

### **Visual Design Elements**
- **Purple Theme**: Consistent purple branding for judge interface
- **Professional Layout**: Clean, modern grid with hover effects
- **Modal Experience**: Full-screen image viewing with rating sidebar
- **Evaluation Guidelines**: Clear 5-star rating system with descriptions
- **Rating Indicators**: Visual feedback on grid for rated/unrated submissions
- **Context Information**: Current average ratings for informed evaluation

### **User Experience Improvements**
- **Consistent Interface**: Judges now have the same beautiful interface as users
- **Intuitive Navigation**: Click to expand, arrow navigation, keyboard shortcuts
- **Professional Feel**: Purple theming and evaluation guidelines enhance judge experience
- **Clear Feedback**: Visual indicators for rated vs unrated submissions
- **Efficient Workflow**: Easy navigation between submissions with context preservation

### **Files Modified**
- `src/app/judge/competitions/[id]/evaluate/page.tsx` - Complete interface redesign

### **Technical Features**
- Same responsive modal system as user interface
- Infinite scroll pagination for large submission sets
- Real-time rating updates and state management
- Professional evaluation guidelines and rating criteria
- Judge role validation and competition assignment checking
- Seamless integration with existing APIs

This redesign ensures that judges have a consistent, professional, and beautiful interface that matches the user experience while providing the specialized functionality needed for competition evaluation.

## Results Page Features Restoration (January 2025)

### **Issue**: Missing Features in Results Page  
**Problem**: The localhost version of the results page was missing key features that were previously implemented:
- Missing "Photographer Rank" tab (only "Results" tab was showing)
- Missing "Share:" social media buttons  
- Lost functionality that was documented as working

**Impact**: Users couldn't access the photographer rankings view or share competition results on social media.

### **Root Cause Analysis**
The view-submissions page had been overwritten during previous changes, losing the complete feature set that was documented as implemented.

### **Solution Implemented**
**Git History Restoration**: Used git commit `b84462c` which contained the complete implementation with all features:

**Features Restored**:
1. **📊 Photographer Rank Tab**:
   - Two-tab system: "Results" and "Photographer Rank"
   - Toggle between submission results and photographer rankings
   - Complete photographer statistics and rankings

2. **📤 Social Media Sharing**:
   - Platform-specific sharing: Twitter, WhatsApp, Facebook, Instagram
   - Platform-optimized text formats (Twitter compact, WhatsApp URL-compatible emojis)
   - Copy to clipboard functionality
   - Share buttons appear in both tabs with context-appropriate content

3. **🏆 Enhanced Results Display**:
   - Top 3 winners highlighting with trophy icons
   - Complete ranking system with multipliers
   - Total points calculation and display
   - Responsive design for mobile and desktop

4. **👨‍💻 Complete Interface**:
   - Full modal system for image viewing
   - Star rating interface during voting phases
   - Keyboard navigation and scroll wheel support
   - Click-to-expand functionality

### **Technical Implementation**
- Restored complete file from git commit `b84462c` using `git show`
- All state management for tabs, sharing, and photographer rankings intact
- Platform-specific sharing logic and URL generation preserved
- Responsive design and mobile optimizations maintained

### **Result**
✅ **Complete Feature Restoration**: All documented features now working in localhost environment
✅ **Tab Navigation**: "Results" and "Photographer Rank" tabs functional
✅ **Social Sharing**: All social media platforms and clipboard sharing working
✅ **Responsive Design**: Mobile and desktop layouts optimized
✅ **Complete Interface**: Modal, voting, and navigation systems restored

**Files Modified**:
- `src/app/dashboard/competitions/[id]/view-submissions/page.tsx` - Complete restoration from git backup

## Judges Evaluation Tab in Results Page (January 2025)

### **Feature**: Judge Evaluation Display in Competition Results  
**Purpose**: Provide transparency and insights into professional judge ratings for competitions with assigned judges.

### **Implementation Details**

**Dynamic Tab System**: 
- Added third tab "Judges Evaluation" that only appears when competition has judges assigned
- Updated tab state management to include `'judges'` as a valid option
- Tab shows count of assigned judges in the header

**Judge Ratings Display**:
- **Individual Submission Cards**: Each submission shown in expandable card format with:
  - Submission thumbnail and details (title, photographer, description)
  - Average judge rating displayed with purple star styling
  - Progress indicator showing "X of Y judges rated"
  - Individual judge ratings grid showing each judge's score and date

**Technical Features**:
- **Judge-Specific API Calls**: Fetches judge ratings using `type=judge` parameter
- **Loading States**: Professional loading spinner while fetching judge evaluations
- **Error Handling**: Graceful handling of missing or failed judge rating data
- **Responsive Design**: Mobile-optimized layout with collapsible rating details

**Security & Access Control**:
- **Judge Privacy**: Individual judge names not displayed, only "Judge 1", "Judge 2", etc.
- **Assignment Verification**: Tab only appears for competitions with assigned judges
- **Data Filtering**: Only shows ratings from official competition judges

**User Experience**:
- **Visual Distinction**: Purple color scheme to distinguish from regular user ratings
- **Clear Information Architecture**: Separated sections for summary and detailed ratings
- **Professional Presentation**: Clean, organized display suitable for public results

### **Benefits**
- **Transparency**: Users can see professional judge evaluations alongside community voting
- **Educational Value**: Provides insights into professional photography assessment
- **Competition Integrity**: Shows the rigor and expertise behind judge-evaluated competitions
- **Enhanced Results**: Offers multiple perspectives on submission quality

### **Technical Implementation**
- Enhanced Competition interface to include `judges?: string[]` field
- Added state management for judge ratings and loading states
- Implemented `fetchJudgeRatings()` function with proper error handling
- Updated tab navigation system to conditionally show judges tab
- Created comprehensive judge evaluation UI with responsive design

### **API Integration**
- Uses existing `/api/ratings?photo=${submissionId}&type=judge` endpoint
- Fetches ratings for all submissions when judges tab is activated
- Handles missing or incomplete judge rating data gracefully

**Files Modified**:
- `src/app/dashboard/competitions/[id]/view-submissions/page.tsx` - Added judges evaluation tab and functionality
- `ProjectDocumentationDetailed.md` - Updated documentation

**Judge Evaluation Calculation System**:
- **Total Judge Rating**: `averageJudgeRating × judgeRatingCount` (same calculation as user voting)
- **Ranking System**: Submissions sorted by total judge rating (descending), then by average judge rating, then by judge rating count
- **Points Multipliers**: Same as user voting system:
  - 1st Place: 5× multiplier
  - 2nd Place: 3× multiplier  
  - 3rd Place: 2× multiplier
  - 4th+ Place: 1× multiplier
- **Total Judge Points**: `Math.round(totalJudgeRating × multiplier)`

**Visual Design**:
- **Purple Theme**: Distinguished from user voting (yellow/green) with purple color scheme
- **Ranking Badges**: Gold/Silver/Bronze trophies with "Judge Rank" labels
- **Mobile & Desktop Layouts**: Responsive design matching user voting interface
- **Individual Judge Ratings**: Compact grid showing each judge's score
- **Progress Indicators**: Shows how many judges have rated each submission

**Data Integration**:
- **API Integration**: Uses `/api/ratings?photo={id}&type=judge` endpoint
- **Real-time Updates**: Fetches latest judge ratings when tab is accessed
- **Error Handling**: Graceful handling of missing ratings or API errors

**User Experience**:
- **Familiar Interface**: Same layout and interaction patterns as Results tab
- **Clear Distinction**: Purple theme and "Judge" labels differentiate from community voting
- **Complete Information**: Shows average rating, total rating, total points, and individual ratings
- **Loading States**: Proper loading indicators while fetching judge data
