// =============================================================================
// EXPERIENCE CALCULATOR - Single source of truth for years of experience
// File: lib/experienceCalculator.ts
// =============================================================================

export interface WorkHistoryEntry {
  start_date?: string;
  end_date?: string;
  company?: string;
  title?: string;
  is_current?: boolean;
}

// Month name mapping
const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Parse various date formats into a Date object
 * Handles: "March 2021", "Mar 2021", "2021-03", "03/2021", "2021", "Present"
 */
export function parseJobDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const str = dateStr.trim().toLowerCase();
  
  // Handle "Present", "Current", "Now"
  if (/^(present|current|now|today)$/i.test(str)) {
    return new Date();
  }
  
  // Try "Month Year" format: "March 2021", "Mar 2021"
  const monthYearMatch = str.match(/^([a-z]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const month = MONTHS[monthYearMatch[1]];
    const year = parseInt(monthYearMatch[2]);
    if (month !== undefined && year >= 1950 && year <= 2100) {
      return new Date(year, month, 1);
    }
  }
  
  // Try "Year-Month" format: "2021-03", "2021/03"
  const yearMonthMatch = str.match(/^(\d{4})[-\/](\d{1,2})$/);
  if (yearMonthMatch) {
    const year = parseInt(yearMonthMatch[1]);
    const month = parseInt(yearMonthMatch[2]) - 1;
    if (year >= 1950 && year <= 2100 && month >= 0 && month <= 11) {
      return new Date(year, month, 1);
    }
  }
  
  // Try "Month/Year" format: "03/2021", "3/2021"
  const monthSlashYear = str.match(/^(\d{1,2})[-\/](\d{4})$/);
  if (monthSlashYear) {
    const month = parseInt(monthSlashYear[1]) - 1;
    const year = parseInt(monthSlashYear[2]);
    if (year >= 1950 && year <= 2100 && month >= 0 && month <= 11) {
      return new Date(year, month, 1);
    }
  }
  
  // Try just year: "2021"
  const yearOnly = str.match(/^(\d{4})$/);
  if (yearOnly) {
    const year = parseInt(yearOnly[1]);
    if (year >= 1950 && year <= 2100) {
      return new Date(year, 0, 1); // January of that year
    }
  }
  
  // Fallback to Date.parse
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }
  
  console.warn(`[ExperienceCalculator] Could not parse date: "${dateStr}"`);
  return null;
}

/**
 * Calculate total years of experience from work history
 * Returns formatted string like "10+" 
 */
export function calculateTotalExperience(workHistory: WorkHistoryEntry[]): string {
  if (!workHistory || !Array.isArray(workHistory) || workHistory.length === 0) {
    console.warn('[ExperienceCalculator] No work history provided');
    return '';
  }
  
  // Get all valid start dates
  const startDates = workHistory
    .map(job => parseJobDate(job.start_date))
    .filter((d): d is Date => d !== null);
  
  if (startDates.length === 0) {
    console.warn('[ExperienceCalculator] No valid start dates found');
    return '';
  }
  
  // Find earliest start date
  const earliest = new Date(Math.min(...startDates.map(d => d.getTime())));
  const now = new Date();
  
  // Calculate years (accounting for leap years)
  const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
  const years = (now.getTime() - earliest.getTime()) / msPerYear;
  
  // Round down and add "+"
  const rounded = Math.floor(years);
  
  console.log(`[ExperienceCalculator] Earliest: ${earliest.toISOString()}, Years: ${years.toFixed(2)}, Result: ${rounded}+`);
  
  return `${rounded}+`;
}

/**
 * Get numeric years for comparisons (not formatted)
 */
export function getExperienceYears(workHistory: WorkHistoryEntry[]): number {
  if (!workHistory || !Array.isArray(workHistory) || workHistory.length === 0) {
    return 0;
  }
  
  const startDates = workHistory
    .map(job => parseJobDate(job.start_date))
    .filter((d): d is Date => d !== null);
  
  if (startDates.length === 0) return 0;
  
  const earliest = new Date(Math.min(...startDates.map(d => d.getTime())));
  const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
  
  return (Date.now() - earliest.getTime()) / msPerYear;
}

/**
 * Format years for display in different contexts
 */
export function formatExperience(workHistory: WorkHistoryEntry[], style: 'short' | 'long' | 'narrative' = 'short'): string {
  const years = calculateTotalExperience(workHistory);
  if (!years) return '';
  
  switch (style) {
    case 'short':
      return `${years} years`;
    case 'long':
      return `${years} years of experience`;
    case 'narrative':
      const num = parseInt(years);
      if (num >= 10) return `over a decade`;
      if (num >= 5) return `${years} years`;
      return `${years} years`;
    default:
      return `${years} years`;
  }
}

/**
 * Get the earliest and latest dates from work history
 */
export function getWorkHistoryRange(workHistory: WorkHistoryEntry[]): { start: Date | null; end: Date | null } {
  if (!workHistory || workHistory.length === 0) {
    return { start: null, end: null };
  }
  
  const startDates = workHistory
    .map(job => parseJobDate(job.start_date))
    .filter((d): d is Date => d !== null);
  
  const endDates = workHistory
    .map(job => job.is_current ? new Date() : parseJobDate(job.end_date))
    .filter((d): d is Date => d !== null);
  
  return {
    start: startDates.length > 0 ? new Date(Math.min(...startDates.map(d => d.getTime()))) : null,
    end: endDates.length > 0 ? new Date(Math.max(...endDates.map(d => d.getTime()))) : null,
  };
}

export default {
  parseJobDate,
  calculateTotalExperience,
  getExperienceYears,
  formatExperience,
  getWorkHistoryRange,
};
