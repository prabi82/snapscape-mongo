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
        
        debugLog(`JWT created for user: ${user.email}`, { 
          id: token.id, 
          role: token.role,
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
            debugLog('Admin role confirmed');
          } else {
            // User is no longer admin
            token.role = 'user';
            debugLog('User no longer has admin role, downgraded token');
          }
        } catch (error) {
          console.error('Error refreshing admin token:', error);
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
        
        debugLog('Session created', { 
          user: session.user.email, 
          role: session.user.role 
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
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
}; 