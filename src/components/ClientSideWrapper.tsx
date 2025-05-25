'use client';

import { useEffect, useState } from 'react';

interface ClientSideWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ClientSideWrapper({ children, fallback = null }: ClientSideWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
} 