// =============================================================================
// WHY GOOD FIT GENERATOR - Claude API prompts for personalized employer fit
// File: lib/whyGoodFitGenerator.ts
// =============================================================================

export interface CandidateProfile {
  targetRole: string;
  yearsExperience: string;
  keyMetrics: string[];
  certifications: string[];
  skills: string[];
  barriers?: string;
  city: string;
  state: string;
}

export interface EmployerInfo {
  name: string;
  industry: string;
  jobTitle?: string;
  location?: string;
  description?: string;
}

/**
 * Build the prompt for generating "Why Good Fit" explanation
 */
export function buildWhyGoodFitPrompt(
  employer: EmployerInfo,
  candidate: CandidateProfile
): string {
  return `Generate a "Why Good Fit" explanation for this job seeker applying to this employer.

EMPLOYER:
- Company: ${employer.name}
- Industry: ${employer.industry}
- Job posting: ${employer.jobTitle || `${candidate.targetRole}`}
- Location: ${employer.location || 'Not specified'}
${employer.description ? `- About: ${employer.description.substring(0, 200)}...` : ''}

CANDIDATE:
- Target role: ${candidate.targetRole}
- Experience: ${candidate.yearsExperience} years
- Location: ${candidate.city}, ${candidate.state}
- Key metrics: ${candidate.keyMetrics.join(', ')}
- Certifications: ${candidate.certifications.join(', ')}
- Top skills: ${candidate.skills.slice(0, 5).join(', ')}
${candidate.barriers ? `- Barriers to address: ${candidate.barriers}` : ''}

REQUIREMENTS:
1. Write exactly 2-3 sentences
2. Reference at least ONE specific metric from the candidate's background
3. Connect to something specific about the company or industry
4. Be confident and specific, NOT generic
5. Do NOT use phrases like "would be a good fit" or "aligns well" - be direct
6. If the company is known to be second-chance friendly, mention it

BAD EXAMPLE (too generic):
"Your experience aligns well with their needs. You would be a good fit for this role."

GOOD EXAMPLE:
"Your 28% error reduction and 8,000-SKU inventory management directly matches their high-volume fulfillment operation. They're expanding their Austin facility—growth means supervisor opportunities. Known for promoting from within."

Write the Why Good Fit now (2-3 sentences only, no preamble):`;
}

/**
 * Build batch prompt for multiple employers (more efficient)
 */
export function buildBatchWhyGoodFitPrompt(
  employers: EmployerInfo[],
  candidate: CandidateProfile
): string {
  const employerList = employers
    .map((emp, i) => `${i + 1}. ${emp.name} (${emp.industry})${emp.jobTitle ? ` - ${emp.jobTitle}` : ''}`)
    .join('\n');

  return `Generate "Why Good Fit" explanations for this job seeker applying to multiple employers.

CANDIDATE PROFILE:
- Target role: ${candidate.targetRole}
- Experience: ${candidate.yearsExperience} years
- Location: ${candidate.city}, ${candidate.state}
- Key metrics: ${candidate.keyMetrics.join(', ')}
- Certifications: ${candidate.certifications.join(', ')}
- Top skills: ${candidate.skills.slice(0, 5).join(', ')}
${candidate.barriers ? `- Barriers to address: ${candidate.barriers}` : ''}

EMPLOYERS TO MATCH:
${employerList}

REQUIREMENTS FOR EACH:
1. Write exactly 2-3 sentences per employer
2. Reference at least ONE specific metric from the candidate
3. Connect to something specific about that company/industry
4. Be confident and specific, NOT generic
5. Do NOT use "would be a good fit" or "aligns well"

OUTPUT FORMAT (respond with ONLY this JSON, no markdown):
{
  "fits": [
    { "employer": "Company Name 1", "whyGoodFit": "Your 2-3 sentence explanation here." },
    { "employer": "Company Name 2", "whyGoodFit": "Your 2-3 sentence explanation here." }
  ]
}

Generate the JSON now:`;
}

/**
 * Parse the batch response
 */
export function parseBatchResponse(response: string): Map<string, string> {
  const fits = new Map<string, string>();
  
  try {
    // Clean up response - remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsed = JSON.parse(cleaned);
    
    if (parsed.fits && Array.isArray(parsed.fits)) {
      for (const fit of parsed.fits) {
        if (fit.employer && fit.whyGoodFit) {
          fits.set(fit.employer.toLowerCase(), fit.whyGoodFit);
        }
      }
    }
  } catch (err) {
    console.error('[WhyGoodFit] Failed to parse batch response:', err);
    console.error('[WhyGoodFit] Raw response:', response.substring(0, 500));
  }
  
  return fits;
}

/**
 * Generate fallback Why Good Fit when API fails
 */
export function generateFallbackFit(
  employer: EmployerInfo,
  candidate: CandidateProfile
): string {
  const metric = candidate.keyMetrics[0] || `${candidate.yearsExperience} years of experience`;
  const skill = candidate.skills[0] || candidate.targetRole;
  
  return `Your ${metric} demonstrates the operational excellence ${employer.name} needs in their ${employer.industry.toLowerCase()} operation. Your ${skill} expertise transfers directly to their team environment.`;
}

/**
 * Validate and clean a Why Good Fit response
 */
export function validateWhyGoodFit(text: string): string | null {
  if (!text || typeof text !== 'string') return null;
  
  const cleaned = text.trim();
  
  // Too short
  if (cleaned.length < 50) return null;
  
  // Contains AI refusal
  if (/cannot|unable|don't have|no information/i.test(cleaned)) return null;
  
  // Too generic (contains banned phrases)
  const genericPhrases = [
    'would be a great fit',
    'would be a good fit',
    'aligns perfectly',
    'aligns well with',
    'makes you an ideal candidate',
    'ideal candidate for',
  ];
  
  for (const phrase of genericPhrases) {
    if (cleaned.toLowerCase().includes(phrase)) {
      console.warn(`[WhyGoodFit] Response contains generic phrase: "${phrase}"`);
      // Don't reject, just warn - it's better than nothing
    }
  }
  
  return cleaned;
}

export default {
  buildWhyGoodFitPrompt,
  buildBatchWhyGoodFitPrompt,
  parseBatchResponse,
  generateFallbackFit,
  validateWhyGoodFit,
};
