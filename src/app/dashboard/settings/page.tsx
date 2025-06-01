'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ExtendedSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    role?: string;
  };
}

export default function SettingsPage() {
  const { data: session, status } = useSession() as { data: ExtendedSession | null; status: string };
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f8fa] py-10 px-2 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/profile" className="text-[#1a4d5c] hover:text-[#2699a6] transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-[#1a4d5c]">Settings</h1>
          </div>
          <p className="text-gray-600">Manage your account preferences and notification settings</p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notifications Card */}
          <Link href="/dashboard/settings/notifications">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-[#e0c36a] hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#e6f0f3] rounded-full flex items-center justify-center group-hover:bg-[#d1e6ed] transition">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#1a4d5c]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#1a4d5c] group-hover:text-[#2699a6] transition">Notifications</h3>
                  <p className="text-gray-600 text-sm">Manage email notifications and alerts</p>
                </div>
              </div>
              <div className="text-gray-500 text-sm">
                Configure which notifications you want to receive via email
              </div>
              <div className="mt-4 flex items-center text-[#1a4d5c] group-hover:text-[#2699a6] transition">
                <span className="text-sm font-medium">Configure notifications</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Account Settings Card */}
          <Link href="/dashboard/edit-profile">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-[#e0c36a] hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#e6f0f3] rounded-full flex items-center justify-center group-hover:bg-[#d1e6ed] transition">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#1a4d5c]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#1a4d5c] group-hover:text-[#2699a6] transition">Profile</h3>
                  <p className="text-gray-600 text-sm">Edit your profile information</p>
                </div>
              </div>
              <div className="text-gray-500 text-sm">
                Update your name, bio, profile picture, and other details
              </div>
              <div className="mt-4 flex items-center text-[#1a4d5c] group-hover:text-[#2699a6] transition">
                <span className="text-sm font-medium">Edit profile</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Privacy & Security Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 opacity-60">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-400">Privacy & Security</h3>
                <p className="text-gray-400 text-sm">Manage your privacy settings</p>
              </div>
            </div>
            <div className="text-gray-400 text-sm">
              Control who can see your profile and submissions
            </div>
            <div className="mt-4 flex items-center text-gray-400">
              <span className="text-sm font-medium">Coming soon</span>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 opacity-60">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m0 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h3.75" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-400">Preferences</h3>
                <p className="text-gray-400 text-sm">Customize your experience</p>
              </div>
            </div>
            <div className="text-gray-400 text-sm">
              Set your language, theme, and display preferences
            </div>
            <div className="mt-4 flex items-center text-gray-400">
              <span className="text-sm font-medium">Coming soon</span>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border-2 border-[#e0c36a]">
          <h3 className="text-xl font-semibold text-[#1a4d5c] mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium text-[#1a4d5c]">{session.user.email}</span>
            </div>
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium text-[#1a4d5c]">{session.user.name || 'Not set'}</span>
            </div>
            <div>
              <span className="text-gray-600">User ID:</span>
              <span className="ml-2 font-mono text-xs text-gray-500">{session.user.id}</span>
            </div>
            <div>
              <span className="text-gray-600">Role:</span>
              <span className="ml-2 font-medium text-[#1a4d5c] capitalize">{session.user.role || 'User'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 