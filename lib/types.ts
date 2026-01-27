// ForgePayloadV1 - Master Schema
// This is the locked contract between Forge and Refinery

export type TechComfort = 'easy' | 'comfortable' | 'master';

export interface ForgePayloadV1 {
  // === METADATA ===
  schema_version: '1.0';
  handoff_id: string;
  checksum: string;
  generated_at: string;

  // === USER PROFILE ===
  profile: {
    full_name: string;
    phone: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    linkedin: string | null;
  };

  // === USER INTAKE ===
  intake: {
    goals: string[];
    challenges: string[];
    constraints: {
      shift_preference: '1st' | '2nd' | '3rd' | 'any';
      weekend_ok: 'yes' | 'no' | 'depends';
      max_commute_minutes: number;
      transportation: 'reliable_car' | 'bus' | 'rides' | 'depends';
      physical_standing?: 'none' | 'some' | 'lots';
      physical_lifting?: 'none' | 'some' | 'lots';
    };
    tech_comfort: TechComfort;
    target_role: string;
  };

  // === WORK HISTORY ===
  work_history: Array<{
    company: string;
    title: string;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    raw_dates: string;
    bullets: string[];
    is_current: boolean;
  }>;

  // === EDUCATION ===
  education: Array<{
    institution: string;
    credential: string;
    field: string | null;
    year: string | null;
    is_completed: boolean | null;
  }>;

  // === CERTIFICATIONS ===
  certifications_raw: string[];

  // === MILITARY ===
  military: {
    branch: string | null;
    rank: string | null;
    years: string | null;
    discharge: string | null;
  };

  // === NARRATIVE MODULE (Phase 2A) ===
  narrative: {
    archetype: string;
    headline: string;
    summary: {
      professional: string;
      friendly: string;
      direct: string;
    };
    elevator_pitch_30s: string;
    linkedin_about: string;
    story_arc: {
      beginning: string;
      development: string;
      challenge: string | null;
      current: string;
      future: string;
    };
    positioning_strategy: string;
  };

  // === SKILLS MODULE (Phase 2B) ===
  skills: {
    skills: {
      hard: string[];
      soft: string[];
      transferable: string[];
    };
    keywords: {
      present: string[];
      missing_critical: string[];
      missing_recommended: string[];
      industry_buzzwords: string[];
    };
    skills_matrix: Array<{
      skill: string;
      level: 'expert' | 'proficient' | 'familiar';
      evidence: string;
      ats_value: 'high' | 'medium' | 'low';
    }>;
    ats_assessment: {
      current_score_estimate: number;
      potential_score: number;
      biggest_gaps: string[];
      quick_fixes: string[];
    };
  };

  // === STRATEGY MODULE (Phase 2C) ===
  strategy: {
    ideal_job_profile: string;
    target_titles: {
      primary: string[];
      secondary: string[];
      stretch: string[];
      avoid: Array<{ title: string; reason: string }>;
    };
    target_industries: {
      tier1_best_fit: Array<{
        industry: string;
        why: string;
        local_strength: string;
      }>;
      tier2_good_alternatives: Array<{
        industry: string;
        why: string;
        local_strength: string;
      }>;
      avoid: Array<{ industry: string; why: string }>;
    };
    salary: {
      immediate_realistic: string;
      after_6_months: string;
      after_1_year: string;
      negotiation_leverage: string[];
      red_flags: string[];
    };
    application_strategy: {
      primary_method: 'online' | 'in-person' | 'staffing agency' | 'network' | 'hybrid';
      best_times: string;
      follow_up_approach: string;
      volume_recommendation: string;
      staffing_agencies: {
        recommended: boolean;
        reasoning: string;
        types_to_target: string[];
      };
    };
    competitive_advantages: string[];
    potential_concerns: Array<{ concern: string; mitigation: string }>;
    timeline: {
      quick_wins: string[];
      first_month_goals: string[];
      success_indicators: string[];
    };
  };

  // === BARRIERS MODULE (Phase 2D - Conditional) ===
  barriers: {
    challenges: Array<{
      type: string;
      employer_perspective: string;
      reframe: string;
      scripts: {
        application_written: string;
        if_asked_directly: string;
        proactive_address: string;
        follow_up_written: string;
      };
      proof_points: string[];
      action_items: string[];
      legal_context: string;
    }>;
    interview_master_scripts: {
      tell_me_about_yourself: string;
      why_are_you_looking: string;
      greatest_strength: string;
      greatest_weakness: string;
      why_should_we_hire_you: string;
      do_you_have_questions: string[];
    };
    overall_strategy: string;
  } | null;

  // === RESEARCH MODULE (Phase 3A) ===
  research: {
    past_employer_insights: Array<{
      company: string;
      reputation: string;
      recent_news: string | null;
      skills_valued: string[];
      perception_of_alumni: string;
      sources: string[];
    }>;
    local_market: {
      job_availability: string;
      major_employers_hiring: string[];
      pay_range: string;
      seasonal_patterns: string | null;
      notable_trends: string;
      sources: string[];
    };
    target_employers: Array<{
      name: string;
      business_type: string;
      location: string;
      why_good_fit: string;
      reputation: 'good' | 'neutral' | 'caution' | 'unknown';
      how_to_apply: string;
      second_chance_friendly: boolean | null;
      source: string | null;
    }>;
    competitive_landscape: {
      typical_applicant_profile: string;
      candidate_advantages: string[];
      candidate_disadvantages: string[];
      sources: string[];
    };
    staffing_agencies: Array<{
      name: string;
      specialization: string;
      location: string;
      reputation: string;
      contact: string;
      source: string;
    }>;
    research_confidence: 'high' | 'medium' | 'low';
    research_gaps: string[];
  };
}

// Refinery-only types
export interface ScreeningPrivate {
  second_chance_only: 'yes' | 'no' | 'not_sure';
  drug_test_ok: 'yes' | 'no' | 'depends';
  background_check_ok: 'yes' | 'no' | 'depends';
  has_childcare_needs: 'yes' | 'no' | 'not_sure';
  has_transportation_challenges: 'yes' | 'no' | 'not_sure';
  has_housing_concerns: 'yes' | 'no' | 'not_sure';
  has_mental_health_needs: 'yes' | 'no' | 'not_sure';
  has_addiction_recovery: 'yes' | 'no' | 'not_sure';
  has_financial_stress: 'yes' | 'no' | 'not_sure';
}

export interface PortfolioPreferences {
  theme: 'professional' | 'bold' | 'minimal' | 'creative';
  accent_color: string;
  tagline_style: 'professional' | 'bold' | 'friendly';
}

export type ResumeTrack =
  | 'warehouse_production'
  | 'office_admin'
  | 'customer_service'
  | 'driving_delivery'
  | 'food_service'
  | 'skilled_trades'
  | 'healthcare_support'
  | 'general_labor';
