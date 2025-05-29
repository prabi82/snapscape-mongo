'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, getProviders, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ReCaptchaV3 from '@/components/ReCaptcha';

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
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRestrictedBrowser, setIsRestrictedBrowser] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Check for restricted user agents
    const userAgent = navigator.userAgent.toLowerCase();
    const isInApp = userAgent.includes('instagram') || 
                   userAgent.includes('fban') || 
                   userAgent.includes('fbav') || 
                   userAgent.includes('twitter') || 
                   userAgent.includes('linkedin') ||
                   userAgent.includes('wechat') ||
                   userAgent.includes('line');
    
    setIsRestrictedBrowser(isInApp);
    
    // Fetch auth providers
    getProviders().then((providers) => {
      setAuthProviders(providers || {});
    });
    
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
    
    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    // Validate reCAPTCHA
    if (!recaptchaToken) {
      setError('Unable to verify security challenge. Please try again.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // First verify the reCAPTCHA on the server
      const recaptchaResponse = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: recaptchaToken,
          action: 'login'
        }),
      });
      
      const recaptchaData = await recaptchaResponse.json();
      
      if (!recaptchaData.success) {
        setError('Security verification failed. Please try again.');
        return;
      }
      
      // Proceed with sign in
      const result = await signIn('credentials', {
        redirect: false,
        email: email.toLowerCase(),
        password,
        recaptchaToken,
      });
      
      if (result?.error) {
        // If the error is about email verification, show the verification modal
        if (result.error.includes('verify your email')) {
          setVerificationEmail(email.toLowerCase());
          setShowVerificationModal(true);
        } else {
          setError(result.error);
        }
        return;
      }
      
      // Get the session to check the user's role
      const session = await fetch('/api/auth/session');
      const sessionData = await session.json();
      
      // Check if user is admin and redirect accordingly
      if (sessionData?.user?.role === 'admin') {
        // Redirect admin users to admin dashboard
        console.log('Admin user detected, redirecting to admin dashboard');
        router.push('/admin/dashboard');
      } else {
        // Redirect regular users to user dashboard
        router.push('/dashboard');
      }
      
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecaptchaVerify = (token: string) => {
    setRecaptchaToken(token);
  };

  const handleSocialLogin = (providerId: string) => {
    // Use state callback URL based on role - the actual check will happen in middleware
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
        body: JSON.stringify({ email: verificationEmail.toLowerCase() }),
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
      {/* Invisible reCAPTCHA v3 */}
      <ReCaptchaV3
        siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LegLkMrAAAAAOSRdKTQ33Oa6UT4EzOvqdhsSpM3"}
        action="login"
        onVerify={handleRecaptchaVerify}
      />
      
      <div className="w-full max-w-md p-6 bg-white rounded-3xl shadow-2xl flex flex-col items-center border border-[#e0c36a]">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="SnapScape Logo" width={160} height={160} className="mb-3" />
        </div>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#1a4d5c] mb-2">Hello!</h2>
          <p className="text-[#1a4d5c] mb-6">Login using your email/phone</p>
        </div>
        
        {/* Google Login Button - Moved to top */}
        <div className="w-full mb-6">
          {Object.values(authProviders).map((provider: any) => {
            if (provider.id === 'google') {
              return (
                <button
                  key={provider.id}
                  onClick={() => handleSocialLogin(provider.id)}
                  className="flex items-center justify-center w-full py-3 px-4 rounded-lg bg-white hover:bg-gray-50 shadow-md border-2 border-gray-300 hover:border-gray-400 transition-all duration-200"
                  aria-label={`Sign in with ${provider.name}`}
                  type="button"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-gray-700 font-medium text-base">Login with Google</span>
                </button>
              );
            }
            return null;
          })}
        </div>
        
        <div className="flex items-center w-full mb-6">
          <div className="flex-grow border-t border-[#e0c36a]"></div>
          <span className="mx-4 text-[#1a4d5c] font-medium">or</span>
          <div className="flex-grow border-t border-[#e0c36a]"></div>
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

        {successMessage && (
          <div className="p-3 mb-4 bg-green-100 border border-green-400 text-green-700 rounded w-full text-center text-sm">
            {successMessage}
          </div>
        )}

        {/* Warning for restricted browsers */}
        {isRestrictedBrowser && (
          <div className="p-4 mb-4 bg-yellow-50 border border-yellow-400 text-yellow-800 rounded w-full text-sm">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Browser Compatibility Notice</p>
                <p className="mt-1">For the best experience with Google Sign-In, please open this page in your default browser (Chrome, Safari, Firefox) instead of this app's built-in browser.</p>
                <p className="mt-2 text-xs">
                  <strong>How to open in browser:</strong> Tap the menu (⋯) and select "Open in Browser" or copy this URL to your browser.
                </p>
              </div>
            </div>
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
            className="block w-full px-4 py-3 border border-[#1a4d5c] rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4d5c] focus:border-[#1a4d5c] text-[#1a4d5c] text-base"
          />
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="block w-full px-4 py-3 pr-12 border border-[#1a4d5c] rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4d5c] focus:border-[#1a4d5c] text-[#1a4d5c] text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#1a4d5c] hover:text-[#2699a6] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          
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
        <div className="text-center w-full space-y-2 mt-4">
          <div>
            <span className="text-[#1a4d5c]">Don't have an account? </span>
            <Link href="/auth/register" className="text-[#e0c36a] font-semibold hover:underline">Signup</Link>
          </div>
          <div>
            <Link href="/about" className="text-[#1a4d5c] hover:text-[#2699a6] transition-colors text-sm">
              Learn more about SnapScape
            </Link>
          </div>
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
