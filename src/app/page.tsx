'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [session, status, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gray-50">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">Welcome to SnapScape</h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl">
          A photography competition platform built with Next.js, MongoDB, and Tailwind CSS.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          {status === 'authenticated' ? (
            <>
              {session?.user?.role === 'admin' ? (
                <Link
                  href="/admin/dashboard"
                  className="px-8 py-3 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Go to Admin Dashboard
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="px-8 py-3 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Go to Dashboard
                </Link>
              )}
              <Link
                href="/dashboard/competitions"
                className="px-8 py-3 rounded-md bg-white text-indigo-600 font-medium border border-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                View Competitions
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-8 py-3 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-8 py-3 rounded-md bg-white text-indigo-600 font-medium border border-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-3">Submit Photos</h2>
            <p className="text-gray-600">Enter photography competitions and showcase your work to the community.</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-3">Vote on Photos</h2>
            <p className="text-gray-600">Rate and vote on photo submissions from other photographers.</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-3">Win Competitions</h2>
            <p className="text-gray-600">Gain recognition and earn badges for your photography skills.</p>
          </div>
        </div>
      </main>
      
      <footer className="w-full py-6 bg-gray-50 border-t border-gray-200">
        <div className="text-center text-gray-500">
          <p>Built with Next.js 15, MongoDB, and deployed on Vercel</p>
        </div>
      </footer>
    </div>
  );
}
