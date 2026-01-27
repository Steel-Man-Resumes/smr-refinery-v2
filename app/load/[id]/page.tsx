'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import GlassPanel from '@/components/ui/GlassPanel';

export default function LoadHandoff() {
  const router = useRouter();
  const params = useParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayload() {
      try {
        const res = await fetch(`/api/handoff/${params.id}`);

        if (!res.ok) {
          const errorData = await res.json();
          setError(errorData.error || 'Failed to load data');
          return;
        }

        const payload = await res.json();

        // Store in localStorage for Refinery to pick up
        localStorage.setItem('forgePayload', JSON.stringify(payload));

        console.log('[Handoff] Payload loaded successfully');

        // Redirect to main refinery page
        router.push('/');
      } catch (err: any) {
        console.error('[Handoff] Error loading payload:', err);
        setError('Failed to load your career data. Please try again.');
      }
    }

    if (params.id) {
      loadPayload();
    }
  }, [params.id, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-forge-black">
        <GlassPanel className="p-8 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-headline text-trashRed mb-4">Handoff Link Error</h1>
          <p className="text-paperWhite/80 mb-6">{error}</p>
          <p className="text-sm text-industrialGray mb-6">
            Handoff links expire after 24 hours. You may need to generate a new one from the Forge.
          </p>
          <a
            href="https://smr-forge-v2.vercel.app"
            className="inline-block px-6 py-3 bg-steelGold text-forge-black rounded-lg font-semibold hover:bg-steelGold/90 transition-colors"
          >
            Return to Forge
          </a>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-forge-black">
      <GlassPanel className="p-12 max-w-md text-center">
        <div className="animate-pulse mb-6">
          <div className="text-6xl mb-4">⚡</div>
        </div>
        <h1 className="text-2xl font-headline text-steelGold mb-4">Loading Your Career Data...</h1>
        <p className="text-paperWhite/70 text-sm">
          Transferring securely from the Forge
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <div className="w-2 h-2 bg-steelGold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-steelGold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-steelGold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </GlassPanel>
    </div>
  );
}
