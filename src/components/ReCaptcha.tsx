'use client';

import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';

// Define props for the component
interface ReCaptchaProps {
  siteKey: string;
  action: string;
  onVerify: (token: string) => void;
}

// Define ref methods
export interface ReCaptchaRef {
  refreshToken: () => void;
}

const ReCaptchaV3 = forwardRef<ReCaptchaRef, ReCaptchaProps>(({
  siteKey,
  action,
  onVerify
}, ref) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [tokenGenerated, setTokenGenerated] = useState(false);
  const executionRef = useRef(false);

  // Expose refresh method to parent components
  useImperativeHandle(ref, () => ({
    refreshToken: () => {
      setTokenGenerated(false);
      executionRef.current = false;
    }
  }));

  // Load reCAPTCHA script
  useEffect(() => {
    // Check if script is already loaded
    if (document.querySelector(`script[src*="recaptcha/api.js"]`)) {
      setScriptLoaded(true);
      return;
    }

    // Only load if not already loaded
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setScriptLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('Error loading reCAPTCHA script:', error);
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts and no other instances need it
      const scripts = document.querySelectorAll(`script[src*="recaptcha/api.js"]`);
      if (scripts.length === 1) {
        document.head.removeChild(script);
      }
    };
  }, [siteKey]);

  // Execute reCAPTCHA when the script is loaded (only once)
  useEffect(() => {
    if (!scriptLoaded || !siteKey || tokenGenerated || executionRef.current) {
      return;
    }

    const executeRecaptcha = () => {
      if (window.grecaptcha && window.grecaptcha.ready) {
        executionRef.current = true;
        try {
          window.grecaptcha.ready(() => {
            window.grecaptcha
              .execute(siteKey, { action })
              .then(token => {
                onVerify(token);
                setTokenGenerated(true);
              })
              .catch(error => {
                console.error('reCAPTCHA execution error:', error);
                executionRef.current = false;
              });
          });
        } catch (error) {
          console.error('Error executing reCAPTCHA:', error);
          executionRef.current = false;
        }
      } else {
        // If grecaptcha isn't ready, try again after a short delay
        setTimeout(executeRecaptcha, 1000);
      }
    };

    executeRecaptcha();
  }, [scriptLoaded, siteKey, action, onVerify, tokenGenerated]);

  // Reset token when action changes (for different forms)
  useEffect(() => {
    setTokenGenerated(false);
    executionRef.current = false;
  }, [action]);

  // No visible UI for v3
  return null;
});

ReCaptchaV3.displayName = 'ReCaptchaV3';

export default ReCaptchaV3;

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