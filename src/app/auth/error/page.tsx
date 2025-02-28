'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Create a separate component that uses useSearchParams
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  let errorTitle = 'Authentication Error';
  let errorMessage = 'An unexpected error occurred during authentication. Please try again.';

  // Map common NextAuth error codes to user-friendly messages
  if (error) {
    switch (error) {
      case 'CredentialsSignin':
        errorTitle = 'Invalid Credentials';
        errorMessage = 'The email or password you entered is incorrect. Please try again.';
        break;
      case 'EmailSignin':
        errorTitle = 'Email Error';
        errorMessage = 'The email could not be sent. Please try again later.';
        break;
      case 'OAuthSignin':
        errorTitle = 'OAuth Error';
        errorMessage = 'Could not sign in with the selected provider. Please try again.';
        break;
      case 'OAuthCallback':
        errorTitle = 'OAuth Callback Error';
        errorMessage = 'Could not complete the OAuth sign-in process. Please try again.';
        break;
      case 'OAuthCreateAccount':
        errorTitle = 'Account Creation Error';
        errorMessage = 'Could not create an account with the provided OAuth credentials.';
        break;
      case 'EmailCreateAccount':
        errorTitle = 'Account Creation Error';
        errorMessage = 'Could not create an account with the provided email.';
        break;
      case 'Callback':
        errorTitle = 'Callback Error';
        errorMessage = 'An error occurred during the authentication callback.';
        break;
      case 'OAuthAccountNotLinked':
        errorTitle = 'Account Not Linked';
        errorMessage = 'To confirm your identity, sign in with the same account you used originally.';
        break;
      case 'SessionRequired':
        errorTitle = 'Session Required';
        errorMessage = 'You must be signed in to access this page.';
        break;
      case 'AccessDenied':
        errorTitle = 'Access Denied';
        errorMessage = 'You do not have permission to access this resource.';
        break;
      default:
        // Keep default error title and message
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="border border-red-200 rounded-lg p-8 bg-white shadow-md">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{errorTitle}</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/auth/login"
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm text-gray-500">
            Need help? <a href="mailto:support@example.com" className="text-blue-600 hover:underline">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading error details...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
} 