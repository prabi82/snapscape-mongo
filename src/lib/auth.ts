import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { compare } from 'bcryptjs';

// Debug function
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Auth Debug] ${message}`, data ? data : '');
  }
};

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }
        
        await dbConnect();
        
        // Find user by email
        const user = await User.findOne({ email: credentials.email }).select('+password');
        
        if (!user) {
          throw new Error('No user found with this email');
        }
        
        // Check if user is active
        if (!user.isActive) {
          throw new Error('This account has been deactivated. Please contact support for assistance.');
        }
        
        // Check if user's email is verified (for credentials provider)
        if (user.provider === 'credentials' && !user.isVerified) {
          throw new Error('Please verify your email before signing in');
        }
        
        // Check if password matches
        const isPasswordValid = await compare(credentials.password, user.password);
        
        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }
        
        debugLog(`User authenticated: ${user.email} with role: ${user.role}`);
        
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // For social logins
      if (account && account.provider !== 'credentials') {
        try {
          await dbConnect();
          
          // Check if user exists
          const existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            // Create a new user if they don't exist
            const newUser = await User.create({
              name: user.name,
              email: user.email,
              image: user.image, // Include image from social profile
              // Set a default role for social login users
              role: 'user',
              // Social providers don't need email verification
              isVerified: true,
              // Additional metadata about the provider they used
              provider: account.provider,
              providerId: account.providerAccountId,
            });
            
            // Update the user.id to be the MongoDB _id for the session
            user.id = newUser._id.toString();
            user.role = newUser.role;
            
            debugLog(`Created new social user: ${user.email} with role: ${user.role}`);
          } else {
            // Set the id for existing users
            user.id = existingUser._id.toString();
            user.role = existingUser.role;
            
            // If user doesn't have an image but the social profile does, update it
            if (!existingUser.image && user.image) {
              await User.findByIdAndUpdate(existingUser._id, {
                image: user.image
              });
              debugLog(`Updated existing user with social profile image: ${user.email}`);
            } else {
              // Ensure the session has the image from the database
              user.image = existingUser.image || user.image;
            }
            
            debugLog(`Existing social user login: ${user.email} with role: ${user.role}`);
          }
        } catch (error) {
          console.error('Error during social sign in:', error);
          return false;
        }
      }
      
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // When signing in
        token.id = user.id;
        token.role = user.role;
        token.isVerified = user.isVerified;
        token.isActive = user.isActive;
        
        // Make sure to include image if present
        if (user.image) {
          token.image = user.image;
        }
        
        debugLog(`JWT created for user: ${user.email}`, { 
          id: token.id, 
          role: token.role,
          image: token.image,
          roleType: typeof token.role
        });
      } else if (token.role === 'admin') {
        // For existing tokens, verify admin status on each request
        debugLog('Refreshing admin token data', { userId: token.id });
        
        try {
          await dbConnect();
          const adminUser = await User.findById(token.id);
          
          if (adminUser && adminUser.role === 'admin') {
            // Ensure role is correctly set in token
            token.role = 'admin';
            
            // Update image in token if it's changed in the database
            if (adminUser.image) {
              token.image = adminUser.image;
            }
            
            debugLog('Admin role confirmed');
          } else {
            // User is no longer admin
            token.role = 'user';
            debugLog('User no longer has admin role, downgraded token');
          }
        } catch (error) {
          console.error('Error refreshing admin token:', error);
        }
      } else if (token.role === 'judge') {
        // For existing tokens, verify judge status on each request
        debugLog('Refreshing judge token data', { userId: token.id });
        
        try {
          await dbConnect();
          const judgeUser = await User.findById(token.id);
          
          if (judgeUser && judgeUser.role === 'judge') {
            // Ensure role is correctly set in token
            token.role = 'judge';
            
            // Update image in token if it's changed in the database
            if (judgeUser.image) {
              token.image = judgeUser.image;
            }
            
            debugLog('Judge role confirmed');
          } else {
            // User is no longer judge
            token.role = 'user';
            debugLog('User no longer has judge role, downgraded token');
          }
        } catch (error) {
          console.error('Error refreshing judge token:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isVerified = token.isVerified as boolean;
        session.user.isActive = token.isActive as boolean;
        
        // Make sure to include image from token to session
        if (token.image) {
          session.user.image = token.image as string;
        }
        
        debugLog('Session created', { 
          user: session.user.email, 
          role: session.user.role,
          image: session.user.image
        });
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
};

// Utility function to check if user is in "View as User" mode
export const isViewingAsUser = (req?: Request): boolean => {
  if (typeof window !== 'undefined') {
    // Client-side: check URL params
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('viewAsUser') === 'true';
  } else if (req) {
    // Server-side: check request URL
    const url = new URL(req.url);
    return url.searchParams.get('viewAsUser') === 'true';
  }
  return false;
};

// Utility function to get effective user role (considers view as user mode)
export const getEffectiveUserRole = (user: any): string => {
  if (user.role === 'judge' && isViewingAsUser()) {
    return 'user';
  }
  return user.role;
}; 