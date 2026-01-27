// =============================================================================
// TARGET EMPLOYERS GENERATOR - TORI Standard
// Produces a professionally styled Target Employers document with:
// - Dark header box with gold border
// - Stats bar showing key metrics
// - Tier 1 employers as full cards (gold header + light content)
// - Tier 2 employers as compact rows
// - Tier 3 employers as simple list
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
  WHITE: 'FFFFFF',
  BLACK: '000000',
};

const noBorder = { style: BorderStyle.NONE, size: 0, color: COLORS.WHITE };
const goldBorder = { style: BorderStyle.SINGLE, size: 16, color: COLORS.GOLD };
const goldBorderMedium = { style: BorderStyle.SINGLE, size: 8, color: COLORS.GOLD };
const grayBorder = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };

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

// =============================================================================
// HEADER BOX (Dark background with gold border)
// =============================================================================

function createHeaderBox(candidateName: string, targetRole: string, location: string, salaryRange: string, commute: string) {
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
                children: [text('TARGET EMPLOYERS', { size: 56, bold: true, color: COLORS.WHITE })],
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
// STATS BAR
// =============================================================================

function createStatsBar(stats: Array<{ value: string; label: string }>) {
  const cellWidth = Math.floor(9360 / stats.length);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: grayBorder, left: grayBorder, bottom: grayBorder, right: grayBorder,
    },
    columnWidths: stats.map(() => cellWidth),
    rows: [
      new TableRow({
        children: stats.map((stat, index) =>
          new TableCell({
            width: { size: cellWidth, type: WidthType.DXA },
            borders: {
              top: noBorder, left: noBorder, bottom: noBorder,
              right: index < stats.length - 1 ? grayBorder : noBorder,
            },
            margins: { top: 150, bottom: 150, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [text(stat.value, { size: 40, bold: true, color: COLORS.GOLD })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [text(stat.label, { size: 18, color: COLORS.GRAY })],
              }),
            ],
          })
        ),
      }),
    ],
  });
}

// =============================================================================
// SECTION HEADER
// =============================================================================

function createSectionHeader(title: string, count?: number) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder, left: noBorder, right: noBorder,
      bottom: { style: BorderStyle.SINGLE, size: 12, color: COLORS.GOLD },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: { top: noBorder, left: noBorder, bottom: noBorder, right: noBorder },
            margins: { top: 300, bottom: 100 },
            children: [
              new Paragraph({
                children: [
                  text(title, { size: 32, bold: true, color: COLORS.GOLD }),
                  count !== undefined ? text(` (${count})`, { size: 26, color: COLORS.GRAY }) : text(''),
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
// EMPLOYER CARD (Tier 1 - Full details)
// =============================================================================

function createEmployerCard(index: number, employer: any) {
  const contentChildren: Paragraph[] = [
    new Paragraph({
      spacing: { after: 80 },
      children: [
        text('Industry: ', { bold: true }),
        text(employer.industry || employer.business_type || 'Not specified'),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        text('Location: ', { bold: true }),
        text(employer.location),
        employer.commute ? text(` (${employer.commute} commute)`, { color: COLORS.GRAY, size: 20 }) : text(''),
      ],
    }),
  ];

  if (employer.website) {
    contentChildren.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          text('Website: ', { bold: true }),
          text(employer.website, { color: '0066CC' }),
        ],
      })
    );
  }

  if (employer.activePosting || employer.how_to_apply) {
    contentChildren.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          text('Active Posting: ', { bold: true, color: COLORS.GREEN }),
          text(employer.activePosting || employer.how_to_apply),
        ],
      })
    );
  }

  contentChildren.push(
    new Paragraph({
      spacing: { before: 120, after: 80 },
      children: [
        text('WHY YOU FIT: ', { bold: true, color: COLORS.GOLD }),
        text(employer.whyGoodFit || employer.why_good_fit || 'Strong match for your background'),
      ],
    })
  );

  if (employer.applyLink) {
    contentChildren.push(
      new Paragraph({
        spacing: { before: 100 },
        children: [
          text('► APPLY: ', { bold: true }),
          text(employer.applyLink, { color: '0066CC' }),
        ],
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: goldBorderMedium, left: goldBorderMedium,
      bottom: goldBorderMedium, right: goldBorderMedium,
    },
    rows: [
      // Gold header row
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.GOLD, type: ShadingType.CLEAR },
            borders: { top: noBorder, left: noBorder, bottom: noBorder, right: noBorder },
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: [
              new Paragraph({
                children: [text(`${index}. ${employer.name}`, { size: 28, bold: true, color: COLORS.WHITE })],
              }),
            ],
          }),
        ],
      }),
      // Content row
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.LIGHT_GOLD, type: ShadingType.CLEAR },
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
// COMPACT EMPLOYER ROW (Tier 2)
// =============================================================================

function createCompactEmployerRow(index: number, employer: any) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: grayBorder, left: grayBorder, bottom: grayBorder, right: grayBorder,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.LIGHT_GRAY, type: ShadingType.CLEAR },
            borders: { top: noBorder, left: noBorder, bottom: noBorder, right: noBorder },
            margins: { top: 120, bottom: 120, left: 150, right: 150 },
            children: [
              new Paragraph({
                children: [
                  text(`${index}. ${employer.name}`, { size: 24, bold: true }),
                  text(` — ${employer.industry || employer.business_type || 'Hiring company'}`, { size: 22, color: COLORS.GRAY }),
                ],
              }),
              new Paragraph({
                spacing: { before: 60 },
                children: [text(employer.location, { size: 20, color: COLORS.GRAY })],
              }),
              new Paragraph({
                spacing: { before: 80 },
                children: [text(employer.whyGoodFit || employer.why_good_fit || 'Good opportunity', { size: 22 })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// SIMPLE EMPLOYER LIST ITEM (Tier 3)
// =============================================================================

function createSimpleEmployerItem(index: number, employer: any) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [
      text(`${index}. ${employer.name}`, { bold: true }),
      text(` (${employer.industry || employer.business_type || 'Employer'})`, { color: COLORS.GRAY }),
      text(` — ${employer.location}`, { size: 20 }),
    ],
  });
}

// =============================================================================
// MAIN GENERATOR FUNCTION
// =============================================================================

export async function generateTargetEmployersDOCX(payload: ForgePayloadV1): Promise<{ docx: Buffer; employers: any[] }> {
  // Extract data from payload
  const profile = payload.profile;
  const candidateName = profile.full_name;
  const targetRole = payload.intake.target_role || payload.strategy?.target_titles?.primary?.[0] || 'Target Role';
  const location = `${profile.city}, ${profile.state}`;
  const salaryRange = payload.strategy?.salary?.immediate_realistic || '$50,000 - $60,000';
  const commute = `${payload.intake?.constraints?.max_commute_minutes || 30}-Min Commute`;

  // Get employers from research
  const employers = payload.research?.target_employers || [];

  // Validate we have employers
  if (employers.length === 0) {
    throw new Error('No target employers found in payload');
  }

  // Split into tiers
  const tier1 = employers.filter((e: any) => e.tier === 1).slice(0, 10);
  const tier2 = employers.filter((e: any) => e.tier === 2).slice(0, 20);
  const tier3 = employers.filter((e: any) => e.tier === 3 || (!e.tier && tier1.length + tier2.length < employers.indexOf(e)));

  // If no tiers assigned, distribute: first 10 = T1, next 20 = T2, rest = T3
  let finalTier1 = tier1;
  let finalTier2 = tier2;
  let finalTier3 = tier3;

  if (tier1.length === 0 && tier2.length === 0) {
    finalTier1 = employers.slice(0, 10);
    finalTier2 = employers.slice(10, 30);
    finalTier3 = employers.slice(30);
  }

  // Build document content
  const children: (Paragraph | Table)[] = [];

  // Header
  children.push(createHeaderBox(candidateName, targetRole, location, salaryRange, commute));
  children.push(spacer(300));

  // Stats bar
  const totalEmployers = finalTier1.length + finalTier2.length + finalTier3.length;
  children.push(createStatsBar([
    { value: String(totalEmployers), label: 'EMPLOYERS' },
    { value: commute.split('-')[0], label: 'MAX COMMUTE' },
    { value: salaryRange.split(' - ')[0].replace('$', ''), label: 'TARGET SALARY' },
    { value: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), label: 'UPDATED' },
  ]));
  children.push(spacer(400));

  // Tier 1 Section
  if (finalTier1.length > 0) {
    children.push(createSectionHeader('TIER 1: TOP TARGETS', finalTier1.length));
    children.push(new Paragraph({
      spacing: { after: 150 },
      children: [text('These employers are actively hiring and match your profile closely. Apply immediately.', { italics: true, color: COLORS.GRAY })],
    }));

    finalTier1.forEach((employer: any, idx: number) => {
      children.push(createEmployerCard(idx + 1, employer));
      children.push(spacer(200));
    });
  }

  // Page break before Tier 2
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Tier 2 Section
  if (finalTier2.length > 0) {
    children.push(createSectionHeader('TIER 2: STRONG ALTERNATIVES', finalTier2.length));
    children.push(new Paragraph({
      spacing: { after: 150 },
      children: [text('Solid opportunities that may require slightly more follow-up.', { italics: true, color: COLORS.GRAY })],
    }));

    finalTier2.forEach((employer: any, idx: number) => {
      children.push(createCompactEmployerRow(finalTier1.length + idx + 1, employer));
      children.push(spacer(100));
    });
  }

  // Tier 3 Section
  if (finalTier3.length > 0) {
    children.push(spacer(200));
    children.push(createSectionHeader('TIER 3: ADDITIONAL OPTIONS', finalTier3.length));
    children.push(new Paragraph({
      spacing: { after: 150 },
      children: [text('Staffing agencies and backup options to expand your search.', { italics: true, color: COLORS.GRAY })],
    }));

    finalTier3.forEach((employer: any, idx: number) => {
      children.push(createSimpleEmployerItem(finalTier1.length + finalTier2.length + idx + 1, employer));
    });
  }

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
              children: [text(`${candidateName} | Target Employers`, { size: 18, color: COLORS.GRAY, italics: true })],
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

  const buffer = await Packer.toBuffer(doc);
  return { docx: buffer, employers };
}
