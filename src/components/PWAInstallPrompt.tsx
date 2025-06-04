'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  showText?: boolean;
  buttonClass?: string;
  iconSize?: number;
}

export default function PWAInstallPrompt({ 
  showText = true, 
  buttonClass = "",
  iconSize = 20 
}: PWAInstallPromptProps) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isAndroidInstalled = document.referrer.includes('android-app://');
    
    if (isStandalone || isInWebAppiOS || isAndroidInstalled) {
      setIsInstalled(true);
      return;
    }

    // Handle beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      // Show install banner after a delay (for better UX)
      setTimeout(() => {
        setShowBanner(true);
      }, 3000);
    };

    // Listen for the event
    window.addEventListener('beforeinstallprompt', handler);

    // Check if deferredPrompt is already available (from layout script)
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
      setIsInstallable(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
        setDeferredPrompt(null);
        setIsInstallable(false);
        setShowBanner(false);
        setIsInstalled(true);
      } else {
        console.log('PWA installation dismissed');
      }
    } catch (error) {
      console.error('PWA installation error:', error);
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    // Don't show banner again for this session
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
  };

  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable) {
    return null;
  }

  // Install button component
  const InstallButton = () => (
    <button
      onClick={handleInstall}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${buttonClass}`}
      aria-label="Install SnapScape as an app"
    >
      <Download size={iconSize} />
      {showText && (
        <span className="font-medium">
          Install App
        </span>
      )}
    </button>
  );

  // Installation banner for mobile
  const InstallBanner = () => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem('pwa-banner-dismissed') === 'true') {
      return null;
    }

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 shadow-lg z-50 transform transition-transform duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Download size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm">Install SnapScape</p>
              <p className="text-xs text-blue-100">
                Get the app experience with offline access
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismissBanner}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <InstallButton />
      {showBanner && <InstallBanner />}
    </>
  );
} 