# SnapScape MongoDB

A simple application with user authentication, registration, and separate dashboards for regular users and administrators. Built with Next.js 15 and MongoDB.

## Features

- User authentication (login/logout)
- User registration
- Admin registration
- User dashboard
- Admin dashboard with user management
- Protected routes based on authentication and roles
- MongoDB integration
- Responsive design

## Tech Stack

- **Frontend**: Next.js 15, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **Deployment**: Vercel (frontend), MongoDB Atlas (database)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB instance)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd snapscape-mongo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables (see `.env.local.example`):
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   NEXTAUTH_SECRET=your-nextauth-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Time Setup

1. Visit the application at [http://localhost:3000](http://localhost:3000)
2. Go to the Admin Setup page to create the first admin account
3. Use the admin dashboard to manage users

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### MongoDB Atlas

1. Create a MongoDB Atlas account
2. Set up a new cluster
3. Create a database user
4. Get your connection string and add it to your environment variables

## Project Structure

- `src/app/` - Next.js application components and pages
- `src/app/api/` - API routes for authentication and data management
- `src/lib/` - Utility functions and database connections
- `src/models/` - MongoDB data models
- `src/middleware.ts` - NextAuth middleware for route protection

## License

This project is licensed under the MIT License.
