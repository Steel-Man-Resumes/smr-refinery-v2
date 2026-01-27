'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRefinery } from '@/store/refineryStore';
import GlassPanel from '@/components/ui/GlassPanel';
import Button from '@/components/ui/Button';
import { CONTACT_INFO } from '@/lib/constants';
import { FadeUp, StaggerContainer, StaggerItem } from '@/components/animations/FadeUp';
import { ShimmerGold, GoldenPulse } from '@/components/animations/ShimmerGold';
import { TiltCard } from '@/components/animations/TiltCard';

export default function DownloadStage() {
  const { state, setDownloadReady, setDownloadUrl, resetAll } = useRefinery();
  const [isPackaging, setIsPackaging] = useState(true);
  const [downloadUrl, setLocalDownloadUrl] = useState('');

  useEffect(() => {
    const packageDocuments = async () => {
      try {
        const response = await fetch('/api/package-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documents: state.generatedDocuments,
            profile: state.forgePayload?.profile,
            portfolioOptions: state.portfolioOptions,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to package documents');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        setLocalDownloadUrl(url);
        setDownloadUrl(url);
        setDownloadReady(true);
        setIsPackaging(false);
      } catch (error: any) {
        alert(`Packaging failed: ${error.message}`);
        setIsPackaging(false);
      }
    };

    if (!state.downloadReady) {
      packageDocuments();
    } else {
      setIsPackaging(false);
      setLocalDownloadUrl(state.downloadUrl);
    }
  }, []);

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${state.forgePayload?.profile.full_name.replace(/\s+/g, '_')}_Career_Package.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleStartOver = () => {
    if (confirm('Start over? This will clear all your data.')) {
      resetAll();
      window.location.reload();
    }
  };

  if (isPackaging) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-refinery">
          <div className="bg-overlay" />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <GlassPanel className="p-12 max-w-2xl w-full text-center">
            <div className="flex justify-center mb-6">
              <Image 
                src="/logo.png" 
                alt="Steel Man Resumes" 
                width={60} 
                height={60}
                className="opacity-80 pulse-glow"
              />
            </div>
            <h2 className="text-2xl md:text-3xl font-headline text-steelGold headline-glow mb-4">
              Packaging Your Documents...
            </h2>
            <p className="text-paperWhite/80 mb-6">
              Creating your ZIP file with all documents and extras.
            </p>
            <div className="text-5xl animate-pulse">📦</div>
          </GlassPanel>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-refinery">
        <div className="bg-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen py-8 px-6">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <FadeUp delay={0}>
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-steelGold/20 flex items-center justify-center">
                  <span className="text-4xl">🎉</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-headline text-steelGold headline-glow mb-3">
                <ShimmerGold>You're All Set!</ShimmerGold>
              </h1>
              <p className="text-lg md:text-xl text-paperWhite/90 mb-2">
                Your professional documents are ready.
              </p>
              <p className="text-industrialGray">
                Download them now and start applying with confidence.
              </p>
            </div>
          </FadeUp>

          {/* Download Button */}
          <FadeUp delay={0.1}>
            <TiltCard tiltAmount={2}>
              <GlassPanel className="p-6 mb-6 glass-panel-gold">
                <GoldenPulse intensity="medium">
                  <Button 
                    variant="primary" 
                    onClick={handleDownload} 
                    fullWidth
                    className="btn-gold text-lg md:text-xl py-4"
                  >
                    📥 Download Your Career Package
                  </Button>
                </GoldenPulse>
                <p className="text-industrialGray text-sm text-center mt-3">
                  ZIP file includes resume, <strong className="text-steelGold">3 cover letter variants</strong>, action plan, target employers, and web portfolio
                </p>
              </GlassPanel>
            </TiltCard>
          </FadeUp>

          {/* Next Steps */}
          <FadeUp delay={0.2}>
            <GlassPanel className="p-6 mb-6">
              <h3 className="text-xl md:text-2xl font-headline text-steelGold mb-4 flex items-center gap-2">
                <span>📋</span> Next Steps
              </h3>
              <StaggerContainer staggerDelay={0.05}>
                {[
                  'Extract the ZIP file to a safe location on your computer',
                  'Review your resume and all 3 cover letter variants in the Cover_Letters folder',
                  'Pick the right tone for each employer: BOLD (confident), PROFESSIONAL (safe), or FRIENDLY (personable)',
                  'Replace [COMPANY NAME] and [JOB TITLE] placeholders before sending',
                  'Start applying to the employers in Target_Employers.docx',
                  'Follow the 30-Day Action Plan and track applications in the spreadsheet',
                ].map((step, idx) => (
                  <StaggerItem key={idx}>
                    <div className="flex items-start gap-3 py-2">
                      <span className="w-6 h-6 rounded-full bg-steelGold/20 flex items-center justify-center text-steelGold text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-paperWhite/90 text-sm">{step}</span>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </GlassPanel>
          </FadeUp>

          {/* Cover Letter Tip */}
          <FadeUp delay={0.25}>
            <GlassPanel className="p-6 mb-6 border-l-4 border-steelGold">
              <h3 className="text-lg font-headline text-steelGold mb-2 flex items-center gap-2">
                <span>💡</span> Pro Tip: Which Cover Letter to Use?
              </h3>
              <div className="text-paperWhite/80 text-sm space-y-2">
                <p><strong className="text-steelGold">BOLD</strong> → Competitive roles, big companies, metrics-driven positions</p>
                <p><strong className="text-steelGold">PROFESSIONAL</strong> → When in doubt, use this one. Works everywhere.</p>
                <p><strong className="text-steelGold">FRIENDLY</strong> → Small businesses, family-owned, culture-focused employers</p>
              </div>
            </GlassPanel>
          </FadeUp>

          {/* Support */}
          <FadeUp delay={0.3}>
            <GlassPanel className="p-6 mb-6">
              <h3 className="text-xl md:text-2xl font-headline text-steelGold mb-4 flex items-center gap-2">
                <span>💬</span> Need Help?
              </h3>
              <p className="text-paperWhite/80 mb-4 text-sm">
                Have questions or need adjustments? We're here to help.
              </p>
              <div className="space-y-2 text-paperWhite/90 text-sm">
                <p>
                  📧 Email:{' '}
                  <a href={`mailto:${CONTACT_INFO.email}`} className="text-steelGold hover:underline">
                    {CONTACT_INFO.email}
                  </a>
                </p>
                <p>
                  📞 Phone:{' '}
                  <a href={`tel:${CONTACT_INFO.phone}`} className="text-steelGold hover:underline">
                    {CONTACT_INFO.phone}
                  </a>
                </p>
              </div>
            </GlassPanel>
          </FadeUp>

          {/* Review Request */}
          <FadeUp delay={0.4}>
            <GlassPanel className="p-6 mb-6 text-center">
              <h3 className="text-xl font-headline text-steelGold mb-3">
                Helped You Land a Job? ⭐
              </h3>
              <p className="text-paperWhite/70 mb-4 text-sm">
                Your review helps other workers find us. We'd be grateful if you'd share your story.
              </p>
              <Button
                variant="secondary"
                onClick={() => window.open(CONTACT_INFO.googleReviewUrl, '_blank')}
                className="btn-outline"
              >
                Leave a Google Review
              </Button>
            </GlassPanel>
          </FadeUp>

          {/* Actions */}
          <FadeUp delay={0.5}>
            <div className="flex gap-4">
              <Button 
                variant="ghost" 
                onClick={handleStartOver}
                className="text-paperWhite/60 hover:text-paperWhite"
              >
                🔄 Start Over
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleDownload} 
                fullWidth
                className="btn-outline"
              >
                📥 Download Again
              </Button>
            </div>

            <p className="text-industrialGray text-xs text-center mt-6">
              💾 Your documents are saved. You can download them again anytime within 30 days.
            </p>
          </FadeUp>
        </div>
      </div>
    </div>
  );
}
