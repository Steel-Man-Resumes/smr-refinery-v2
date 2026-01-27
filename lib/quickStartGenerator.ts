/**
 * QUICK START GUIDE GENERATOR - TORI Visual Standard
 * 
 * A one-page, action-focused guide that gets users moving in 48 hours.
 * Uses checkboxes, bold calls-to-action, and visual hierarchy.
 */

import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, TableCell, TableRow, Table, WidthType, ShadingType } from 'docx';
import type { ForgePayloadV1 } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// BRAND COLORS (TORI Standard)
// ═══════════════════════════════════════════════════════════════════════════
const COLORS = {
  GOLD: 'D4A84B',
  DARK: '1a1a1a',
  GRAY: '666666',
  LIGHT_GOLD_BG: 'FDF6E3',
  WHITE: 'FFFFFF',
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT: Create Quick Start Guide DOCX
// ═══════════════════════════════════════════════════════════════════════════

export async function createQuickStartGuideDOCX(payload: ForgePayloadV1): Promise<Buffer> {
  const name = payload.profile.full_name;
  const firstName = name.split(' ')[0];
  const targetRole = payload.intake.target_role;
  const location = `${payload.profile.city}, ${payload.profile.state}`;
  const hasBarriers = (payload.intake.challenges || []).length > 0;

  const children: Paragraph[] = [];

  // ═══════════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════════
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: 'QUICK START GUIDE',
          bold: true,
          size: 48, // 24pt
          font: 'Calibri',
          color: COLORS.DARK,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: 'Your First 48 Hours',
          size: 28,
          font: 'Calibri',
          color: COLORS.GOLD,
          italics: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      border: {
        bottom: { color: COLORS.GOLD, space: 1, style: BorderStyle.SINGLE, size: 12 },
      },
      children: [
        new TextRun({
          text: `${firstName}, this is your launch pad. Follow these steps and you'll have applications out TODAY.`,
          size: 22,
          font: 'Calibri',
          color: COLORS.GRAY,
        }),
      ],
    })
  );

  // ═══════════════════════════════════════════════════════════════════════
  // HOUR 1-2: REVIEW YOUR PACKAGE
  // ═══════════════════════════════════════════════════════════════════════
  children.push(
    createSectionHeader('HOUR 1-2: REVIEW YOUR PACKAGE'),
    createCheckboxItem('Extract the ZIP file to a folder you can find easily (Desktop or Documents)'),
    createCheckboxItem('Open your resume in Microsoft Word — read it out loud to catch any errors'),
    createCheckboxItem('Open the Cover_Letters folder and read ALL THREE variants'),
    createCheckboxItem('Pick your default cover letter (PROFESSIONAL is safest if unsure)'),
    createCheckboxItem('Check all dates, company names, and contact info are correct'),
    createTipBox('Your resume is already formatted and ready. Don\'t change the styling — just verify the content is accurate.')
  );

  // ═══════════════════════════════════════════════════════════════════════
  // HOUR 3-4: SET UP YOUR SYSTEM
  // ═══════════════════════════════════════════════════════════════════════
  children.push(
    createSectionHeader('HOUR 3-4: SET UP YOUR SYSTEM'),
    createCheckboxItem('Open the Job_Application_Tracker.xlsx spreadsheet'),
    createCheckboxItem('Create a dedicated email folder called "Job Applications"'),
    createCheckboxItem(`Save your resume as PDF: ${name.replace(/\s+/g, '_')}_Resume.pdf`),
    createCheckboxItem('Print 5-10 resume copies if you\'ll apply in person'),
    createCheckboxItem('Clear your voicemail and update your greeting to sound professional'),
    createTipBox('Employers often call without leaving a message. Answer unknown numbers during business hours or call back within 2 hours.')
  );

  // ═══════════════════════════════════════════════════════════════════════
  // HOUR 5-8: YOUR FIRST APPLICATIONS
  // ═══════════════════════════════════════════════════════════════════════
  children.push(
    createSectionHeader('HOUR 5-8: APPLY TO 3 JOBS TODAY'),
    createCheckboxItem('Open Target_Employers.docx and review the Tier 1 companies'),
    createCheckboxItem('Pick your TOP 3 employers from the list'),
    createCheckboxItem('For each application:'),
    createSubItem('Open the right cover letter variant for that company'),
    createSubItem('Replace [COMPANY NAME] and [JOB TITLE] with actual values'),
    createSubItem('Save the customized cover letter'),
    createSubItem('Submit application with resume + cover letter'),
    createSubItem('Log it in the Job Tracker immediately'),
    createCheckboxItem('Set calendar reminders to follow up in 3-5 business days'),
    createBoldCallout('🎯 GOAL: 3 applications submitted before you go to bed tonight.')
  );

  // ═══════════════════════════════════════════════════════════════════════
  // DAY 2: BUILD MOMENTUM
  // ═══════════════════════════════════════════════════════════════════════
  children.push(
    createSectionHeader('DAY 2: BUILD MOMENTUM'),
    createCheckboxItem('Apply to 3-5 more positions from Target_Employers.docx'),
    createCheckboxItem('Open the 30_Day_Action_Plan.docx and read Week 1'),
    createCheckboxItem('Practice your elevator pitch out loud 3 times:'),
    new Paragraph({
      spacing: { before: 100, after: 200 },
      indent: { left: 720 },
      shading: { type: ShadingType.SOLID, color: COLORS.LIGHT_GOLD_BG },
      children: [
        new TextRun({
          text: payload.narrative?.elevator_pitch_30s || 
            `"I'm a ${targetRole} with experience in [your top skill]. I'm looking for a role where I can [what you want to contribute]."`,
          size: 20,
          font: 'Calibri',
          italics: true,
          color: COLORS.DARK,
        }),
      ],
    }),
    hasBarriers 
      ? createCheckboxItem('Review your Alloy_Report_CONFIDENTIAL.docx — practice the scripts for addressing barriers')
      : createCheckboxItem('Prepare 3 specific examples of achievements from your work history (use STAR method)'),
    createCheckboxItem('Check your email and tracker for any responses'),
    createBoldCallout('🎯 GOAL: 6-8 total applications by end of Day 2.')
  );

  // ═══════════════════════════════════════════════════════════════════════
  // COVER LETTER CHEAT SHEET
  // ═══════════════════════════════════════════════════════════════════════
  children.push(
    createSectionHeader('WHICH COVER LETTER TO USE?'),
    new Paragraph({
      spacing: { after: 150 },
      children: [
        new TextRun({ text: 'BOLD', bold: true, size: 22, font: 'Calibri', color: COLORS.GOLD }),
        new TextRun({ text: ' → Big companies, competitive roles, metrics-driven environments', size: 20, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 150 },
      children: [
        new TextRun({ text: 'PROFESSIONAL', bold: true, size: 22, font: 'Calibri', color: COLORS.GOLD }),
        new TextRun({ text: ' → Most applications. When in doubt, use this one.', size: 20, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: 'FRIENDLY', bold: true, size: 22, font: 'Calibri', color: COLORS.GOLD }),
        new TextRun({ text: ' → Small businesses, family-owned, culture-first employers', size: 20, font: 'Calibri' }),
      ],
    })
  );

  // ═══════════════════════════════════════════════════════════════════════
  // WHAT'S IN YOUR PACKAGE
  // ═══════════════════════════════════════════════════════════════════════
  children.push(
    createSectionHeader('YOUR PACKAGE CONTENTS'),
    createFileItem(`${name.replace(/\s+/g, '_')}_Resume.docx`, 'Your professional resume'),
    createFileItem('Cover_Letters/', '3 variants (BOLD, PROFESSIONAL, FRIENDLY)'),
    createFileItem('30_Day_Action_Plan.docx', 'Day-by-day job search roadmap'),
    createFileItem('Target_Employers.docx', '50+ employers in your area, ranked by fit'),
    createFileItem('Portfolio.html', 'Web portfolio — open in any browser'),
  );
  if (hasBarriers) {
    children.push(createFileItem('Alloy_Report_CONFIDENTIAL.docx', 'Private barrier-addressing strategies'));
  }
  children.push(
    createFileItem('Job_Application_Tracker.xlsx', 'Track every application'),
  );

  // ═══════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
      border: {
        top: { color: COLORS.GOLD, space: 1, style: BorderStyle.SINGLE, size: 12 },
      },
      children: [
        new TextRun({
          text: '\n',
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [
        new TextRun({
          text: `${firstName}, your first job offer is coming.`,
          bold: true,
          size: 24,
          font: 'Calibri',
          color: COLORS.GOLD,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: 'Keep moving. Keep applying. Keep following up.',
          size: 22,
          font: 'Calibri',
          color: COLORS.GRAY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '— Steel Man Resumes',
          size: 20,
          font: 'Calibri',
          color: COLORS.GRAY,
          italics: true,
        }),
      ],
    })
  );

  // Filter out nulls
  const filteredChildren = children.filter(Boolean) as Paragraph[];

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 576,    // 0.4 inch
            right: 720,  // 0.5 inch
            bottom: 576,
            left: 720,
          },
        },
      },
      children: filteredChildren,
    }],
  });

  return await Packer.toBuffer(doc);
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function createSectionHeader(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 400, after: 200 },
    border: {
      bottom: { color: COLORS.GOLD, space: 1, style: BorderStyle.SINGLE, size: 8 },
    },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 26,
        font: 'Calibri',
        color: COLORS.GOLD,
      }),
    ],
  });
}

function createCheckboxItem(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: '☐  ',
        size: 24,
        font: 'Calibri',
      }),
      new TextRun({
        text: text,
        size: 22,
        font: 'Calibri',
      }),
    ],
  });
}

function createSubItem(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 720 }, // 0.5 inch
    children: [
      new TextRun({
        text: '→ ',
        size: 20,
        font: 'Calibri',
        color: COLORS.GOLD,
      }),
      new TextRun({
        text: text,
        size: 20,
        font: 'Calibri',
      }),
    ],
  });
}

function createTipBox(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 150, after: 200 },
    indent: { left: 360 },
    shading: { type: ShadingType.SOLID, color: COLORS.LIGHT_GOLD_BG },
    border: {
      left: { color: COLORS.GOLD, space: 1, style: BorderStyle.SINGLE, size: 24 },
    },
    children: [
      new TextRun({
        text: '💡 TIP: ',
        bold: true,
        size: 20,
        font: 'Calibri',
        color: COLORS.GOLD,
      }),
      new TextRun({
        text: text,
        size: 20,
        font: 'Calibri',
        color: COLORS.DARK,
      }),
    ],
  });
}

function createBoldCallout(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 300 },
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.SOLID, color: COLORS.GOLD },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 24,
        font: 'Calibri',
        color: COLORS.WHITE,
      }),
    ],
  });
}

function createFileItem(filename: string, description: string): Paragraph {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({
        text: '📄 ',
        size: 20,
        font: 'Calibri',
      }),
      new TextRun({
        text: filename,
        bold: true,
        size: 20,
        font: 'Calibri',
        color: COLORS.DARK,
      }),
      new TextRun({
        text: ` — ${description}`,
        size: 20,
        font: 'Calibri',
        color: COLORS.GRAY,
      }),
    ],
  });
}
