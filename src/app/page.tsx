'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, getProviders, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Component that uses useSearchParams
function HomeWithSearchParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refresh = searchParams?.get('refresh');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authProviders, setAuthProviders] = useState<any>({});
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');

  useEffect(() => {
    // Fetch available providers
    const fetchProviders = async () => {
      const providers = await getProviders();
      setAuthProviders(providers || {});
    };
    fetchProviders();
    
    // Check if we need to refresh the session
    if (refresh === 'true') {
      setSessionMessage('Your session has been reset. Please login again.');
      
      // Clear the URL parameter without page refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('refresh');
      window.history.replaceState({}, '', url);
    }
  }, [refresh]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      if (result?.error) {
        // If the error is about email verification, show the verification modal
        if (result.error.includes('verify your email')) {
          setVerificationEmail(email);
          setShowVerificationModal(true);
        } else {
          setError(result.error);
        }
        return;
      }
      // Redirect to dashboard on successful login
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (providerId: string) => {
    signIn(providerId, { callbackUrl: '/dashboard' });
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) {
      setResendStatus('error');
      setResendMessage('Email is required');
      return;
    }

    try {
      setResendStatus('loading');
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: verificationEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendStatus('success');
        setResendMessage(data.message);
      } else {
        setResendStatus('error');
        setResendMessage(data.message || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setResendStatus('error');
      setResendMessage('An error occurred. Please try again.');
    }
  };

  const closeVerificationModal = () => {
    setShowVerificationModal(false);
    setResendStatus('idle');
    setResendMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-[#e6f0f3] to-[#1a4d5c]">
      <div className="w-full max-w-md p-6 bg-white rounded-3xl shadow-2xl flex flex-col items-center border border-[#e0c36a]">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="SnapScape Logo" width={160} height={160} className="mb-3" />
        </div>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#1a4d5c] mb-2">Hello!</h2>
          <p className="text-[#1a4d5c] mb-6">Login using your email/phone</p>
        </div>
        
        {sessionMessage && (
          <div className="p-3 mb-2 bg-blue-50 border border-blue-300 text-blue-700 rounded w-full text-center text-sm">
            {sessionMessage}
          </div>
        )}
        
        {error && (
          <div className="p-3 mb-2 bg-[#fffbe6] border border-[#e0c36a] text-[#bfa100] rounded w-full text-center text-sm">
            {error}
          </div>
        )}
        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          <input
            id="email"
            name="email"
            type="text"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email/Phone"
            className="block w-full px-4 py-3 border border-[#1a4d5c] rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4d5c] focus:border-[#1a4d5c] text-base"
          />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="block w-full px-4 py-3 border border-[#1a4d5c] rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4d5c] focus:border-[#1a4d5c] text-base"
          />
          <div className="flex justify-end w-full">
            <Link href="/auth/reset-password" className="text-sm text-[#e0c36a] hover:underline">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold text-lg shadow-md hover:from-[#2699a6] hover:to-[#1a4d5c] transition disabled:opacity-60 border-2 border-[#e0c36a]"
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <div className="flex items-center w-full my-6">
          <div className="flex-grow border-t border-[#e0c36a]"></div>
          <span className="mx-4 text-[#1a4d5c] font-medium">or</span>
          <div className="flex-grow border-t border-[#e0c36a]"></div>
        </div>
        <div className="flex justify-center gap-6 w-full mb-4">
          {Object.values(authProviders).map((provider: any) => {
            if (provider.id === 'credentials' || provider.id === 'facebook' || provider.id === 'apple') return null;
            
            if (provider.id === 'google') {
              return (
                <button
                  key={provider.id}
                  onClick={() => handleSocialLogin(provider.id)}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-[#e6f0f3] hover:bg-[#d1e6ed] shadow border border-[#e0c36a] transition"
                  aria-label={`Sign in with ${provider.name}`}
                  type="button"
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
                    <path fill="#2699a6" d="M12 11v2.5h6.5c-.3 1.7-2 5-6.5 5-3.9 0-7-3.1-7-7s3.1-7 7-7c2.2 0 3.7.9 4.6 1.7l3.1-3.1C17.7 1.6 15.1 0 12 0 5.4 0 0 5.4 0 12s5.4 12 12 12c6.1 0 11-4.6 11-11 0-.7-.1-1.3-.2-1.9H12z"/>
                  </svg>
                </button>
              );
            }
            return null;
          })}
        </div>
        <div className="text-center w-full">
          <span className="text-[#1a4d5c]">Don't have an account? </span>
          <Link href="/auth/register" className="text-[#e0c36a] font-semibold hover:underline">Signup</Link>
        </div>
        
        {/* Email Verification Modal */}
        {showVerificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
              <button
                onClick={closeVerificationModal}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h3 className="text-xl font-semibold text-[#1a4d5c] mb-4 text-center">Email Verification Required</h3>
              
              <p className="text-[#1a4d5c] mb-4">
                Your email address needs to be verified before you can sign in. Please check your inbox for the verification email.
              </p>
              
              <p className="text-[#1a4d5c] mb-6">
                If you didn't receive the email or it expired, you can resend it to: <span className="font-semibold">{verificationEmail}</span>
              </p>
              
              {resendStatus === 'idle' && (
                <button
                  onClick={handleResendVerification}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold text-lg shadow-md hover:from-[#2699a6] hover:to-[#1a4d5c] transition border-2 border-[#e0c36a]"
                >
                  Resend Verification Email
                </button>
              )}
              
              {resendStatus === 'loading' && (
                <div className="flex justify-center my-4">
                  <div className="w-8 h-8 border-4 border-[#2699a6] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              {resendStatus === 'success' && (
                <div className="text-green-600 p-3 bg-green-100 rounded-lg mb-4 text-center">
                  {resendMessage}
                </div>
              )}
              
              {resendStatus === 'error' && (
                <div className="text-red-600 p-3 bg-red-100 rounded-lg mb-4 text-center">
                  {resendMessage}
                </div>
              )}
              
              <div className="flex justify-between mt-4">
                <button
                  onClick={closeVerificationModal}
                  className="py-2 px-4 rounded-lg bg-gray-200 text-[#1a4d5c] font-semibold hover:bg-gray-300 transition"
                >
                  Close
                </button>
                <Link href="/auth/register" className="py-2 px-4 rounded-lg bg-[#e6f0f3] text-[#1a4d5c] font-semibold hover:bg-[#d1e6ed] transition">
                  Register with a Different Email
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fallback for suspense
function HomeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-[#e6f0f3] to-[#1a4d5c]">
      <div className="w-full max-w-md p-6 bg-white rounded-3xl shadow-2xl flex flex-col items-center border border-[#e0c36a]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-[#2699a6] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#1a4d5c]">Loading...</p>
        </div>
      </div>
    </div>
  );
}

// Main component wrapped with Suspense
export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeWithSearchParams />
    </Suspense>
  );
}
