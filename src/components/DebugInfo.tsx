'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface DebugInfoProps {
  children: ReactNode;
}

export default function DebugInfo({ children }: DebugInfoProps) {
  const { data: session } = useSession();
  const [showDebug, setShowDebug] = useState(false);
  
  useEffect(() => {
    // Check if debug mode is enabled for this user
    const checkDebugMode = async () => {
      try {
        const response = await fetch('/api/user/debug-status');
        if (response.ok) {
          const data = await response.json();
          setShowDebug(data.isDebugModeEnabled);
        }
      } catch (error) {
        console.error('Error checking debug mode status:', error);
        setShowDebug(false);
      }
    };
    
    if (session?.user) {
      checkDebugMode();
    }
  }, [session]);
  
  if (!showDebug) return null;
  
  return (
    <div className="debug-info border border-yellow-400 bg-yellow-50 p-3 rounded-md my-2">
      {children}
    </div>
  );
} 