import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import type { GeneratedDocuments, PortfolioOptions } from '@/store/refineryStore';

export async function POST(req: NextRequest) {
  try {
    const { documents, profile, portfolioOptions } = await req.json() as {
      documents: GeneratedDocuments;
      profile: any;
      portfolioOptions: PortfolioOptions;
    };

    if (!documents.resume || !documents.coverLetter) {
      return NextResponse.json({ error: 'Missing documents' }, { status: 400 });
    }

    // Create a ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    const chunks: Buffer[] = [];

    // Collect archive data
    archive.on('data', (chunk) => {
      chunks.push(chunk);
    });

    // Wait for archive to finish
    const zipPromise = new Promise<Buffer>((resolve, reject) => {
      archive.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      archive.on('error', (err) => {
        reject(err);
      });
    });

    const fileName = profile?.full_name?.replace(/\s+/g, '_') || 'Career';

    // ═══════════════════════════════════════════════════════════════════════
    // RESUME
    // ═══════════════════════════════════════════════════════════════════════
    const resumeBuffer = Buffer.from(documents.resume.content, 'base64');
    archive.append(resumeBuffer, {
      name: `${fileName}_Resume.docx`,
    });

    // ═══════════════════════════════════════════════════════════════════════
    // COVER LETTERS - All 3 Variants
    // ═══════════════════════════════════════════════════════════════════════
    if (documents.coverLetter.aggressive) {
      const aggressiveBuffer = Buffer.from(documents.coverLetter.aggressive.content, 'base64');
      archive.append(aggressiveBuffer, {
        name: `Cover_Letters/${fileName}_Cover_Letter_BOLD.docx`,
      });
    }
    
    if (documents.coverLetter.professional) {
      const professionalBuffer = Buffer.from(documents.coverLetter.professional.content, 'base64');
      archive.append(professionalBuffer, {
        name: `Cover_Letters/${fileName}_Cover_Letter_PROFESSIONAL.docx`,
      });
    }
    
    if (documents.coverLetter.friendly) {
      const friendlyBuffer = Buffer.from(documents.coverLetter.friendly.content, 'base64');
      archive.append(friendlyBuffer, {
        name: `Cover_Letters/${fileName}_Cover_Letter_FRIENDLY.docx`,
      });
    }

    // Cover letters README
    const coverLetterReadme = `COVER LETTER VARIANTS
=====================

You have 3 different cover letter styles to choose from:

1. BOLD (${fileName}_Cover_Letter_BOLD.docx)
   - Confident, achievement-focused tone
   - Best for: Competitive roles, high-volume operations, metric-driven companies
   - Opens strong with your biggest achievement
   - Uses power language: "I delivered..." "I drove..."

2. PROFESSIONAL (${fileName}_Cover_Letter_PROFESSIONAL.docx)
   - Balanced, traditional tone
   - Best for: Corporate environments, most applications, traditional companies
   - Standard business letter format
   - Safe choice when unsure

3. FRIENDLY (${fileName}_Cover_Letter_FRIENDLY.docx)
   - Warm, personable tone
   - Best for: Small businesses, family-owned companies, culture-focused employers
   - Shows personality and enthusiasm
   - Emphasizes teamwork and fit

HOW TO USE:
-----------
1. Open ALL THREE and read them
2. Pick the one that matches the company culture
3. Replace [COMPANY NAME] with the actual company
4. Replace [JOB TITLE] with the actual position
5. Replace [HIRING MANAGER] if you know their name
6. Proofread, save, and attach to your application

TIP: When in doubt, use PROFESSIONAL. It works everywhere.
`;
    archive.append(Buffer.from(coverLetterReadme), {
      name: 'Cover_Letters/README.txt',
    });

    // ═══════════════════════════════════════════════════════════════════════
    // CORE DOCUMENTS
    // ═══════════════════════════════════════════════════════════════════════

    // 30-Day Action Plan
    if (documents.actionPlan) {
      const actionPlanBuffer = Buffer.from(documents.actionPlan.content, 'base64');
      archive.append(actionPlanBuffer, {
        name: '30_Day_Action_Plan.docx',
      });
    }

    // Target Employers
    if (documents.targetEmployers) {
      const targetEmployersBuffer = Buffer.from(documents.targetEmployers.content, 'base64');
      archive.append(targetEmployersBuffer, {
        name: 'Target_Employers.docx',
      });
    }

    // Portfolio HTML
    if (documents.portfolio) {
      archive.append(documents.portfolio.content, {
        name: 'Portfolio.html',
      });
    }

    // Alloy Report (conditional on barriers)
    if (documents.alloyReport) {
      const alloyReportBuffer = Buffer.from(documents.alloyReport.content, 'base64');
      archive.append(alloyReportBuffer, {
        name: 'Alloy_Report_CONFIDENTIAL.docx',
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BONUS MATERIALS
    // ═══════════════════════════════════════════════════════════════════════

    // Job Application Tracker
    if (documents.jobTracker && portfolioOptions?.extras_job_tracker) {
      const jobTrackerBuffer = Buffer.from(documents.jobTracker.content, 'base64');
      archive.append(jobTrackerBuffer, {
        name: 'Job_Application_Tracker.xlsx',
      });
    }

    // Quick Start Guide - DOCX version if available, otherwise fallback to .txt
    if (portfolioOptions?.extras_quick_start) {
      if (documents.quickStartGuide?.content) {
        // Use the TORI-standard DOCX
        const quickStartBuffer = Buffer.from(documents.quickStartGuide.content, 'base64');
        archive.append(quickStartBuffer, {
          name: 'Quick_Start_Guide.docx',
        });
      } else {
        // Fallback .txt (shouldn't happen with updated generate-documents)
        const quickStartContent = `QUICK START GUIDE - Your First 48 Hours
========================================

HOUR 1-2: REVIEW YOUR PACKAGE
-----------------------------
□ Open your Resume in Word - read it out loud
□ Check all dates and company names are correct
□ Read all 3 cover letter variants in the Cover_Letters folder
□ Pick your default (PROFESSIONAL is safest if unsure)

HOUR 3-4: SET UP YOUR SYSTEM
----------------------------
□ Open the Job Application Tracker spreadsheet
□ Create a dedicated email folder for job applications
□ Print 5-10 resume copies if you'll apply in person
□ Save resume as PDF: ${fileName}_Resume.pdf

HOUR 5-8: FIRST APPLICATIONS
----------------------------
□ Open Target_Employers.docx
□ Review the Tier 1 companies (best matches)
□ Apply to your top 3 picks TODAY
□ Log each application in the tracker immediately

DAY 2: FOLLOW-UP PREP
--------------------
□ Set calendar reminders for Day 5 follow-ups
□ Practice your elevator pitch out loud 3 times
□ Review the 30-Day Action Plan for Week 1 tasks

Your first job offer is coming. Keep moving.
`;
        archive.append(Buffer.from(quickStartContent), {
          name: 'Quick_Start_Guide.txt',
        });
      }
    }

    // Salary Negotiation Cheat Sheet - DOCX version if available, otherwise fallback to .txt
    if (portfolioOptions?.extras_salary_negotiation) {
      if (documents.salaryNegotiation?.content) {
        // Use the TORI-standard DOCX
        const salaryBuffer = Buffer.from(documents.salaryNegotiation.content, 'base64');
        archive.append(salaryBuffer, {
          name: 'Salary_Negotiation_Cheat_Sheet.docx',
        });
      } else {
        // Fallback .txt
        const salaryContent = `SALARY NEGOTIATION CHEAT SHEET
==============================

THE GOLDEN RULES:
-----------------
1. Never name a number first
2. Research the market rate BEFORE interviews
3. Always negotiate - employers expect it
4. Be confident, not apologetic

WHEN THEY ASK YOUR SALARY EXPECTATIONS:
---------------------------------------
SCRIPT: "I'm focused on finding the right role. I'm flexible on 
compensation and confident we can find a number that works if I'm 
the right fit. What's the range budgeted for this position?"

IF THEY PUSH FOR A NUMBER:
--------------------------
SCRIPT: "Based on my research and experience, I'm looking for 
$[X to Y] depending on total compensation. What's possible?"

(Always give a range. Make the LOW end your actual target.)

AFTER THEY MAKE AN OFFER:
-------------------------
SCRIPT: "Thank you - I'm excited about the opportunity. Is there 
flexibility on the base salary? Based on [specific achievement], 
I was hoping for [10-15% higher]."

IF SALARY IS FIRM:
------------------
Negotiate these instead:
• Sign-on bonus
• Earlier review/raise date (90 days vs 1 year)
• Extra PTO days
• Flexible schedule
• Remote work options
• Training/certification budget
• Better title

WHAT NOT TO SAY:
----------------
✗ "I need X because my rent is high"
✗ "I was making X at my last job"
✗ "I'll take anything"
✗ "That's less than I expected" (without counter)

You've earned the right to negotiate. Use it.
`;
        archive.append(Buffer.from(salaryContent), {
          name: 'Salary_Negotiation_Cheat_Sheet.txt',
        });
      }
    }

    // Interview Prep Sheet - DOCX version if available
    if (portfolioOptions?.extras_interview_prep) {
      if (documents.interviewPrep?.content) {
        const interviewPrepBuffer = Buffer.from(documents.interviewPrep.content, 'base64');
        archive.append(interviewPrepBuffer, {
          name: 'Interview_Prep_Sheet.docx',
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MASTER README
    // ═══════════════════════════════════════════════════════════════════════
    const quickStartExt = documents.quickStartGuide?.content ? 'docx' : 'txt';
    const salaryExt = documents.salaryNegotiation?.content ? 'docx' : 'txt';
    const interviewPrepExt = documents.interviewPrep?.content ? 'docx' : 'txt';
    
    const masterReadme = `YOUR STEEL MAN CAREER PACKAGE
=============================

This package contains everything you need to land your next job.

WHAT'S INSIDE:
--------------
📄 ${fileName}_Resume.docx
   Your professional resume, ready to customize

📁 Cover_Letters/
   Three cover letter variants for different situations:
   - BOLD: Confident, achievement-focused
   - PROFESSIONAL: Balanced, traditional (safest default)
   - FRIENDLY: Warm, personable

📋 30_Day_Action_Plan.docx
   Day-by-day guide to your job search

🎯 Target_Employers.docx
   50+ employers hiring in your area, ranked by fit

🌐 Portfolio.html
   Your web portfolio - open in any browser
${documents.alloyReport ? '\n🔒 Alloy_Report_CONFIDENTIAL.docx\n   Private guidance on addressing barriers (for your eyes only)' : ''}
${documents.jobTracker && portfolioOptions?.extras_job_tracker ? '\n📊 Job_Application_Tracker.xlsx\n   Spreadsheet to track all your applications' : ''}
${portfolioOptions?.extras_quick_start ? `\n🚀 Quick_Start_Guide.${quickStartExt}\n   Your first 48 hours - start here!` : ''}
${portfolioOptions?.extras_salary_negotiation ? `\n💰 Salary_Negotiation_Cheat_Sheet.${salaryExt}\n   Scripts and tactics for getting paid what you're worth` : ''}
${portfolioOptions?.extras_interview_prep ? `\n🎤 Interview_Prep_Sheet.${interviewPrepExt}\n   Common questions, STAR answers, and day-of checklist` : ''}

QUICK START:
------------
1. ${portfolioOptions?.extras_quick_start ? `Read the Quick_Start_Guide.${quickStartExt}` : 'Apply to 3 jobs TODAY using Target_Employers list'}
2. Apply to 3 jobs TODAY using Target_Employers list
3. Follow the 30-Day Action Plan
4. Track everything in the Job Tracker

NEED HELP?
----------
Email: support@steelmanresumes.com

We're rooting for you. Now go get that job.

- The Steel Man Resumes Team
`;
    archive.append(Buffer.from(masterReadme), {
      name: 'README.txt',
    });

    // Finalize the archive
    await archive.finalize();

    // Wait for ZIP to complete
    const zipBuffer = await zipPromise;

    // Return ZIP file
    return new NextResponse(zipBuffer as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}_Career_Package.zip"`,
      },
    });
  } catch (error: any) {
    console.error('Packaging error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to package documents' },
      { status: 500 }
    );
  }
}
