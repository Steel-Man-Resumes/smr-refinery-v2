/**
 * SALARY NEGOTIATION CHEAT SHEET GENERATOR - TORI Visual Standard
 * 
 * Designed specifically for second-chance candidates who've been told
 * they should be "grateful for any opportunity." This document helps
 * them reclaim their worth and negotiate with confidence.
 * 
 * No one should have to accept poverty wages because of their past.
 */

import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';
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
  RED: 'C41E3A',
  GREEN: '2E7D32',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function createSectionHeader(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 400, after: 200 },
    border: {
      bottom: { color: COLORS.GOLD, space: 1, style: BorderStyle.SINGLE, size: 12 },
    },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 30, // 15pt
        font: 'Calibri',
        color: COLORS.GOLD,
      }),
    ],
  });
}

function createSubHeader(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 250, after: 120 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 24, // 12pt
        font: 'Calibri',
        color: COLORS.DARK,
      }),
    ],
  });
}

function createScript(label: string, script: string): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 150, after: 80 },
      children: [
        new TextRun({
          text: label,
          bold: true,
          size: 22,
          font: 'Calibri',
          color: COLORS.DARK,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 150 },
      shading: { type: 'clear', fill: COLORS.LIGHT_GOLD_BG },
      border: {
        left: { color: COLORS.GOLD, space: 1, style: BorderStyle.SINGLE, size: 16 },
      },
      indent: { left: 200, right: 200 },
      children: [
        new TextRun({
          text: `"${script}"`,
          italics: true,
          size: 22,
          font: 'Calibri',
          color: COLORS.DARK,
        }),
      ],
    }),
  ];
}

function createDoItem(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({
        text: '✓  ',
        bold: true,
        size: 22,
        font: 'Calibri',
        color: COLORS.GREEN,
      }),
      new TextRun({
        text: text,
        size: 22,
        font: 'Calibri',
        color: COLORS.DARK,
      }),
    ],
  });
}

function createDontItem(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({
        text: '✗  ',
        bold: true,
        size: 22,
        font: 'Calibri',
        color: COLORS.RED,
      }),
      new TextRun({
        text: text,
        size: 22,
        font: 'Calibri',
        color: COLORS.DARK,
      }),
    ],
  });
}

function createBullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360 },
    children: [
      new TextRun({
        text: '•  ',
        size: 22,
        font: 'Calibri',
      }),
      new TextRun({
        text: text,
        size: 22,
        font: 'Calibri',
        color: COLORS.DARK,
      }),
    ],
  });
}

function createCalloutBox(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    alignment: AlignmentType.CENTER,
    shading: { type: 'clear', fill: COLORS.GOLD },
    border: {
      top: { color: COLORS.GOLD, space: 1, style: BorderStyle.SINGLE, size: 8 },
      bottom: { color: COLORS.GOLD, space: 1, style: BorderStyle.SINGLE, size: 8 },
      left: { color: COLORS.GOLD, space: 1, style: BorderStyle.SINGLE, size: 8 },
      right: { color: COLORS.GOLD, space: 1, style: BorderStyle.SINGLE, size: 8 },
    },
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

function createParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 150 },
    children: [
      new TextRun({
        text: text,
        size: 22,
        font: 'Calibri',
        color: COLORS.DARK,
      }),
    ],
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT: Create Salary Negotiation Cheat Sheet DOCX
// ═══════════════════════════════════════════════════════════════════════════

export async function createSalaryNegotiationDOCX(payload: ForgePayloadV1): Promise<Buffer> {
  const name = payload.profile.full_name;
  const firstName = name.split(' ')[0];
  const targetRole = payload.intake.target_role;
  const location = `${payload.profile.city}, ${payload.profile.state}`;
  const hasBarriers = (payload.intake.challenges || []).length > 0;
  
  // Get salary data if available
  const salaryTarget = payload.strategy?.salary?.immediate_realistic || '';
  const salaryRange = 'market rate'; // Market range not available in payload

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
          text: 'SALARY NEGOTIATION',
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
          text: 'CHEAT SHEET',
          bold: true,
          size: 36,
          font: 'Calibri',
          color: COLORS.GOLD,
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
          text: `${firstName}, you've earned the right to be paid what you're worth. This guide shows you how.`,
          size: 22,
          font: 'Calibri',
          color: COLORS.GRAY,
        }),
      ],
    })
  );

  // ═══════════════════════════════════════════════════════════════════════
  // THE TRUTH ABOUT NEGOTIATION
  // ═══════════════════════════════════════════════════════════════════════
  if (hasBarriers) {
    children.push(
      createSectionHeader('THE TRUTH NO ONE TELLS YOU'),
      createParagraph(
        `${firstName}, here's what they won't say out loud: employers EXPECT you to negotiate. ` +
        `When you don't, they assume you don't know your worth — or worse, that you're desperate. ` +
        `Your past doesn't change this. In fact, if you've overcome real challenges to get here, ` +
        `that's PROOF you're someone who delivers under pressure.`
      ),
      createCalloutBox('YOUR PAST DOES NOT DETERMINE YOUR PAYCHECK.')
    );
  } else {
    children.push(
      createSectionHeader('THE TRUTH ABOUT NEGOTIATION'),
      createParagraph(
        `${firstName}, employers EXPECT you to negotiate. The first offer is almost never their best offer. ` +
        `When you accept immediately, you leave money on the table — money they were ready to pay. ` +
        `Negotiating isn't greedy. It's professional.`
      ),
      createCalloutBox('THE FIRST OFFER IS NEVER THE FINAL OFFER.')
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // YOUR TARGET NUMBERS
  // ═══════════════════════════════════════════════════════════════════════
  children.push(
    createSectionHeader('YOUR TARGET NUMBERS'),
    createParagraph(
      `Based on ${targetRole} positions in ${location}, here's your negotiation range:`
    )
  );

  if (salaryTarget) {
    children.push(
      new Paragraph({
        spacing: { before: 150, after: 80 },
        children: [
          new TextRun({
            text: 'Your Target: ',
            bold: true,
            size: 24,
            font: 'Calibri',
            color: COLORS.DARK,
          }),
          new TextRun({
            text: salaryTarget,
            bold: true,
            size: 28,
            font: 'Calibri',
            color: COLORS.GOLD,
          }),
        ],
      })
    );
  }

  children.push(
    createParagraph(
      'When stating a range, make your TARGET the LOW end. If you want $20/hour, say "$20-23/hour." ' +
      'This anchors the conversation at your actual goal.'
    )
  );

  // ═══════════════════════════════════════════════════════════════════════
  // THE GOLDEN RULES
  // ═══════════════════════════════════════════════════════════════════════
  children.push(
    createSectionHeader('THE GOLDEN RULES'),
    createDoItem('Research the market rate BEFORE interviews (you already have it above)'),
    createDoItem('Let them name a number first whenever possible'),
    createDoItem('Always give a RANGE, not a single number'),
    createDoItem('Pause and think before responding — silence is powerful'),
    createDoItem('Be confident, not apologetic — you\'re solving their problem'),
    createDontItem('"I\'ll take whatever you offer"'),
    createDontItem('"I really need this job" (desperation kills leverage)'),
    createDontItem('Apologizing for asking'),
    createDontItem('Accepting on the spot without taking time to consider'),
  );

  // ═══════════════════════════════════════════════════════════════════════
  // SCRIPTS FOR EVERY SITUATION
  // ═══════════════════════════════════════════════════════════════════════
  children.push(
    createSectionHeader('WORD-FOR-WORD SCRIPTS'),
    
    createSubHeader('When they ask: "What are your salary expectations?"'),
    ...createScript(
      'DEFLECT FIRST (best option):',
      `I'm focused on finding the right fit. I'm flexible on compensation if this is the right opportunity. What's the range budgeted for this position?`
    ),
    ...createScript(
      'IF THEY PUSH:',
      `Based on my research for ${targetRole} roles in ${location}, I'm looking in the ${salaryRange || '$X to $Y'} range depending on total compensation. Is that within your budget?`
    ),

    createSubHeader('When they make an offer:'),
    ...createScript(
      'DON\'T ACCEPT IMMEDIATELY:',
      `Thank you — I'm excited about this opportunity. I'd like to take 24 hours to review the full package. When do you need my answer?`
    ),
    ...createScript(
      'THEN COUNTER:',
      `I appreciate the offer. Based on my experience with [specific achievement], I was hoping we could get closer to [10-15% higher]. Is there flexibility there?`
    ),

    createSubHeader('If they say the salary is firm:'),
    ...createScript(
      'NEGOTIATE OTHER ITEMS:',
      `I understand the base is set. Would you be open to discussing [sign-on bonus / earlier review date / extra PTO / schedule flexibility]?`
    ),
  );

  // ═══════════════════════════════════════════════════════════════════════
  // IF PAST COMES UP DURING NEGOTIATION (for barriers)
  // ═══════════════════════════════════════════════════════════════════════
  if (hasBarriers) {
    children.push(
      createSectionHeader('IF YOUR PAST COMES UP'),
      createParagraph(
        `Some employers try to use your background to lowball you. Here's how to redirect:`
      ),
      ...createScript(
        'IF THEY IMPLY YOU SHOULD TAKE LESS:',
        `I understand there might be concerns, but my qualifications and what I bring to this role are the same as any other candidate. I'm asking for fair market compensation for the work I'll deliver.`
      ),
      ...createScript(
        'IF THEY SAY "THIS IS A SECOND CHANCE":',
        `I appreciate the opportunity, and I'm committed to proving myself. That said, I'm confident my skills justify fair compensation. I'd rather start at a rate that reflects my contributions so we build a long-term relationship.`
      ),
      createCalloutBox('A company that won\'t pay you fairly will never treat you fairly.')
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // THINGS YOU CAN NEGOTIATE (BESIDES SALARY)
  // ═══════════════════════════════════════════════════════════════════════
  children.push(
    createSectionHeader('IF BASE SALARY IS TRULY FIXED'),
    createParagraph('Negotiate these instead — they have real value:'),
    createBullet('Sign-on bonus (one-time, often easier to approve)'),
    createBullet('Earlier performance review (90 days instead of 1 year = faster raise)'),
    createBullet('Extra PTO days (worth $100-200+ per day)'),
    createBullet('Flexible schedule or remote days'),
    createBullet('Training/certification budget (increases your future earning power)'),
    createBullet('Better title (costs them nothing, helps your next job search)'),
    createBullet('Shift differential or overtime preference'),
    createBullet('Gas/mileage reimbursement'),
  );

  // ═══════════════════════════════════════════════════════════════════════
  // WHAT NOT TO SAY
  // ═══════════════════════════════════════════════════════════════════════
  children.push(
    createSectionHeader('NEVER SAY THESE'),
    createDontItem('"I need $X because my rent is expensive" — your bills aren\'t their problem'),
    createDontItem('"I was making $X at my last job" — irrelevant, and might anchor you low'),
    createDontItem('"I\'ll take anything" — guarantees you\'ll get the minimum'),
    createDontItem('"That\'s disappointing" without a counter-offer — always counter'),
    createDontItem('"I\'m not good at negotiating" — you are now'),
  );

  // ═══════════════════════════════════════════════════════════════════════
  // CLOSING MINDSET
  // ═══════════════════════════════════════════════════════════════════════
  children.push(
    createSectionHeader('YOUR MINDSET'),
    createParagraph(
      `${firstName}, negotiation isn't about winning or being greedy. It's about establishing mutual respect. ` +
      `When you accept less than you're worth, you start the job feeling undervalued — and that shows in your work. ` +
      `When you negotiate professionally, employers respect you more, not less.`
    ),
  );

  if (hasBarriers) {
    children.push(
      createParagraph(
        `Your background doesn't disqualify you from fair pay. You've overcome things most people never face. ` +
        `That resilience is VALUABLE. Don't let anyone tell you otherwise.`
      ),
      createCalloutBox('YOU ARE NOT YOUR PAST. YOU ARE WHAT YOU DO NEXT.')
    );
  } else {
    children.push(
      createCalloutBox('YOU BRING VALUE. GET PAID FOR IT.')
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
      border: {
        top: { color: COLORS.GOLD, space: 1, style: BorderStyle.SINGLE, size: 8 },
      },
      children: [
        new TextRun({
          text: 'Steel Man Resumes — ',
          size: 20,
          font: 'Calibri',
          color: COLORS.GRAY,
        }),
        new TextRun({
          text: 'We believe in your worth.',
          size: 20,
          font: 'Calibri',
          color: COLORS.GOLD,
          italics: true,
        }),
      ],
    })
  );

  // ═══════════════════════════════════════════════════════════════════════
  // BUILD DOCUMENT
  // ═══════════════════════════════════════════════════════════════════════
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch
              bottom: 720,
              left: 1080,  // 0.75 inch
              right: 1080,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
