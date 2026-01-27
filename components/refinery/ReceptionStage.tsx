'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRefinery } from '@/store/refineryStore';
import type { ForgePayloadV1 } from '@/lib/types';
import GlassPanel from '@/components/ui/GlassPanel';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { FadeUp } from '@/components/animations/FadeUp';
import { ShimmerGold, GoldenPulse } from '@/components/animations/ShimmerGold';

export default function ReceptionStage() {
  const { state, setForgePayload, setStage } = useRefinery();
  const [jsonInput, setJsonInput] = useState(state.jsonInput || '');
  const [error, setError] = useState<string | null>(null);

  const validateAndLoadJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput) as ForgePayloadV1;

      if (!parsed.schema_version || parsed.schema_version !== '1.0') {
        throw new Error('Invalid schema version. Expected ForgePayloadV1 (schema_version: "1.0")');
      }

      if (!parsed.handoff_id || !parsed.profile || !parsed.intake) {
        throw new Error('Missing required fields in payload');
      }

      setForgePayload(parsed);
      setError(null);
      setStage('confirm-profile');
    } catch (err: any) {
      setError(err.message || 'Invalid JSON format');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-refinery">
        <div className="bg-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <FadeUp delay={0}>
          <GlassPanel className="p-8 md:p-12 max-w-3xl w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Image 
                  src="/logo.png" 
                  alt="Steel Man Resumes" 
                  width={70} 
                  height={70}
                  className="opacity-90"
                />
              </div>
              <h1 className="text-4xl md:text-5xl font-headline text-steelGold headline-glow mb-3">
                <ShimmerGold>THE REFINERY</ShimmerGold>
              </h1>
              <p className="text-lg md:text-xl text-paperWhite/80">
                Transform Intelligence Into Weapons
              </p>
            </div>

            <div className="mb-8">
              <p className="text-paperWhite/90 mb-4 text-center">
                This is where we transform your career intelligence into polished, professional documents.
              </p>
              <p className="text-industrialGray text-sm text-center">
                If you came from The Forge, your data should have loaded automatically. 
                If not, paste your ForgePayloadV1 JSON below.
              </p>
            </div>

            {/* Manual JSON input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-steelGold mb-2">
                Forge Payload JSON
              </label>
              <Textarea
                value={jsonInput}
                onChange={setJsonInput}
                placeholder="Paste your ForgePayloadV1 JSON here..."
                rows={8}
              />
              {error && (
                <p className="text-trash-red text-sm mt-2 flex items-center gap-2">
                  <span>⚠️</span> {error}
                </p>
              )}
            </div>

            <GoldenPulse intensity="subtle">
              <Button 
                variant="primary" 
                onClick={validateAndLoadJSON} 
                fullWidth
                className="btn-gold text-lg py-3"
              >
                Load Data & Continue →
              </Button>
            </GoldenPulse>

            <div className="section-divider opacity-50" />

            <div className="text-center">
              <p className="text-industrialGray text-sm mb-3">
                Need to create your career intelligence first?
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  window.open(process.env.NEXT_PUBLIC_FORGE_URL || 'http://localhost:3002', '_blank');
                }}
                className="text-steelGold hover:text-bright-gold"
              >
                ← Go to The Forge (Free)
              </Button>
            </div>
          </GlassPanel>
        </FadeUp>
      </div>
    </div>
  );
}
