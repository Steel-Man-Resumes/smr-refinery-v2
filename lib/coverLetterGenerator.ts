/**
 * COVER LETTER GENERATOR v2.0 - Three Tone Variants
 * 
 * Generates 3 cover letter variants for different situations:
 * - AGGRESSIVE: Bold, confident, achievement-focused (for competitive roles)
 * - PROFESSIONAL: Balanced, traditional, respectful (default/safe choice)
 * - FRIENDLY: Warm, conversational, personable (for smaller companies/culture fit)
 * 
 * All variants include [COMPANY NAME] and [JOB TITLE] placeholders for customization.
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import Anthropic from '@anthropic-ai/sdk';
import type { ForgePayloadV1 } from './types';
import type { ScreeningResponses } from '@/store/refineryStore';
import { API_MODELS } from './constants';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CoverLetterVariant {
  content: string;
  tone: 'aggressive' | 'professional' | 'friendly';
  description: string;
}

export interface CoverLetterVariants {
  aggressive: CoverLetterVariant;
  professional: CoverLetterVariant;
  friendly: CoverLetterVariant;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT: Generate All Three Variants
// ═══════════════════════════════════════════════════════════════════════════

export async function generateCoverLetterVariants(
  payload: ForgePayloadV1,
  screening: ScreeningResponses
): Promise<CoverLetterVariants> {
  
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Build shared context
  const context = buildCoverLetterContext(payload, screening);
  
  // Generate all 3 in parallel for speed
  const [aggressive, professional, friendly] = await Promise.all([
    generateVariant(anthropic, context, 'aggressive'),
    generateVariant(anthropic, context, 'professional'),
    generateVariant(anthropic, context, 'friendly'),
  ]);

  return {
    aggressive: {
      content: aggressive,
      tone: 'aggressive',
      description: 'Bold & Achievement-Focused',
    },
    professional: {
      content: professional,
      tone: 'professional',
      description: 'Balanced & Traditional',
    },
    friendly: {
      content: friendly,
      tone: 'friendly',
      description: 'Warm & Personable',
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT BUILDER
// ═══════════════════════════════════════════════════════════════════════════

interface CoverLetterContext {
  name: string;
  location: string;
  phone: string;
  email: string;
  targetRole: string;
  topAchievements: string[];
  yearsExperience: number;
  keySkills: string[];
  hasBarriers: boolean;
  elevatorPitch: string;
  competitiveAdvantages: string[];
}

function buildCoverLetterContext(
  payload: ForgePayloadV1,
  _screening: ScreeningResponses
): CoverLetterContext {
  
  // Extract top achievements from work history bullets
  const allBullets = payload.work_history?.flatMap(j => j.bullets || []) || [];
  const topAchievements = allBullets
    .filter(b => /\d+/.test(b)) // Prefer bullets with numbers
    .slice(0, 5);
  
  // Calculate years of experience
  const workHistory = payload.work_history || [];
  let yearsExperience = 0;
  if (workHistory.length > 0) {
    const earliest = workHistory[workHistory.length - 1];
    const startYear = parseInt(earliest?.start_date?.match(/\d{4}/)?.[0] || '0');
    yearsExperience = Math.max(0, new Date().getFullYear() - startYear);
  }

  // Get key skills
  const keySkills = [
    ...(payload.skills?.skills?.hard || []).slice(0, 5),
    ...(payload.skills?.skills?.soft || []).slice(0, 3),
  ];

  return {
    name: payload.profile.full_name,
    location: `${payload.profile.city || 'City'}, ${payload.profile.state || 'State'}`,
    phone: payload.profile.phone || '',
    email: payload.profile.email || '',
    targetRole: payload.intake.target_role,
    topAchievements,
    yearsExperience,
    keySkills,
    hasBarriers: (payload.intake.challenges || []).length > 0,
    elevatorPitch: payload.narrative?.elevator_pitch_30s || '',
    competitiveAdvantages: payload.strategy?.competitive_advantages || [],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

async function generateVariant(
  anthropic: Anthropic,
  context: CoverLetterContext,
  tone: 'aggressive' | 'professional' | 'friendly'
): Promise<string> {
  
  const toneInstructions = getToneInstructions(tone);
  
  const prompt = `You are an expert cover letter writer for blue-collar careers. Write a cover letter for:

NAME: ${context.name}
TARGET ROLE: ${context.targetRole}
LOCATION: ${context.location}
YEARS EXPERIENCE: ${context.yearsExperience}+

KEY ACHIEVEMENTS (use these):
${context.topAchievements.map(a => `• ${a}`).join('\n')}

KEY SKILLS: ${context.keySkills.join(', ')}

COMPETITIVE ADVANTAGES: ${context.competitiveAdvantages.join('; ') || 'Solid work ethic and reliability'}

${context.elevatorPitch ? `ELEVATOR PITCH TO REFERENCE: ${context.elevatorPitch}` : ''}

===

TONE REQUIREMENTS - ${tone.toUpperCase()}:
${toneInstructions}

FORMAT REQUIREMENTS:
1. Use [COMPANY NAME] placeholder (user will fill in)
2. Use [JOB TITLE] placeholder (user will fill in)  
3. Use [HIRING MANAGER] or "Hiring Manager" as greeting
4. 3-4 paragraphs maximum
5. Strong opening that grabs attention
6. Middle paragraph(s) highlighting 2-3 specific achievements with NUMBERS
7. Closing with clear call to action
8. Professional but human voice - NOT robotic or generic
9. ${context.hasBarriers ? 'Subtly address any gaps/concerns by focusing on growth and reliability' : 'Emphasize consistency and track record'}

FORBIDDEN PHRASES (never use):
- "I am writing to express my interest"
- "I believe I would be a great fit"
- "Thank you for considering my application"
- "results-driven", "detail-oriented", "team player"
- "proven track record", "seeking opportunity"
- Any clichés

Return ONLY the cover letter text. No JSON, no markdown, no explanation.`;

  try {
    const message = await anthropic.messages.create({
      model: API_MODELS.claude,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    return responseText.trim();
  } catch (e) {
    console.error(`Failed to generate ${tone} cover letter:`, e);
    return getFallbackCoverLetter(context, tone);
  }
}

function getToneInstructions(tone: 'aggressive' | 'professional' | 'friendly'): string {
  switch (tone) {
    case 'aggressive':
      return `
- BOLD and CONFIDENT opening - lead with your biggest achievement
- Use power verbs: "delivered", "drove", "slashed", "generated", "transformed"
- Direct statements, not hedging: "I will bring..." not "I hope to bring..."
- Emphasize results and impact over duties
- Challenge the reader subtly: "Your operation needs someone who can..."
- Shorter sentences, more punch
- Close with confident availability: "I'm ready to discuss how I can deliver these results for [COMPANY NAME]."
- Best for: Competitive industries, high-volume operations, companies that value metrics`;
      
    case 'professional':
      return `
- Balanced and respectful opening - express genuine interest
- Mix of achievements and team/company focus
- Professional warmth without being stiff
- Use measured confidence: "I'm confident that..." 
- Balance "I" statements with company focus
- Standard business letter flow
- Close with polite call to action: "I'd welcome the opportunity to discuss..."
- Best for: Most applications, corporate environments, traditional companies`;
      
    case 'friendly':
      return `
- Warm, conversational opening - show personality
- Emphasize culture fit and teamwork
- Use "we" language when describing past work
- Show enthusiasm without being over-the-top
- Include a genuine reason you're interested in THIS type of company
- Slightly longer sentences, conversational flow
- Close warmly: "I'd love to chat about how we might work together."
- Best for: Small/medium businesses, family-owned companies, culture-focused employers`;
  }
}

function getFallbackCoverLetter(
  context: CoverLetterContext,
  tone: 'aggressive' | 'professional' | 'friendly'
): string {
  const greeting = 'Dear Hiring Manager,';
  const achievement = context.topAchievements[0] || 'consistently meeting operational targets';
  
  if (tone === 'aggressive') {
    return `${greeting}

Your [JOB TITLE] position needs someone who delivers. In my ${context.yearsExperience}+ years, I've ${achievement}. That's what I'll bring to [COMPANY NAME].

My background includes: ${context.keySkills.slice(0, 4).join(', ')}. These aren't just skills on paper—they're proven capabilities that have driven real results.

I'm ready to discuss how I can deliver these results for [COMPANY NAME]. When can we talk?

${context.name}
${context.phone}
${context.email}`;
  }
  
  if (tone === 'friendly') {
    return `${greeting}

I came across your [JOB TITLE] opening at [COMPANY NAME] and got excited—this is exactly the kind of work I love doing.

Over my ${context.yearsExperience}+ years in the field, I've ${achievement}. What I enjoy most is being part of a team that takes pride in getting things done right.

I'd love to chat about how we might work together. Feel free to reach out anytime.

Best,
${context.name}
${context.phone}
${context.email}`;
  }
  
  // Professional (default)
  return `${greeting}

I am writing to apply for the [JOB TITLE] position at [COMPANY NAME]. With ${context.yearsExperience}+ years of experience, I've ${achievement}.

My qualifications include: ${context.keySkills.slice(0, 4).join(', ')}. I'm confident these skills align well with what you're looking for.

I would welcome the opportunity to discuss how my experience can benefit [COMPANY NAME]. Thank you for your consideration.

Sincerely,
${context.name}
${context.phone}
${context.email}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCX CREATION
// ═══════════════════════════════════════════════════════════════════════════

export async function createCoverLetterDOCXV2(
  variant: CoverLetterVariant,
  payload: ForgePayloadV1
): Promise<Buffer> {
  
  const paragraphs = variant.content.split('\n\n').filter(p => p.trim());
  
  const GOLD = 'D4A84B';
  
  const children: Paragraph[] = [
    // Header - Name
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: payload.profile.full_name,
          bold: true,
          size: 28, // 14pt
          font: 'Calibri',
        }),
      ],
    }),
    
    // Contact Info
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: [
            payload.profile.phone,
            payload.profile.email,
          ].filter(Boolean).join('  |  '),
          size: 20,
          font: 'Calibri',
          color: '666666',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `${payload.profile.city}, ${payload.profile.state} ${payload.profile.zip || ''}`.trim(),
          size: 20,
          font: 'Calibri',
          color: '666666',
        }),
      ],
    }),
    
    // Date
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          size: 22,
          font: 'Calibri',
        }),
      ],
    }),
    
    // Variant indicator (subtle)
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: `Style: ${variant.description}`,
          size: 18,
          font: 'Calibri',
          color: GOLD,
          italics: true,
        }),
      ],
    }),
  ];
  
  // Body paragraphs
  paragraphs.forEach((para, idx) => {
    children.push(
      new Paragraph({
        spacing: { after: idx < paragraphs.length - 1 ? 240 : 0 },
        children: [
          new TextRun({
            text: para.trim(),
            size: 22, // 11pt
            font: 'Calibri',
          }),
        ],
      })
    );
  });
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 720,    // 0.5 inch
            right: 720,
            bottom: 720,
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
// HTML PREVIEW
// ═══════════════════════════════════════════════════════════════════════════

export function createCoverLetterPreviewV2(
  variant: CoverLetterVariant,
  payload: ForgePayloadV1
): string {
  
  const paragraphs = variant.content.split('\n\n').filter(p => p.trim());
  const date = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .cover-letter { max-width: 700px; margin: 0 auto; background: white; padding: 50px 60px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { margin-bottom: 20px; }
    .name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
    .contact { font-size: 11px; color: #666; margin-bottom: 3px; }
    .date { font-size: 12px; margin: 15px 0; }
    .tone-badge { display: inline-block; font-size: 10px; color: #D4A84B; font-style: italic; margin-bottom: 20px; }
    .body p { font-size: 12px; line-height: 1.6; margin-bottom: 15px; }
    .body p:last-child { margin-bottom: 0; }
    .placeholder { background: #FDF6E3; padding: 1px 4px; border-radius: 2px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="cover-letter">
    <div class="header">
      <div class="name">${payload.profile.full_name}</div>
      <div class="contact">${payload.profile.phone}  |  ${payload.profile.email}</div>
      <div class="contact">${payload.profile.city}, ${payload.profile.state}</div>
    </div>
    
    <div class="date">${date}</div>
    
    <div class="tone-badge">Style: ${variant.description}</div>
    
    <div class="body">
      ${paragraphs.map(p => {
        // Highlight placeholders
        const highlighted = p
          .replace(/\[COMPANY NAME\]/g, '<span class="placeholder">[COMPANY NAME]</span>')
          .replace(/\[JOB TITLE\]/g, '<span class="placeholder">[JOB TITLE]</span>')
          .replace(/\[HIRING MANAGER\]/g, '<span class="placeholder">[HIRING MANAGER]</span>');
        return `<p>${highlighted}</p>`;
      }).join('')}
    </div>
  </div>
</body>
</html>`;
}
