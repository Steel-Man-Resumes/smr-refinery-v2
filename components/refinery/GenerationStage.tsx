'use client';

import { useState, useEffect } from 'react';
import { useRefinery } from '@/store/refineryStore';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { REFINERY_LOADING_PHASES } from '@/lib/constants';

export default function GenerationStage() {
  const { state, setGeneratedDocuments, setStage } = useRefinery();
  const [currentPhase, setCurrentPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateDocuments = async () => {
      try {
        // Generation stage comes AFTER payment, so just generate
        console.log('🔥 Starting document generation...');
        console.log('Payload:', state.forgePayload?.handoff_id);
        console.log('Portfolio options:', state.portfolioOptions);

        // Phase 0: Starting
        setCurrentPhase(0);

        // Call document generation API
        const response = await fetch('/api/generate-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            forgePayload: state.forgePayload,
            screeningResponses: state.screeningResponses,
            portfolioOptions: state.portfolioOptions,
          }),
        });

        // Update phases as we wait
        const phaseInterval = setInterval(() => {
          setCurrentPhase(prev => Math.min(prev + 1, 5));
        }, 3000);

        if (!response.ok) {
          clearInterval(phaseInterval);
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `Generation failed with status ${response.status}`);
        }

        const result = await response.json();
        clearInterval(phaseInterval);

        console.log('✅ Documents generated:', Object.keys(result.documents || {}));

        // Phase 6: Done
        setCurrentPhase(6);
        setGeneratedDocuments(result.documents);

        // Wait a moment to show completion, then go to download
        setTimeout(() => {
          setStage('download');
        }, 1500);

      } catch (error: any) {
        console.error('❌ Generation error:', error);
        setError(error.message || 'Document generation failed');
      }
    };

    // Only run once on mount
    generateDocuments();
  }, []); // Empty deps - run once

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-forgeBlack">
        <div className="glass-panel p-12 max-w-2xl w-full text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-headline text-trashRed mb-4">Generation Failed</h2>
          <p className="text-paperWhite mb-6">{error}</p>
          <p className="text-industrialGray text-sm mb-8">
            Don't worry - your payment is safe. Please try again or contact support.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setError(null);
                setCurrentPhase(0);
                window.location.reload();
              }}
              className="btn-gold px-6 py-3"
            >
              Try Again
            </button>
            <button
              onClick={() => setStage('payment')}
              className="px-6 py-3 border border-steelGold text-steelGold rounded hover:bg-steelGold/10"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LoadingScreen
      phases={REFINERY_LOADING_PHASES}
      currentPhase={currentPhase}
      message="Creating your professional documents..."
    />
  );
}
