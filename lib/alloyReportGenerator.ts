// =============================================================================
// ALLOY REPORT GENERATOR - TORI Standard
// Produces a professionally styled Alloy Report (barrier handling) with:
// - Confidential header with red warning
// - Situation overview box
// - "What Employers Are Thinking" section
// - Interview scripts in styled boxes
// - Evidence/proof points
// - Second-chance friendly employers
// - Local support resources
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
  LIGHT_GREEN: 'F0FFF0',
  RED: '8B0000',
  LIGHT_RED: 'FFF5F5',
  WHITE: 'FFFFFF',
  BLACK: '000000',
};

const noBorder = { style: BorderStyle.NONE, size: 0, color: COLORS.WHITE };
const goldBorder = { style: BorderStyle.SINGLE, size: 16, color: COLORS.GOLD };
const goldBorderMedium = { style: BorderStyle.SINGLE, size: 8, color: COLORS.GOLD };
const goldBorderThin = { style: BorderStyle.SINGLE, size: 4, color: COLORS.GOLD };
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

// =============================================================================
// HEADER BOX (Confidential)
// =============================================================================

function createHeaderBox(candidateName: string) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: redBorder, left: redBorder, bottom: redBorder, right: redBorder,
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
                children: [text('⚠️ CONFIDENTIAL', { size: 24, bold: true, color: COLORS.RED })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 150 },
                children: [text('ALLOY REPORT', { size: 56, bold: true, color: COLORS.WHITE })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120 },
                children: [text('Barrier Strategy & Interview Scripts', { size: 28, color: COLORS.GOLD })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80 },
                children: [text(`Prepared for ${candidateName}`, { size: 22, color: COLORS.WHITE })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// SECTION HEADER
// =============================================================================

function createSectionHeader(title: string, icon: string = '') {
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
                  text(icon ? `${icon} ` : ''),
                  text(title, { size: 32, bold: true, color: COLORS.GOLD }),
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
// SITUATION BOX
// =============================================================================

function createSituationBox(barrierType: string, riskLevel: string, strategy: string) {
  const barrierLabels: Record<string, string> = {
    'employment_gap': 'Employment Gap',
    'career_stall': 'Career Stall',
    'criminal_record': 'Background Concerns',
    'termination': 'Previous Termination',
    'health': 'Health/Medical',
    'age': 'Age Concerns',
    'career_change': 'Career Change',
  };

  const riskColors: Record<string, string> = {
    'LOW': COLORS.GREEN,
    'MEDIUM': COLORS.GOLD,
    'HIGH': COLORS.RED,
  };

  const barrierLabel = barrierLabels[barrierType] || barrierType || 'Career Barrier';
  const riskColor = riskColors[riskLevel?.toUpperCase()] || COLORS.GOLD;

  return new Table({
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
                spacing: { after: 100 },
                children: [text('YOUR SITUATION AT A GLANCE', { size: 26, bold: true })],
              }),
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  text('Barrier Type: ', { bold: true }),
                  text(barrierLabel),
                ],
              }),
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  text('Risk Level: ', { bold: true }),
                  text(riskLevel || 'MEDIUM', { bold: true, color: riskColor }),
                  text(' — Manageable with the right approach', { color: COLORS.GRAY }),
                ],
              }),
              new Paragraph({
                spacing: { before: 100 },
                children: [
                  text('Strategy: ', { bold: true }),
                  text(strategy || 'Lead with strengths, address concerns proactively, provide evidence of reliability.'),
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
// CONCERNS BOX
// =============================================================================

function createConcernsBox(concerns: Array<{ worry: string; counter: string }>) {
  const contentChildren: Paragraph[] = [
    new Paragraph({
      spacing: { after: 150 },
      children: [text('WHAT EMPLOYERS ARE SECRETLY THINKING', { size: 26, bold: true })],
    }),
    new Paragraph({
      spacing: { after: 150 },
      children: [text('Understanding their concerns lets you address them before they become objections:', { italics: true, color: COLORS.GRAY })],
    }),
  ];

  concerns.forEach((concern, idx) => {
    contentChildren.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          text(`${idx + 1}. `, { bold: true, color: COLORS.RED }),
          text(`"${concern.worry}"`, { italics: true, color: COLORS.RED }),
        ],
      })
    );

    contentChildren.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          text('   → Counter with: ', { bold: true, color: COLORS.GREEN }),
          text(concern.counter),
        ],
      })
    );
  });

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
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
            children: contentChildren,
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// SCRIPT BOX
// =============================================================================

function createScriptBox(title: string, context: string | null, script: string) {
  const children: Paragraph[] = [
    new Paragraph({
      spacing: { after: 80 },
      children: [text(title, { size: 24, bold: true, color: COLORS.GOLD })],
    }),
  ];

  if (context) {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [text(context, { italics: true, color: COLORS.GRAY, size: 20 })],
      })
    );
  }

  children.push(
    new Paragraph({
      children: [text(`"${script}"`, { italics: true })],
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: grayBorder,
      left: goldBorderThin,
      bottom: grayBorder,
      right: grayBorder,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'FAFAFA', type: ShadingType.CLEAR },
            borders: { top: noBorder, left: noBorder, bottom: noBorder, right: noBorder },
            margins: { top: 150, bottom: 150, left: 200, right: 200 },
            children,
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// EVIDENCE BOX
// =============================================================================

function createEvidenceBox(proofPoints: string[]) {
  const contentChildren: Paragraph[] = [
    new Paragraph({
      spacing: { after: 150 },
      children: [text('YOUR EVIDENCE', { size: 26, bold: true })],
    }),
    new Paragraph({
      spacing: { after: 150 },
      children: [text('These facts from your background counter employer concerns:', { italics: true, color: COLORS.GRAY })],
    }),
  ];

  proofPoints.forEach(point => {
    contentChildren.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          text('✓ ', { bold: true, color: COLORS.GREEN }),
          text(point),
        ],
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: goldBorderMedium, left: goldBorderMedium, bottom: goldBorderMedium, right: goldBorderMedium,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.LIGHT_GREEN, type: ShadingType.CLEAR },
            borders: { top: noBorder, left: noBorder, bottom: noBorder, right: noBorder },
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
            children: contentChildren,
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// SECOND CHANCE EMPLOYERS BOX
// =============================================================================

function createSecondChanceBox(employers: Array<{ name: string; industry?: string; note?: string }>) {
  const contentChildren: Paragraph[] = [
    new Paragraph({
      spacing: { after: 150 },
      children: [text('SECOND-CHANCE FRIENDLY EMPLOYERS', { size: 26, bold: true, color: COLORS.GOLD })],
    }),
    new Paragraph({
      spacing: { after: 150 },
      children: [text('These companies are known to consider candidates with employment gaps or other barriers:', { italics: true, color: COLORS.GRAY })],
    }),
  ];

  employers.forEach(emp => {
    contentChildren.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          text('• ', { bold: true, color: COLORS.GOLD }),
          text(emp.name, { bold: true }),
          text(` — ${emp.industry || emp.note || 'Barrier-friendly employer'}`, { color: COLORS.GRAY }),
        ],
      })
    );
  });

  return new Table({
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
            children: contentChildren,
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// RESOURCES BOX
// =============================================================================

function createResourcesBox(city: string, state: string) {
  const stateResources: Record<string, Array<{ name: string; url: string; desc: string }>> = {
    'WI': [
      { name: 'Wisconsin Job Center', url: 'jobcenterofwisconsin.com', desc: 'State employment services' },
      { name: 'WRTP/BIG STEP', url: 'wrtp.org', desc: 'Construction & manufacturing training' },
      { name: 'Employ Milwaukee', url: 'employmilwaukee.org', desc: 'Career services and job placement' },
    ],
    'TX': [
      { name: 'Texas Workforce Commission', url: 'twc.texas.gov', desc: 'State employment services' },
      { name: 'Workforce Solutions', url: 'wfscapitalarea.com', desc: 'Austin area career services' },
      { name: 'Goodwill Central Texas', url: 'goodwillcentraltexas.org', desc: 'Job training and placement' },
    ],
    'DEFAULT': [
      { name: 'CareerOneStop', url: 'careeronestop.org', desc: 'US DOL career resources' },
      { name: 'USA Jobs', url: 'usajobs.gov', desc: 'Federal employment opportunities' },
      { name: 'Local Workforce Center', url: 'servicelocator.org', desc: 'Find your local job center' },
    ],
  };

  const resources = stateResources[state] || stateResources['DEFAULT'];

  const contentChildren: Paragraph[] = [
    new Paragraph({
      spacing: { after: 150 },
      children: [text('LOCAL SUPPORT RESOURCES', { size: 26, bold: true, color: COLORS.GOLD })],
    }),
  ];

  resources.forEach(resource => {
    contentChildren.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          text('• ', { bold: true, color: COLORS.GOLD }),
          text(resource.name, { bold: true }),
          text(` — ${resource.desc}`, {}),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [text(`  ${resource.url}`, { color: '0066CC', size: 20 })],
      })
    );
  });

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
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
            children: contentChildren,
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// MAIN GENERATOR FUNCTION
// =============================================================================

export async function generateAlloyReportDOCX(payload: ForgePayloadV1): Promise<Buffer> {
  const profile = payload.profile;
  const candidateName = profile.full_name;
  const city = profile.city || 'your city';
  const state = profile.state || 'your state';

  const barriers = payload.barriers?.challenges || [];
  const primaryBarrier = barriers[0] || {};
  const barrierType = (primaryBarrier as any).type || 'employment_gap';

  const defaultConcerns = [
    { worry: "Will they be reliable? Can I count on them to show up?", counter: "Your attendance record and years of consistent employment demonstrate reliability." },
    { worry: "Why the gap/issue? Are they hiding something?", counter: "Be upfront and brief. The more naturally you address it, the less concerning it seems." },
    { worry: "Are they desperate? Will they leave as soon as something better comes along?", counter: "Express genuine interest in the company and role. Show you've researched them." },
    { worry: "Will they fit with the team? Are there attitude problems?", counter: "Your references and track record of training others shows you work well with people." },
  ];

  const concerns = defaultConcerns;

  const scripts = (primaryBarrier as any).scripts || {
    application_written: "Experienced professional seeking to apply skills in a growth-focused environment.",
    if_asked_directly: "I took time to handle a personal matter. It's resolved, and I'm fully focused on my career now.",
    proactive_address: "I want to be upfront—there's a gap in my resume. It's behind me, and I'm ready to contribute.",
    follow_up_written: "Thank you for considering my application. I'm excited about this opportunity.",
  };

  const defaultProofPoints = [
    "Consistent work history prior to gap",
    "Strong references from previous supervisors",
    "Quantifiable achievements (error reduction, team leadership)",
    "Relevant certifications maintained during gap",
    "Demonstrated commitment through continued skill development",
    "Clear explanation with no red flags",
    "Enthusiasm and specific interest in the role",
    "Professional demeanor and communication",
  ];

  const proofPoints = (primaryBarrier as any).proof_points || defaultProofPoints;

  const employers = payload.research?.target_employers || [];
  const secondChanceEmployers = employers
    .filter((e: any) => e.secondChanceFriendly || e.second_chance_friendly)
    .slice(0, 8);

  const finalSecondChanceEmployers = secondChanceEmployers.length > 0 ? secondChanceEmployers : [
    { name: 'Amazon', industry: 'Known for inclusive hiring practices' },
    { name: 'Walmart', industry: 'Large employer with barrier-friendly policies' },
    { name: 'UPS', industry: 'Values work ethic over background' },
    { name: 'FedEx Ground', industry: 'Second-chance employer' },
    { name: 'Goodwill', industry: 'Mission includes workforce reentry' },
    { name: 'Staffing Agencies', industry: 'Many specialize in barrier populations' },
  ];

  const riskLevels: Record<string, string> = {
    'employment_gap': 'LOW',
    'career_stall': 'LOW',
    'career_change': 'MEDIUM',
    'termination': 'MEDIUM',
    'criminal_record': 'HIGH',
    'health': 'MEDIUM',
  };
  const riskLevel = riskLevels[barrierType] || 'MEDIUM';

  const strategies: Record<string, string> = {
    'employment_gap': 'Be brief and confident when addressing the gap. Lead with what you accomplished before and what you bring now.',
    'career_stall': 'Frame as "ready to grow" not "stuck." Emphasize you\'ve been doing the work without the title.',
    'termination': 'Own it briefly, focus on what you learned, and provide strong references from other roles.',
    'criminal_record': 'Know your rights, disclose appropriately, and emphasize rehabilitation and current capabilities.',
    'career_change': 'Highlight transferable skills and genuine interest in the new field.',
    'health': 'Focus on current capability. You don\'t owe details—just confirm you can do the job.',
  };
  const strategy = strategies[barrierType] || 'Address concerns proactively with confidence and evidence.';

  const children: (Paragraph | Table)[] = [];

  children.push(createHeaderBox(candidateName));
  children.push(spacer(300));

  children.push(createSituationBox(barrierType, riskLevel, strategy));
  children.push(spacer(400));

  children.push(createConcernsBox(concerns));
  children.push(spacer(400));

  children.push(new Paragraph({
    shading: { fill: COLORS.LIGHT_GRAY, type: ShadingType.CLEAR },
    spacing: { before: 100, after: 100 },
    children: [
      text('📋 ', { size: 24 }),
      text('Legal Note: ', { bold: true }),
      text('Employers cannot legally ask about medical conditions, only whether you can perform essential job functions. For background checks, many states have "ban the box" laws limiting when employers can inquire.', { size: 20, color: COLORS.GRAY }),
    ],
  }));
  children.push(spacer(300));

  children.push(createSectionHeader('YOUR SCRIPTS', '📝'));
  children.push(spacer(150));

  children.push(createScriptBox(
    'ON THE APPLICATION',
    'Use in the "explain any gaps" or similar fields:',
    scripts.application_written
  ));
  children.push(spacer(200));

  children.push(createScriptBox(
    'IF ASKED DIRECTLY IN INTERVIEW',
    'Deliver with confidence, then redirect to your strengths:',
    scripts.if_asked_directly
  ));
  children.push(spacer(200));

  children.push(createScriptBox(
    'PROACTIVE ADDRESS',
    'Use if you sense hesitation or want to control the narrative:',
    scripts.proactive_address
  ));
  children.push(spacer(200));

  children.push(createScriptBox(
    'IN FOLLOW-UP COMMUNICATION',
    'Reinforce in thank-you emails or follow-up calls:',
    scripts.follow_up_written
  ));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  children.push(createEvidenceBox(proofPoints));
  children.push(spacer(400));

  children.push(createSecondChanceBox(finalSecondChanceEmployers));
  children.push(spacer(400));

  children.push(createResourcesBox(city, state));
  children.push(spacer(300));

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
                children: [text('REMEMBER', { size: 28, bold: true, color: COLORS.GOLD })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 },
                children: [text('Your barrier is one part of your story, not the whole story. Lead with your strengths, address concerns with confidence, and let your track record speak for itself.', { italics: true })],
              }),
            ],
          }),
        ],
      }),
    ],
  }));

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
              children: [text(`${candidateName} | Alloy Report — CONFIDENTIAL`, { size: 18, color: COLORS.RED, italics: true })],
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
