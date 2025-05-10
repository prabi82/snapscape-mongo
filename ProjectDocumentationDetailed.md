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
*   **Editing (`/admin/competitions/[id]/edit`):**
    *   Admins can modify all fields from the creation form.
    *   Crucially, this form handles `multipart/form-data` using `formidable` on the backend due to the cover image upload. This required careful handling of field parsing, as `formidable` can parse single text fields as arrays. Logic was added to ensure these fields are converted back to strings before database updates.
    *   Status can be changed (e.g., from "active" to "voting").
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

### 2.4. Ranking System
*   **Logic:** Implemented a dense ranking system.
*   **Primary Sort Key:** Average rating.
*   **Tie-Breaking:** `ratingCount` (number of votes received) is used as a secondary sort key to break ties in average ratings.
*   **Consistency:** Ensured this logic is applied consistently across the results page and dashboard feed cards for user's wins. Addressed initial bugs where skipped ranks (e.g., 1, 1, 3) occurred.

### 2.5. User Profile (`/dashboard/profile`)
*   Displays basic user information.
*   **Photo Gallery:** Shows all photos submitted by the user across various competitions.
    *   Fullscreen modal for viewing images, which also displays the rank achieved in that photo's competition. This required fetching all approved submissions for that specific competition to calculate the rank accurately.
*   **Competition Achievements:** Displays counts of 1st, 2nd, and 3rd place finishes. These icons are clickable and scroll the user to the relevant image in their gallery.

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

## 3. Data Handling and Privacy

*   **Database:** MongoDB. Mongoose models define schemas for `Competition`, `User`, `PhotoSubmission`, `Activity`, etc.
*   **Data Protection:**
    *   HTTPS is assumed for production to encrypt data in transit.
    *   MongoDB security features (authentication, IP whitelisting for Atlas) should be configured.
*   **User Data:**
    *   Passwords (if using credentials provider) are hashed by NextAuth.js.
    *   API routes ensure data is fetched/modified only by authenticated and authorized users.
*   **File Uploads:**
    *   Managed by `formidable` on the backend. Files are temporarily stored on the server during processing. A robust solution would involve uploading to a cloud storage service (e.g., S3, Cloudinary) and storing the URL in the database.
    *   Crop parameters for cover images are stored alongside competition data.

## 4. User Interface (UI) and User Experience (UX) Design

*   **Responsive Design:** Tailwind CSS utility classes are used extensively to ensure the application adapts to different screen sizes (e.g., `md:hidden`, `hidden md:block`). Mobile views, particularly for the results page, underwent iterative improvements for better organization and aesthetics.
*   **Clarity & Navigation:**
    *   Dashboard with clear tabs for "Feed", "Competitions", "Activity".
    *   Sidebar navigation for main sections.
    *   Consistent button styling and calls to action.
*   **Visual Feedback:**
    *   Loading spinners/states during data fetching.
    *   Success and error messages for form submissions and API interactions.
    *   Visual cues for rankings (trophy icons, color-coded badges).
*   **Accessibility:** While not explicitly detailed as a primary focus in interactions, best practices like semantic HTML and keyboard navigability are inherent goals with modern frameworks and should be continually assessed.
*   **Specific UI Challenges Addressed:**
    *   Ensuring image display on feed cards (e.g., removing covering overlays, applying `rounded-lg overflow-hidden`).
    *   Reformatting the mobile view of the competition results page for better readability and attractiveness.
    *   Fixing JSX syntax errors during UI development (e.g., unclosed tags).

## 5. Error Handling Strategies

*   **Client-Side (`handleSubmit` functions, API call wrappers):**
    *   Required field validation in forms.
    *   Error state variables (`setError`, `setSuccess`) to display messages to the user.
    *   Parsing API error responses: `if (!res.ok) { try { errorData = await res.json() } catch { errorData = { message: await res.text() } } ... }`.
    *   Example: `TypeError: Failed to fetch` logged in `fetchDashboardData` indicates network or API issues.
*   **Server-Side (API Routes):**
    *   `try...catch` blocks around database operations and critical logic.
    *   Returning `NextResponse.json({ success: false, message: ... }, { status: ... })` for errors.
    *   **`formidable` errors:** Parsing errors are caught and reported.
    *   **Mongoose Validation Errors:** `CastError` (e.g., "Cast to string failed for value [ 'voting' ] (type Array) at path 'status'") handled by ensuring data types match the schema before database operations. This was particularly relevant after introducing `formidable`, which tended to parse all form fields into arrays. The fix involved checking `Array.isArray(fields.fieldName) ? fields.fieldName[0] : fields.fieldName`.
    *   **Route `params` await error:** A Next.js warning (`Route "/api/competitions/[id]" used params.id. params should be awaited...`) was noted, though the destructuring approach `{ params: { id } }` is standard for App Router.
    *   Initial backend errors where API routes returned plain text instead of JSON for errors, causing client-side JSON parsing failures.
*   **File `README-local-setup.md`:** Includes troubleshooting tips for common setup errors (Next.js cache, MongoDB connection, Google Auth).

## 6. Testing and Validation

*   **Iterative Manual Testing:** The primary mode of testing observed. Each feature addition or bug fix was followed by requests for the user (developer) to test and report back. This covered:
    *   Badge display on profiles.
    *   Ranking logic on results pages and dashboard cards (including ties).
    *   Feed content, sorting, and timestamp accuracy.
    *   Admin form submissions (creation and editing of competitions, including image cropping).
    *   Navigation and link correctness.
*   **Debugging:** Extensive use of `console.log` on both client and server to trace data flow and identify issues.
*   **Linter Fixes:** Addressed ESLint errors (type mismatches, incorrect `formData` access, `setError` usage, `instanceof Date` checks).
*   **No Formal Automated Testing Suite:** While highly beneficial, automated tests (unit, integration, E2E) were not part of the interactions. This is a key area for future improvement to ensure long-term stability.

## 7. Performance Metrics

*   **API Response Optimization:**
    *   Increased `limit` parameter in `/api/submissions` and `/api/competitions` calls from the dashboard to reduce the chance of missing items due to default low limits, improving perceived performance and data completeness.
*   **Client-Side Rendering:**
    *   Next.js's built-in optimizations (code splitting, `next/image`) are leveraged.
*   **Data Fetching:**
    *   Specific fetching functions for different data types on the dashboard (`fetchDashboardData`, `fetchVotingCompetitions`, `fetchCompletedCompetitions`, `fetchActivities`).
    *   Polling implemented on the dashboard to auto-refresh data every 30 seconds.
*   **No Formal Benchmarking:** Performance improvements were mostly reactive to observed issues (e.g., missing data in feeds).

## 8. API Integrations and Design

### Internal APIs (Next.js API Routes)
*   **Structure:** RESTful principles, e.g., `GET /api/competitions`, `POST /api/competitions`, `PUT /api/competitions/[id]`.
*   **Request Handling:**
    *   Use `NextRequest` and `NextResponse`.
    *   `params` object for dynamic route segments (e.g., `params.id`).
*   **`multipart/form-data` Handling:**
    *   The `PUT /api/competitions/[id]` and `POST /api/competitions` routes (for editing/creating competitions with cover images) disable Next.js's default `bodyParser`.
    *   `formidable` library is used to parse `multipart/form-data`. This involved:
        *   Setting `multiples: false` in `formidable` options.
        *   Manually constructing a `PassThrough` stream from `req.body` and piping it to `formidable.parse()`, as `NextRequest` doesn't directly expose Node.js stream events (`req.on`).
        *   Copying headers from `req.headers` to the `PassThrough` stream for `formidable`.
    *   **Critical Fix:** Handling cases where `formidable` parses all text fields as arrays. A loop or specific checks now convert array values to single strings for fields defined as `String` in Mongoose schemas (e.g., `title`, `status`, `prizes`, `votingCriteria`).
*   **Security:** API routes are protected using `getServerSession` from NextAuth.js to check for authenticated users and their roles.
*   **Response Format:** Consistent JSON responses, typically `{ success: boolean, data?: any, message?: string }`.

### External APIs
*   Google OAuth is an external API integration managed by NextAuth.js.

## 9. Feedback Mechanisms

*   **Developer-AI Collaboration:** The development process heavily relied on a tight feedback loop:
    1.  User (developer) states a requirement or reports a bug.
    2.  AI proposes a solution (code changes, explanations).
    3.  User applies the solution and tests.
    4.  User provides feedback on the outcome (success, new errors, further refinements).
    This iterative process was key to debugging complex issues like form handling and feed logic.
*   **No In-App User Feedback System:** Currently, there are no formal mechanisms for end-users of SnapScape to provide feedback directly within the app.

## 10. Update and Maintenance Protocols

*   **Dependency Management:** `npm install` for managing packages. Regular updates to dependencies (`npm update` or targeted updates) are implied for security and feature benefits.
*   **Codebase Maintenance:** Refactoring (e.g., improving field processing in API routes, unifying feed logic) has occurred to enhance clarity and robustness.
*   **Environment Configuration:** `.env.local` for managing environment-specific variables (database connection strings, API keys). A `.env.template` or similar should exist to guide setup.

## 11. Localization and Internationalization (i18n)

*   **Current Status:** The application is primarily in English.
*   **Future Consideration:** No specific i18n libraries or structures have been implemented yet. If internationalization becomes a requirement, libraries like `next-i18next` would be suitable.

## 12. Development Environment and File Management

*   **Custom Instruction Adherence:**
    *   "Ensure any time an API is created, the corresponding page/UI is also implemented immediately": This was generally followed. For instance, when a `/dashboard/competitions/[id]/vote` route was thought to be needed, a placeholder page was created. When it was clarified that `/view-submissions` was the correct page, the incorrect one was removed and the link fixed.
    *   "Before creating a new file, verify that the file does not already exist...": This was a manual check during development.
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
    *   **`dashboard/`**:
        *   `layout.tsx`: Layout specific to the dashboard section (e.g., sidebar).
        *   `page.tsx`: The main dashboard page, heavily modified to include the unified feed, stats, and tabbed navigation.
        *   `competitions/[id]/page.tsx`: Detail page for a single competition.
        *   `competitions/[id]/view-submissions/page.tsx`: Displays submissions for viewing, results, and voting. Logic on this page adapts based on competition status.
        *   `profile/page.tsx`: User profile page, displays achievements and photo gallery.
    *   **`admin/`**:
        *   `competitions/create/page.tsx`: Form for creating new competitions, including `react-image-crop`.
        *   `competitions/[id]/edit/page.tsx`: Form for editing competitions, also including `react-image-crop` and handling `multipart/form-data`.
*   **`src/components/`**: Likely contains reusable UI elements (e.g., specific card types if not directly in pages, modals, form inputs if abstracted).
*   **`src/lib/`**:
    *   `auth.ts`: Detailed configuration for NextAuth.js providers and callbacks.
    *   `mongodb.ts`: Utility to establish and reuse MongoDB connections.
    *   `helpers.ts` (or similar): Could contain utility functions like `formatTimeSince`.
*   **`src/models/`**:
    *   `Competition.ts`: Mongoose schema for competitions (includes fields like `title`, `theme`, `status`, `startDate`, `endDate`, `votingEndDate`, `coverImage`, `cropX`, `cropY`, etc., and importantly `createdAt`, `updatedAt` for timestamp tracking).
    *   `User.ts`: Mongoose schema for users (includes `name`, `email`, `image`, `role`).
    *   `PhotoSubmission.ts`: Mongoose schema for photo submissions (includes `user`, `competition`, `imageUrl`, `thumbnailUrl`, `averageRating`, `ratingCount`).
    *   `Activity.ts`: Mongoose schema for user activities.
*   **`.env.local`**: For storing sensitive environment variables (DB connection string, NextAuth secrets, Google OAuth credentials).

## 15. Detailed Summary of Development Journey & Key Decisions

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

This detailed account of features, challenges, and solutions should provide a rich context for training another AI agent on the SnapScape project. The evolution of the feed and the complexities of handling `multipart/form-data` with `formidable` in Next.js API routes are particularly important learning points.