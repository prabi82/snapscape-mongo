'use client';

import { useState, useEffect } from 'react';
import { signIn, getProviders } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authProviders, setAuthProviders] = useState<any>({});

  useEffect(() => {
    // Fetch available providers
    const fetchProviders = async () => {
      const providers = await getProviders();
      setAuthProviders(providers || {});
    };
    fetchProviders();
  }, []);

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
        setError(result.error);
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
            if (provider.id === 'credentials') return null;
            let icon = null;
            if (provider.id === 'google') {
              icon = (
                <svg className="w-7 h-7" viewBox="0 0 24 24"><path fill="#2699a6" d="M12 11v2.5h6.5c-.3 1.7-2 5-6.5 5-3.9 0-7-3.1-7-7s3.1-7 7-7c2.2 0 3.7.9 4.6 1.7l3.1-3.1C17.7 1.6 15.1 0 12 0 5.4 0 0 5.4 0 12s5.4 12 12 12c6.1 0 11-4.6 11-11 0-.7-.1-1.3-.2-1.9H12z"/></svg>
              );
            } else if (provider.id === 'facebook') {
              icon = (
                <svg className="w-7 h-7" viewBox="0 0 24 24"><path fill="#1a4d5c" d="M22.675 0h-21.35C.6 0 0 .6 0 1.326v21.348C0 23.4.6 24 1.326 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.4 24 24 23.4 24 22.674V1.326C24 .6 23.4 0 22.675 0"/></svg>
              );
            } else if (provider.id === 'apple') {
              icon = (
                <svg className="w-7 h-7" viewBox="0 0 24 24"><path fill="#e0c36a" d="M16.5 2c.02 0 2.5.4 2.5 3.33 0 1.72-1.13 3.22-2.5 3.22-.5 0-1.62-.17-2.5-1.67C14 9 16.25 9.5 16.5 12.67c0 1.92-.5 6.67-5 7.33-1-.03-1.5-.17-2-.33V20H8v-.33c-.5.17-1 .33-2 .33-4.5-.67-5-5.42-5-7.33C1.25 9.5 3.5 9 3.5 6.88c-.88 1.5-2 1.67-2.5 1.67C-.37 8.55-1.5 7.05-1.5 5.33-1.5 2.4 1 2 1 2c.74-.02 2 .5 3 2 .74.91 0 0 1 0 1 0 .27-.91 1 0 1-1.5 2.27-2.02 3-2ZM7 14.5c.75 0 1-.25 1.5-.5V17c-.5.5-.75.5-1.5.5-1 0-2-1-2-1.5s1-1.5 2-1.5Zm8.5 0c1 0 2 1 2 1.5s-1 1.5-2 1.5c-.75 0-1-.25-1.5-.5V14c.5.25.75.5 1.5.5Z"/></svg>
              );
            }
            return (
              <button
                key={provider.id}
                onClick={() => handleSocialLogin(provider.id)}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-[#e6f0f3] hover:bg-[#d1e6ed] shadow border border-[#e0c36a] transition"
                aria-label={`Sign in with ${provider.name}`}
                type="button"
              >
                {icon}
              </button>
            );
          })}
        </div>
        <div className="text-center w-full">
          <span className="text-[#1a4d5c]">Don't have an account? </span>
          <Link href="/auth/register" className="text-[#e0c36a] font-semibold hover:underline">Signup</Link>
        </div>
      </div>
    </div>
  );
}
