import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      image?: string | null; // Ensure image is here and optional
      username?: string | null; // Added username
    } & DefaultSession["user"]; // Extends default user properties (name, email)
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends DefaultUser {
    // Add your own properties here, like id and role from your database model
    id: string;
    role: string;
    image?: string | null; // Ensure image is here and optional
    username?: string | null; // Added username
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    image?: string | null; // Ensure image is here and optional
    username?: string | null; // Added username
  }
} 