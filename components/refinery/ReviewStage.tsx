'use client';

import { useState } from 'react';
import { useRefinery } from '@/store/refineryStore';
import GlassPanel from '@/components/ui/GlassPanel';
import Button from '@/components/ui/Button';

export default function ReviewStage() {
  const { state, nextStage, prevStage, setGeneratedDocuments } = useRefinery();
  const [activeTab, setActiveTab] = useState<'resume' | 'cover'  >('resume');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const { generatedDocuments } = state;

  if (!generatedDocuments.resume || !generatedDocuments.coverLetter) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassPanel className="p-12 max-w-2xl w-full text-center">
          <p className="text-trashRed mb-4">No documents generated yet!</p>
          <Button variant="secondary" onClick={prevStage}>
            ← Go Back
          </Button>
        </GlassPanel>
      </div>
    );
  }

  const handleRegenerate = async () => {
    if (!confirm('Regenerate documents? This will replace your current versions.')) {
      return;
    }

    setIsRegenerating(true);

    try {
      const response = await fetch('/api/generate-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forgePayload: state.forgePayload,
          screeningResponses: state.screeningResponses,
          portfolioOptions: state.portfolioOptions,
        }),
      });

      if (!response.ok) {
        throw new Error('Regeneration failed');
      }

      const result = await response.json();
      setGeneratedDocuments(result.documents);
      alert('Documents regenerated successfully!');
    } catch (error: any) {
      alert(`Regeneration failed: ${error.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        <GlassPanel className="p-12 mb-6">
          <h2 className="text-4xl font-headline text-steelGold headline-glow mb-4">
            Review Your Documents
          </h2>
          <p className="text-paperWhite mb-6">
            Take a look at what we created. You can regenerate if needed, or proceed to payment.
          </p>

          {/* Tab Switcher */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'resume'
                  ? 'bg-steelGold text-forgeBlack'
                  : 'bg-transparent border border-steelGold/40 text-paperWhite hover:border-steelGold'
              }`}
            >
              📄 Resume
            </button>
            <button
              onClick={() => setActiveTab('cover')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'cover'
                  ? 'bg-steelGold text-forgeBlack'
                  : 'bg-transparent border border-steelGold/40 text-paperWhite hover:border-steelGold'
              }`}
            >
              ✉️ Cover Letter
            </button>
          </div>

          {/* Document Preview */}
          <div className="glass-panel p-6 mb-6 max-h-[600px] overflow-y-auto">
            {activeTab === 'resume' && (
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: generatedDocuments.resume.preview }}
              />
            )}
            {activeTab === 'cover' && (
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: generatedDocuments.coverLetter.professional.preview }}
              />
            )}
          </div>

          <div className="flex gap-4">
            <Button variant="secondary" onClick={prevStage}>
              ← Back
            </Button>
            <Button
              variant="ghost"
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? '⏳ Regenerating...' : '🔄 Regenerate'}
            </Button>
            <Button variant="primary" onClick={nextStage} fullWidth>
              Looks Good, Continue to Payment →
            </Button>
          </div>
        </GlassPanel>

        <div className="text-center">
          <p className="text-industrialGray text-sm">
            💡 Tip: The final DOCX files may look slightly different from this preview due to formatting.
          </p>
        </div>
      </div>
    </div>
  );
}
