// =============================================================================
// EMPLOYER SEARCH - JSearch API (RapidAPI Pro) for real job postings
// File: lib/employerSearch.ts
// =============================================================================

import { validateEmployer, ValidatedEmployer, RawEmployerData } from './employerValidation';

const JSEARCH_HOST = 'jsearch.p.rapidapi.com';
const MIN_EMPLOYERS = 50; // Target 50 employers
const MAX_PAGES = 2; // Keep pages low since we're running parallel

export interface JSearchJob {
  employer_name: string;
  employer_website?: string;
  employer_logo?: string;
  job_id: string;
  job_title: string;
  job_description: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_apply_link: string;
  job_posted_at_datetime_utc?: string;
  job_employment_type?: string;
  job_is_remote?: boolean;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_salary_period?: string;
}

export interface JSearchResponse {
  status: string;
  request_id: string;
  data: JSearchJob[];
  parameters?: {
    query: string;
    page: number;
    num_pages: number;
  };
}

export interface SearchOptions {
  targetRole: string;
  city: string;
  state: string;
  apiKey: string;
  maxCommute?: number;
  datePosted?: 'all' | 'today' | '3days' | 'week' | 'month';
  employmentTypes?: string[]; // 'FULLTIME', 'PARTTIME', 'CONTRACTOR', 'INTERN'
  remoteOnly?: boolean;
  workHistory?: Array<{ title: string; company?: string }>; // Add work history for smarter searches
}

/**
 * Search for employers using JSearch API (RapidAPI Pro tier)
 * Returns deduplicated list of jobs
 */
export async function searchEmployers(options: SearchOptions): Promise<JSearchJob[]> {
  const { targetRole, city, state, apiKey, datePosted = 'month' } = options;
  
  const allJobs: JSearchJob[] = [];
  const seenEmployers = new Set<string>();
  
  // Fetch multiple pages to get unique employers
  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const url = new URL('https://jsearch.p.rapidapi.com/search');
      url.searchParams.set('query', `${targetRole} in ${city}, ${state}`);
      url.searchParams.set('page', String(page));
      url.searchParams.set('num_pages', '1');
      url.searchParams.set('date_posted', datePosted);
      
      if (options.remoteOnly) {
        url.searchParams.set('remote_jobs_only', 'true');
      }
      
      if (options.employmentTypes?.length) {
        url.searchParams.set('employment_types', options.employmentTypes.join(','));
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': JSEARCH_HOST,
        },
      });
      
      if (!response.ok) {
        // If rate limited, don't retry in parallel mode - just return what we have
        if (response.status === 429) {
          console.log(`[JSearch] Rate limited on "${targetRole}" page ${page}, returning partial results`);
          break;
        }
        continue;
      }
      
      const data: JSearchResponse = await response.json();
      
      if (!data.data?.length) {
        break;
      }
      
      // Deduplicate by employer name (case-insensitive)
      for (const job of data.data) {
        const key = job.employer_name?.toLowerCase().trim();
        if (key && key.length > 2 && !seenEmployers.has(key)) {
          seenEmployers.add(key);
          allJobs.push(job);
        }
      }
      
    } catch (err) {
      console.error(`[JSearch] Error on "${targetRole}" page ${page}:`, err);
    }
  }
  
  return allJobs;
}

/**
 * Extract searchable terms from work history job titles
 */
export function extractWorkHistoryTerms(workHistory: Array<{ title: string; company?: string }>): string[] {
  if (!workHistory?.length) return [];
  
  const terms: string[] = [];
  
  // Industry detection patterns
  const industryPatterns: Record<string, string[]> = {
    'warehouse|fulfillment|distribution|logistics': ['Warehouse', 'Warehouse Associate', 'Distribution', 'Logistics'],
    'forklift|lift|material handler': ['Forklift Operator', 'Material Handler', 'Warehouse'],
    'machine|operator|cnc|press': ['Machine Operator', 'Production Operator', 'Manufacturing'],
    'weld|fabricat': ['Welder', 'Fabricator', 'Manufacturing'],
    'mechanic|maintenance|technician': ['Maintenance Technician', 'Mechanic', 'Industrial Maintenance'],
    'assembl|production|manufacturing': ['Assembler', 'Production', 'Manufacturing'],
    'landscap|lawn|grounds': ['Landscaper', 'Grounds Maintenance', 'General Labor'],
    'construct|carpenter|framing': ['Construction', 'General Labor', 'Carpenter'],
    'electri': ['Electrician', 'Industrial Electrician'],
    'plumb|pipe': ['Plumber', 'Pipefitter'],
    'hvac|heating|cooling': ['HVAC Technician', 'HVAC'],
    'driver|cdl|truck|delivery': ['Driver', 'CDL Driver', 'Delivery Driver'],
    'cook|kitchen|food|restaurant': ['Cook', 'Kitchen', 'Food Service', 'Food Production'],
    'clean|janitor|custod': ['Janitor', 'Custodian', 'Cleaner'],
    'secur|guard': ['Security Guard', 'Security'],
    'ship|receiv|dock': ['Shipping', 'Receiving', 'Dock Worker'],
    'pack|pick': ['Picker', 'Packer', 'Order Picker'],
    'quality|qc|qa|inspector': ['Quality Control', 'QC Inspector', 'Quality Technician'],
    'lead|supervisor|foreman|manager': ['Team Lead', 'Supervisor', 'Shift Lead'],
    'labor|general': ['General Labor', 'Laborer'],
  };
  
  for (const job of workHistory) {
    const title = (job.title || '').toLowerCase();
    
    for (const [pattern, searchTerms] of Object.entries(industryPatterns)) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(title)) {
        terms.push(...searchTerms);
      }
    }
  }
  
  // Dedupe
  return Array.from(new Set(terms));
}

/**
 * Get broad fallback terms that should always return results
 * Based on target role and work history to stay relevant
 */
export function getBroadFallbackTerms(targetRole: string, workHistory?: Array<{ title: string }>): string[] {
  const input = targetRole.toLowerCase();
  const fallbacks: string[] = [];
  
  // Analyze what type of work they're looking for
  const isLeadership = /lead|super|foreman|manager|boss/.test(input);
  const isQuality = /qc|qa|quality|inspect/.test(input);
  const isDriverRelated = /driver|cdl|truck|delivery/.test(input);
  const isTrades = /hvac|electri|plumb|weld|mechanic|carpenter/.test(input);
  const isFood = /cook|kitchen|food|restaurant/.test(input);
  const isOutdoor = /landscap|construct|labor/.test(input);
  
  // Add category-appropriate fallbacks
  if (isLeadership) {
    fallbacks.push('Supervisor', 'Team Lead', 'Shift Lead', 'Foreman', 'Production Supervisor');
  }
  
  if (isQuality) {
    fallbacks.push('Quality Control', 'Inspector', 'Quality Technician', 'QC');
  }
  
  if (isDriverRelated) {
    fallbacks.push('Driver', 'CDL Driver', 'Delivery Driver', 'Truck Driver');
  }
  
  if (isTrades) {
    fallbacks.push('Maintenance Technician', 'Industrial Maintenance', 'Mechanic');
  }
  
  if (isFood) {
    fallbacks.push('Food Production', 'Kitchen', 'Food Manufacturing', 'Cook');
  }
  
  if (isOutdoor) {
    fallbacks.push('Construction', 'General Labor', 'Landscaper', 'Labor');
  }
  
  // Universal high-volume terms that almost always have openings
  // Only add ones that make sense for blue collar
  const universalTerms = [
    'Warehouse',
    'Production',
    'Manufacturing',
    'General Labor',
    'Forklift Operator',
    'Material Handler',
    'Assembler',
  ];
  
  // Add universal terms but limit to avoid too many searches
  for (const term of universalTerms) {
    if (fallbacks.length < 6 && !fallbacks.includes(term)) {
      fallbacks.push(term);
    }
  }
  
  return fallbacks;
}

/**
 * Expand search with PARALLEL queries for speed
 * Pro tier RapidAPI can handle concurrent requests
 * Now uses work history and smart fallbacks to maximize results
 */
export async function searchEmployersExpanded(options: SearchOptions): Promise<JSearchJob[]> {
  const startTime = Date.now();
  
  // 1. Normalize the target role into search terms
  const normalizedRoles = normalizeTargetRole(options.targetRole);
  
  // 2. Extract terms from work history
  const workHistoryTerms = extractWorkHistoryTerms(options.workHistory || []);
  
  // 3. Get broad fallback terms based on target + history
  const fallbackTerms = getBroadFallbackTerms(options.targetRole, options.workHistory);
  
  // 4. Combine all terms, prioritize: normalized roles > work history > fallbacks
  const allTerms = [
    ...normalizedRoles,
    ...workHistoryTerms,
    ...fallbackTerms,
  ];
  
  // Deduplicate while preserving priority order
  const seenTerms = new Set<string>();
  const uniqueTerms: string[] = [];
  for (const term of allTerms) {
    const key = term.toLowerCase();
    if (!seenTerms.has(key)) {
      seenTerms.add(key);
      uniqueTerms.push(term);
    }
  }
  
  // Take up to 12 roles for parallel search (Pro tier can handle it)
  const rolesToSearch = uniqueTerms.slice(0, 12);
  
  console.log(`[JSearch] Target: "${options.targetRole}"`);
  console.log(`[JSearch] Normalized roles: [${normalizedRoles.join(', ')}]`);
  console.log(`[JSearch] Work history terms: [${workHistoryTerms.join(', ')}]`);
  console.log(`[JSearch] Fallback terms: [${fallbackTerms.join(', ')}]`);
  console.log(`[JSearch] Final search terms (${rolesToSearch.length}): [${rolesToSearch.join(', ')}]`);
  console.log(`[JSearch] Running ${rolesToSearch.length} searches in PARALLEL...`);
  
  // Run ALL searches in parallel - Pro tier can handle concurrent requests
  const searchPromises = rolesToSearch.map(role => 
    searchEmployers({
      ...options,
      targetRole: role,
    }).catch(err => {
      console.error(`[JSearch] Search failed for "${role}":`, err.message);
      return [] as JSearchJob[]; // Return empty on error, don't fail entire batch
    })
  );
  
  const results = await Promise.all(searchPromises);
  
  // Merge and deduplicate
  const seenEmployers = new Set<string>();
  const allJobs: JSearchJob[] = [];
  
  for (let i = 0; i < results.length; i++) {
    const jobs = results[i];
    const role = rolesToSearch[i];
    let newCount = 0;
    
    for (const job of jobs) {
      const key = job.employer_name?.toLowerCase().trim();
      if (key && key.length > 2 && !seenEmployers.has(key)) {
        seenEmployers.add(key);
        allJobs.push(job);
        newCount++;
      }
    }
    
    if (jobs.length > 0) {
      console.log(`[JSearch] "${role}": ${jobs.length} jobs, ${newCount} new unique`);
    }
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[JSearch] PARALLEL COMPLETE: ${allJobs.length} unique employers from ${rolesToSearch.length} searches in ${elapsed}s`);
  
  // If we still don't have enough, log a warning
  if (allJobs.length < MIN_EMPLOYERS) {
    console.warn(`[JSearch] WARNING: Only found ${allJobs.length} employers (target: ${MIN_EMPLOYERS})`);
  }
  
  return allJobs;
}

/**
 * Normalize user input into searchable job titles
 * Handles garbage like "lead man role or QC" -> ["Lead", "Quality Control", "Team Lead", "QC Inspector"]
 */
export function normalizeTargetRole(rawInput: string): string[] {
  const input = rawInput.toLowerCase().trim();
  const searchTerms: string[] = [];
  
  // Common abbreviation/slang mappings
  const mappings: Record<string, string[]> = {
    'qc': ['Quality Control', 'QC Inspector', 'Quality Technician'],
    'qa': ['Quality Assurance', 'QA Technician', 'Quality Control'],
    'lead': ['Team Lead', 'Shift Lead', 'Production Lead'],
    'lead man': ['Team Lead', 'Lead Hand', 'Shift Lead'],
    'leadman': ['Team Lead', 'Lead Hand', 'Shift Lead'],
    'supervisor': ['Supervisor', 'Shift Supervisor', 'Production Supervisor'],
    'forklift': ['Forklift Operator', 'Forklift Driver', 'Material Handler'],
    'cdl': ['CDL Driver', 'Truck Driver', 'Delivery Driver'],
    'driver': ['Driver', 'Delivery Driver', 'CDL Driver'],
    'warehouse': ['Warehouse', 'Warehouse Associate', 'Warehouse Worker'],
    'machine operator': ['Machine Operator', 'CNC Operator', 'Production Operator'],
    'machinist': ['Machinist', 'CNC Machinist', 'Machine Operator'],
    'welder': ['Welder', 'MIG Welder', 'Fabricator'],
    'mechanic': ['Mechanic', 'Maintenance Mechanic', 'Diesel Mechanic'],
    'maintenance': ['Maintenance Technician', 'Maintenance Mechanic', 'Facilities'],
    'hvac': ['HVAC Technician', 'HVAC Installer'],
    'electrician': ['Electrician', 'Industrial Electrician'],
    'plumber': ['Plumber', 'Pipefitter'],
    'carpenter': ['Carpenter', 'Construction Carpenter'],
    'assembly': ['Assembler', 'Assembly Line', 'Production Assembler'],
    'picker': ['Order Picker', 'Warehouse Picker'],
    'packer': ['Packer', 'Shipping Packer'],
    'shipping': ['Shipping', 'Shipping Clerk'],
    'receiving': ['Receiving', 'Receiving Clerk'],
    'inventory': ['Inventory', 'Inventory Control'],
    'production': ['Production', 'Production Worker'],
    'manufacturing': ['Manufacturing', 'Production'],
    'food': ['Food Production', 'Food Manufacturing'],
    'cook': ['Cook', 'Line Cook', 'Prep Cook'],
    'kitchen': ['Kitchen', 'Kitchen Staff'],
    'cleaning': ['Cleaner', 'Janitor', 'Custodian'],
    'janitor': ['Janitor', 'Custodian', 'Cleaner'],
    'security': ['Security Guard', 'Security Officer'],
    'landscaping': ['Landscaper', 'Grounds Maintenance'],
    'construction': ['Construction Worker', 'Construction Laborer'],
    'laborer': ['General Laborer', 'Construction Laborer'],
    'helper': ['Helper', 'Trade Helper'],
    'inspector': ['Inspector', 'Quality Inspector', 'QC Inspector'],
    'technician': ['Technician', 'Maintenance Technician'],
    'operator': ['Operator', 'Machine Operator', 'Equipment Operator'],
    'material handler': ['Material Handler', 'Warehouse', 'Forklift Operator'],
  };
  
  // Check for known terms in the input
  for (const [key, values] of Object.entries(mappings)) {
    if (input.includes(key)) {
      searchTerms.push(...values);
    }
  }
  
  // If nothing matched, try to extract meaningful words
  if (searchTerms.length === 0) {
    // Remove common filler words
    const fillers = ['role', 'job', 'position', 'work', 'or', 'and', 'the', 'a', 'an', 'in', 'at', 'for', 'to', 'i', 'want', 'looking', 'need', 'something', 'type', 'kind', 'of'];
    const words = input.split(/\s+/).filter(w => w.length > 2 && !fillers.includes(w));
    
    if (words.length > 0) {
      // Capitalize each word and use as search term
      const cleaned = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      searchTerms.push(cleaned);
      
      // Also add individual significant words as fallback
      for (const word of words) {
        const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
        if (!searchTerms.includes(capitalized)) {
          searchTerms.push(capitalized);
        }
      }
    }
  }
  
  // Ultimate fallback - generic blue collar terms
  if (searchTerms.length === 0) {
    searchTerms.push('General Labor', 'Warehouse', 'Production');
  }
  
  // Dedupe and return (limit to prevent too many similar terms)
  const unique = Array.from(new Set(searchTerms));
  return unique.slice(0, 8); // Max 8 from normalization
}

/**
 * Assign tiers based on job posting recency and quality
 */
export function assignTiers(jobs: JSearchJob[]): Map<string, 1 | 2 | 3> {
  const tiers = new Map<string, 1 | 2 | 3>();
  
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const twoWeeks = 14 * 24 * 60 * 60 * 1000;
  
  for (const job of jobs) {
    const posted = job.job_posted_at_datetime_utc 
      ? new Date(job.job_posted_at_datetime_utc).getTime()
      : 0;
    
    const age = now - posted;
    const hasApplyLink = !!job.job_apply_link;
    const hasSalary = !!(job.job_min_salary || job.job_max_salary);
    
    // Tier 1: Posted within last week, has apply link
    if (age < oneWeek && hasApplyLink) {
      tiers.set(job.employer_name, 1);
    }
    // Tier 2: Posted within 2 weeks OR has good data
    else if (age < twoWeeks || (hasApplyLink && hasSalary)) {
      tiers.set(job.employer_name, tiers.get(job.employer_name) || 2);
    }
    // Tier 3: Older or missing data
    else {
      if (!tiers.has(job.employer_name)) {
        tiers.set(job.employer_name, 3);
      }
    }
  }
  
  return tiers;
}

/**
 * Extract industry from job data
 */
export function extractIndustry(job: JSearchJob): string {
  const title = job.job_title?.toLowerCase() || '';
  const desc = job.job_description?.toLowerCase() || '';
  const combined = title + ' ' + desc;
  
  // Industry detection based on keywords
  if (combined.includes('fulfillment') || combined.includes('e-commerce') || combined.includes('ecommerce')) {
    return 'E-commerce Fulfillment';
  }
  if (combined.includes('food') || combined.includes('grocery') || combined.includes('beverage')) {
    return 'Food & Beverage Distribution';
  }
  if (combined.includes('pharmaceutical') || combined.includes('medical') || combined.includes('healthcare')) {
    return 'Healthcare / Pharmaceutical';
  }
  if (combined.includes('automotive') || combined.includes('auto parts')) {
    return 'Automotive';
  }
  if (combined.includes('manufacturing') || combined.includes('production')) {
    return 'Manufacturing';
  }
  if (combined.includes('logistics') || combined.includes('3pl') || combined.includes('freight')) {
    return 'Third-Party Logistics (3PL)';
  }
  if (combined.includes('retail') || combined.includes('store')) {
    return 'Retail Distribution';
  }
  if (combined.includes('construction') || combined.includes('building materials')) {
    return 'Construction / Building Materials';
  }
  if (combined.includes('electronics') || combined.includes('tech')) {
    return 'Technology / Electronics';
  }
  
  return 'Distribution / Logistics';
}

/**
 * Convert JSearch jobs to validated employers (without Why Good Fit - that comes from Claude)
 */
export function convertToEmployers(jobs: JSearchJob[]): Partial<RawEmployerData>[] {
  const tiers = assignTiers(jobs);
  
  return jobs.map(job => ({
    employer_name: job.employer_name,
    industry: extractIndustry(job),
    job_city: job.job_city,
    job_state: job.job_state,
    employer_website: job.employer_website,
    job_title: job.job_title,
    job_apply_link: job.job_apply_link,
    tier: tiers.get(job.employer_name) || 3,
  }));
}

export default {
  searchEmployers,
  searchEmployersExpanded,
  normalizeTargetRole,
  extractWorkHistoryTerms,
  getBroadFallbackTerms,
  assignTiers,
  extractIndustry,
  convertToEmployers,
};
