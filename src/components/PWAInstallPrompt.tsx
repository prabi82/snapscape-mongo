'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, EyeOff } from 'lucide-react';

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
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);

    // Simple and reliable installation detection
    const checkIfHidden = () => {
      // Check if user manually hid the install prompts
      const isManuallyHidden = localStorage.getItem('snapscape-install-hidden') === 'true';
      
      // Check if running in standalone mode (actually launched from PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Check if iOS PWA
      const isIOSPWA = (window.navigator as any).standalone === true;
      
      console.log('🔍 PWA Detection:', {
        manuallyHidden: isManuallyHidden,
        standalone: isStandalone,
        iosPWA: isIOSPWA
      });
      
      return isManuallyHidden || isStandalone || isIOSPWA;
    };

    // Hide prompts if already installed or manually hidden
    if (checkIfHidden()) {
      setIsInstalled(true);
      console.log('✅ Install prompts hidden (app installed or user choice)');
      return;
    }

    console.log('📱 Showing install options for mobile device');

    // Handle native browser install prompt
    const handler = (e: Event) => {
      console.log('📥 Native install prompt available');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      setTimeout(() => {
        setShowBanner(true);
      }, 1000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For mobile devices, show custom banner
    if (isMobileDevice) {
      const lastDismissed = localStorage.getItem('pwa-banner-dismissed');
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (!lastDismissed || (now - parseInt(lastDismissed)) > dayInMs) {
        setTimeout(() => {
          setShowCustomBanner(true);
          console.log('📱 Showing custom install banner');
        }, 5000);
      }
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('🎉 App installed successfully!');
      hideAllPrompts();
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const hideAllPrompts = () => {
    setIsInstalled(true);
    setShowBanner(false);
    setShowCustomBanner(false);
    setDeferredPrompt(null);
    setIsInstallable(false);
    localStorage.setItem('snapscape-install-hidden', 'true');
    console.log('🚫 All install prompts hidden');
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        console.log('🚀 Starting installation...');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('✅ Installation accepted');
          hideAllPrompts();
        } else {
          console.log('❌ Installation declined');
        }
      } catch (error) {
        console.error('💥 Installation error:', error);
      }
    } else {
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    let instructions = '';
    if (isAndroid) {
      instructions = 'Tap the menu (⋮) in Chrome, then select "Add to Home screen"';
    } else if (isIOS) {
      instructions = 'Tap the Share button (⤴) in Safari, then select "Add to Home Screen"';
    } else {
      instructions = 'Look for the install icon in your browser\'s address bar';
    }
    
    setTimeout(() => {
      if (confirm(`${instructions}\n\nAfter installing, click OK to hide these prompts.`)) {
        hideAllPrompts();
      }
    }, 100);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowCustomBanner(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
    console.log('⏰ Banner dismissed for 24 hours');
  };

  const handleDontShowAgain = () => {
    hideAllPrompts();
  };

  // Don't show anything if hidden
  if (isInstalled) {
    return null;
  }

  // Install button for dashboard
  const InstallButton = () => {
    if (!showButton || !isInstallable) return null;
    
    return (
      <button
        onClick={handleInstall}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${buttonClass}`}
      >
        <Download size={iconSize} />
        {showText && <span className="font-medium">Install App</span>}
      </button>
    );
  };

  // Native install banner
  const NativeInstallBanner = () => {
    if (!showBanner || !isInstallable) return null;
    
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 shadow-lg z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Download size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm">Install SnapScape</p>
              <p className="text-xs text-blue-100">Get the app experience</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Install
            </button>
            <button onClick={handleDismiss} className="p-2 hover:bg-white/10 rounded-lg">
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Custom install banner with "Don't show again" option
  const CustomInstallBanner = () => {
    if (!showCustomBanner || !isMobile) return null;
    
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Smartphone size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm">📱 Get SnapScape App</p>
              <p className="text-xs text-blue-100">Install for better experience</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleInstall}
              className="bg-white text-purple-600 px-3 py-2 rounded-lg text-sm font-bold"
            >
              Install
            </button>
            <button
              onClick={handleDontShowAgain}
              className="p-2 hover:bg-white/10 rounded-lg"
              title="Don't show again"
            >
              <EyeOff size={16} />
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/10 rounded-lg"
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