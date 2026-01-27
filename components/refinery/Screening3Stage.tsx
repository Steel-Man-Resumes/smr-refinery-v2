'use client';

import { useRefinery } from '@/store/refineryStore';
import GlassPanel from '@/components/ui/GlassPanel';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import CardSelect from '@/components/ui/CardSelect';

export default function Screening3Stage() {
  const { state, updateScreeningResponse, nextStage, prevStage } = useRefinery();
  const { screeningResponses } = state;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassPanel className="p-12 max-w-4xl w-full">
        <h2 className="text-4xl font-headline text-steelGold headline-glow mb-4">
          Additional Context
        </h2>
        <p className="text-paperWhite mb-2">
          Last set of optional questions. These help us customize your job search strategy.
        </p>
        <p className="text-industrialGray text-sm mb-8">
          Again: 100% private, 100% optional. Share only what helps us help you.
        </p>

        {/* Recovery Journey */}
        <div className="mb-6">
          <h3 className="text-xl font-headline text-steelGold mb-4">Recovery & Wellness</h3>

          <div className="mb-4">
            <p className="text-paperWhite mb-3">Are you in recovery from addiction?</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <CardSelect
                id="recovery_no"
                label="No"
                selected={screeningResponses.addiction_recovery === 'no'}
                onSelect={() => updateScreeningResponse('addiction_recovery', 'no')}
              />
              <CardSelect
                id="recovery_yes"
                label="Yes"
                selected={screeningResponses.addiction_recovery === 'yes'}
                onSelect={() => updateScreeningResponse('addiction_recovery', 'yes')}
              />
              <CardSelect
                id="recovery_prefer_not"
                label="Prefer not to say"
                selected={screeningResponses.addiction_recovery === 'prefer_not_to_say'}
                onSelect={() => updateScreeningResponse('addiction_recovery', 'prefer_not_to_say')}
              />
            </div>
          </div>

          {screeningResponses.addiction_recovery === 'yes' && (
            <div className="ml-4 animate-fade-in mb-4">
              <Textarea
                value={screeningResponses.recovery_duration || ''}
                onChange={(val) => updateScreeningResponse('recovery_duration', val)}
                placeholder="E.g., '6 months clean', '2 years sober', 'in active recovery', etc."
                rows={2}
                label="How long? (Optional - this is a strength we can position)"
              />
            </div>
          )}
        </div>

        {/* Disability/Accommodation */}
        <div className="mb-6">
          <h3 className="text-xl font-headline text-steelGold mb-4">Disability & Accommodations</h3>

          <div className="mb-4">
            <p className="text-paperWhite mb-3">Do you have a disability?</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <CardSelect
                id="disability_no"
                label="No"
                selected={screeningResponses.disability === 'no'}
                onSelect={() => updateScreeningResponse('disability', 'no')}
              />
              <CardSelect
                id="disability_yes"
                label="Yes"
                selected={screeningResponses.disability === 'yes'}
                onSelect={() => updateScreeningResponse('disability', 'yes')}
              />
              <CardSelect
                id="disability_prefer_not"
                label="Prefer not to say"
                selected={screeningResponses.disability === 'prefer_not_to_say'}
                onSelect={() => updateScreeningResponse('disability', 'prefer_not_to_say')}
              />
            </div>
          </div>

          {screeningResponses.disability === 'yes' && (
            <div className="ml-4 animate-fade-in mb-4">
              <Textarea
                value={screeningResponses.disability_accommodation || ''}
                onChange={(val) => updateScreeningResponse('disability_accommodation', val)}
                placeholder="E.g., 'Need to sit periodically', 'Can't lift over 25lbs', 'Require accessible workspace', etc."
                rows={3}
                label="What accommodations might you need? (Optional)"
              />
            </div>
          )}
        </div>

        {/* Other Barriers */}
        <div className="mb-6">
          <h3 className="text-xl font-headline text-steelGold mb-4">Anything Else?</h3>
          <Textarea
            value={screeningResponses.other_barriers || ''}
            onChange={(val) => updateScreeningResponse('other_barriers', val)}
            placeholder="Any other challenges or concerns we should know about to help you succeed?"
            rows={4}
            label="Other barriers or context (Optional)"
          />
        </div>

        <div className="flex gap-4 mt-8">
          <Button variant="secondary" onClick={prevStage}>
            ← Back
          </Button>
          <Button variant="primary" onClick={nextStage} fullWidth>
            Continue to Document Generation →
          </Button>
        </div>

        <p className="text-industrialGray text-xs text-center mt-6">
          🔒 This information is private. We use it only to build your personalized job search strategy.
        </p>
      </GlassPanel>
    </div>
  );
}
