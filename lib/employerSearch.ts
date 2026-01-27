// =============================================================================
// EMPLOYER SEARCH - JSearch API (RapidAPI Pro) for real job postings
// File: lib/employerSearch.ts
// =============================================================================

import { validateEmployer, ValidatedEmployer, RawEmployerData } from './employerValidation';

const JSEARCH_HOST = 'jsearch.p.rapidapi.com';
const MIN_EMPLOYERS = 50;
const MAX_PAGES = 10; // Pro tier allows more requests

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
  
  console.log(`[JSearch] Starting search: "${targetRole}" in ${city}, ${state}`);
  
  // Fetch multiple pages to get 50+ unique employers
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
        console.error(`[JSearch] Page ${page} failed: ${response.status} ${response.statusText}`);
        
        // If rate limited, wait and retry once
        if (response.status === 429) {
          console.log('[JSearch] Rate limited, waiting 2s and retrying...');
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        
        continue;
      }
      
      const data: JSearchResponse = await response.json();
      
      if (!data.data?.length) {
        console.log(`[JSearch] No more results at page ${page}`);
        break;
      }
      
      // Deduplicate by employer name (case-insensitive)
      let newCount = 0;
      for (const job of data.data) {
        const key = job.employer_name?.toLowerCase().trim();
        if (key && key.length > 2 && !seenEmployers.has(key)) {
          seenEmployers.add(key);
          allJobs.push(job);
          newCount++;
        }
      }
      
      console.log(`[JSearch] Page ${page}: ${data.data.length} jobs, ${newCount} new employers, ${allJobs.length} total unique`);
      
      // Stop if we have enough
      if (allJobs.length >= MIN_EMPLOYERS) {
        console.log(`[JSearch] Reached ${MIN_EMPLOYERS}+ employers, stopping search`);
        break;
      }
      
      // Small delay to be nice to the API
      await new Promise(r => setTimeout(r, 200));
      
    } catch (err) {
      console.error(`[JSearch] Page ${page} error:`, err);
    }
  }
  
  console.log(`[JSearch] Search complete: ${allJobs.length} unique employers found`);
  return allJobs;
}

/**
 * Expand search with alternative queries if initial search doesn't return enough results
 */
export async function searchEmployersExpanded(options: SearchOptions): Promise<JSearchJob[]> {
  let allJobs = await searchEmployers(options);
  
  // If we don't have enough, try alternative search terms
  if (allJobs.length < MIN_EMPLOYERS) {
    console.log(`[JSearch] Only ${allJobs.length} results, trying alternative searches...`);
    
    const alternativeRoles = getAlternativeRoles(options.targetRole);
    const seenEmployers = new Set(allJobs.map(j => j.employer_name?.toLowerCase().trim()));
    
    for (const altRole of alternativeRoles) {
      if (allJobs.length >= MIN_EMPLOYERS) break;
      
      console.log(`[JSearch] Trying alternative: "${altRole}"`);
      
      const altJobs = await searchEmployers({
        ...options,
        targetRole: altRole,
      });
      
      // Add only new employers
      for (const job of altJobs) {
        const key = job.employer_name?.toLowerCase().trim();
        if (key && !seenEmployers.has(key)) {
          seenEmployers.add(key);
          allJobs.push(job);
        }
      }
    }
  }
  
  return allJobs;
}

/**
 * Get alternative role titles to expand search
 */
function getAlternativeRoles(targetRole: string): string[] {
  const role = targetRole.toLowerCase();
  
  if (role.includes('warehouse') || role.includes('distribution')) {
    return [
      'Logistics Supervisor',
      'Shipping Supervisor',
      'Fulfillment Supervisor',
      'Operations Supervisor warehouse',
      'Inventory Supervisor',
    ];
  }
  
  if (role.includes('manufacturing') || role.includes('production')) {
    return [
      'Production Supervisor',
      'Plant Supervisor',
      'Assembly Supervisor',
      'Operations Supervisor manufacturing',
      'Shift Supervisor manufacturing',
    ];
  }
  
  if (role.includes('shipping') || role.includes('receiving')) {
    return [
      'Warehouse Supervisor',
      'Logistics Supervisor',
      'Distribution Supervisor',
      'Dock Supervisor',
    ];
  }
  
  // Generic fallbacks
  return [
    `${targetRole.split(' ')[0]} Lead`,
    `Senior ${targetRole.split(' ')[0]}`,
    targetRole.replace('Supervisor', 'Manager'),
    targetRole.replace('Manager', 'Supervisor'),
  ];
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
