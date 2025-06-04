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
  showButton?: boolean;
}

export default function PWAInstallPrompt({ 
  showText = true, 
  buttonClass = "",
  iconSize = 20,
  showButton = false
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

    // Enhanced detection for already installed PWA
    const checkIfAppInstalled = () => {
      console.log('🔍 Checking if SnapScape PWA is installed...');
      
      // Method 1: Check if running in standalone mode (PWA is launched from home screen)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      console.log('📱 Standalone mode:', isStandalone);
      
      // Method 2: iOS Safari specific check
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      console.log('🍎 iOS PWA mode:', isInWebAppiOS);
      
      // Method 3: Android app referrer check
      const isAndroidInstalled = document.referrer.includes('android-app://');
      console.log('🤖 Android app referrer:', isAndroidInstalled);
      
      // Method 4: Check if launched from installed PWA (Chrome/Edge)
      const isLaunchedFromPWA = window.location.search.includes('source=pwa') || 
                                window.location.search.includes('utm_source=homescreen');
      console.log('🚀 Launched from PWA:', isLaunchedFromPWA);
      
      // Method 5: Check if the page was opened via app protocol
      const isAppProtocol = window.location.protocol === 'app:';
      console.log('🔗 App protocol:', isAppProtocol);
      
      // Method 6: Additional check for standalone display mode via CSS media query
      const isStandaloneCSS = window.matchMedia('(display-mode: standalone)').matches ||
                              window.matchMedia('(display-mode: fullscreen)').matches ||
                              window.matchMedia('(display-mode: minimal-ui)').matches;
      console.log('🎨 Standalone CSS:', isStandaloneCSS);
      
      // Method 7: Check localStorage for previous installation
      const wasInstalled = localStorage.getItem('snapscape-pwa-installed') === 'true';
      console.log('💾 LocalStorage installed:', wasInstalled);
      
      // Method 8: Check if PWA is in the list of installed apps (when available)
      const checkInstalledApps = async () => {
        if ('getInstalledRelatedApps' in navigator) {
          try {
            const relatedApps = await (navigator as any).getInstalledRelatedApps();
            const isInInstalledApps = relatedApps.length > 0;
            console.log('📱 Related apps check:', isInInstalledApps);
            return isInInstalledApps;
          } catch (error) {
            console.log('❌ Related apps check failed:', error);
            return false;
          }
        }
        return false;
      };
      
      // Method 9: Check display mode from window
      const currentDisplayMode = window.matchMedia('(display-mode: standalone)').matches ? 'standalone' :
                                 window.matchMedia('(display-mode: fullscreen)').matches ? 'fullscreen' :
                                 window.matchMedia('(display-mode: minimal-ui)').matches ? 'minimal-ui' : 'browser';
      console.log('🖥️ Current display mode:', currentDisplayMode);
      
      const isInstalled = isStandalone || isInWebAppiOS || isAndroidInstalled || 
                         isLaunchedFromPWA || isAppProtocol || isStandaloneCSS || wasInstalled;
      
      console.log('✅ Final installation status:', isInstalled);
      
      return isInstalled;
    };

    // Check if app is already installed
    if (checkIfAppInstalled()) {
      setIsInstalled(true);
      console.log('🎉 SnapScape PWA is already installed - hiding install prompts');
      return;
    }

    console.log('📋 SnapScape PWA not detected as installed - showing install options');

    // Handle beforeinstallprompt event (Chrome's native prompt)
    const handler = (e: Event) => {
      console.log('📥 beforeinstallprompt event received');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      // Show install banner immediately when we get the native prompt
      setTimeout(() => {
        setShowBanner(true);
        console.log('🔔 Showing native install banner');
      }, 1000);
    };

    // Listen for the event
    window.addEventListener('beforeinstallprompt', handler);

    // Check if deferredPrompt is already available (from layout script)
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
      setIsInstallable(true);
      console.log('📌 Found existing deferredPrompt');
    }

    // For mobile devices, show custom install banner even without native prompt
    if (checkMobile() && !checkIfAppInstalled()) {
      // Check if user has dismissed the banner recently
      const lastDismissed = localStorage.getItem('pwa-banner-dismissed');
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (!lastDismissed || (now - parseInt(lastDismissed)) > dayInMs) {
        // Show custom banner after user has spent some time on the site
        setTimeout(() => {
          setShowCustomBanner(true);
          console.log('📱 Showing custom mobile install banner');
        }, 5000); // Show after 5 seconds
      } else {
        console.log('🚫 Install banner recently dismissed, not showing');
      }
    }

    // Listen for app installation event to update state
    const handleAppInstalled = () => {
      console.log('🎊 SnapScape PWA was just installed!');
      setIsInstalled(true);
      setShowBanner(false);
      setShowCustomBanner(false);
      setDeferredPrompt(null);
      setIsInstallable(false);
      
      // Store installation status
      localStorage.setItem('snapscape-pwa-installed', 'true');
      console.log('💾 Stored installation status in localStorage');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Use native Chrome install prompt
      try {
        console.log('🚀 Starting PWA installation process...');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('✅ PWA installation accepted by user');
          setDeferredPrompt(null);
          setIsInstallable(false);
          setShowBanner(false);
          setShowCustomBanner(false);
          setIsInstalled(true);
          
          // Store installation status
          localStorage.setItem('snapscape-pwa-installed', 'true');
          console.log('💾 Marked app as installed in localStorage');
          
          // Show success message
          alert('🎉 SnapScape has been installed! You can now access it from your home screen.');
        } else {
          console.log('❌ PWA installation dismissed by user');
        }
      } catch (error) {
        console.error('💥 PWA installation error:', error);
      }
    } else {
      // Fallback: Show instructions for manual installation
      console.log('📖 Showing manual installation instructions');
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
    
    // After showing instructions, assume they might install it manually
    setTimeout(() => {
      if (confirm(`Install SnapScape as an app:\n\n${instructions}\n\nDid you successfully install the app?`)) {
        // User confirmed they installed it manually
        localStorage.setItem('snapscape-pwa-installed', 'true');
        setIsInstalled(true);
        setShowBanner(false);
        setShowCustomBanner(false);
        console.log('✅ User confirmed manual installation');
      }
    }, 100);
  };

  const handleDismissBanner = () => {
    console.log('🚫 User dismissed install banner');
    setShowBanner(false);
    setShowCustomBanner(false);
    // Remember dismissal for 24 hours
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  // Debug function to reset installation status (for testing)
  const resetInstallationStatus = () => {
    localStorage.removeItem('snapscape-pwa-installed');
    localStorage.removeItem('pwa-banner-dismissed');
    setIsInstalled(false);
    console.log('🔄 Reset installation status for testing');
  };

  // Add keyboard shortcut for testing (Ctrl+Shift+R)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        resetInstallationStatus();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Install button component (only for dashboard navigation)
  const InstallButton = () => {
    if (!showButton || !isInstallable) return null;
    
    return (
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
  };

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
      <NativeInstallBanner />
      <CustomInstallBanner />
      <InstallButton />
    </>
  );
} 