'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect to appropriate dashboard if already logged in
    if (status === 'authenticated') {
      if (session?.user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [session, status, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-blue-700 mb-6">
          Welcome to SnapScape
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          A simple application with user and admin authentication, built with Next.js 15 and MongoDB.
        </p>

        {status === 'loading' ? (
          <div className="animate-pulse bg-blue-200 w-32 h-10 rounded-md mx-auto"></div>
        ) : status === 'unauthenticated' ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/auth/login" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-md transition-colors duration-300 w-full sm:w-auto text-center"
              >
                Login
              </Link>
              <Link 
                href="/auth/register" 
                className="bg-white hover:bg-gray-100 text-blue-600 font-medium px-6 py-3 rounded-md border border-blue-300 transition-colors duration-300 w-full sm:w-auto text-center"
              >
                Register
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-8">
              Admin or first-time user? <Link href="/auth/admin" className="text-blue-600 hover:underline">Admin Setup</Link>
            </p>
          </div>
        ) : null}

        <div className="mt-20 border-t border-gray-200 pt-8">
          <p className="text-gray-500 text-sm">
            Built with Next.js 15, MongoDB, and deployed on Vercel
          </p>
        </div>
      </div>
    </main>
  );
}
