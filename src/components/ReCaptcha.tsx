'use client';

import { useEffect, useState } from 'react';

// Define props for the component
interface ReCaptchaProps {
  siteKey: string;
  action: string;
  onVerify: (token: string) => void;
}

export default function ReCaptchaV3({
  siteKey,
  action,
  onVerify
}: ReCaptchaProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Log props for debugging
  useEffect(() => {
    console.log('ReCaptcha component initialized with:', { siteKey, action });
    console.log('NEXT_PUBLIC_RECAPTCHA_SITE_KEY:', process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
  }, [siteKey, action]);

  // Load reCAPTCHA script
  useEffect(() => {
    // Check if script is already loaded
    if (document.querySelector(`script[src*="recaptcha/api.js"]`)) {
      console.log('reCAPTCHA script already loaded');
      setScriptLoaded(true);
      return;
    }

    // Only load if not already loaded
    console.log('Loading reCAPTCHA script...');
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('reCAPTCHA script loaded successfully');
      setScriptLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('Error loading reCAPTCHA script:', error);
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
      if (document.querySelector(`script[src*="recaptcha/api.js"]`) && !window.location.pathname.includes('/auth')) {
        console.log('Cleaning up reCAPTCHA script');
        document.head.removeChild(script);
      }
    };
  }, [siteKey]);

  // Execute reCAPTCHA when the script is loaded
  useEffect(() => {
    if (!scriptLoaded || !siteKey) {
      console.log('Script not loaded or no site key, skipping execution');
      return;
    }

    const executeRecaptcha = () => {
      console.log('Attempting to execute reCAPTCHA...');
      if (window.grecaptcha && window.grecaptcha.ready) {
        try {
          console.log('grecaptcha is ready, executing with action:', action);
          window.grecaptcha.ready(() => {
            window.grecaptcha
              .execute(siteKey, { action })
              .then(token => {
                console.log('reCAPTCHA token obtained successfully');
                onVerify(token);
              })
              .catch(error => {
                console.error('reCAPTCHA execution error:', error);
              });
          });
        } catch (error) {
          console.error('Error executing reCAPTCHA:', error);
        }
      } else {
        // If grecaptcha isn't properly initialized, try again after a short delay
        console.log('grecaptcha not ready, retrying in 1 second');
        setTimeout(executeRecaptcha, 1000);
      }
    };

    // Initial execution
    executeRecaptcha();

    // Re-execute every 2 minutes to get a fresh token
    const intervalId = setInterval(executeRecaptcha, 120000);

    return () => {
      clearInterval(intervalId);
    };
  }, [scriptLoaded, siteKey, action, onVerify]);

  // No visible UI for v3
  return null;
}

// Type declaration for global window object
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
} 