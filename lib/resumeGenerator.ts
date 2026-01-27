/**
 * RESUME GENERATOR v2.0 - TORI Award Standard
 * 
 * Generates 10x resumes based on TORI Award-winning patterns:
 * - Branded headline that tells a story
 * - Metrics bar with 3-4 biggest numbers
 * - Narrative summary (not generic fluff)
 * - Grouped skills by category
 * - Context line for each job (scope)
 * - Impact headline for each job (the "so what")
 * - Bold numbers throughout
 * - Certifications promoted as differentiators
 * - Employment gaps addressed strategically
 */

import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';
import Anthropic from '@anthropic-ai/sdk';
import type { ForgePayloadV1 } from './types';
import type { ScreeningResponses, PortfolioOptions } from '@/store/refineryStore';
import { API_MODELS } from './constants';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ResumeContentV2 {
  brandedHeadline: string;
  metricsBar: string[];
  summary: string;
  skillGroups: {
    category: string;
    skills: string[];
  }[];
  experience: {
    title: string;
    company: string;
    location: string | null;
    dates: string;
    contextLine: string;
    impactHeadline: string;
    bullets: string[];
  }[];
  certifications: string[];
  education: {
    credential: string;
    institution: string;
    field: string | null;
    year: string | null;
  }[];
  hasGap: boolean;
  gapExplanation: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT: Generate Resume Content
// ═══════════════════════════════════════════════════════════════════════════

export async function generateResumeContentV2(
  payload: ForgePayloadV1,
  screening: ScreeningResponses,
  _options: PortfolioOptions
): Promise<ResumeContentV2> {
  
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Extract and compute base data
  const workHistory = payload.work_history || [];
  const hardSkills = payload.skills?.skills?.hard || [];
  const softSkills = payload.skills?.skills?.soft || [];
  const certifications = payload.certifications_raw || [];
  const hasBarriers = payload.barriers && payload.barriers.challenges?.length > 0;
  
  // Detect employment gaps
  const { hasGap, gapExplanation } = detectEmploymentGap(payload);
  
  // Extract metrics from work history
  const metricsBar = extractTopMetrics(payload);
  
  // Build skill groups
  const skillGroups = buildSkillGroups(hardSkills, softSkills, payload.intake.target_role);
  
  // Generate enhanced content using Claude (branded headline + summary)
  const { brandedHeadline, summary } = await generateEnhancedContent(anthropic, payload, hasGap);
  
  // Generate context lines and impact headlines for each job
  const enhancedExperience = await enhanceWorkHistory(anthropic, payload);
  
  return {
    brandedHeadline,
    metricsBar,
    summary,
    skillGroups,
    experience: enhancedExperience,
    certifications,
    education: payload.education?.map(edu => ({
      credential: edu.credential,
      institution: edu.institution,
      field: edu.field,
      year: edu.year,
    })) || [],
    hasGap,
    gapExplanation,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CLAUDE-POWERED CONTENT GENERATION
// ═══════════════════════════════════════════════════════════════════════════

async function generateEnhancedContent(
  anthropic: Anthropic,
  payload: ForgePayloadV1,
  hasGap: boolean
): Promise<{ brandedHeadline: string; summary: string }> {
  
  const yearsExp = calculateYearsExperience(payload.work_history);
  const currentRole = payload.work_history?.[0]?.title || 'Professional';
  const earliestRole = payload.work_history?.[payload.work_history.length - 1]?.title || currentRole;
  
  // Build bullet summary for context
  const allBullets = payload.work_history?.flatMap(j => j.bullets || []).slice(0, 10) || [];
  
  const prompt = `You are a TORI Award-winning resume writer (Toast of the Resume Industry - the highest honor in professional resume writing). Your resumes WIN competitions because they tell stories, not just list duties.

CANDIDATE DATA:
Name: ${payload.profile.full_name}
Target Role: ${payload.intake.target_role}
Current/Most Recent Role: ${currentRole}
Career Start Role: ${earliestRole}
Years Experience: ${yearsExp}+
Location: ${payload.profile.city}, ${payload.profile.state}

NARRATIVE FROM FORGE (use this):
Archetype: ${payload.narrative?.archetype || 'N/A'}
Positioning: ${payload.narrative?.positioning_strategy || 'N/A'}
Professional Summary: ${payload.narrative?.summary?.professional || 'N/A'}

KEY ACHIEVEMENTS (from work history):
${allBullets.map(b => `• ${b}`).join('\n')}

SKILLS:
Hard: ${payload.skills?.skills?.hard?.slice(0, 8).join(', ') || 'N/A'}
Soft: ${payload.skills?.skills?.soft?.slice(0, 5).join(', ') || 'N/A'}

CERTIFICATIONS: ${payload.certifications_raw?.join(', ') || 'None'}

COMPETITIVE ADVANTAGES: ${payload.strategy?.competitive_advantages?.join('; ') || 'N/A'}

${hasGap ? 'NOTE: This candidate has an employment gap. Address it naturally in the summary by focusing on growth, not excuses.' : ''}

===

Generate TWO things. Return ONLY valid JSON, no other text:

{
  "brandedHeadline": "A powerful 5-10 word headline that goes UNDER their name. It tells their career story or unique value. TORI examples: 'From Naval Flight Decks to the Digital Frontline', 'Sales Powered by Engineering Expertise', 'Building Teams That Build Results'. Make it specific to THIS person's journey from ${earliestRole} to ${payload.intake.target_role}. Be creative but professional.",
  
  "summary": "A 3-4 sentence professional summary that reads like a PITCH, not a list. Start with their identity and biggest proof point (use a specific number). Include what makes them different. End with what they bring to ${payload.intake.target_role} roles. FORBIDDEN PHRASES: 'results-driven', 'detail-oriented', 'team player', 'proven track record', 'seeking opportunity', 'leverage my skills'. Sound like a confident professional, not an AI."
}`;

  try {
    const message = await anthropic.messages.create({
      model: API_MODELS.claude,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        brandedHeadline: parsed.brandedHeadline || `${currentRole} → ${payload.intake.target_role}`,
        summary: parsed.summary || payload.narrative?.summary?.professional || '',
      };
    }
  } catch (e) {
    console.error('Failed to generate enhanced resume content:', e);
  }
  
  // Fallback
  return {
    brandedHeadline: `${yearsExp}+ Years Building Operations Excellence`,
    summary: payload.narrative?.summary?.professional || 'Experienced professional seeking new opportunities.',
  };
}

async function enhanceWorkHistory(
  anthropic: Anthropic,
  payload: ForgePayloadV1
): Promise<ResumeContentV2['experience']> {
  
  const workHistory = payload.work_history || [];
  if (workHistory.length === 0) return [];

  // Build context for Claude
  const jobsContext = workHistory.map((job, idx) => ({
    index: idx,
    title: job.title,
    company: job.company,
    bullets: job.bullets || [],
  }));

  const prompt = `You are a TORI Award-winning resume writer. For each job below, generate:

1. CONTEXT LINE: One line showing scope - team size, budget, inventory value, coverage area, etc. Use numbers. Examples:
   - "$2.3M Daily Inventory | 12 Direct Reports | 15,000+ SKUs"
   - "3-State Territory | 45+ Accounts | $1.8M Annual Revenue"
   - "24/7 Operation | 200+ Daily Orders | 98% On-Time Target"

2. IMPACT HEADLINE: One sentence summarizing their biggest achievement or transformation. Not what they did, but what CHANGED because of them. Examples:
   - "Transformed error-prone fulfillment operation into a high-accuracy system that became the model for other shifts."
   - "Rebuilt underperforming territory into the company's #1 revenue generator in 18 months."
   - "Introduced process improvements that cut overtime costs 40% while maintaining output."

JOBS TO ENHANCE:
${JSON.stringify(jobsContext, null, 2)}

TARGET ROLE: ${payload.intake.target_role}

Return a JSON array matching this structure (same order as input):
[
  {
    "index": 0,
    "contextLine": "...",
    "impactHeadline": "..."
  }
]

Be specific. Use numbers from their bullets when possible. If you can't infer numbers, make reasonable estimates based on job type. Return ONLY the JSON array.`;

  try {
    const message = await anthropic.messages.create({
      model: API_MODELS.claude,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const enhancements = JSON.parse(jsonMatch[0]);
      
      return workHistory.map((job, index) => {
        const enhancement = enhancements.find((e: any) => e.index === index) || {};
        
        return {
          title: job.title,
          company: job.company,
          location: job.location,
          dates: `${job.start_date || ''} - ${job.end_date || 'Present'}`,
          contextLine: enhancement.contextLine || '',
          impactHeadline: enhancement.impactHeadline || '',
          bullets: job.bullets || [],
        };
      });
    }
  } catch (e) {
    console.error('Failed to enhance work history:', e);
  }
  
  // Fallback - return basic structure without enhancements
  return workHistory.map(job => ({
    title: job.title,
    company: job.company,
    location: job.location,
    dates: `${job.start_date || ''} - ${job.end_date || 'Present'}`,
    contextLine: '',
    impactHeadline: '',
    bullets: job.bullets || [],
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA EXTRACTION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function calculateYearsExperience(workHistory: ForgePayloadV1['work_history']): number {
  if (!workHistory || workHistory.length === 0) return 0;
  
  const earliest = workHistory[workHistory.length - 1];
  const startYear = parseInt(earliest?.start_date?.match(/\d{4}/)?.[0] || '0');
  const currentYear = new Date().getFullYear();
  
  return Math.max(0, currentYear - startYear);
}

function extractTopMetrics(payload: ForgePayloadV1): string[] {
  const metrics: string[] = [];
  const allBullets = payload.work_history?.flatMap(job => job.bullets || []) || [];
  const bulletText = allBullets.join(' ');
  
  // Extract percentage achievements
  const percentMatch = bulletText.match(/(\d+)%\s*(?:reduction|increase|improvement|growth|accuracy|on-time|efficiency|decrease)/i);
  if (percentMatch) {
    metrics.push(`${percentMatch[1]}% ${percentMatch[0].split('%')[1].trim()}`);
  }
  
  // Extract dollar amounts
  const dollarMatch = bulletText.match(/\$[\d,.]+[KMB]?(?:\s*(?:in|of|worth|budget|revenue|savings|inventory))?/i);
  if (dollarMatch) {
    const amount = dollarMatch[0].match(/\$[\d,.]+[KMB]?/)?.[0] || '';
    const context = dollarMatch[0].replace(amount, '').trim() || 'Accountability';
    metrics.push(`${amount} ${context}`.trim());
  }
  
  // Extract team sizes
  const teamMatch = bulletText.match(/(\d+)[\s-]*(?:person|member|employee|associate|staff|direct report|team member)/i);
  if (teamMatch) {
    metrics.push(`${teamMatch[1]}-Person Team`);
  }
  
  // Extract years experience
  const years = calculateYearsExperience(payload.work_history);
  if (years > 0 && metrics.length < 4) {
    metrics.push(`${years}+ Years Experience`);
  }
  
  // Extract certifications count
  if (payload.certifications_raw?.length && metrics.length < 4) {
    const certCount = payload.certifications_raw.length;
    metrics.push(`${certCount} Certification${certCount > 1 ? 's' : ''}`);
  }
  
  // Fill remaining slots with meaningful defaults
  if (metrics.length < 3) {
    // Look for quantities
    const qtyMatch = bulletText.match(/(\d{1,3}(?:,\d{3})*)\+?\s*(?:sku|product|order|customer|account|unit|truck)/i);
    if (qtyMatch) {
      metrics.push(qtyMatch[0].trim());
    }
  }
  
  return metrics.slice(0, 4);
}

function detectEmploymentGap(payload: ForgePayloadV1): { hasGap: boolean; gapExplanation: string | null } {
  const challenges = payload.intake.challenges || [];
  const hasGapChallenge = challenges.some(c => 
    c.toLowerCase().includes('gap') || 
    c.toLowerCase().includes('unemploy') ||
    c.toLowerCase().includes('time off') ||
    c.toLowerCase().includes('career break')
  );
  
  // Also check work history for gaps > 6 months
  const workHistory = payload.work_history || [];
  let hasTimelineGap = false;
  
  for (let i = 0; i < workHistory.length - 1; i++) {
    const currentEnd = workHistory[i].end_date;
    const nextStart = workHistory[i + 1]?.start_date;
    
    if (currentEnd && nextStart) {
      // Simple check - if there's no overlap and dates seem far apart
      const endYear = parseInt(currentEnd.match(/\d{4}/)?.[0] || '0');
      const startYear = parseInt(nextStart.match(/\d{4}/)?.[0] || '0');
      if (endYear - startYear > 1) {
        hasTimelineGap = true;
        break;
      }
    }
  }
  
  const hasGap = hasGapChallenge || hasTimelineGap;
  
  // Get gap explanation from barriers if available
  let gapExplanation: string | null = null;
  if (hasGap && payload.barriers?.challenges) {
    const gapBarrier = payload.barriers.challenges.find(c => 
      c.type.toLowerCase().includes('gap') || 
      c.type.toLowerCase().includes('employment')
    );
    if (gapBarrier) {
      gapExplanation = gapBarrier.reframe;
    }
  }
  
  return { hasGap, gapExplanation };
}

function buildSkillGroups(
  hardSkills: string[],
  softSkills: string[],
  targetRole: string
): ResumeContentV2['skillGroups'] {
  
  const categories: Record<string, string[]> = {
    'Leadership & Management': [],
    'Operations & Technical': [],
    'Safety & Compliance': [],
    'Tools & Systems': [],
  };
  
  const leadershipKeywords = ['team', 'lead', 'manage', 'train', 'supervis', 'mentor', 'coordinat', 'schedul', 'staff', 'hire'];
  const safetyKeywords = ['osha', 'safety', 'compliance', 'regulat', 'hazard', 'incident', 'first aid', 'cpr', 'lockout', 'tagout'];
  const toolsKeywords = ['software', 'system', 'wms', 'erp', 'excel', 'computer', 'rf', 'scan', 'barcode', 'sap', 'oracle', 'microsoft'];
  
  const allSkills = [...hardSkills, ...softSkills];
  
  allSkills.forEach(skill => {
    const lower = skill.toLowerCase();
    
    if (leadershipKeywords.some(k => lower.includes(k))) {
      categories['Leadership & Management'].push(skill);
    } else if (safetyKeywords.some(k => lower.includes(k))) {
      categories['Safety & Compliance'].push(skill);
    } else if (toolsKeywords.some(k => lower.includes(k))) {
      categories['Tools & Systems'].push(skill);
    } else {
      categories['Operations & Technical'].push(skill);
    }
  });
  
  // Filter empty categories and limit skills per category
  return Object.entries(categories)
    .filter(([_, skills]) => skills.length > 0)
    .map(([category, skills]) => ({
      category,
      skills: skills.slice(0, 6),
    }));
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCX CREATION - TORI VISUAL STANDARD
// ═══════════════════════════════════════════════════════════════════════════

export async function createResumeDOCXV2(
  content: ResumeContentV2,
  payload: ForgePayloadV1
): Promise<Buffer> {
  
  // Brand colors
  const GOLD = 'D4A84B';
  const DARK = '1a1a1a';
  const GRAY = '666666';
  const LIGHT_GOLD_BG = 'FDF6E3';
  
  const children: Paragraph[] = [];
  
  // ═══════════════════════════════════════════════════════════════════════
  // HEADER SECTION
  // ═══════════════════════════════════════════════════════════════════════
  
  // Name - Large, centered, uppercase
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: payload.profile.full_name.toUpperCase(),
          bold: true,
          size: 44, // 22pt
          font: 'Calibri',
          color: DARK,
        }),
      ],
    })
  );
  
  // Branded Headline - Gold, italic, centered
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      children: [
        new TextRun({
          text: content.brandedHeadline,
          bold: true,
          size: 26, // 13pt
          font: 'Calibri',
          color: GOLD,
          italics: true,
        }),
      ],
    })
  );
  
  // Metrics Bar - Light gold background, separator bars
  if (content.metricsBar.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 140 },
        shading: { fill: LIGHT_GOLD_BG },
        border: {
          top: { color: GOLD, size: 8, style: BorderStyle.SINGLE, space: 1 },
          bottom: { color: GOLD, size: 8, style: BorderStyle.SINGLE, space: 1 },
        },
        children: [
          new TextRun({
            text: '  ' + content.metricsBar.join('   ┃   ') + '  ',
            bold: true,
            size: 22, // 11pt
            font: 'Calibri',
            color: DARK,
          }),
        ],
      })
    );
  }
  
  // Contact Info - Centered, gray, smaller
  const contactParts = [
    payload.profile.phone,
    payload.profile.email,
    `${payload.profile.city}, ${payload.profile.state} ${payload.profile.zip || ''}`.trim(),
  ].filter(Boolean);
  
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: contactParts.join('  ◆  '),
          size: 20, // 10pt
          font: 'Calibri',
          color: GRAY,
        }),
      ],
    })
  );
  
  // ═══════════════════════════════════════════════════════════════════════
  // PROFESSIONAL SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  
  children.push(createSectionHeader('PROFESSIONAL SUMMARY', GOLD));
  
  children.push(
    new Paragraph({
      spacing: { after: 280 },
      children: [
        new TextRun({
          text: content.summary,
          size: 22,
          font: 'Calibri',
        }),
      ],
    })
  );
  
  // ═══════════════════════════════════════════════════════════════════════
  // CORE COMPETENCIES (Grouped Skills)
  // ═══════════════════════════════════════════════════════════════════════
  
  if (content.skillGroups.length > 0) {
    children.push(createSectionHeader('CORE COMPETENCIES', GOLD));
    
    content.skillGroups.forEach(group => {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: `${group.category}: `,
              bold: true,
              size: 21,
              font: 'Calibri',
              color: DARK,
            }),
            new TextRun({
              text: group.skills.join('  ┃  '),
              size: 21,
              font: 'Calibri',
            }),
          ],
        })
      );
    });
    
    children.push(new Paragraph({ spacing: { after: 120 } }));
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PROFESSIONAL EXPERIENCE
  // ═══════════════════════════════════════════════════════════════════════
  
  children.push(createSectionHeader('PROFESSIONAL EXPERIENCE', GOLD));
  
  content.experience.forEach((job, index) => {
    // Job Title - Bold, uppercase, prominent
    children.push(
      new Paragraph({
        spacing: { before: index > 0 ? 280 : 140, after: 60 },
        children: [
          new TextRun({
            text: job.title.toUpperCase(),
            bold: true,
            size: 24, // 12pt
            font: 'Calibri',
            color: DARK,
          }),
        ],
      })
    );
    
    // Company | Location | Dates
    const companyLine = [
      job.company,
      job.location,
      job.dates,
    ].filter(Boolean).join('  │  ');
    
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: companyLine,
            size: 21,
            font: 'Calibri',
            italics: true,
            color: GRAY,
          }),
        ],
      })
    );
    
    // Context Line (scope) - Light gray background
    if (job.contextLine) {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          shading: { fill: 'F5F5F5' },
          children: [
            new TextRun({
              text: '  ' + job.contextLine + '  ',
              size: 20,
              font: 'Calibri',
              bold: true,
              color: DARK,
            }),
          ],
        })
      );
    }
    
    // Impact Headline - Italic, story of transformation
    if (job.impactHeadline) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: job.impactHeadline,
              size: 21,
              font: 'Calibri',
              italics: true,
            }),
          ],
        })
      );
    }
    
    // Bullets with bold numbers
    job.bullets.forEach(bullet => {
      children.push(createBulletWithBoldNumbers(bullet));
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════
  // CERTIFICATIONS (if any)
  // ═══════════════════════════════════════════════════════════════════════
  
  if (content.certifications.length > 0) {
    children.push(createSectionHeader('CERTIFICATIONS & CREDENTIALS', GOLD));
    
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: content.certifications.join('  │  '),
            size: 21,
            font: 'Calibri',
          }),
        ],
      })
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // EDUCATION (if any)
  // ═══════════════════════════════════════════════════════════════════════
  
  if (content.education.length > 0) {
    children.push(createSectionHeader('EDUCATION', GOLD));
    
    content.education.forEach(edu => {
      const eduLine = [
        edu.credential + (edu.field ? `, ${edu.field}` : ''),
        edu.institution,
        edu.year,
      ].filter(Boolean).join('  │  ');
      
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: eduLine,
              size: 21,
              font: 'Calibri',
            }),
          ],
        })
      );
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // BUILD DOCUMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 576,    // 0.4 inch (tighter margins)
            right: 720,  // 0.5 inch
            bottom: 576,
            left: 720,
          },
        },
      },
      children,
    }],
  });
  
  return await Packer.toBuffer(doc);
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCX HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function createSectionHeader(text: string, accentColor: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 140 },
    border: {
      bottom: {
        color: accentColor,
        size: 12,
        style: BorderStyle.SINGLE,
        space: 2,
      },
    },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 26, // 13pt
        font: 'Calibri',
        color: accentColor,
      }),
    ],
  });
}

function createBulletWithBoldNumbers(text: string): Paragraph {
  // Split text to identify numbers/metrics to bold
  const parts = text.split(/(\d+[%$,.\d]*[KMB]?|\$[\d,.]+ ?[KMB]?)/gi);
  
  const textRuns: TextRun[] = [
    new TextRun({
      text: '• ',
      size: 21,
      font: 'Calibri',
    }),
  ];
  
  parts.forEach(part => {
    if (part && /\d/.test(part)) {
      // Contains numbers - bold it
      textRuns.push(
        new TextRun({
          text: part,
          bold: true,
          size: 21,
          font: 'Calibri',
        })
      );
    } else if (part) {
      textRuns.push(
        new TextRun({
          text: part,
          size: 21,
          font: 'Calibri',
        })
      );
    }
  });
  
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360 },
    children: textRuns,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// HTML PREVIEW GENERATION
// ═══════════════════════════════════════════════════════════════════════════

export function createResumePreviewV2(
  content: ResumeContentV2,
  payload: ForgePayloadV1
): string {
  
  const contact = [
    payload.profile.phone,
    payload.profile.email,
    `${payload.profile.city}, ${payload.profile.state}`,
  ].filter(Boolean).join('  ◆  ');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .resume { max-width: 850px; margin: 0 auto; background: white; padding: 40px 50px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 20px; }
    .name { font-size: 28px; font-weight: bold; letter-spacing: 2px; color: #1a1a1a; margin-bottom: 8px; }
    .headline { font-size: 14px; color: #D4A84B; font-style: italic; font-weight: bold; margin-bottom: 12px; }
    .metrics-bar { background: #FDF6E3; border-top: 3px solid #D4A84B; border-bottom: 3px solid #D4A84B; padding: 10px 15px; font-weight: bold; font-size: 12px; margin-bottom: 12px; }
    .contact { font-size: 11px; color: #666; }
    .section-header { color: #D4A84B; font-weight: bold; font-size: 14px; border-bottom: 2px solid #D4A84B; padding-bottom: 4px; margin: 20px 0 12px 0; }
    .summary { font-size: 12px; line-height: 1.6; margin-bottom: 15px; }
    .skill-group { font-size: 11px; margin-bottom: 8px; }
    .skill-category { font-weight: bold; }
    .job { margin-bottom: 18px; }
    .job-title { font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
    .job-meta { font-size: 11px; color: #666; font-style: italic; margin-bottom: 6px; }
    .context-line { background: #f5f5f5; padding: 6px 10px; font-size: 11px; font-weight: bold; margin-bottom: 6px; }
    .impact-headline { font-size: 11px; font-style: italic; margin-bottom: 8px; }
    .bullets { list-style: disc; padding-left: 20px; font-size: 11px; }
    .bullets li { margin-bottom: 4px; line-height: 1.4; }
    .certs, .edu { font-size: 11px; }
  </style>
</head>
<body>
  <div class="resume">
    <div class="header">
      <div class="name">${payload.profile.full_name.toUpperCase()}</div>
      <div class="headline">${content.brandedHeadline}</div>
      ${content.metricsBar.length > 0 ? `<div class="metrics-bar">${content.metricsBar.join('  ┃  ')}</div>` : ''}
      <div class="contact">${contact}</div>
    </div>
    
    <div class="section-header">PROFESSIONAL SUMMARY</div>
    <div class="summary">${content.summary}</div>
    
    ${content.skillGroups.length > 0 ? `
      <div class="section-header">CORE COMPETENCIES</div>
      ${content.skillGroups.map(g => `
        <div class="skill-group">
          <span class="skill-category">${g.category}:</span> ${g.skills.join('  ┃  ')}
        </div>
      `).join('')}
    ` : ''}
    
    <div class="section-header">PROFESSIONAL EXPERIENCE</div>
    ${content.experience.map(job => `
      <div class="job">
        <div class="job-title">${job.title.toUpperCase()}</div>
        <div class="job-meta">${[job.company, job.location, job.dates].filter(Boolean).join('  │  ')}</div>
        ${job.contextLine ? `<div class="context-line">${job.contextLine}</div>` : ''}
        ${job.impactHeadline ? `<div class="impact-headline">${job.impactHeadline}</div>` : ''}
        <ul class="bullets">
          ${job.bullets.map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>
    `).join('')}
    
    ${content.certifications.length > 0 ? `
      <div class="section-header">CERTIFICATIONS & CREDENTIALS</div>
      <div class="certs">${content.certifications.join('  │  ')}</div>
    ` : ''}
    
    ${content.education.length > 0 ? `
      <div class="section-header">EDUCATION</div>
      ${content.education.map(edu => `
        <div class="edu">${[edu.credential + (edu.field ? `, ${edu.field}` : ''), edu.institution, edu.year].filter(Boolean).join('  │  ')}</div>
      `).join('')}
    ` : ''}
  </div>
</body>
</html>`;
}
