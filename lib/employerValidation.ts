// =============================================================================
// EMPLOYER VALIDATION - Reject garbage before it enters the document
// File: lib/employerValidation.ts
// =============================================================================

const INVALID_EMPLOYER_PATTERNS: RegExp[] = [
  // Cities masquerading as employers
  /^(Milwaukee|Racine|Menomonee Falls|Waukesha|Kenosha|Madison|Chicago|Minneapolis|Austin|Houston|Dallas|San Antonio|Denver|Phoenix|Seattle|Portland)$/i,
  /^[A-Z][a-z]+,?\s*(WI|Wisconsin|IL|MN|TX|Texas|CO|AZ|WA|OR|CA|NY|FL)$/i,
  
  // Job titles masquerading as employers  
  /^(Production|Manufacturing|Warehouse|Operations|Factory|Shipping|Receiving|Logistics)\s*(Supervisor|Manager|Lead|Coordinator|Associate|Worker)$/i,
  /^(General|Senior|Assistant|Associate|Area|Regional|District)\s*(Manager|Supervisor|Director)/i,
  
  // Known split/garbage entries
  /^(Harley|Davidson)$/i,
  /^Inc-/i,
  /^[A-Z]{2,3}-[A-Z]/i,
  /^LLC$/i,
  /^Corp$/i,
  
  // AI refusal patterns
  /cannot provide|search results do not contain|no (public )?data|not specified/i,
  /I (cannot|couldn't|was unable to|don't have)/i,
  /information (is not|isn't|was not) available/i,
  
  // Generic garbage
  /^(Local employer|Full-time|Part-time|Contract|Temporary)$/i,
  /^(Manufacturing|Warehouse|Logistics|Distribution)$/i,
  /^(Supervisor|Manager|Lead|Coordinator)$/i,
  /^(Various|Multiple|Several)\s*(locations?|employers?|companies?)/i,
];

const KNOWN_MERGES: Record<string, string> = {
  'harley': 'Harley-Davidson',
  'davidson': 'Harley-Davidson',
  'cnh': 'CNH Industrial',
  'ge': 'GE Healthcare',
  'jb': 'J.B. Hunt',
  'ups': 'UPS',
  'fedex': 'FedEx',
};

export interface EmployerNameValidation {
  valid: boolean;
  cleaned?: string;
  reason?: string;
}

export function validateEmployerName(name: string | null | undefined): EmployerNameValidation {
  if (!name || typeof name !== 'string') {
    return { valid: false, reason: 'Empty or invalid name' };
  }
  
  const trimmed = name.trim();
  
  // Minimum length check
  if (trimmed.length < 3) {
    return { valid: false, reason: 'Name too short (< 3 chars)' };
  }
  
  // Check for known patterns to reject
  for (const pattern of INVALID_EMPLOYER_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: `Matches invalid pattern: ${pattern.source.substring(0, 30)}...` };
    }
  }
  
  // Check for known merges
  const lower = trimmed.toLowerCase();
  if (KNOWN_MERGES[lower]) {
    return { valid: true, cleaned: KNOWN_MERGES[lower] };
  }
  
  return { valid: true, cleaned: trimmed };
}

export interface WhyGoodFitValidation {
  valid: boolean;
  reason?: string;
}

export function validateWhyGoodFit(text: string | null | undefined): WhyGoodFitValidation {
  if (!text || typeof text !== 'string') {
    return { valid: false, reason: 'Empty Why Good Fit' };
  }
  
  const trimmed = text.trim();
  
  // Minimum length - must be substantial
  if (trimmed.length < 50) {
    return { valid: false, reason: `Why Good Fit too short (${trimmed.length} chars, need 50+)` };
  }
  
  // Check for AI refusal text
  const refusalPatterns = [
    /cannot provide/i,
    /no (public )?data/i,
    /not specified/i,
    /search results/i,
    /I (cannot|couldn't|was unable)/i,
    /information (is not|isn't) available/i,
  ];
  
  for (const pattern of refusalPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: 'Contains AI refusal text' };
    }
  }
  
  return { valid: true };
}

export interface ValidatedEmployer {
  name: string;
  industry: string;
  location: string;
  whyGoodFit: string;
  website?: string;
  activePosting?: string;
  applyLink?: string;
  secondChanceFriendly?: boolean;
  tier: 1 | 2 | 3;
  commute?: string;
}

export interface RawEmployerData {
  name?: string;
  employer_name?: string;
  industry?: string;
  location?: string;
  job_city?: string;
  job_state?: string;
  whyGoodFit?: string;
  why_good_fit?: string;
  website?: string;
  employer_website?: string;
  activePosting?: string;
  job_title?: string;
  applyLink?: string;
  job_apply_link?: string;
  secondChanceFriendly?: boolean;
  second_chance_friendly?: boolean;
  tier?: 1 | 2 | 3;
}

export function validateEmployer(raw: RawEmployerData): ValidatedEmployer | null {
  // Validate name
  const nameResult = validateEmployerName(raw.name || raw.employer_name);
  if (!nameResult.valid) {
    console.log(`[Validation] Rejected employer: ${raw.name || raw.employer_name} - ${nameResult.reason}`);
    return null;
  }
  
  // Validate Why Good Fit
  const fitResult = validateWhyGoodFit(raw.whyGoodFit || raw.why_good_fit);
  if (!fitResult.valid) {
    console.log(`[Validation] Rejected employer ${nameResult.cleaned}: ${fitResult.reason}`);
    return null;
  }
  
  // Must have industry
  const industry = raw.industry;
  if (!industry || industry.length < 3) {
    console.log(`[Validation] Rejected employer ${nameResult.cleaned}: Missing or invalid industry`);
    return null;
  }
  
  // Build location string
  let location = raw.location;
  if (!location && (raw.job_city || raw.job_state)) {
    location = [raw.job_city, raw.job_state].filter(Boolean).join(', ');
  }
  if (!location) {
    location = 'Location not specified';
  }
  
  return {
    name: nameResult.cleaned!,
    industry: industry,
    location: location,
    whyGoodFit: (raw.whyGoodFit || raw.why_good_fit)!,
    website: raw.website || raw.employer_website,
    activePosting: raw.activePosting || raw.job_title,
    applyLink: raw.applyLink || raw.job_apply_link,
    secondChanceFriendly: raw.secondChanceFriendly || raw.second_chance_friendly,
    tier: raw.tier || 2,
  };
}

export function validateEmployerList(employers: ValidatedEmployer[], minCount: number = 50): void {
  if (employers.length < minCount) {
    throw new Error(`Only ${employers.length} employers - need ${minCount} minimum`);
  }
  
  // Check all fields populated
  for (const emp of employers) {
    if (!emp.whyGoodFit || emp.whyGoodFit.length < 50) {
      throw new Error(`Empty/short Why Good Fit for ${emp.name}`);
    }
    if (!emp.industry) {
      throw new Error(`Missing industry for ${emp.name}`);
    }
  }
  
  // Log tier distribution
  const tier1 = employers.filter(e => e.tier === 1).length;
  const tier2 = employers.filter(e => e.tier === 2).length;
  const tier3 = employers.filter(e => e.tier === 3).length;
  
  console.log(`[Validation] ✓ ${employers.length} employers validated`);
  console.log(`[Validation] Tier distribution: T1=${tier1}, T2=${tier2}, T3=${tier3}`);
  
  if (tier1 < 8) {
    console.warn(`[Validation] Warning: Only ${tier1} Tier 1 employers (want 10+)`);
  }
}

export default {
  validateEmployerName,
  validateWhyGoodFit,
  validateEmployer,
  validateEmployerList,
};
