'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { EMPLOYMENT_STATS, MOTIVATIONAL_QUOTES } from '@/lib/constants';
import ProgressBar from './ProgressBar';
import { ShimmerGold } from '@/components/animations/ShimmerGold';

interface LoadingScreenProps {
  phases: string[];
  currentPhase: number;
  message?: string;
  progress?: number;
}

export default function LoadingScreen({
  phases,
  currentPhase,
  message,
  progress,
}: LoadingScreenProps) {
  const [statIndex, setStatIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatIndex((prev) => (prev + 1) % EMPLOYMENT_STATS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const calculatedProgress = progress !== undefined
    ? progress
    : ((currentPhase + 1) / phases.length) * 100;

  const currentQuote = MOTIVATIONAL_QUOTES[quoteIndex];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-refinery">
        <div className="bg-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="glass-panel p-8 md:p-12 max-w-2xl w-full">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image 
              src="/logo.png" 
              alt="Steel Man Resumes" 
              width={60} 
              height={60}
              className="opacity-80 pulse-glow"
            />
          </div>

          {/* Main message */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-headline text-steelGold headline-glow mb-2">
              <ShimmerGold>{message || phases[currentPhase] || 'Processing...'}</ShimmerGold>
            </h2>
            <p className="text-sm text-paperWhite/60">
              Crafting your professional documents...
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <ProgressBar progress={calculatedProgress} animated={true} />
            <div className="flex justify-between mt-2 text-xs text-industrialGray">
              <span>Phase {currentPhase + 1} of {phases.length}</span>
              <span>{Math.round(calculatedProgress)}%</span>
            </div>
          </div>

          {/* Phase checklist */}
          <div className="space-y-3 mb-8">
            {phases.map((phase, index) => (
              <div
                key={index}
                className={`
                  flex items-center gap-3 p-2 rounded-lg transition-all duration-500
                  ${index === currentPhase ? 'bg-white/5 scale-[1.02]' : ''}
                  ${index < currentPhase ? 'opacity-60' : ''}
                `}
              >
                {/* Status icon */}
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-sm
                  transition-all duration-300
                  ${index < currentPhase ? 'bg-steelGold/20 text-steelGold' : ''}
                  ${index === currentPhase ? 'bg-steelGold text-forge-black pulse-glow' : ''}
                  ${index > currentPhase ? 'bg-white/10 text-industrialGray' : ''}
                `}>
                  {index < currentPhase ? (
                    <span className="checkmark-animation">✓</span>
                  ) : index === currentPhase ? (
                    <span className="animate-pulse">●</span>
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>

                {/* Phase text */}
                <span className={`
                  text-sm md:text-base transition-all duration-500
                  ${index < currentPhase ? 'text-paperWhite/50 line-through' : ''}
                  ${index === currentPhase ? 'text-steelGold font-semibold' : ''}
                  ${index > currentPhase ? 'text-paperWhite/40' : ''}
                `}>
                  {phase}
                </span>
              </div>
            ))}
          </div>

          <div className="section-divider opacity-50" />

          {/* Employment stat */}
          <div className="mb-6 animate-fade-in" key={`stat-${statIndex}`}>
            <p className="text-xs text-steelGold uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>📊</span> DID YOU KNOW?
            </p>
            <p className="text-sm text-paperWhite/80 leading-relaxed">
              {EMPLOYMENT_STATS[statIndex]}
            </p>
          </div>

          <div className="section-divider opacity-30" />

          {/* Motivational quote */}
          <div className="animate-fade-in" key={`quote-${quoteIndex}`}>
            <p className="text-sm text-paperWhite/80 leading-relaxed italic mb-2">
              "{currentQuote.quote}"
            </p>
            <p className="text-xs text-industrialGray text-right">
              — {currentQuote.author}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
