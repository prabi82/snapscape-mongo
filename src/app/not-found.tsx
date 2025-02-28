import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="border border-gray-200 rounded-lg p-8 bg-white shadow-md">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg
              className="h-6 w-6 text-blue-600"
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">404 - Page Not Found</h2>
          <p className="text-gray-600 mb-6">
            Oops! The page you are looking for doesn't exist or has been moved.
          </p>
          <div className="flex justify-center">
            <Link
              href="/"
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Back Home
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