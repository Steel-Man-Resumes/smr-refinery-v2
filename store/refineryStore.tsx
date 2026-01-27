"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ForgePayloadV1 } from '@/lib/types';

// Refinery stages - CORRECT ORDER:
// 1. reception - paste JSON
// 2. confirm-profile - verify data
// 3-5. screening - gather barrier info
// 6. portfolio - customize portfolio options
// 7. payment - pay for service
// 8. generation - AI generates documents
// 9. download - get the goods
export type RefineryStage =
  | 'reception'
  | 'confirm-profile'
  | 'screening-1'
  | 'screening-2'
  | 'screening-3'
  | 'portfolio'
  | 'payment'
  | 'generation'
  | 'download';

// Screening responses
export interface ScreeningResponses {
  // Screen 1: Legal/Criminal
  criminal_record?: string;
  criminal_details?: string;
  felony?: 'yes' | 'no' | 'sealed';
  felony_year?: string;
  time_served?: string;
  probation_parole?: 'yes' | 'no' | 'completed';

  // Screen 2: Employment Issues
  fired?: 'yes' | 'no';
  fired_details?: string;
  employment_verification_concerns?: string;
  reference_concerns?: string;

  // Screen 3: Other Challenges
  addiction_recovery?: 'yes' | 'no' | 'prefer_not_to_say';
  recovery_duration?: string;
  disability?: 'yes' | 'no' | 'prefer_not_to_say';
  disability_accommodation?: string;
  other_barriers?: string;
  
  // Life situation (childcare, transportation, etc.)
  childcare_needs?: string;
  transportation_details?: string;
  housing_stability?: string;
  financial_barriers?: string;
  drug_test_ready?: 'yes' | 'no' | 'need_time';
  background_check_concerns?: string;
}

// Generated documents
export interface CoverLetterVariant {
  content: string;  // DOCX base64
  preview: string;  // HTML preview
  description: string;  // e.g., "Bold & Achievement-Focused"
}

export interface GeneratedDocuments {
  resume?: {
    content: string; // DOCX base64
    preview: string; // HTML preview
  };
  coverLetter?: {
    aggressive: CoverLetterVariant;
    professional: CoverLetterVariant;
    friendly: CoverLetterVariant;
  };
  actionPlan?: {
    content: string; // DOCX base64
    preview?: string;
  };
  targetEmployers?: {
    content: string; // DOCX base64
    preview?: string;
  };
  portfolio?: {
    content: string; // HTML
  };
  alloyReport?: {
    content: string; // DOCX base64
  } | null;
  jobTracker?: {
    content: string; // XLSX base64
  } | null;
  quickStartGuide?: {
    content: string; // DOCX base64
  } | null;
  salaryNegotiation?: {
    content: string; // DOCX base64
  } | null;
  interviewPrep?: {
    content: string; // DOCX base64
  } | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// PORTFOLIO CUSTOMIZATION - Full Options
// ═══════════════════════════════════════════════════════════════════════════
export interface PortfolioOptions {
  // Theme
  theme?: 'forge' | 'executive' | 'midnight' | 'steel' | 'nature' | 'ocean' | 'minimal' | 'noir';
  
  // Colors
  accent_color?: string; // hex
  
  // Typography
  font_style?: 'modern' | 'elegant' | 'bold' | 'clean' | 'classic' | 'tech';
  tagline_style?: 'professional' | 'bold' | 'friendly' | 'minimal';
  
  // Layout
  layout_style?: 'centered' | 'sidebar' | 'cards' | 'timeline';
  header_style?: 'full' | 'compact' | 'split' | 'minimal';
  section_style?: 'cards' | 'dividers' | 'floating' | 'flat';
  
  // Visual Effects
  effect_particles?: boolean;
  effect_gradient?: boolean;
  effect_glow?: boolean;
  effect_glass?: boolean;
  effect_shadows?: boolean;
  effect_noise?: boolean;
  
  // Bonus Materials
  extras_job_tracker?: boolean;
  extras_quick_start?: boolean;
  extras_salary_negotiation?: boolean;
  extras_interview_prep?: boolean;
}

// Main state interface
export interface RefineryState {
  currentStage: RefineryStage;
  forgePayload: ForgePayloadV1 | null;
  jsonInput: string;
  screeningResponses: ScreeningResponses;
  generatedDocuments: GeneratedDocuments;
  portfolioOptions: PortfolioOptions;
  paymentCompleted: boolean;
  paymentSessionId: string;
  downloadReady: boolean;
  downloadUrl: string;
  
  // Live job search results from RapidAPI
  liveJobListings?: any[];
}

const INITIAL_STATE: RefineryState = {
  currentStage: 'reception',
  forgePayload: null,
  jsonInput: '',
  screeningResponses: {},
  generatedDocuments: {},
  portfolioOptions: {
    // Theme defaults
    theme: 'forge',
    accent_color: '#D4A84B',
    
    // Typography defaults
    font_style: 'modern',
    tagline_style: 'professional',
    
    // Layout defaults
    layout_style: 'centered',
    header_style: 'full',
    section_style: 'cards',
    
    // Effects defaults (most on)
    effect_particles: true,
    effect_gradient: true,
    effect_glow: true,
    effect_glass: true,
    effect_shadows: true,
    effect_noise: false,
    
    // Bonus materials defaults
    extras_job_tracker: true,
    extras_quick_start: true,
    extras_salary_negotiation: false,
    extras_interview_prep: false,
  },
  paymentCompleted: false,
  paymentSessionId: '',
  downloadReady: false,
  downloadUrl: '',
  liveJobListings: [],
};

// Context type
interface RefineryContextType {
  state: RefineryState;

  // Navigation
  setStage: (stage: RefineryStage) => void;
  nextStage: () => void;
  prevStage: () => void;

  // Forge payload
  setForgePayload: (payload: ForgePayloadV1) => void;
  setJsonInput: (json: string) => void;

  // Screening
  updateScreeningResponse: (key: keyof ScreeningResponses, value: any) => void;
  clearScreeningResponses: () => void;

  // Documents
  setGeneratedDocuments: (docs: GeneratedDocuments) => void;

  // Portfolio
  updatePortfolioOption: (key: keyof PortfolioOptions, value: any) => void;

  // Payment
  setPaymentCompleted: (completed: boolean) => void;
  setPaymentSessionId: (sessionId: string) => void;

  // Download
  setDownloadReady: (ready: boolean) => void;
  setDownloadUrl: (url: string) => void;
  
  // Live job listings
  setLiveJobListings: (listings: any[]) => void;

  // Utilities
  resetAll: () => void;
}

const RefineryContext = createContext<RefineryContextType | undefined>(undefined);

// ═══════════════════════════════════════════════════════════════════════════
// STAGE ORDER - CRITICAL: This defines the user journey
// ═══════════════════════════════════════════════════════════════════════════
const STAGE_ORDER: RefineryStage[] = [
  'reception',        // 1. Paste JSON from Forge
  'confirm-profile',  // 2. Verify their data looks right
  'screening-1',      // 3. Legal/criminal barriers
  'screening-2',      // 4. Employment issues
  'screening-3',      // 5. Other challenges
  'portfolio',        // 6. Customize portfolio appearance
  'payment',          // 7. Pay for service
  'generation',       // 8. AI generates all documents
  'download',         // 9. Download everything
];

export function RefineryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RefineryState>(INITIAL_STATE);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('refinery_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with initial state to ensure new options have defaults
        setState({
          ...INITIAL_STATE,
          ...parsed,
          portfolioOptions: {
            ...INITIAL_STATE.portfolioOptions,
            ...parsed.portfolioOptions,
          }
        });
      } catch (e) {
        console.error('Failed to parse saved state:', e);
      }
    }

    // Check for Forge handoff in localStorage
    const handoff = localStorage.getItem('forge_handoff');
    if (handoff && !saved) {
      try {
        const payload = JSON.parse(handoff);
        setState((prev) => ({
          ...prev,
          forgePayload: payload,
          currentStage: 'confirm-profile', // Skip reception if auto-loaded
        }));
        // Clear handoff after loading
        localStorage.removeItem('forge_handoff');
        console.log('✅ Forge data loaded successfully:', payload.handoff_id);
      } catch (e) {
        console.error('Failed to parse Forge handoff:', e);
      }
    }

    // Backup: Check URL parameters for handoff_id
    if (!handoff && !saved) {
      const params = new URLSearchParams(window.location.search);
      const handoffId = params.get('handoff_id');
      if (handoffId) {
        console.log('Handoff ID found in URL params:', handoffId);
        // Could fetch payload from server using handoff_id if needed
      }
    }
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    localStorage.setItem('refinery_state', JSON.stringify(state));
  }, [state]);

  // Navigation
  const setStage = (stage: RefineryStage) => {
    setState((prev) => ({ ...prev, currentStage: stage }));
  };

  const nextStage = () => {
    setState((prev) => {
      const currentIndex = STAGE_ORDER.indexOf(prev.currentStage);
      const nextIndex = Math.min(currentIndex + 1, STAGE_ORDER.length - 1);
      return { ...prev, currentStage: STAGE_ORDER[nextIndex] };
    });
    // Scroll to top when navigating to next stage
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStage = () => {
    setState((prev) => {
      const currentIndex = STAGE_ORDER.indexOf(prev.currentStage);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return { ...prev, currentStage: STAGE_ORDER[prevIndex] };
    });
    // Scroll to top when navigating to previous stage
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Forge payload
  const setForgePayload = (payload: ForgePayloadV1) => {
    setState((prev) => ({ ...prev, forgePayload: payload }));
  };

  const setJsonInput = (json: string) => {
    setState((prev) => ({ ...prev, jsonInput: json }));
  };

  // Screening
  const updateScreeningResponse = (key: keyof ScreeningResponses, value: any) => {
    setState((prev) => ({
      ...prev,
      screeningResponses: {
        ...prev.screeningResponses,
        [key]: value,
      },
    }));
  };

  const clearScreeningResponses = () => {
    setState((prev) => ({ ...prev, screeningResponses: {} }));
  };

  // Documents
  const setGeneratedDocuments = (docs: GeneratedDocuments) => {
    setState((prev) => ({ ...prev, generatedDocuments: docs }));
  };

  // Portfolio
  const updatePortfolioOption = (key: keyof PortfolioOptions, value: any) => {
    setState((prev) => ({
      ...prev,
      portfolioOptions: {
        ...prev.portfolioOptions,
        [key]: value,
      },
    }));
  };

  // Payment
  const setPaymentCompleted = (completed: boolean) => {
    setState((prev) => ({ ...prev, paymentCompleted: completed }));
  };

  const setPaymentSessionId = (sessionId: string) => {
    setState((prev) => ({ ...prev, paymentSessionId: sessionId }));
  };

  // Download
  const setDownloadReady = (ready: boolean) => {
    setState((prev) => ({ ...prev, downloadReady: ready }));
  };

  const setDownloadUrl = (url: string) => {
    setState((prev) => ({ ...prev, downloadUrl: url }));
  };
  
  // Live job listings
  const setLiveJobListings = (listings: any[]) => {
    setState((prev) => ({ ...prev, liveJobListings: listings }));
  };

  // Utilities
  const resetAll = () => {
    setState(INITIAL_STATE);
    localStorage.removeItem('refinery_state');
    localStorage.removeItem('forge_handoff');
  };

  const value: RefineryContextType = {
    state,
    setStage,
    nextStage,
    prevStage,
    setForgePayload,
    setJsonInput,
    updateScreeningResponse,
    clearScreeningResponses,
    setGeneratedDocuments,
    updatePortfolioOption,
    setPaymentCompleted,
    setPaymentSessionId,
    setDownloadReady,
    setDownloadUrl,
    setLiveJobListings,
    resetAll,
  };

  return <RefineryContext.Provider value={value}>{children}</RefineryContext.Provider>;
}

// Custom hook
export function useRefinery() {
  const context = useContext(RefineryContext);
  if (context === undefined) {
    throw new Error('useRefinery must be used within RefineryProvider');
  }
  return context;
}
