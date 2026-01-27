'use client';

import { useRefinery } from '@/store/refineryStore';
import GlassPanel from '@/components/ui/GlassPanel';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import CardSelect from '@/components/ui/CardSelect';

export default function Screening2Stage() {
  const { state, updateScreeningResponse, nextStage, prevStage } = useRefinery();
  const { screeningResponses } = state;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassPanel className="p-12 max-w-4xl w-full">
        <h2 className="text-4xl font-headline text-steelGold headline-glow mb-4">
          Employment History
        </h2>
        <p className="text-paperWhite mb-2">
          Still private. Still optional. This helps us prepare you for tough questions.
        </p>
        <p className="text-industrialGray text-sm mb-8">
          Hiring managers ask these questions anyway—we want you ready with strong answers.
        </p>

        {/* Have you been fired? */}
        <div className="mb-6">
          <h3 className="text-xl font-headline text-steelGold mb-4">Past Terminations</h3>

          <div className="mb-4">
            <p className="text-paperWhite mb-3">Have you ever been fired or asked to resign?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CardSelect
                id="fired_no"
                label="No"
                selected={screeningResponses.fired === 'no'}
                onSelect={() => updateScreeningResponse('fired', 'no')}
              />
              <CardSelect
                id="fired_yes"
                label="Yes"
                selected={screeningResponses.fired === 'yes'}
                onSelect={() => updateScreeningResponse('fired', 'yes')}
              />
            </div>
          </div>

          {screeningResponses.fired === 'yes' && (
            <div className="ml-4 animate-fade-in mb-4">
              <Textarea
                value={screeningResponses.fired_details || ''}
                onChange={(val) => updateScreeningResponse('fired_details', val)}
                placeholder="Brief context (e.g., 'performance', 'attendance', 'conflict with manager', etc.). This helps us build your story."
                rows={4}
                label="What happened? (Optional)"
              />
            </div>
          )}
        </div>

        {/* Employment verification concerns */}
        <div className="mb-6">
          <h3 className="text-xl font-headline text-steelGold mb-4">Verification Concerns</h3>
          <Textarea
            value={screeningResponses.employment_verification_concerns || ''}
            onChange={(val) => updateScreeningResponse('employment_verification_concerns', val)}
            placeholder="E.g., 'Company X went out of business', 'Can't locate records', 'Former boss passed away', etc."
            rows={3}
            label="Are there any employers that might be hard to verify? (Optional)"
          />
        </div>

        {/* Reference concerns */}
        <div className="mb-6">
          <h3 className="text-xl font-headline text-steelGold mb-4">Reference Quality</h3>
          <Textarea
            value={screeningResponses.reference_concerns || ''}
            onChange={(val) => updateScreeningResponse('reference_concerns', val)}
            placeholder="E.g., 'Left on bad terms with supervisor', 'No professional references available', etc."
            rows={3}
            label="Any concerns about getting good references? (Optional)"
          />
        </div>

        <div className="flex gap-4 mt-8">
          <Button variant="secondary" onClick={prevStage}>
            ← Back
          </Button>
          <Button variant="primary" onClick={nextStage} fullWidth>
            Continue →
          </Button>
        </div>

        <p className="text-industrialGray text-xs text-center mt-6">
          🔒 This information is private and used only to prepare your interview scripts.
        </p>
      </GlassPanel>
    </div>
  );
}
