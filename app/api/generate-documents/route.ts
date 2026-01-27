import { createPortfolioHTML } from '@/lib/portfolioGenerator';
import { generateResumeContentV2, createResumeDOCXV2, createResumePreviewV2, type ResumeContentV2 } from '@/lib/resumeGenerator';
import { generateCoverLetterVariants, createCoverLetterDOCXV2, createCoverLetterPreviewV2, type CoverLetterVariants } from '@/lib/coverLetterGenerator';
import { createQuickStartGuideDOCX } from '@/lib/quickStartGenerator';
import { createSalaryNegotiationDOCX } from '@/lib/salaryNegotiationGenerator';
import { createInterviewPrepDOCX } from '@/lib/interviewPrepGenerator';
import { validateEmployer, validateEmployerName, type ValidatedEmployer } from '@/lib/employerValidation';
import { calculateTotalExperience } from '@/lib/experienceCalculator';
import { searchEmployersExpanded, assignTiers } from '@/lib/employerSearch';
import { COLORS, createHeaderBox, createEmployerCard, createScriptBox, createCalloutBox, createWeekHeader, createDayBox } from '@/lib/documentStyles';
import { buildBatchWhyGoodFitPrompt, parseBatchResponse, generateFallbackFit, validateWhyGoodFit } from '@/lib/whyGoodFitGenerator';
import { generateTargetEmployersDOCX } from '@/lib/targetEmployersGenerator';
import { generate30DayActionPlanDOCX } from '@/lib/actionPlanGenerator';
import { generateAlloyReportDOCX } from '@/lib/alloyReportGenerator';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType } from 'docx';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import type { ForgePayloadV1 } from '@/lib/types';
import type { ScreeningResponses, PortfolioOptions } from '@/store/refineryStore';
import { API_MODELS } from '@/lib/constants';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Perplexity API for research with retry logic
async function perplexitySearch(query: string, retries: number = 3): Promise<string> {
  // Validate API key exists
  if (!process.env.PERPLEXITY_API_KEY) {
    console.error('PERPLEXITY_API_KEY not configured');
    return '';
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'user',
              content: query,
            },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Check for rate limit (429) or server errors (5xx)
      if (response.status === 429 || response.status >= 500) {
        if (attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.warn(`Perplexity API rate limited or error (${response.status}), retrying in ${waitTime}ms... (attempt ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Perplexity API error: ${response.status} ${response.statusText}`);
        console.error(`Error body: ${errorBody}`);
        console.error(`Query was: ${query.substring(0, 200)}...`);
        return '';
      }

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content || '';

      if (!result) {
        console.warn('Perplexity API returned empty response');
        console.warn(`Response data: ${JSON.stringify(data)}`);
      }

      return result;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Perplexity API timeout after 30s');
      } else {
        console.error('Perplexity API error:', error.message || error);
      }

      // Retry on network errors
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`Retrying Perplexity request in ${waitTime}ms... (attempt ${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      return '';
    }
  }

  return '';
}

// RapidAPI JSearch for job listings with retry logic
async function searchJobs(
  role: string,
  location: string,
  shiftPreference?: string,
  limit: number = 50,
  retries: number = 3
): Promise<any[]> {
  // Validate API key exists
  if (!process.env.RAPIDAPI_KEY) {
    console.error('RAPIDAPI_KEY not configured');
    return [];
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

      // Build query with shift preference if provided
      const shiftSuffix = shiftPreference && shiftPreference !== 'any' ? ` ${shiftPreference} shift` : '';
      const searchQuery = `${role}${shiftSuffix} in ${location}`;

      const params = new URLSearchParams({
        query: searchQuery,
        page: '1',
        num_pages: '1',
        date_posted: 'month',
      });

      const response = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Check for rate limit (429) or server errors (5xx)
      if (response.status === 429 || response.status >= 500) {
        if (attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.warn(`RapidAPI rate limited or error (${response.status}), retrying in ${waitTime}ms... (attempt ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }

      if (!response.ok) {
        console.error(`RapidAPI error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      const jobs = data.data?.slice(0, limit) || [];

      if (jobs.length === 0) {
        console.warn(`RapidAPI returned no jobs for query: ${searchQuery}`);
      } else {
        console.log(`RapidAPI returned ${jobs.length} jobs for: ${searchQuery}`);
      }

      return jobs;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('RapidAPI timeout after 20s');
      } else {
        console.error('RapidAPI JSearch error:', error.message || error);
      }

      // Retry on network errors
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`Retrying RapidAPI request in ${waitTime}ms... (attempt ${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      return [];
    }
  }

  return [];
}

export async function POST(req: NextRequest) {
  try {
    // Validate required API keys
    const missingKeys = [];
    if (!process.env.ANTHROPIC_API_KEY) missingKeys.push('ANTHROPIC_API_KEY');
    if (!process.env.PERPLEXITY_API_KEY) missingKeys.push('PERPLEXITY_API_KEY');
    if (!process.env.RAPIDAPI_KEY) missingKeys.push('RAPIDAPI_KEY');

    if (missingKeys.length > 0) {
      console.error('Missing required API keys:', missingKeys.join(', '));
      return NextResponse.json(
        { error: `Missing required API keys: ${missingKeys.join(', ')}` },
        { status: 500 }
      );
    }

    const { forgePayload, screeningResponses, portfolioOptions } = await req.json() as {
      forgePayload: ForgePayloadV1;
      screeningResponses: ScreeningResponses;
      portfolioOptions: PortfolioOptions;
    };

    if (!forgePayload || !forgePayload.profile) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log('Starting document generation for:', forgePayload.profile.full_name);

    // ========================================================================
    // FETCH 50+ REAL EMPLOYERS FROM JSEARCH API (RapidAPI) FIRST
    // ========================================================================
    const targetRole = forgePayload.intake?.target_role;
    const city = forgePayload.profile?.city;
    const state = forgePayload.profile?.state;
    const apiKey = process.env.RAPIDAPI_KEY;

    console.log('[DEBUG] Payload structure:', {
      hasIntake: !!forgePayload.intake,
      hasProfile: !!forgePayload.profile,
      targetRole,
      city,
      state,
      apiKeyExists: !!apiKey,
      apiKeyLength: apiKey?.length
    });

    console.log(`Fetching 50+ employers for: ${targetRole} in ${city}, ${state}`);

    // Validate required parameters
    if (!targetRole || !city || !state || !apiKey) {
      console.warn('[WARNING] Missing required parameters for JSearch API:');
      console.warn(`  targetRole: ${targetRole || 'MISSING'}`);
      console.warn(`  city: ${city || 'MISSING'}`);
      console.warn(`  state: ${state || 'MISSING'}`);
      console.warn(`  apiKey: ${apiKey ? 'EXISTS' : 'MISSING'}`);
      console.warn('  Skipping JSearch API call, using Forge employers only');
    } else {
      try {
        const jobResults = await searchEmployersExpanded({
          targetRole,
          city,
          state,
          apiKey,
          datePosted: 'month',
        });

      // Assign tiers based on job posting recency
      const tiers = assignTiers(jobResults);

      // Convert JSearch results to employer format matching ForgePayloadV1 schema
      const fetchedEmployers = jobResults.map((job: any) => ({
        name: job.employer_name,
        business_type: job.employer_company_type || 'Employer',
        location: `${job.job_city || forgePayload.profile.city}, ${job.job_state || forgePayload.profile.state}`,
        why_good_fit: `Active hiring: ${job.job_title || 'See application'}`, // Will be enhanced by generators if needed
        reputation: 'unknown' as const,
        how_to_apply: job.job_apply_link || job.employer_website || 'Visit company website',
        second_chance_friendly: null,
        source: 'JSearch API',
      }));

      // Merge with any existing employers from Forge
      const existingEmployers = forgePayload.research?.target_employers || [];
      const allEmployers = [...fetchedEmployers, ...existingEmployers];

      // Deduplicate by name and take first 50
      const uniqueEmployers = Array.from(
        new Map(allEmployers.map(e => [e.name.toLowerCase(), e])).values()
      ).slice(0, 50);

      // Update payload with fetched employers
      if (!forgePayload.research) {
        forgePayload.research = {} as any;
      }
      forgePayload.research.target_employers = uniqueEmployers;

      console.log(`✓ Fetched and populated ${uniqueEmployers.length} employers (${fetchedEmployers.length} from JSearch API)`);
    } catch (error) {
      console.error('Error fetching employers from JSearch:', error);
      // Continue with Forge employers if API fails
      console.log('Continuing with existing Forge employers...');
    }
  }

    // Generate TORI-standard resume content using Claude (V2)
    const resumeContent = await generateResumeContentV2(forgePayload, screeningResponses, portfolioOptions);

    // Generate cover letter variants (3 tones) using Claude
    const coverLetterVariants = await generateCoverLetterVariants(forgePayload, screeningResponses);

    // Create Word documents - Resume uses V2 TORI standard
    const resumeDOCX = await createResumeDOCXV2(resumeContent, forgePayload);
    
    // Create cover letter DOCXs for all 3 variants
    const [coverLetterAggressiveDOCX, coverLetterProfessionalDOCX, coverLetterFriendlyDOCX] = await Promise.all([
      createCoverLetterDOCXV2(coverLetterVariants.aggressive, forgePayload),
      createCoverLetterDOCXV2(coverLetterVariants.professional, forgePayload),
      createCoverLetterDOCXV2(coverLetterVariants.friendly, forgePayload),
    ]);

    // Generate Target Employers first (so we can reference them in Action Plan) - TORI STYLED
    const { docx: targetEmployersDOCX, employers: employersList } = await generateTargetEmployersDOCX(forgePayload);

    // Generate Action Plan with access to employer list - TORI STYLED
    const actionPlanDOCX = await generate30DayActionPlanDOCX(forgePayload, employersList);
    const portfolioHTML = createPortfolioHTML(forgePayload, portfolioOptions);

    // Generate Alloy Report if barriers exist - TORI STYLED
    let alloyReportDOCX: Buffer | null = null;
    if (forgePayload.barriers && forgePayload.barriers.challenges?.length > 0) {
      alloyReportDOCX = await generateAlloyReportDOCX(forgePayload);
    }

    // Generate bonus materials if requested
    let jobTrackerExcel: Buffer | null = null;
    if (portfolioOptions.extras_job_tracker) {
      jobTrackerExcel = await createJobTrackerExcel(forgePayload);
    }

    // Generate Quick Start Guide if requested
    let quickStartGuideDOCX: Buffer | null = null;
    if (portfolioOptions.extras_quick_start) {
      quickStartGuideDOCX = await createQuickStartGuideDOCX(forgePayload);
    }

    // Generate Salary Negotiation Cheat Sheet if requested
    let salaryNegotiationDOCX: Buffer | null = null;
    if (portfolioOptions.extras_salary_negotiation) {
      salaryNegotiationDOCX = await createSalaryNegotiationDOCX(forgePayload);
    }

    // Generate Interview Prep Sheet if requested
    let interviewPrepDOCX: Buffer | null = null;
    if (portfolioOptions.extras_interview_prep) {
      interviewPrepDOCX = await createInterviewPrepDOCX(forgePayload);
    }

    // Convert to base64 for storage
    const resumeBase64 = Buffer.from(resumeDOCX).toString('base64');
    
    // Cover letter variants base64
    const coverLetterAggressiveBase64 = Buffer.from(coverLetterAggressiveDOCX).toString('base64');
    const coverLetterProfessionalBase64 = Buffer.from(coverLetterProfessionalDOCX).toString('base64');
    const coverLetterFriendlyBase64 = Buffer.from(coverLetterFriendlyDOCX).toString('base64');
    
    const actionPlanBase64 = Buffer.from(actionPlanDOCX).toString('base64');
    const targetEmployersBase64 = Buffer.from(targetEmployersDOCX).toString('base64');
    const alloyReportBase64 = alloyReportDOCX ? Buffer.from(alloyReportDOCX).toString('base64') : null;
    const jobTrackerBase64 = jobTrackerExcel ? Buffer.from(jobTrackerExcel).toString('base64') : null;
    const quickStartGuideBase64 = quickStartGuideDOCX ? Buffer.from(quickStartGuideDOCX).toString('base64') : null;
    const salaryNegotiationBase64 = salaryNegotiationDOCX ? Buffer.from(salaryNegotiationDOCX).toString('base64') : null;
    const interviewPrepBase64 = interviewPrepDOCX ? Buffer.from(interviewPrepDOCX).toString('base64') : null;

    // Create HTML previews - Resume uses V2 TORI standard
    const resumePreview = createResumePreviewV2(resumeContent, forgePayload);
    
    // Cover letter previews for all 3 variants
    const coverLetterAggressivePreview = createCoverLetterPreviewV2(coverLetterVariants.aggressive, forgePayload);
    const coverLetterProfessionalPreview = createCoverLetterPreviewV2(coverLetterVariants.professional, forgePayload);
    const coverLetterFriendlyPreview = createCoverLetterPreviewV2(coverLetterVariants.friendly, forgePayload);

    return NextResponse.json({
      success: true,
      documents: {
        resume: {
          content: resumeBase64,
          preview: resumePreview,
        },
        coverLetter: {
          aggressive: {
            content: coverLetterAggressiveBase64,
            preview: coverLetterAggressivePreview,
            description: coverLetterVariants.aggressive.description,
          },
          professional: {
            content: coverLetterProfessionalBase64,
            preview: coverLetterProfessionalPreview,
            description: coverLetterVariants.professional.description,
          },
          friendly: {
            content: coverLetterFriendlyBase64,
            preview: coverLetterFriendlyPreview,
            description: coverLetterVariants.friendly.description,
          },
        },
        actionPlan: {
          content: actionPlanBase64,
        },
        targetEmployers: {
          content: targetEmployersBase64,
        },
        portfolio: {
          content: portfolioHTML,
        },
        alloyReport: alloyReportBase64 ? {
          content: alloyReportBase64,
        } : null,
        jobTracker: jobTrackerBase64 ? {
          content: jobTrackerBase64,
        } : null,
        quickStartGuide: quickStartGuideBase64 ? {
          content: quickStartGuideBase64,
        } : null,
        salaryNegotiation: salaryNegotiationBase64 ? {
          content: salaryNegotiationBase64,
        } : null,
        interviewPrep: interviewPrepBase64 ? {
          content: interviewPrepBase64,
        } : null,
      },
    });
  } catch (error: any) {
    console.error('Document generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Document generation failed' },
      { status: 500 }
    );
  }
}

async function generateResumeContent(
  payload: ForgePayloadV1,
  screening: ScreeningResponses,
  options: PortfolioOptions
) {
  // Build resume directly from payload data - no Claude generation needed
  // This eliminates parsing issues and duplication bugs

  const summary = payload.narrative?.summary?.professional ||
                  'Experienced professional seeking new opportunities.';

  const skills = [
    ...(payload.skills?.skills?.hard || []),
    ...(payload.skills?.skills?.soft || [])
  ].slice(0, 12); // Top 12 skills

  return {
    summary,
    skills,
    workHistory: payload.work_history || [],
    education: payload.education || [],
    certifications: payload.certifications_raw || []
  };
}

async function generateCoverLetterContent(
  payload: ForgePayloadV1,
  screening: ScreeningResponses
) {
  const prompt = `You are an expert cover letter writer specializing in blue-collar and working-class careers.

Generate a professional cover letter template based on this career intelligence data:

PROFILE:
Name: ${payload.profile.full_name}
Location: ${payload.profile.city}, ${payload.profile.state}

TARGET ROLE: ${payload.intake.target_role}

NARRATIVE:
${JSON.stringify(payload.narrative, null, 2)}

STRATEGY:
${JSON.stringify(payload.strategy, null, 2)}

BARRIERS (if any):
${payload.barriers ? JSON.stringify(payload.barriers, null, 2) : 'None'}

SCREENING CONTEXT (PRIVATE - use to inform tone, never include directly):
${JSON.stringify(screening, null, 2)}

INSTRUCTIONS:
1. Create a professional cover letter template that can be customized for different employers
2. Use placeholders like [COMPANY NAME], [JOB TITLE], [HOW YOU FOUND THIS JOB]
3. Lead with enthusiasm and specific interest in the role
4. Highlight 2-3 key achievements or skills that match the target role
5. Address any potential concerns subtly and positively (if barriers exist)
6. Close with a strong call to action
7. Keep it to 3-4 paragraphs maximum
8. Use conversational but professional language
9. DO NOT reference screening information directly

Return ONLY the cover letter content in plain text. No JSON, no markdown.`;

  const message = await anthropic.messages.create({
    model: API_MODELS.claude,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  return content.type === 'text' ? content.text : '';
}

async function generateFollowUpEmail(payload: ForgePayloadV1) {
  const prompt = `Generate a brief, professional follow-up email template for ${payload.profile.full_name} to use 3-5 days after applying for ${payload.intake.target_role} positions.

REQUIREMENTS:
- Subject line placeholder: [FOLLOW UP: Job Title at Company Name]
- Brief and respectful tone
- Express continued interest
- Offer to provide additional information
- Include clear call to action
- 4-6 sentences maximum
- Use placeholders for company-specific details

Return ONLY the email template in plain text.`;

  const message = await anthropic.messages.create({
    model: API_MODELS.claude,
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  return content.type === 'text' ? content.text : '';
}

async function createResumeDOCX(
  content: any, // Now receives structured data
  payload: ForgePayloadV1,
  options: PortfolioOptions
): Promise<Buffer> {
  const documentChildren: Paragraph[] = [
    // Header with name (large, bold, centered, premium styling)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: payload.profile.full_name.toUpperCase(),
          bold: true,
          size: 36,
          font: 'Calibri',
          color: '000000',
        }),
      ],
    }),

    // Accent line under name (Steel Gold)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
      border: {
        bottom: {
          color: 'D4A84B',
          space: 1,
          style: 'single',
          size: 8,
        },
      },
      children: [
        new TextRun({
          text: payload.intake.target_role || 'Professional',
          bold: true,
          size: 24,
          font: 'Calibri',
          color: 'D4A84B',
        }),
      ],
    }),

    // Contact info (one line, centered)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: [
            payload.profile.phone,
            payload.profile.email,
            `${payload.profile.city}, ${payload.profile.state} ${payload.profile.zip}`,
          ].filter(Boolean).join(' | '),
          size: 22,
          font: 'Calibri',
          color: '404040',
        }),
      ],
    }),

    // PROFESSIONAL SUMMARY
    new Paragraph({
      spacing: { before: 400, after: 150 },
      border: {
        bottom: {
          color: 'D4A84B',
          space: 1,
          style: 'single',
          size: 8,
        },
        left: {
          color: 'D4A84B',
          space: 1,
          style: 'single',
          size: 12,
        },
      },
      indent: { left: 100 },
      children: [
        new TextRun({
          text: 'PROFESSIONAL SUMMARY',
          bold: true,
          size: 28,
          font: 'Calibri',
          color: 'D4A84B',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: content.summary,
          size: 22,
          font: 'Calibri',
        }),
      ],
    }),

    // CORE SKILLS
    new Paragraph({
      spacing: { before: 400, after: 150 },
      border: {
        bottom: {
          color: 'D4A84B',
          space: 1,
          style: 'single',
          size: 8,
        },
        left: {
          color: 'D4A84B',
          space: 1,
          style: 'single',
          size: 12,
        },
      },
      indent: { left: 100 },
      children: [
        new TextRun({
          text: 'CORE SKILLS',
          bold: true,
          size: 28,
          font: 'Calibri',
          color: 'D4A84B',
        }),
      ],
    }),
  ];

  // Add skills in a compact format (2-3 per line)
  const skillsPerLine = 3;
  for (let i = 0; i < content.skills.length; i += skillsPerLine) {
    const lineSkills = content.skills.slice(i, i + skillsPerLine);
    documentChildren.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: lineSkills.map((s: string) => `◆ ${s}`).join('   •   '),
            size: 22,
            font: 'Calibri',
            bold: true,
          }),
        ],
      })
    );
  }

  // PROFESSIONAL EXPERIENCE
  documentChildren.push(
    new Paragraph({
      spacing: { before: 400, after: 150 },
      border: {
        bottom: {
          color: 'D4A84B',
          space: 1,
          style: 'single',
          size: 8,
        },
        left: {
          color: 'D4A84B',
          space: 1,
          style: 'single',
          size: 12,
        },
      },
      indent: { left: 100 },
      children: [
        new TextRun({
          text: 'PROFESSIONAL EXPERIENCE',
          bold: true,
          size: 28,
          font: 'Calibri',
          color: 'D4A84B',
        }),
      ],
    })
  );

  // Add each job
  content.workHistory.forEach((job: any, index: number) => {
    // Job title (larger, bold, prominent)
    documentChildren.push(
      new Paragraph({
        spacing: { after: 80, before: index > 0 ? 300 : 150 },
        children: [
          new TextRun({
            text: `${job.title}`,
            bold: true,
            size: 24,
            font: 'Calibri',
          }),
        ],
      }),
      // Company and dates (smaller, italicized)
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: `${job.company}  •  ${job.start_date} - ${job.end_date || 'Present'}`,
            size: 22,
            font: 'Calibri',
            italics: true,
            color: '404040',
          }),
        ],
      })
    );

    // Job bullets with bolded numbers/metrics
    (job.bullets || []).forEach((bullet: string) => {
      // Parse bullet to bold numbers and percentages
      const parts = bullet.split(/(\d+[%$]?|\$\d+[,\d]*)/g);
      const bulletRuns: TextRun[] = [
        new TextRun({
          text: '• ',
          size: 22,
          font: 'Calibri',
        })
      ];

      parts.forEach((part) => {
        if (part && /\d/.test(part)) {
          // This part contains numbers - make it bold
          bulletRuns.push(
            new TextRun({
              text: part,
              size: 22,
              font: 'Calibri',
              bold: true,
            })
          );
        } else if (part) {
          // Regular text
          bulletRuns.push(
            new TextRun({
              text: part,
              size: 22,
              font: 'Calibri',
            })
          );
        }
      });

      documentChildren.push(
        new Paragraph({
          spacing: { after: 120 },
          indent: { left: 360 },
          children: bulletRuns,
        })
      );
    });
  });

  // EDUCATION
  if (content.education && content.education.length > 0) {
    documentChildren.push(
      new Paragraph({
        spacing: { before: 400, after: 150 },
        border: {
          bottom: {
            color: 'D4A84B',
            space: 1,
            style: 'single',
            size: 8,
          },
          left: {
            color: 'D4A84B',
            space: 1,
            style: 'single',
            size: 12,
          },
        },
        indent: { left: 100 },
        children: [
          new TextRun({
            text: 'EDUCATION',
            bold: true,
            size: 28,
            font: 'Calibri',
            color: 'D4A84B',
          }),
        ],
      })
    );

    content.education.forEach((edu: any) => {
      documentChildren.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: `${edu.credential}${edu.field ? ` in ${edu.field}` : ''} - ${edu.institution}${edu.year ? ` (${edu.year})` : ''}`,
              size: 20,
              font: 'Calibri',
            }),
          ],
        })
      );
    });
  }

  // CERTIFICATIONS
  if (content.certifications && content.certifications.length > 0) {
    documentChildren.push(
      new Paragraph({
        spacing: { before: 400, after: 150 },
        border: {
          bottom: {
            color: 'D4A84B',
            space: 1,
            style: 'single',
            size: 8,
          },
          left: {
            color: 'D4A84B',
            space: 1,
            style: 'single',
            size: 12,
          },
        },
        indent: { left: 100 },
        children: [
          new TextRun({
            text: 'CERTIFICATIONS',
            bold: true,
            size: 28,
            font: 'Calibri',
            color: 'D4A84B',
          }),
        ],
      })
    );

    content.certifications.forEach((cert: string) => {
      documentChildren.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: `• ${cert}`,
              size: 20,
              font: 'Calibri',
            }),
          ],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: documentChildren,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

async function createCoverLetterDOCX(
  content: string,
  payload: ForgePayloadV1
): Promise<Buffer> {
  const paragraphs = content.split('\n\n');

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            text: payload.profile.full_name,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: [
              payload.profile.phone,
              payload.profile.email,
              `${payload.profile.city}, ${payload.profile.state} ${payload.profile.zip}`,
            ].filter(Boolean).join(' | '),
          }),
          new Paragraph({ text: '' }), // Spacer

          // Body paragraphs
          ...paragraphs.map((para) => new Paragraph({ text: para })),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

async function create30DayActionPlanDOCX(payload: ForgePayloadV1, employers: any[] = []): Promise<Buffer> {
  const name = payload.profile.full_name;
  const targetRole = payload.intake.target_role;
  const location = `${payload.profile.city}, ${payload.profile.state}`;
  const challenges = payload.intake.challenges || [];
  const hasBarriers = challenges.length > 0;
  const salaryTarget = payload.strategy?.salary?.immediate_realistic || 'competitive market rate';
  const elevatorPitch = payload.narrative?.elevator_pitch_30s || '';

  // Extract user constraints
  const shiftPreference = payload.intake.constraints?.shift_preference || 'any';
  const maxCommuteMinutes = payload.intake.constraints?.max_commute_minutes || 30;
  const transportation = payload.intake.constraints?.transportation || 'reliable_car';
  const weekendOk = payload.intake.constraints?.weekend_ok || 'depends';

  // Get top employers for specific references
  const topEmployers = employers.slice(0, 10).map(e => e.name).filter(Boolean);
  const tier1Names = topEmployers.slice(0, 3).join(', ');
  const tier2Names = topEmployers.slice(3, 6).join(', ');
  const tier3Names = topEmployers.slice(6, 10).join(', ');

  // Research local job centers and workforce resources
  const jobCenterQuery = `List job centers, workforce development agencies, and career resources in ${location} specifically. Format each resource CLEARLY with:

RESOURCE NAME
Address: [full address]
Phone: [phone number]
Website: [URL if available]
Services: [brief description]

Provide 3-5 key resources for ${targetRole} workers. Use clear formatting with blank lines between each resource.`;
  const localResourcesRaw = await perplexitySearch(jobCenterQuery);
  const localResources = removeCitationBrackets(localResourcesRaw);

  // Build daily tasks with specific employer references
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: '30-DAY ACTION PLAN',
                bold: true,
                size: 32,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `${targetRole} Job Search for ${name}`,
                size: 24,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `${location} | Target: ${salaryTarget}`,
                size: 20,
                font: 'Calibri',
                italics: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: `${shiftPreference !== 'any' ? `${shiftPreference.charAt(0).toUpperCase() + shiftPreference.slice(1)} Shift • ` : ''}Commute: ${maxCommuteMinutes} min${transportation !== 'reliable_car' ? ` • Transportation: ${transportation}` : ''}`,
                size: 18,
                font: 'Calibri',
                italics: true,
                color: '666666',
              }),
            ],
          }),

          // WEEK 1: FOUNDATION & LAUNCH
          new Paragraph({
            spacing: { before: 400, after: 200 },
            border: {
              bottom: {
                color: 'D4A84B',
                space: 1,
                style: 'single',
                size: 10,
              },
            },
            children: [
              new TextRun({
                text: 'WEEK 1: FOUNDATION & LAUNCH',
                bold: true,
                size: 30,
                font: 'Calibri',
                color: 'D4A84B',
              }),
            ],
          }),

          // Day 1
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Day 1: Setup & Organization',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            'Create job search tracking spreadsheet (columns: Company, Position, Date Applied, Follow-up Date, Status, Notes)',
            'Set up dedicated email folder for job applications',
            'Save your resume as PDF (use professional filename: FirstName_LastName_Resume.pdf)',
            'Print 10 resume copies for in-person applications (if applicable)',
          ]),

          // Day 2
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Day 2: Target Employer Research',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            'Review your Target Employers document completely',
            topEmployers.length >= 3
              ? `Research these Tier 1 companies in depth: ${tier1Names}`
              : 'Identify your top 3 priority employers from the Target Employers list',
            'Note which companies have active job postings with apply links',
            'Create calendar reminders for follow-ups (3-5 days after each application)',
          ]),

          // Day 3
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Day 3: First Applications',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            topEmployers.length >= 3
              ? `Apply to: ${topEmployers.slice(0, 3).join(', ')}`
              : `Apply to 3 ${targetRole} positions from your Target Employers list`,
            shiftPreference !== 'any'
              ? `IMPORTANT: Only apply to ${shiftPreference} shift positions (verify shift in job description)`
              : '',
            `Check commute time - only apply if location is within ${maxCommuteMinutes} minutes`,
            'Customize cover letter for each application (reference company name, specific role)',
            'Log all applications in tracking spreadsheet immediately',
          ].filter(Boolean)),

          // Day 4
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Day 4: Continue Applications',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            topEmployers.length >= 6
              ? `Apply to: ${topEmployers.slice(3, 6).join(', ')}`
              : `Apply to 3 more ${targetRole} positions`,
            hasBarriers
              ? 'Review your Alloy Report - practice barrier-addressing scripts out loud'
              : 'Practice your elevator pitch out loud 3 times',
            'Update tracking spreadsheet',
          ]),

          // Day 5
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Day 5: Final Week 1 Applications',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            `Apply to 2-3 additional ${targetRole} positions (aim for 8-10 total this week)`,
            payload.strategy?.application_strategy?.staffing_agencies?.recommended
              ? `Contact staffing agencies: ${payload.strategy.application_strategy.staffing_agencies.types_to_target?.join(', ') || 'temp agencies in your field'}`
              : 'Research staffing agencies that specialize in your field',
            'Set follow-up reminders for Monday/Tuesday of Week 2',
          ]),

          // WEEK 2: FOLLOW-UP & EXPAND
          new Paragraph({
            spacing: { before: 500, after: 200 },
            border: {
              bottom: {
                color: 'D4A84B',
                space: 1,
                style: 'single',
                size: 10,
              },
            },
            children: [
              new TextRun({
                text: 'WEEK 2: FOLLOW-UP & EXPAND',
                bold: true,
                size: 30,
                font: 'Calibri',
                color: 'D4A84B',
              }),
            ],
          }),

          // Day 8
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Day 8: Follow-Up on Week 1',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            'Send follow-up emails to Week 1 applications (professional, brief)',
            'Check company websites for new job postings',
            'Update tracker with any responses received',
          ]),

          // Day 9
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Day 9: Interview Preparation',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            `Practice your elevator pitch: "${elevatorPitch.slice(0, 100)}${elevatorPitch.length > 100 ? '...' : ''}"`,
            'Prepare answers to common questions: "Tell me about yourself", "Why do you want this job?", "What are your strengths?"',
            hasBarriers
              ? 'Practice your barrier-addressing scripts using the Alloy Report examples'
              : 'Prepare 3 specific examples from your work history (STAR method)',
          ]),

          // Day 10
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Day 10: Tier 2 Employer Applications',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            topEmployers.length >= 9
              ? `Apply to Tier 2 employers: ${tier2Names}`
              : `Apply to 3 ${targetRole} positions from Tier 2 list`,
            'Research each company before applying (culture, values, recent news)',
            'Tailor cover letters to mention company-specific information',
          ]),

          // Day 11-12
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Day 11-12: In-Person Outreach (if applicable)',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            payload.strategy?.application_strategy?.primary_method?.includes('in-person')
              ? `Visit 2-3 ${targetRole} employers in person with resume copies`
              : `Apply to 3-4 more ${targetRole} positions online`,
            'Dress professionally for any in-person visits',
            'Ask to speak with hiring manager or leave resume with receptionist',
          ]),

          // WEEK 3: MOMENTUM & NETWORKING
          new Paragraph({
            spacing: { before: 500, after: 200 },
            border: {
              bottom: {
                color: 'D4A84B',
                space: 1,
                style: 'single',
                size: 10,
              },
            },
            children: [
              new TextRun({
                text: 'WEEK 3: MOMENTUM & NETWORKING',
                bold: true,
                size: 30,
                font: 'Calibri',
                color: 'D4A84B',
              }),
            ],
          }),

          // Day 15
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Day 15: Follow-Up & New Applications',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            'Follow up on Week 2 applications',
            topEmployers.length >= 10
              ? `Apply to additional employers: ${tier3Names}`
              : `Apply to 3 ${targetRole} positions`,
            'Update tracker with all responses and statuses',
          ]),

          // Day 16-17
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Day 16-17: Interview Skills',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            'Prepare 5-7 questions to ask interviewers (about role, team, company culture)',
            'Practice STAR method responses with specific examples from your work history',
            `Research typical interview questions for ${targetRole} roles`,
            'Plan professional interview outfit (clean, appropriate for industry)',
          ]),

          // Day 18-19
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Day 18-19: Expand Your Search',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            `Apply to 5 more ${targetRole} positions (can expand to Tier 3 employers)`,
            shiftPreference !== 'any'
              ? `If ${shiftPreference} shift options limited, consider being flexible on shift to increase opportunities`
              : 'Consider all shift times to maximize opportunities',
            'Check for new postings from previously applied companies',
            'Consider adjacent roles that use similar skills',
          ]),

          // WEEK 4: PERSISTENCE & REFINEMENT
          new Paragraph({
            spacing: { before: 500, after: 200 },
            border: {
              bottom: {
                color: 'D4A84B',
                space: 1,
                style: 'single',
                size: 10,
              },
            },
            children: [
              new TextRun({
                text: 'WEEK 4: PERSISTENCE & REFINEMENT',
                bold: true,
                size: 30,
                font: 'Calibri',
                color: 'D4A84B',
              }),
            ],
          }),

          // Day 22
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Day 22: Analyze & Adjust',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            'Review tracking spreadsheet: What\'s working? (job boards, application times, follow-up methods)',
            'Which applications got responses? Look for patterns',
            'Adjust resume bullets if certain achievements get better responses',
            'Follow up on Week 3 applications',
          ]),

          // Day 23-24
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Day 23-24: Salary Research & Preparation',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            `Research salary ranges for ${targetRole} in ${location}`,
            `Know your target: ${salaryTarget}`,
            'Prepare for potential job offers: minimum acceptable salary, benefits priorities',
            'Practice salary negotiation talking points',
          ]),

          // Day 25-29
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'Day 25-29: Final Push',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            `Apply to 5-10 more ${targetRole} positions`,
            'Send thank-you emails within 24 hours of any interviews',
            hasBarriers
              ? 'Refine your barrier-addressing scripts based on any interview feedback received'
              : 'Continue following up on all pending applications',
            'Stay persistent - the right opportunity is coming',
          ]),

          // LOCAL JOB CENTERS & RESOURCES
          new Paragraph({
            spacing: { before: 600, after: 200 },
            border: {
              bottom: {
                color: 'D4A84B',
                space: 1,
                style: 'single',
                size: 10,
              },
            },
            children: [
              new TextRun({
                text: 'LOCAL JOB CENTERS & RESOURCES',
                bold: true,
                size: 28,
                font: 'Calibri',
                color: 'D4A84B',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `Career resources in ${location} to support your job search:`,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: localResources || `Visit your local workforce development center for additional support with job searching, resume help, and interview preparation. Search for "${location} workforce development" or "${location} job center" online for contact information.`,
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),

          // WEEKLY SUCCESS METRICS
          new Paragraph({
            spacing: { before: 600, after: 200 },
            border: {
              bottom: {
                color: 'D4A84B',
                space: 1,
                style: 'single',
                size: 10,
              },
            },
            children: [
              new TextRun({
                text: 'WEEKLY SUCCESS METRICS',
                bold: true,
                size: 28,
                font: 'Calibri',
                color: 'D4A84B',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Track your progress each week:',
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            'Week 1 Goal: 8-10 applications submitted, tracking system set up',
            'Week 2 Goal: All Week 1 follow-ups sent, 5+ new applications, interview prep complete',
            'Week 3 Goal: 5-10 applications, at least 1 interview scheduled (if possible)',
            'Week 4 Goal: 20-30 total applications for the month, follow-ups on all pending applications',
            `Overall Success: Job offer for ${targetRole} position paying ${salaryTarget}`,
          ]),

          // IF THINGS AREN'T WORKING
          new Paragraph({
            spacing: { before: 600, after: 200 },
            border: {
              bottom: {
                color: 'D4A84B',
                space: 1,
                style: 'single',
                size: 10,
              },
            },
            children: [
              new TextRun({
                text: 'IF THINGS AREN\'T WORKING - CONTINGENCY PLAN',
                bold: true,
                size: 28,
                font: 'Calibri',
                color: 'D4A84B',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'If you\'re not getting responses after 2-3 weeks, try these adjustments:',
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...createActionItems([
            'Resume: Add more specific metrics/numbers to work history bullets',
            'Applications: Increase volume to 15-20 per week instead of 8-10',
            'Timing: Apply Tuesday-Thursday mornings (9-11am) for better visibility',
            shiftPreference !== 'any'
              ? `Shift flexibility: If not enough ${shiftPreference} shift openings, expand to other shifts temporarily`
              : '',
            maxCommuteMinutes < 40
              ? `Commute flexibility: Consider expanding to ${maxCommuteMinutes + 10}-${maxCommuteMinutes + 15} minute commutes if needed`
              : '',
            payload.strategy?.application_strategy?.primary_method?.includes('online')
              ? 'Strategy shift: Try more in-person applications with resume drops'
              : 'Strategy shift: Apply to more online positions to increase reach',
            'Expand search: Consider adjacent roles (e.g., if Warehouse Worker, try Forklift Operator, Material Handler, Shipping Clerk)',
            hasBarriers
              ? 'Leverage Alloy Report: Focus on second-chance employers listed in that document'
              : 'Network: Ask friends/family if their employers are hiring',
            'Get help: Visit local job center for resume review and interview coaching',
            `Staffing agencies: ${payload.strategy?.application_strategy?.staffing_agencies?.recommended ? 'Follow up with agencies you contacted - they often have unadvertised positions' : 'Sign up with 2-3 temp agencies as backup plan'}`,
          ].filter(Boolean)),

          // YOUR SPECIFIC STRATEGY
          new Paragraph({
            spacing: { before: 600, after: 200 },
            border: {
              bottom: {
                color: 'D4A84B',
                space: 1,
                style: 'single',
                size: 10,
              },
            },
            children: [
              new TextRun({
                text: 'YOUR SPECIFIC STRATEGY',
                bold: true,
                size: 28,
                font: 'Calibri',
                color: 'D4A84B',
              }),
            ],
          }),
          ...createActionItems([
            shiftPreference !== 'any'
              ? `SHIFT FOCUS: Prioritize ${shiftPreference} shift positions - specify this in applications and searches`
              : 'Shift flexibility: Consider all shifts to maximize opportunities',
            `COMMUTE LIMIT: Target employers within ${maxCommuteMinutes} minutes of ${payload.profile.city}${transportation === 'bus' ? ' - verify bus routes before applying' : transportation === 'rides' ? ' - confirm ride availability before accepting interviews' : ''}`,
            weekendOk === 'no' ? 'WEEKENDS: Only apply to Monday-Friday positions - clarify schedule in interview' : weekendOk === 'yes' ? 'Weekend availability: Mention this in applications as a competitive advantage' : '',
            `Best application times: ${payload.strategy?.application_strategy?.best_times || 'Tuesday-Thursday mornings (9-11am)'}`,
            `Application volume: ${payload.strategy?.application_strategy?.volume_recommendation || '8-10 quality applications per week'}`,
            `Follow-up approach: ${payload.strategy?.application_strategy?.follow_up_approach || 'Email 3-5 days after applying, brief and professional'}`,
            `Focus industries: ${payload.strategy?.target_industries?.tier1_best_fit?.map(i => i.industry).join(', ') || 'See Target Employers list'}`,
            'Use keywords from job descriptions in your applications (ATS systems scan for these)',
            'Keep tracker updated immediately after each action - this is your accountability tool',
            hasBarriers
              ? 'Always use your Alloy Report scripts when barriers come up - they work'
              : 'Be confident in your experience and skills - you have what employers need',
          ].filter(Boolean)),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// Helper function to remove citation brackets from Perplexity responses
function removeCitationBrackets(text: string): string {
  if (!text) return text;
  // Remove [1], [2], [3], etc. and [1][2], [a], etc.
  text = text.replace(/\[\d+\]/g, '').replace(/\[\d+(,\s*\d+)*\]/g, '').replace(/\[a-z\]/g, '');
  return text.trim();
}

function cleanPerplexityResourceData(text: string): string {
  if (!text) return text;

  // Remove lines that contain "Not specified", "Not available", "N/A" for structured fields
  const lines = text.split('\n');
  const cleaned = lines.filter(line => {
    const lowerLine = line.toLowerCase();

    // Keep lines that don't have missing data patterns
    if (lowerLine.includes('not specified') ||
        lowerLine.includes('not available') ||
        /^(address|phone|website|email):\s*(not?\s*(specified|available|found)|n\/?a)/i.test(line)) {
      return false;
    }

    return true;
  });

  return cleaned.join('\n').trim();
}

// Validation functions moved to lib/employerValidation.ts
// Now using validateEmployerName() from the utility module

function cleanMarkdown(text: string): string {
  if (!text) return text;
  // Remove bold markdown
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  // Remove italic markdown
  text = text.replace(/\*(.+?)\*/g, '$1');
  // Remove citation brackets
  text = removeCitationBrackets(text);
  return text;
}

// Helper to create text runs with markdown bold support
function createFormattedTextRuns(text: string, baseSize: number = 22, baseFont: string = 'Calibri'): TextRun[] {
  if (!text) return [];
  // Remove citations first
  text = removeCitationBrackets(text);
  // Normalize escaped quotes
  text = text.replace(/\\"/g, '"'); // Replace \" with "
  text = text.replace(/\\'/g, "'"); // Replace \' with '
  // Split on bold markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const runs: TextRun[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) {
      // Bold text
      runs.push(new TextRun({
        text: part.slice(2, -2),
        bold: true,
        size: baseSize,
        font: baseFont,
      }));
    } else {
      // Regular text
      runs.push(new TextRun({
        text: part,
        size: baseSize,
        font: baseFont,
      }));
    }
  }

  return runs;
}

async function createTargetEmployersDOCX(payload: ForgePayloadV1): Promise<{docx: Buffer, employers: any[]}> {
  const location = `${payload.profile.city}, ${payload.profile.state}`;
  const targetRole = payload.intake.target_role;
  const hasBarriers = (payload.intake.challenges || []).length > 0;
  const challenges = (payload.intake.challenges || []).join(', ');

  // Extract user constraints for job filtering
  const shiftPreference = payload.intake.constraints?.shift_preference || 'any';
  const maxCommuteMinutes = payload.intake.constraints?.max_commute_minutes || 30;
  const transportation = payload.intake.constraints?.transportation || 'reliable_car';

  // Start with Forge's researched employers if available
  let allJobs: any[] = [];
  const forgeEmployers = payload.research?.target_employers || [];

  // Convert Forge employers to job format
  forgeEmployers.forEach((emp: any) => {
    allJobs.push({
      employer_name: emp.name,
      employer_website: '',
      job_apply_link: '',
      employer_company_type: emp.business_type || 'Local employer',
      job_city: emp.location || payload.profile.city,
      job_employment_type: 'Full-time',
    });
  });

  // Get MANY job listings from RapidAPI (multiple searches to get 100+)
  const searchVariations = [
    targetRole,
    `${targetRole} near ${location}`,
    `${targetRole} ${payload.profile.city}`,
    `${targetRole} ${payload.profile.state}`,
    `entry level ${targetRole} ${payload.profile.city}`,
    `${targetRole} hiring now ${location}`,
  ];

  for (const query of searchVariations) {
    const jobs = await searchJobs(query, location, shiftPreference, 50);
    allJobs = allJobs.concat(jobs);
    // Break if we already have plenty
    if (allJobs.length > 200) break;
  }

  // Extract unique employers
  const employerMap = new Map<string, any>();
  allJobs.forEach((job: any) => {
    if (job.employer_name && !employerMap.has(job.employer_name)) {
      employerMap.set(job.employer_name, {
        name: job.employer_name,
        website: job.employer_website || '',
        jobUrl: job.job_apply_link || '',
        description: job.employer_company_type || job.job_employment_type || 'Hiring company',
        location: job.job_city || location,
      });
    }
  });

  let employers = Array.from(employerMap.values());

  // If we still don't have 50, use Perplexity to find more
  if (employers.length < 50) {
    const additionalQuery = `List major employers hiring for ${targetRole} positions in ${location} and surrounding areas. Include company names only, focusing on manufacturing, logistics, construction, and blue-collar sectors.`;
    const additionalResearch = await perplexitySearch(additionalQuery);

    // Parse company names from Perplexity response with validation
    const companyNameMatches = additionalResearch.match(/[A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp|Company|Industries|Manufacturing|Services)?/g) || [];

    companyNameMatches.forEach(name => {
      const cleaned = name.trim();
      if (!employerMap.has(cleaned)) {
        // Use new validation utility
        const validation = validateEmployerName(cleaned);
        if (validation.valid) {
          const finalName = validation.cleaned || cleaned;
          employerMap.set(finalName, {
            name: finalName,
            website: '',
            jobUrl: '',
            description: 'Local employer',
            location: location,
          });
        }
      }
    });
    employers = Array.from(employerMap.values());
  }

  // Take top 50
  employers = employers.slice(0, 50);

  // Research Tier 1 employers for personalization (top 10)
  const tier1Employers = employers.slice(0, 10);
  const researchPromises = tier1Employers.map(async (emp) => {
    // Build constraint context for research
    const shiftContext = shiftPreference !== 'any' ? ` Shift needed: ${shiftPreference} shift.` : '';
    const commuteContext = ` Commute from ${payload.profile.city} should be under ${maxCommuteMinutes} minutes.`;
    const transportContext = transportation !== 'reliable_car' ? ` Transportation: ${transportation}.` : '';

    const researchQuery = `Research ${emp.name} in ${location}. Provide: 1) What industry/services, 2) Company culture, 3) Why good fit for a ${targetRole} with ${payload.work_history?.[0]?.title || 'experience'} background${hasBarriers ? `, 4) Are they second-chance friendly for ${challenges}` : ''}.${shiftContext}${commuteContext}${transportContext} Be concise, 2-3 sentences total.`;
    const research = await perplexitySearch(researchQuery);
    const cleanedResearch = removeCitationBrackets(research);
    return { ...emp, whyGoodFit: cleanedResearch || `Active employer hiring for ${targetRole} positions in your area.` };
  });

  const researchedTier1 = await Promise.all(researchPromises);
  employers = [...researchedTier1, ...employers.slice(10)];

  // Build document
  const employerParagraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: 'TARGET EMPLOYERS',
          bold: true,
          size: 32,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `${targetRole} Opportunities in ${location}`,
          size: 24,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Found ${employers.length} active employers. Check their careers pages regularly and apply directly when possible.`,
          size: 22,
          font: 'Calibri',
          italics: true,
        }),
      ],
    }),
  ];

  // Add TIER 1 employers (first 10)
  employerParagraphs.push(
    new Paragraph({
      spacing: { before: 400, after: 200 },
      border: {
        bottom: {
          color: 'D4A84B',
          space: 1,
          style: 'single',
          size: 10,
        },
      },
      children: [
        new TextRun({
          text: 'TIER 1: BEST MATCHES (Active Job Postings)',
          bold: true,
          size: 28,
          font: 'Calibri',
          color: 'D4A84B',
        }),
      ],
    })
  );

  employers.slice(0, 10).forEach((emp, idx) => {
    employerParagraphs.push(
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: `${idx + 1}. ${emp.name}`,
            bold: true,
            size: 22,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 120 },
        indent: { left: 360 },
        children: [
          new TextRun({
            text: 'Industry: ',
            size: 20,
            font: 'Calibri',
          }),
          ...createFormattedTextRuns(emp.description, 20, 'Calibri'),
        ],
      })
    );
    if (emp.website) {
      employerParagraphs.push(
        new Paragraph({
          spacing: { after: 120 },
          indent: { left: 360 },
          children: [
            new TextRun({
              text: `Website: ${emp.website}`,
              size: 20,
              font: 'Calibri',
              color: '0066CC',
            }),
          ],
        })
      );
    }
    if (emp.jobUrl) {
      employerParagraphs.push(
        new Paragraph({
          spacing: { after: 120 },
          indent: { left: 360 },
          children: [
            new TextRun({
              text: `Apply: ${emp.jobUrl}`,
              size: 20,
              font: 'Calibri',
              color: '0066CC',
            }),
          ],
        })
      );
    }
    // Add "Why Good Fit" section (researched)
    if (emp.whyGoodFit) {
      employerParagraphs.push(
        new Paragraph({
          spacing: { after: 250 },
          indent: { left: 360 },
          children: [
            new TextRun({
              text: `Why Good Fit: `,
              bold: true,
              size: 20,
              font: 'Calibri',
            }),
            ...createFormattedTextRuns(emp.whyGoodFit, 20, 'Calibri').map(run =>
              new TextRun({
                ...run,
                italics: true,
              })
            ),
          ],
        })
      );
    }
  });

  // Add TIER 2 employers (next 20)
  employerParagraphs.push(
    new Paragraph({
      spacing: { before: 500, after: 200 },
      border: {
        bottom: {
          color: 'D4A84B',
          space: 1,
          style: 'single',
          size: 10,
        },
      },
      children: [
        new TextRun({
          text: 'TIER 2: STRONG ALTERNATIVES',
          bold: true,
          size: 28,
          font: 'Calibri',
          color: 'D4A84B',
        }),
      ],
    })
  );

  employers.slice(10, 30).forEach((emp, idx) => {
    employerParagraphs.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `${idx + 11}. ${emp.name} - `,
            size: 20,
            font: 'Calibri',
          }),
          ...createFormattedTextRuns(emp.description, 20, 'Calibri'),
        ],
      })
    );
  });

  // Add TIER 3 employers (remaining)
  if (employers.length > 30) {
    employerParagraphs.push(
      new Paragraph({
        spacing: { before: 500, after: 200 },
        border: {
          bottom: {
            color: 'D4A84B',
            space: 1,
            style: 'single',
            size: 10,
          },
        },
        children: [
          new TextRun({
            text: 'TIER 3: ADDITIONAL OPTIONS',
            bold: true,
            size: 28,
            font: 'Calibri',
            color: 'D4A84B',
          }),
        ],
      })
    );

    employers.slice(30).forEach((emp, idx) => {
      employerParagraphs.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: `${idx + 31}. ${emp.name} - `,
              size: 20,
              font: 'Calibri',
            }),
            ...createFormattedTextRuns(emp.description, 20, 'Calibri'),
          ],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: employerParagraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return { docx: buffer, employers: employers };
}

async function createAlloyReportDOCX(payload: ForgePayloadV1): Promise<Buffer> {
  const barriers = payload.barriers;
  const location = `${payload.profile.city}, ${payload.profile.state}`;
  const challenges = payload.intake.challenges || [];

  // Extract user constraints for research context
  const shiftPreference = payload.intake.constraints?.shift_preference || 'any';
  const maxCommuteMinutes = payload.intake.constraints?.max_commute_minutes || 30;
  const transportation = payload.intake.constraints?.transportation || 'reliable_car';

  // Research second-chance employers and local resources using Perplexity
  const challengeTypes = challenges.map(c => c.toLowerCase()).join(', ');
  const shiftContext = shiftPreference !== 'any' ? ` that offer ${shiftPreference} shift positions` : '';
  const commuteContext = ` within ${maxCommuteMinutes} minutes commute from ${payload.profile.city}`;
  const transportContext = transportation !== 'reliable_car' ? ` accessible by ${transportation}` : '';

  const secondChanceQuery = `List second-chance employers and companies that hire individuals with ${challengeTypes} in ${location}${shiftContext}${commuteContext}${transportContext}. Include company names and why they're supportive.`;
  const localResourcesQuery = `What local support resources, organizations, and programs are available in ${location} for individuals dealing with ${challengeTypes}? Format each resource clearly:

ORGANIZATION NAME
Address: [full street address - ONLY include if you can find actual address, otherwise omit this line]
Phone: [phone number - ONLY include if you can find actual number, otherwise omit this line]
Website: [URL - ONLY include if available]
Services: [what they offer]

IMPORTANT: If you cannot find specific contact information, omit those lines entirely. Do NOT write "Not specified" or "Not available". Provide 3-5 key resources. Use clear formatting with blank lines between resources.`;

  const [secondChanceEmployers, localResources] = await Promise.all([
    perplexitySearch(secondChanceQuery),
    perplexitySearch(localResourcesQuery),
  ]);

  // Clean citation brackets from research
  const cleanedSecondChance = removeCitationBrackets(secondChanceEmployers);
  const cleanedLocalResources = cleanPerplexityResourceData(removeCitationBrackets(localResources));

  const allParagraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: 'THE ALLOY REPORT',
          bold: true,
          size: 32,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'Confidential Career Barrier Strategy',
          size: 24,
          font: 'Calibri',
          italics: true,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: 'This document is for your eyes only. It contains strategies for addressing employment barriers with dignity and honesty.',
          size: 22,
          font: 'Calibri',
          color: '666666',
        }),
      ],
    }),

    // Overall Strategy
    new Paragraph({
      spacing: { before: 400, after: 200 },
      border: {
        bottom: {
          color: 'D4A84B',
          space: 1,
          style: 'single',
          size: 10,
        },
      },
      children: [
        new TextRun({
          text: 'OVERALL STRATEGY',
          bold: true,
          size: 28,
          font: 'Calibri',
          color: 'D4A84B',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: barriers?.overall_strategy || 'Address challenges with honesty and focus on growth.',
          size: 22,
          font: 'Calibri',
        }),
      ],
    }),
  ];

  // Challenge-specific sections with enhanced scripts
  (barriers?.challenges || []).forEach((challenge: any) => {
    allParagraphs.push(
      new Paragraph({
        spacing: { before: 500, after: 200 },
        border: {
          bottom: {
            color: 'D4A84B',
            space: 1,
            style: 'single',
            size: 10,
          },
        },
        children: [
          new TextRun({
            text: challenge.type.toUpperCase(),
            bold: true,
            size: 28,
            font: 'Calibri',
            color: 'D4A84B',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: 'Employer Perspective: ',
            bold: true,
            size: 22,
            font: 'Calibri',
          }),
          new TextRun({
            text: challenge.employer_perspective,
            size: 22,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: 'How to Reframe: ',
            bold: true,
            size: 22,
            font: 'Calibri',
          }),
          new TextRun({
            text: challenge.reframe,
            size: 22,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: 'Legal Context: ',
            bold: true,
            size: 22,
            font: 'Calibri',
          }),
          new TextRun({
            text: challenge.legal_context || 'Employers cannot discriminate based on protected characteristics. Know your rights.',
            size: 22,
            font: 'Calibri',
          }),
        ],
      })
    );

    // Scripts section
    allParagraphs.push(
      new Paragraph({
        spacing: { after: 100, before: 200 },
        children: [
          new TextRun({
            text: 'SCRIPTS FOR DIFFERENT SITUATIONS:',
            bold: true,
            size: 22,
            font: 'Calibri',
          }),
        ],
      })
    );

    Object.entries(challenge.scripts || {}).forEach(([key, value]) => {
      allParagraphs.push(
        new Paragraph({
          spacing: { after: 120 },
        indent: { left: 360 },
          children: [
            new TextRun({
              text: `${key.replace(/_/g, ' ').toUpperCase()}: `,
              bold: true,
              size: 20,
              font: 'Calibri',
            }),
            new TextRun({
              text: value as string,
              size: 20,
              font: 'Calibri',
            }),
          ],
        })
      );
    });

    // Proof points
    if (challenge.proof_points && challenge.proof_points.length > 0) {
      allParagraphs.push(
        new Paragraph({
          spacing: { after: 100, before: 200 },
          children: [
            new TextRun({
              text: 'Evidence to Counter Concerns:',
              bold: true,
              size: 22,
              font: 'Calibri',
            }),
          ],
        })
      );
      challenge.proof_points.forEach((point: string) => {
        allParagraphs.push(
          new Paragraph({
            spacing: { after: 120 },
        indent: { left: 360 },
            children: [
              new TextRun({
                text: `• ${point}`,
                size: 20,
                font: 'Calibri',
              }),
            ],
          })
        );
      });
    }
  });

  // Master Interview Scripts
  allParagraphs.push(
    new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: 'MASTER INTERVIEW SCRIPTS',
          bold: true,
          size: 26,
          font: 'Calibri',
        }),
      ],
    })
  );

  Object.entries(barriers?.interview_master_scripts || {}).forEach(([key, value]) => {
    allParagraphs.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `${key.replace(/_/g, ' ').toUpperCase()}: `,
            bold: true,
            size: 22,
            font: 'Calibri',
          }),
          new TextRun({
            text: Array.isArray(value) ? value.join(', ') : value as string,
            size: 22,
            font: 'Calibri',
          }),
        ],
      })
    );
  });

  // Second-chance employers (from Perplexity research)
  if (cleanedSecondChance) {
    allParagraphs.push(
      new Paragraph({
        spacing: { before: 500, after: 200 },
        border: {
          bottom: {
            color: 'D4A84B',
            space: 1,
            style: 'single',
            size: 10,
          },
        },
        children: [
          new TextRun({
            text: 'SECOND-CHANCE EMPLOYERS IN YOUR AREA',
            bold: true,
            size: 28,
            font: 'Calibri',
            color: 'D4A84B',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 300 },
        children: createFormattedTextRuns(cleanedSecondChance, 22, 'Calibri'),
      })
    );
  }

  // Local resources (from Perplexity research)
  if (cleanedLocalResources) {
    allParagraphs.push(
      new Paragraph({
        spacing: { before: 500, after: 200 },
        border: {
          bottom: {
            color: 'D4A84B',
            space: 1,
            style: 'single',
            size: 10,
          },
        },
        children: [
          new TextRun({
            text: 'LOCAL SUPPORT RESOURCES',
            bold: true,
            size: 28,
            font: 'Calibri',
            color: 'D4A84B',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 300 },
        children: createFormattedTextRuns(cleanedLocalResources, 22, 'Calibri'),
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: allParagraphs,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

async function createJobTrackerExcel(payload: ForgePayloadV1): Promise<Buffer> {
  // Create workbook with exceljs for full styling support
  const workbook = new ExcelJS.Workbook();

  // Create Job Applications worksheet
  const ws = workbook.addWorksheet('Job Applications', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }] // Freeze top row
  });

  // Define columns with headers and widths
  ws.columns = [
    { header: 'Company Name', key: 'company', width: 25 },
    { header: 'Position', key: 'position', width: 25 },
    { header: 'Date Applied', key: 'dateApplied', width: 15 },
    { header: 'Follow-Up Date', key: 'followUp', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Contact Person', key: 'contact', width: 20 },
    { header: 'Contact Email/Phone', key: 'contactInfo', width: 25 },
    { header: 'Notes', key: 'notes', width: 40 },
  ];

  // Style header row (row 1)
  const headerRow = ws.getRow(1);
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' } // Professional blue
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 20;
  headerRow.commit();

  // Add example row
  const exampleDate = new Date();
  const followUpDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  ws.addRow({
    company: 'Example Corp',
    position: payload.intake.target_role,
    dateApplied: exampleDate,
    followUp: followUpDate,
    status: 'Applied',
    contact: 'Hiring Manager',
    contactInfo: 'hiring@example.com',
    notes: 'Applied through company website'
  });

  // Format date columns
  ws.getColumn('dateApplied').numFmt = 'yyyy-mm-dd';
  ws.getColumn('followUp').numFmt = 'yyyy-mm-dd';

  // Add 49 empty rows with Arial font
  for (let i = 0; i < 49; i++) {
    const row = ws.addRow({
      company: '',
      position: '',
      dateApplied: null,
      followUp: null,
      status: '',
      contact: '',
      contactInfo: '',
      notes: ''
    });
    row.font = { name: 'Arial', size: 11 };
    row.commit();
  }

  // Create Summary worksheet
  const ws2 = workbook.addWorksheet('Summary');
  ws2.columns = [
    { width: 30 },
    { width: 40 }
  ];

  // Add summary data with formatting
  const titleRow = ws2.addRow(['Job Application Tracker Summary']);
  titleRow.font = { name: 'Arial', size: 14, bold: true };
  titleRow.commit();

  ws2.addRow([]);
  ws2.addRow(['Target Role:', payload.intake.target_role]);
  ws2.addRow(['Location:', `${payload.profile.city}, ${payload.profile.state}`]);
  ws2.addRow(['Target Salary:', payload.strategy?.salary?.immediate_realistic || 'N/A']);
  ws2.addRow([]);

  const statsHeader = ws2.addRow(['Quick Stats:']);
  statsHeader.font = { name: 'Arial', size: 12, bold: true };
  statsHeader.commit();

  ws2.addRow(['Total Applications:', { formula: 'COUNTA(\'Job Applications\'!A3:A52)' }]);
  ws2.addRow(['Applications This Week:', '(Update manually)']);
  ws2.addRow(['Interviews Scheduled:', '(Update manually)']);
  ws2.addRow([]);

  const statusHeader = ws2.addRow(['Status Breakdown:']);
  statusHeader.font = { name: 'Arial', size: 12, bold: true };
  statusHeader.commit();

  ws2.addRow(['Applied:', { formula: 'COUNTIF(\'Job Applications\'!E:E,"Applied")' }]);
  ws2.addRow(['Phone Screen:', { formula: 'COUNTIF(\'Job Applications\'!E:E,"Phone Screen")' }]);
  ws2.addRow(['Interview Scheduled:', { formula: 'COUNTIF(\'Job Applications\'!E:E,"Interview")' }]);
  ws2.addRow(['Offer:', { formula: 'COUNTIF(\'Job Applications\'!E:E,"Offer")' }]);
  ws2.addRow(['Rejected:', { formula: 'COUNTIF(\'Job Applications\'!E:E,"Rejected")' }]);
  ws2.addRow([]);

  const tipsHeader = ws2.addRow(['Tips:']);
  tipsHeader.font = { name: 'Arial', size: 12, bold: true };
  tipsHeader.commit();

  ws2.addRow(['• Update this tracker immediately after each action']);
  ws2.addRow(['• Set reminders for follow-up dates']);
  ws2.addRow(['• Use Status column: Applied, Phone Screen, Interview, Offer, Rejected']);
  ws2.addRow(['• Track all applications - even rejections help you learn']);

  // Write to buffer and return
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function createActionItems(items: string[]): Paragraph[] {
  return items.map(item =>
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: '□  ',
          size: 22,
          font: 'Calibri',
        }),
        ...createFormattedTextRuns(item, 22, 'Calibri'),
      ],
    })
  );
}

function parseResumeContent(content: string) {
  const sections: Array<{ title: string; content: string }> = [];
  const lines = content.split('\n');

  let currentSection = { title: '', content: '' };
  const skipSections = ['NAME', 'CONTACT', 'CONTACT INFORMATION', 'HEADER'];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if it's a section header (all caps or title case heading)
    if (trimmedLine.match(/^[A-Z\s]+:?$/) && trimmedLine.length > 2) {
      // Save previous section if it has content
      if (currentSection.title && currentSection.content.trim() &&
          !skipSections.includes(currentSection.title.toUpperCase())) {
        sections.push(currentSection);
      }
      currentSection = { title: trimmedLine.replace(':', '').trim(), content: '' };
    } else if (trimmedLine) {
      // Add to current section content
      currentSection.content += line + '\n';
    }
  }

  // Save the last section
  if (currentSection.title && currentSection.content.trim() &&
      !skipSections.includes(currentSection.title.toUpperCase())) {
    sections.push(currentSection);
  }

  return sections;
}

function createResumePreview(content: any, payload: ForgePayloadV1) {
  return `
    <div style="font-family: Calibri, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white; color: black;">
      <h1 style="text-align: center; text-transform: uppercase; margin-bottom: 10px; font-size: 28px;">${payload.profile.full_name}</h1>
      <p style="text-align: center; color: #666; margin-bottom: 30px; font-size: 14px;">
        ${[payload.profile.phone, payload.profile.email, `${payload.profile.city}, ${payload.profile.state} ${payload.profile.zip}`].filter(Boolean).join(' | ')}
      </p>

      <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 30px;">PROFESSIONAL SUMMARY</h2>
      <p style="margin: 15px 0;">${content.summary}</p>

      <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 30px;">CORE SKILLS</h2>
      <ul style="margin: 15px 0; columns: 2; -webkit-columns: 2; -moz-columns: 2;">
        ${content.skills.map((skill: string) => `<li style="margin-bottom: 8px;">${skill}</li>`).join('')}
      </ul>

      <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 30px;">PROFESSIONAL EXPERIENCE</h2>
      ${content.workHistory.map((job: any) => `
        <div style="margin: 20px 0;">
          <h3 style="margin: 10px 0 5px 0; font-size: 18px;">${job.title}</h3>
          <p style="margin: 0 0 10px 0; font-style: italic; color: #666;">${job.company} | ${job.start_date} - ${job.end_date || 'Present'}</p>
          <ul style="margin: 10px 0 10px 20px;">
            ${(job.bullets || []).map((bullet: string) => `<li style="margin-bottom: 8px;">${bullet}</li>`).join('')}
          </ul>
        </div>
      `).join('')}

      ${content.education && content.education.length > 0 ? `
        <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 30px;">EDUCATION</h2>
        <ul style="margin: 15px 0;">
          ${content.education.map((edu: any) => `
            <li style="margin-bottom: 8px;">${edu.credential}${edu.field ? ` in ${edu.field}` : ''} - ${edu.institution}${edu.year ? ` (${edu.year})` : ''}</li>
          `).join('')}
        </ul>
      ` : ''}

      ${content.certifications && content.certifications.length > 0 ? `
        <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 30px;">CERTIFICATIONS</h2>
        <ul style="margin: 15px 0;">
          ${content.certifications.map((cert: string) => `<li style="margin-bottom: 8px;">${cert}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `;
}

function createCoverLetterPreview(content: string, payload: ForgePayloadV1) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white; color: black;">
      <h2 style="margin-bottom: 5px;">${payload.profile.full_name}</h2>
      <p style="color: #666; margin-bottom: 20px;">
        ${[payload.profile.phone, payload.profile.email, `${payload.profile.city}, ${payload.profile.state} ${payload.profile.zip}`].filter(Boolean).join(' | ')}
      </p>
      <hr style="margin: 20px 0;" />
      <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px;">${content}</pre>
    </div>
  `;
}
