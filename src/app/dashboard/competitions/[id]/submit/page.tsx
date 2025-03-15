'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function CompetitionSubmitRedirect() {
  const router = useRouter();
  const params = useParams();
  const competitionId = params?.id as string;

  useEffect(() => {
    // Redirect to the competition detail page
    if (competitionId) {
      router.replace(`/dashboard/competitions/${competitionId}`);
    }
  }, [competitionId, router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-gray-600">Redirecting to competition page...</p>
      </div>
    </div>
  );
} 