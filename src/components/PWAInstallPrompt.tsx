'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

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
  const [isMobile, setIsMobile] = useState(false);
  const [showCustomBanner, setShowCustomBanner] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      return isMobileDevice || isSmallScreen;
    };
    
    setIsMobile(checkMobile());

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isAndroidInstalled = document.referrer.includes('android-app://');
    
    if (isStandalone || isInWebAppiOS || isAndroidInstalled) {
      setIsInstalled(true);
      return;
    }

    // Handle beforeinstallprompt event (Chrome's native prompt)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      // Show install banner immediately when we get the native prompt
      setTimeout(() => {
        setShowBanner(true);
      }, 1000);
    };

    // Listen for the event
    window.addEventListener('beforeinstallprompt', handler);

    // Check if deferredPrompt is already available (from layout script)
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
      setIsInstallable(true);
    }

    // For mobile devices, show custom install banner even without native prompt
    if (checkMobile()) {
      // Check if user has dismissed the banner recently
      const lastDismissed = localStorage.getItem('pwa-banner-dismissed');
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (!lastDismissed || (now - parseInt(lastDismissed)) > dayInMs) {
        // Show custom banner after user has spent some time on the site
        setTimeout(() => {
          setShowCustomBanner(true);
        }, 5000); // Show after 5 seconds
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Use native Chrome install prompt
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('PWA installation accepted');
          setDeferredPrompt(null);
          setIsInstallable(false);
          setShowBanner(false);
          setShowCustomBanner(false);
          setIsInstalled(true);
        } else {
          console.log('PWA installation dismissed');
        }
      } catch (error) {
        console.error('PWA installation error:', error);
      }
    } else {
      // Fallback: Show instructions for manual installation
      showManualInstallInstructions();
    }
  };

  const showManualInstallInstructions = () => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    let instructions = '';
    if (isAndroid) {
      instructions = 'Tap the menu (⋮) in Chrome, then select "Add to Home screen" or "Install app"';
    } else if (isIOS) {
      instructions = 'Tap the Share button (⤴) in Safari, then select "Add to Home Screen"';
    } else {
      instructions = 'Look for the install icon in your browser\'s address bar or check the browser menu';
    }
    
    alert(`Install SnapScape as an app:\n\n${instructions}`);
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    setShowCustomBanner(false);
    // Remember dismissal for 24 hours
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isInstalled) {
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

  // Native installation banner (when Chrome provides beforeinstallprompt)
  const NativeInstallBanner = () => {
    if (!showBanner || !isInstallable) return null;
    
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

  // Custom installation banner (for mobile devices without native prompt)
  const CustomInstallBanner = () => {
    if (!showCustomBanner || !isMobile) return null;
    
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg z-50 transform transition-transform duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Smartphone size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm">📱 Get SnapScape App</p>
              <p className="text-xs text-blue-100">
                Install for better experience & offline access
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-50 transition-colors"
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
      <NativeInstallBanner />
      <CustomInstallBanner />
    </>
  );
} 