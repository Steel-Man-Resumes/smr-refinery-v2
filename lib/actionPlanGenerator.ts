// =============================================================================
// 30-DAY ACTION PLAN GENERATOR - TORI Standard
// Produces a professionally styled 30-Day Action Plan with:
// - Dark header box with gold border
// - Visual progress bar targets
// - Week boxes with gold headers
// - Day-by-day tasks with checkboxes
// - Target company callouts
// - Contingency plan section
// =============================================================================

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  Header, Footer, PageNumber, PageBreak
} from 'docx';
import type { ForgePayloadV1 } from './types';

// =============================================================================
// BRAND COLORS & STYLES
// =============================================================================

const COLORS = {
  GOLD: 'D4A84B',
  DARK: '1a1a1a',
  LIGHT_GOLD: 'FFF8E7',
  GRAY: '666666',
  LIGHT_GRAY: 'F5F5F5',
  GREEN: '228B22',
  RED: '8B0000',
  LIGHT_RED: 'FFF0F0',
  WHITE: 'FFFFFF',
  BLACK: '000000',
};

const noBorder = { style: BorderStyle.NONE, size: 0, color: COLORS.WHITE };
const goldBorder = { style: BorderStyle.SINGLE, size: 16, color: COLORS.GOLD };
const goldBorderMedium = { style: BorderStyle.SINGLE, size: 8, color: COLORS.GOLD };
const grayBorder = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
const redBorder = { style: BorderStyle.SINGLE, size: 8, color: COLORS.RED };

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function text(content: string, options: any = {}) {
  return new TextRun({
    text: content,
    font: 'Arial',
    size: options.size || 22,
    bold: options.bold || false,
    italics: options.italics || false,
    color: options.color || COLORS.BLACK,
  });
}

function spacer(twips: number = 200) {
  return new Paragraph({ spacing: { before: twips, after: twips } });
}

function progressBar(filled: number, total: number = 10): TextRun[] {
  const boxes: TextRun[] = [];
  for (let i = 0; i < total; i++) {
    boxes.push(text(i < filled ? '█' : '░', { color: i < filled ? COLORS.GOLD : 'CCCCCC', size: 24 }));
  }
  return boxes;
}

// =============================================================================
// HEADER BOX
// =============================================================================

function createHeaderBox(targetRole: string, location: string, salaryRange: string, commute: string) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: goldBorder, left: goldBorder, bottom: goldBorder, right: goldBorder,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.DARK, type: ShadingType.CLEAR },
            borders: { top: noBorder, left: noBorder, bottom: noBorder, right: noBorder },
            margins: { top: 300, bottom: 300, left: 200, right: 200 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [text('30-DAY ACTION PLAN', { size: 56, bold: true, color: COLORS.WHITE })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120 },
                children: [text(targetRole, { size: 28, color: COLORS.GOLD })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80 },
                children: [
                  text(`${location} | Target: ${salaryRange} | ${commute}`, { size: 22, color: COLORS.WHITE }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// TARGETS BOX (Progress bars)
// =============================================================================

function createTargetsBox(targetRole: string, salaryRange: string) {
  const targets = [
    { week: 1, count: 2, label: '8-10 applications' },
    { week: 2, count: 4, label: '15+ total applications' },
    { week: 3, count: 6, label: '25+ total, 1+ interview' },
    { week: 4, count: 8, label: '35+ total applications' },
  ];

  const rows = targets.map(t =>
    new Paragraph({
      spacing: { before: 80, after: 80 },
      children: [
        text(`Week ${t.week}: `, { bold: true }),
        ...progressBar(t.count),
        text(`  ${t.label}`, { color: COLORS.GRAY }),
      ],
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: grayBorder, left: grayBorder, bottom: grayBorder, right: grayBorder,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: noBorder, left: noBorder, bottom: noBorder, right: noBorder },
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { after: 150 },
                children: [text('YOUR 30-DAY TARGETS', { size: 28, bold: true })],
              }),
              ...rows,
              new Paragraph({
                spacing: { before: 150 },
                children: [
                  text('🎯 ', { size: 24 }),
                  text('END GOAL: ', { bold: true, color: COLORS.GOLD }),
                  text(`Job offer for ${targetRole} at ${salaryRange}`, { size: 22 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// WEEK HEADER
// =============================================================================

function createWeekHeader(weekNum: number, title: string, dateRange: string) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: goldBorder, left: goldBorder, bottom: noBorder, right: goldBorder,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.GOLD, type: ShadingType.CLEAR },
            borders: { top: noBorder, left: noBorder, bottom: noBorder, right: noBorder },
            margins: { top: 120, bottom: 120, left: 150, right: 150 },
            children: [
              new Paragraph({
                children: [
                  text(`WEEK ${weekNum}: ${title}`, { size: 28, bold: true, color: COLORS.WHITE }),
                  text(`  |  ${dateRange}`, { size: 22, color: COLORS.WHITE }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// DAY BOX
// =============================================================================

function createDayBox(dayNum: number | string, title: string, tasks: string[], targetCompanies: string[] | null, isLastInWeek: boolean = false) {
  const contentChildren: Paragraph[] = [
    new Paragraph({
      spacing: { after: 100 },
      children: [
        text(`DAY ${dayNum}: `, { size: 24, bold: true, color: COLORS.GOLD }),
        text(title, { size: 24, bold: true }),
      ],
    }),
  ];

  if (targetCompanies && targetCompanies.length > 0) {
    contentChildren.push(
      new Paragraph({
        spacing: { after: 120 },
        shading: { fill: COLORS.LIGHT_GOLD, type: ShadingType.CLEAR },
        children: [
          text('🎯 Target: ', { bold: true, size: 20 }),
          text(targetCompanies.join(', '), { size: 20 }),
        ],
      })
    );
  }

  tasks.forEach(task => {
    if (task) {
      contentChildren.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [text(`☐ ${task}`, { size: 22 })],
        })
      );
    }
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder,
      left: goldBorder,
      bottom: isLastInWeek ? goldBorder : grayBorder,
      right: goldBorder,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: noBorder, left: noBorder, bottom: noBorder, right: noBorder },
            margins: { top: 150, bottom: 150, left: 200, right: 200 },
            children: contentChildren,
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// CONTINGENCY BOX
// =============================================================================

function createContingencyBox() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: redBorder, left: redBorder, bottom: redBorder, right: redBorder,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.LIGHT_RED, type: ShadingType.CLEAR },
            borders: { top: noBorder, left: noBorder, bottom: noBorder, right: noBorder },
            margins: { top: 150, bottom: 150, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { after: 100 },
                children: [text('⚠️ CONTINGENCY PLAN', { size: 26, bold: true, color: COLORS.RED })],
              }),
              new Paragraph({
                spacing: { after: 80 },
                children: [text('If no interviews by end of Week 2:', { bold: true })],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [text('☐ Review resume with fresh eyes—are achievements quantified?')],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [text('☐ Expand search radius by 10 miles')],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [text('☐ Contact 2 additional staffing agencies')],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [text('☐ Consider adjacent roles (Lead, Coordinator)')],
              }),
              new Paragraph({
                spacing: { before: 100 },
                children: [text('Remember: Job searching is a numbers game. Persistence wins.', { italics: true, color: COLORS.GRAY })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// MAIN GENERATOR FUNCTION
// =============================================================================

export async function generate30DayActionPlanDOCX(payload: ForgePayloadV1, employersList?: any[]): Promise<Buffer> {
  // Extract data from payload
  const profile = payload.profile;
  const candidateName = profile.full_name;
  const targetRole = payload.intake?.target_role || payload.strategy?.target_titles?.primary?.[0] || 'Target Role';
  const location = `${profile.city}, ${profile.state}`;
  const salaryRange = payload.strategy?.salary?.immediate_realistic || '$50,000 - $60,000';
  const commute = `${payload.intake?.constraints?.max_commute_minutes || 30}-Min Commute`;

  // Get tier 1 employers for targeting
  const employers = employersList || payload.research?.target_employers || [];
  const tier1Names = employers.filter((e: any) => e.tier === 1).slice(0, 5).map((e: any) => e.name);
  const tier1Batch1 = tier1Names.slice(0, 3);
  const tier1Batch2 = tier1Names.slice(3, 5);

  // If no tier assignment, use first 5
  const targetBatch1 = tier1Batch1.length > 0 ? tier1Batch1 : employers.slice(0, 3).map((e: any) => e.name);
  const targetBatch2 = tier1Batch2.length > 0 ? tier1Batch2 : employers.slice(3, 5).map((e: any) => e.name);

  // Build document content
  const children: (Paragraph | Table)[] = [];

  // Header
  children.push(createHeaderBox(targetRole, location, salaryRange, commute));
  children.push(spacer(300));

  // Targets box
  children.push(createTargetsBox(targetRole, salaryRange));
  children.push(spacer(400));

  // ==========================================================================
  // WEEK 1
  // ==========================================================================
  children.push(createWeekHeader(1, 'FOUNDATION & LAUNCH', 'Days 1-5'));

  children.push(createDayBox(1, 'SETUP & ORGANIZATION', [
    'Open your Job Application Tracker spreadsheet—this is your command center',
    'Set up dedicated email folder: "Job Applications"',
    `Save resume as PDF: ${candidateName.replace(/\s+/g, '_')}_Resume.pdf`,
    'Print 10 resume copies for in-person applications',
    'Update voicemail to professional greeting',
    'Clear schedule for job search: block 2-3 hours daily',
  ], null));

  children.push(createDayBox(2, 'TARGET EMPLOYER RESEARCH', [
    'Review your Target Employers document completely',
    'Research Tier 1 companies in depth—check their careers pages',
    'Note which companies have active job postings with apply links',
    'Create calendar reminders for follow-ups (3-5 days after each application)',
  ], targetBatch1));

  children.push(createDayBox(3, 'FIRST APPLICATIONS', [
    targetBatch1.length > 0 ? `Apply to: ${targetBatch1.join(', ')}` : 'Apply to 3 top employers from your list',
    'Customize cover letter for each (reference company name, specific role)',
    'IMPORTANT: Only apply to positions that match your shift/commute constraints',
    'Log each application in your tracker with date and contact info',
  ], targetBatch1));

  children.push(createDayBox(4, 'EXPAND & FOLLOW UP', [
    targetBatch2.length > 0 ? `Apply to: ${targetBatch2.join(', ')}` : 'Apply to 2 more top employers',
    'Search Indeed/LinkedIn for 3 additional matching positions',
    'Apply to any urgent/immediate openings found',
    'Draft follow-up email template for use next week',
  ], targetBatch2));

  children.push(createDayBox('5-7', 'WEEKEND MOMENTUM', [
    'Review all applications submitted this week',
    'Research 5 more potential employers',
    'Practice your 30-second elevator pitch',
    'Prepare interview outfit',
    'Goal: 8-10 applications submitted by end of Week 1',
  ], null, true));

  children.push(spacer(300));

  // ==========================================================================
  // WEEK 2
  // ==========================================================================
  children.push(createWeekHeader(2, 'ACCELERATION', 'Days 8-14'));

  children.push(createDayBox(8, 'FOLLOW-UP BLITZ', [
    'Call to follow up on Day 3 applications (3-5 days later)',
    'Ask: "I submitted my application on [date] and wanted to confirm it was received"',
    'Get hiring manager names when possible',
    'Apply to 2 new positions',
  ], null));

  children.push(createDayBox(9, 'STAFFING AGENCIES', [
    'Contact 3 staffing agencies from your Target Employers list',
    'Send resume with brief intro: "Looking for [role] in [location]"',
    'Ask about temp-to-hire opportunities',
    'Apply to 2 new positions',
  ], null));

  children.push(createDayBox(10, 'NETWORK ACTIVATION', [
    'Reach out to 3 former colleagues/supervisors',
    'Ask if they know of any openings (don\'t ask for a job directly)',
    'Request LinkedIn recommendations if appropriate',
    'Apply to 2 new positions',
  ], null));

  children.push(createDayBox('11-14', 'SUSTAINED EFFORT', [
    'Continue applying: target 2-3 applications per day',
    'Follow up on Week 1 applications not yet contacted',
    'Review and refresh your elevator pitch',
    'Goal: 15+ total applications by end of Week 2',
    'CHECKPOINT: If no responses yet, review contingency plan below',
  ], null, true));

  children.push(spacer(300));

  // ==========================================================================
  // WEEK 3
  // ==========================================================================
  children.push(createWeekHeader(3, 'INTERVIEW PREPARATION', 'Days 15-21'));

  children.push(createDayBox('15-17', 'INTERVIEW READINESS', [
    'Review your Interview Prep Sheet thoroughly',
    'Practice STAR method answers for common questions',
    'Prepare 5 questions to ask interviewers',
    'Research companies you\'ve applied to (recent news, values)',
    'Continue applying: 2 applications per day minimum',
  ], null));

  children.push(createDayBox('18-21', 'ACTIVE PURSUIT', [
    'Second follow-up calls on applications over 10 days old',
    'Check in with staffing agencies',
    'Apply to any new postings from Tier 1 employers',
    'Goal: 25+ total applications, at least 1 interview scheduled',
  ], null, true));

  children.push(spacer(300));

  // ==========================================================================
  // WEEK 4
  // ==========================================================================
  children.push(createWeekHeader(4, 'CLOSING STRONG', 'Days 22-30'));

  children.push(createDayBox('22-25', 'FINAL PUSH', [
    'Apply to any remaining Tier 2 employers not yet contacted',
    'Final follow-up on all pending applications',
    'Expand to Tier 3 employers if needed',
    'Continue daily application habit',
  ], null));

  children.push(createDayBox('26-30', 'CLOSE THE DEAL', [
    'Prepare for any scheduled interviews',
    'Review salary negotiation strategies from your package',
    'Send thank-you emails within 24 hours of any interview',
    'Goal: 35+ total applications, job offer in hand or imminent',
  ], null, true));

  // Page break before contingency
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Contingency plan
  children.push(createContingencyBox());
  children.push(spacer(300));

  // Closing message
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: goldBorderMedium, left: goldBorderMedium, bottom: goldBorderMedium, right: goldBorderMedium,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.LIGHT_GOLD, type: ShadingType.CLEAR },
            borders: { top: noBorder, left: noBorder, bottom: noBorder, right: noBorder },
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [text('YOU\'VE GOT THIS', { size: 28, bold: true, color: COLORS.GOLD })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 },
                children: [text('Consistency beats intensity. Show up every day, follow the plan, and the results will come.', { italics: true })],
              }),
            ],
          }),
        ],
      }),
    ],
  }));

  // Create document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 22 },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [text(`${candidateName} | 30-Day Action Plan`, { size: 18, color: COLORS.GRAY, italics: true })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                text('Steel Man Resumes | Page ', { size: 18, color: COLORS.GRAY }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: COLORS.GRAY, font: 'Arial' }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  });

  return await Packer.toBuffer(doc);
}
