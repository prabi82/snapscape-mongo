'use client';

import { useState, useEffect } from 'react';
import { Camera, Trophy, Star, Download, Menu, X } from 'lucide-react';

// Define the BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Home() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">SnapScape</span>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Desktop navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Features
              </a>
              <a href="#competitions" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Competitions
              </a>
              <a href="#about" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                About
              </a>
            </nav>
          </div>

          {/* Mobile navigation menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
                <a href="#features" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-900">
                  Features
                </a>
                <a href="#competitions" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-900">
                  Competitions
                </a>
                <a href="#about" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-900">
                  About
                </a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Capture. Compete. 
            <span className="text-blue-600"> Conquer.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join the ultimate photography competition platform. Showcase your talent, 
            vote on amazing photos, and compete with photographers worldwide.
          </p>

          {/* Install App Button */}
          {isInstallable && (
            <div className="mb-8">
              <button
                onClick={handleInstall}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Download className="h-5 w-5 mr-2" />
                Install App
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <Camera className="h-5 w-5 mr-2" />
              Start Competing
            </button>
            <button className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <Trophy className="h-5 w-5 mr-2" />
              View Competitions
            </button>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose SnapScape?</h2>
            <p className="text-lg text-gray-600">Everything you need for photography competitions in one mobile app</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Submissions</h3>
              <p className="text-gray-600">
                Submit your photos directly from your mobile device with our intuitive interface.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fair Voting</h3>
              <p className="text-gray-600">
                Rate and vote on submissions with our transparent scoring system.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Win Prizes</h3>
              <p className="text-gray-600">
                Compete for amazing prizes and recognition in our photography community.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Join Our Growing Community</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
                <div className="text-gray-600">Active Photographers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
                <div className="text-gray-600">Competitions Hosted</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">50K+</div>
                <div className="text-gray-600">Photos Submitted</div>
              </div>
            </div>
          </div>
        </section>

        {/* PWA Features */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Mobile-First Experience</h2>
            <p className="text-lg text-gray-600">Designed specifically for mobile photographers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">📱 Install Like a Native App</h3>
              <p className="text-gray-600">
                Add SnapScape to your home screen for quick access. Works offline and loads instantly.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">🔔 Push Notifications</h3>
              <p className="text-gray-600">
                Get notified about new competitions, voting deadlines, and results.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">⚡ Lightning Fast</h3>
              <p className="text-gray-600">
                Optimized for mobile with smart caching and instant loading.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">🌐 Works Everywhere</h3>
              <p className="text-gray-600">
                Compatible with iOS, Android, and desktop browsers.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Camera className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold">SnapScape Mobile</span>
            </div>
            <p className="text-gray-400 mb-4">
              The ultimate mobile photography competition platform
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
