# SnapScape Project Documentation (Detailed for AI Training)

## 1. Project Overview

**SnapScape** is a dynamic, full-stack web application built with Next.js (App Router) and TypeScript, designed as an engaging platform for online photo competitions. It enables users to discover competitions, submit their photographic work, participate in community voting, and achieve recognition through a system of badges and rankings. The platform features distinct user roles (general user and administrator), with administrators managing the lifecycle of competitions. The primary goal is to create a seamless, intuitive, and fair environment for photographers to showcase their talent and engage with a community.

**Core Technologies:**
*   **Frontend:** Next.js (React), TypeScript, Tailwind CSS
*   **Backend:** Next.js API Routes, Node.js
*   **Database:** MongoDB with Mongoose ODM
*   **Authentication:** NextAuth.js (Google OAuth and Credentials providers)
*   **File Handling:** `formidable` for multipart/form-data, `react-image-crop` for client-side image cropping.
*   **Date/Time:** `date-fns` and custom helpers.
*   **Notifications:** Email notifications via custom email service, in-app notifications
*   **Automation:** Cron job system for automatic competition status updates and reminders

## 2. Core Functionalities (Detailed)

### 2.1. User Authentication & Authorization
*   **Implementation:** NextAuth.js.
*   **Providers:**
    *   Google OAuth: Allows users to sign in/up with their Google accounts. Requires Google Cloud Console setup for OAuth credentials, authorized JavaScript origins (`http://localhost:3000` or production equivalent), and redirect URIs (`/api/auth/callback/google`).
    *   Credentials: Standard email/password login.
*   **Session Management:** Handled by NextAuth.js, providing session data client-side (`useSession`) and server-side (`getServerSession`).
*   **Role-Based Access Control (RBAC):**
    *   User model includes a `role` field (e.g., `user`, `admin`).
    *   Admin-only sections (e.g., `/admin/*`) are protected by checking `session.user.role === 'admin'`.
    *   API endpoints for sensitive operations (e.g., competition creation/update/deletion) also verify admin privileges.

### 2.2. Competition Lifecycle Management (Admin Focus)
*   **Creation (`/admin/competitions/create`):**
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

### 2.3. User Interaction with Competitions
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

### 2.4. Ranking System & Points Calculation
*   **Logic:** Implemented a dense ranking system.
*   **Primary Sort Key:** Average rating.
*   **Tie-Breaking:** `ratingCount` (number of votes received) is used as a secondary sort key to break ties in average ratings.
*   **Points System:** 
    *   Points are only calculated from **completed competitions** to prevent premature point display
    *   Points breakdown includes: 1st place (10 points), 2nd place (7 points), 3rd place (5 points), other submissions (1 point each), voting participation (1 point per vote cast)
    *   Fixed frontend estimation logic that incorrectly calculated points from active/voting competitions
    *   Added comprehensive debugging system to track point calculations
*   **Consistency:** Ensured this logic is applied consistently across the results page and dashboard feed cards for user's wins. Addressed initial bugs where skipped ranks (e.g., 1, 1, 3) occurred.

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
// Old logic (incorrect)
const sorted = [...compImages].sort((a, b) => {
  if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
  return (b.ratingCount || 0) - (a.ratingCount || 0);
});

// New logic (correct)
const sorted = [...compImages].sort((a, b) => {
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

### 18.4. Technical Changes
- **Updated Sorting Logic:** Changed from average rating priority to total rating priority
- **Enhanced Dense Ranking:** Modified ranking calculation to use total rating comparisons
- **Consistent Tiebreakers:** Applied the same tiebreaker hierarchy as results page
- **Type Safety:** Added proper TypeScript typing for ranking variables

### 18.5. Files Modified
- `src/app/dashboard/profile/page.tsx` - Updated image modal ranking calculation
- `ProjectDocumentationDetailed.md` - Added documentation

### 18.6. Impact
- **Consistent Rankings:** Profile page now shows the same ranks as results page
- **Accurate User Information:** Users see correct ranking information across all pages
- **Improved Trust:** Eliminates confusion about ranking discrepancies
- **System Integrity:** Ensures all ranking displays use the same authoritative calculation

### 18.7. Verification
Users can now verify that the rank shown in their profile page image modals exactly matches the rank displayed on the competition results page, providing a consistent and trustworthy user experience.

## 19. Latest Features Implementation Summary (2024) - Updated