'use client';

import { useRefinery } from '@/store/refineryStore';
import GlassPanel from '@/components/ui/GlassPanel';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import CardSelect from '@/components/ui/CardSelect';

export default function Screening1Stage() {
  const { state, updateScreeningResponse, nextStage, prevStage } = useRefinery();
  const { screeningResponses } = state;

  const handleContinue = () => {
    // Optional fields - no validation needed
    nextStage();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassPanel className="p-12 max-w-4xl w-full">
        <h2 className="text-4xl font-headline text-steelGold headline-glow mb-4">
          Private Screening
        </h2>
        <p className="text-paperWhite mb-2">
          This information is <strong>100% private</strong>. It will not appear on your resume or cover letter.
        </p>
        <p className="text-industrialGray text-sm mb-8">
          We need this to craft the right approach for your situation. Everything here is optional—only share what you&apos;re comfortable with.
        </p>

        {/* Criminal Record */}
        <div className="mb-6">
          <h3 className="text-xl font-headline text-steelGold mb-4">Legal/Criminal History</h3>

          <div className="mb-4">
            <p className="text-paperWhite mb-3">Do you have a criminal record?</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <CardSelect
                id="criminal_no"
                label="No"
                selected={screeningResponses.criminal_record === 'no'}
                onSelect={() => updateScreeningResponse('criminal_record', 'no')}
              />
              <CardSelect
                id="criminal_yes"
                label="Yes"
                selected={screeningResponses.criminal_record === 'yes'}
                onSelect={() => updateScreeningResponse('criminal_record', 'yes')}
              />
              <CardSelect
                id="criminal_prefer_not"
                label="Prefer not to say"
                selected={screeningResponses.criminal_record === 'prefer_not_to_say'}
                onSelect={() => updateScreeningResponse('criminal_record', 'prefer_not_to_say')}
              />
            </div>
          </div>

          {/* Conditional: If yes, ask about felony */}
          {screeningResponses.criminal_record === 'yes' && (
            <div className="ml-4 animate-fade-in mb-4">
              <div className="mb-4">
                <p className="text-paperWhite mb-3">Is it a felony or misdemeanor?</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <CardSelect
                    id="felony_no"
                    label="Misdemeanor only"
                    selected={screeningResponses.felony === 'no'}
                    onSelect={() => updateScreeningResponse('felony', 'no')}
                  />
                  <CardSelect
                    id="felony_yes"
                    label="Felony"
                    selected={screeningResponses.felony === 'yes'}
                    onSelect={() => updateScreeningResponse('felony', 'yes')}
                  />
                  <CardSelect
                    id="felony_sealed"
                    label="Sealed/Expunged"
                    selected={screeningResponses.felony === 'sealed'}
                    onSelect={() => updateScreeningResponse('felony', 'sealed')}
                  />
                </div>
              </div>

              <div className="mb-4">
                <Textarea
                  value={screeningResponses.felony_year || ''}
                  onChange={(val) => updateScreeningResponse('felony_year', val)}
                  placeholder="What year? (Optional - helps us position your story)"
                  rows={2}
                  label="Year of conviction (optional)"
                />
              </div>

              <div className="mb-4">
                <p className="text-paperWhite mb-3">Did you serve time?</p>
                <Textarea
                  value={screeningResponses.time_served || ''}
                  onChange={(val) => updateScreeningResponse('time_served', val)}
                  placeholder="Brief description (e.g., '6 months county', 'probation only', etc.)"
                  rows={2}
                />
              </div>

              <div className="mb-4">
                <p className="text-paperWhite mb-3">Are you on probation/parole?</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <CardSelect
                    id="probation_no"
                    label="No"
                    selected={screeningResponses.probation_parole === 'no'}
                    onSelect={() => updateScreeningResponse('probation_parole', 'no')}
                  />
                  <CardSelect
                    id="probation_yes"
                    label="Yes, currently"
                    selected={screeningResponses.probation_parole === 'yes'}
                    onSelect={() => updateScreeningResponse('probation_parole', 'yes')}
                  />
                  <CardSelect
                    id="probation_completed"
                    label="Completed"
                    selected={screeningResponses.probation_parole === 'completed'}
                    onSelect={() => updateScreeningResponse('probation_parole', 'completed')}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-8">
          <Button variant="secondary" onClick={prevStage}>
            ← Back
          </Button>
          <Button variant="primary" onClick={handleContinue} fullWidth>
            Continue →
          </Button>
        </div>

        <p className="text-industrialGray text-xs text-center mt-6">
          🔒 This information is encrypted and never shared with employers. We use it only to build your strategy.
        </p>
      </GlassPanel>
    </div>
  );
}
