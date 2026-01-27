'use client';

import { useRefinery } from '@/store/refineryStore';
import GlassPanel from '@/components/ui/GlassPanel';
import Button from '@/components/ui/Button';

export default function ConfirmProfileStage() {
  const { state, nextStage, prevStage } = useRefinery();
  const payload = state.forgePayload;

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassPanel className="p-12 max-w-2xl w-full text-center">
          <p className="text-trashRed mb-4">No payload loaded!</p>
          <Button variant="secondary" onClick={prevStage}>
            ← Go Back
          </Button>
        </GlassPanel>
      </div>
    );
  }

  const { profile, intake, work_history, narrative } = payload;

  // Safe accessors for optional fields
  const goals = intake?.goals || [];
  const challenges = intake?.challenges || [];
  const displayTags = goals.length > 0 ? goals : challenges;
  const archetype = narrative?.archetype || narrative?.headline || intake?.target_role || 'Career Professional';

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassPanel className="p-12 max-w-4xl w-full">
        <h2 className="text-4xl font-headline text-steelGold headline-glow mb-6">
          Quick Check
        </h2>
        <p className="text-paperWhite mb-8">
          Let&apos;s confirm we have the right information before we build your documents.
        </p>

        {/* Profile Summary */}
        <div className="glass-panel p-6 mb-6">
          <h3 className="text-2xl font-headline text-steelGold mb-4">Your Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-industrialGray text-sm">Name</p>
              <p className="text-paperWhite font-medium">{profile?.full_name || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-industrialGray text-sm">Email</p>
              <p className="text-paperWhite font-medium">{profile?.email || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-industrialGray text-sm">Phone</p>
              <p className="text-paperWhite font-medium">{profile?.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-industrialGray text-sm">Location</p>
              <p className="text-paperWhite font-medium">
                {[profile?.city, profile?.state, profile?.zip].filter(Boolean).join(', ') || 'Not provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Target Role */}
        <div className="glass-panel p-6 mb-6">
          <h3 className="text-2xl font-headline text-steelGold mb-4">Target Role</h3>
          <p className="text-paperWhite text-lg">{intake?.target_role || 'Not specified'}</p>
          <p className="text-industrialGray text-sm mt-2">{archetype}</p>
        </div>

        {/* Work Experience Summary */}
        <div className="glass-panel p-6 mb-6">
          <h3 className="text-2xl font-headline text-steelGold mb-4">Work Experience</h3>
          <div className="space-y-3">
            {(work_history || []).slice(0, 3).map((job, idx) => (
              <div key={idx}>
                <p className="text-paperWhite font-medium">{job.title}</p>
                <p className="text-industrialGray text-sm">
                  {job.company} • {job.raw_dates || `${job.start_date || ''} - ${job.end_date || 'Present'}`}
                </p>
              </div>
            ))}
            {(work_history || []).length > 3 && (
              <p className="text-industrialGray text-sm">
                + {work_history.length - 3} more position{work_history.length - 3 > 1 ? 's' : ''}
              </p>
            )}
            {(!work_history || work_history.length === 0) && (
              <p className="text-industrialGray">No work history provided</p>
            )}
          </div>
        </div>

        {/* Goals / Challenges - only show if we have data */}
        {displayTags.length > 0 && (
          <div className="glass-panel p-6 mb-8">
            <h3 className="text-2xl font-headline text-steelGold mb-4">
              {goals.length > 0 ? 'Your Goals' : 'Challenges to Address'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {displayTags.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-steelGold/20 border border-steelGold/40 rounded-full text-paperWhite text-sm"
                >
                  {String(item).replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button variant="secondary" onClick={prevStage}>
            ← Back
          </Button>
          <Button variant="primary" onClick={nextStage} fullWidth>
            Looks Good, Continue →
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}
