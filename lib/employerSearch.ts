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
 * Expand search with PARALLEL queries for speed
 * Pro tier RapidAPI can handle concurrent requests
 */
export async function searchEmployersExpanded(options: SearchOptions): Promise<JSearchJob[]> {
  const startTime = Date.now();
  
  // First, normalize the target role
  const normalizedRoles = normalizeTargetRole(options.targetRole);
  // Take up to 8 roles for parallel search (Pro tier can handle it)
  const rolesToSearch = normalizedRoles.slice(0, 8);
  console.log(`[JSearch] Normalized "${options.targetRole}" to: [${rolesToSearch.join(', ')}]`);
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
    
    console.log(`[JSearch] "${role}": ${jobs.length} jobs, ${newCount} new unique`);
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[JSearch] PARALLEL COMPLETE: ${allJobs.length} unique employers from ${rolesToSearch.length} searches in ${elapsed}s`);
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
    'qc': ['Quality Control', 'QC Inspector', 'Quality Technician', 'Quality Assurance'],
    'qa': ['Quality Assurance', 'QA Technician', 'Quality Control'],
    'lead': ['Team Lead', 'Lead', 'Shift Lead', 'Production Lead'],
    'lead man': ['Team Lead', 'Lead Hand', 'Shift Lead', 'Production Lead'],
    'leadman': ['Team Lead', 'Lead Hand', 'Shift Lead', 'Production Lead'],
    'supervisor': ['Supervisor', 'Shift Supervisor', 'Production Supervisor'],
    'forklift': ['Forklift Operator', 'Forklift Driver', 'Material Handler'],
    'cdl': ['CDL Driver', 'Truck Driver', 'Delivery Driver'],
    'driver': ['Driver', 'Delivery Driver', 'CDL Driver', 'Route Driver'],
    'warehouse': ['Warehouse', 'Warehouse Associate', 'Warehouse Worker'],
    'machine operator': ['Machine Operator', 'CNC Operator', 'Production Operator'],
    'machinist': ['Machinist', 'CNC Machinist', 'Machine Operator'],
    'welder': ['Welder', 'MIG Welder', 'TIG Welder', 'Fabricator'],
    'mechanic': ['Mechanic', 'Maintenance Mechanic', 'Auto Mechanic', 'Diesel Mechanic'],
    'maintenance': ['Maintenance Technician', 'Maintenance Mechanic', 'Facilities Maintenance'],
    'hvac': ['HVAC Technician', 'HVAC Installer', 'HVAC Mechanic'],
    'electrician': ['Electrician', 'Industrial Electrician', 'Maintenance Electrician'],
    'plumber': ['Plumber', 'Plumbing Technician', 'Pipefitter'],
    'carpenter': ['Carpenter', 'Finish Carpenter', 'Construction Carpenter'],
    'assembly': ['Assembler', 'Assembly Line', 'Production Assembler'],
    'picker': ['Order Picker', 'Warehouse Picker', 'Picker Packer'],
    'packer': ['Packer', 'Shipping Packer', 'Warehouse Packer'],
    'shipping': ['Shipping', 'Shipping Clerk', 'Shipping Associate'],
    'receiving': ['Receiving', 'Receiving Clerk', 'Receiving Associate'],
    'inventory': ['Inventory', 'Inventory Control', 'Inventory Specialist'],
    'production': ['Production', 'Production Worker', 'Production Associate'],
    'manufacturing': ['Manufacturing', 'Manufacturing Associate', 'Production'],
    'food': ['Food Production', 'Food Manufacturing', 'Food Processing'],
    'cook': ['Cook', 'Line Cook', 'Prep Cook', 'Kitchen'],
    'kitchen': ['Kitchen', 'Kitchen Staff', 'Food Service'],
    'cleaning': ['Cleaner', 'Janitor', 'Custodian', 'Housekeeper'],
    'janitor': ['Janitor', 'Custodian', 'Cleaner'],
    'security': ['Security Guard', 'Security Officer', 'Security'],
    'landscaping': ['Landscaper', 'Landscape Technician', 'Grounds Maintenance'],
    'construction': ['Construction Worker', 'Construction Laborer', 'General Labor'],
    'laborer': ['General Laborer', 'Construction Laborer', 'Warehouse Laborer'],
    'helper': ['Helper', 'Trade Helper', 'Assistant'],
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
    const fillers = ['role', 'job', 'position', 'work', 'or', 'and', 'the', 'a', 'an', 'in', 'at', 'for', 'to', 'i', 'want', 'looking', 'need', 'something'];
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
    searchTerms.push('General Labor', 'Warehouse', 'Production', 'Manufacturing');
  }
  
  // Dedupe and return
  return Array.from(new Set(searchTerms));
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
  assignTiers,
  extractIndustry,
  convertToEmployers,
};
