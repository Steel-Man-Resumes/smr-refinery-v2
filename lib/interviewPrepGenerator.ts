/**
 * INTERVIEW PREP SHEET GENERATOR - TORI Visual Standard
 */

import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';
import type { ForgePayloadV1 } from './types';

const COLORS = {
  GOLD: 'D4A84B',
  DARK: '1a1a1a',
  GRAY: '666666',
  LIGHT_GOLD_BG: 'FDF6E3',
};

function createSectionHeader(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 400, after: 200 },
    border: { bottom: { color: COLORS.GOLD, space: 1, style: BorderStyle.SINGLE, size: 12 } },
    children: [new TextRun({ text, bold: true, size: 30, font: 'Calibri', color: COLORS.GOLD })],
  });
}

function createQuestion(q: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({ text: '▸ ', bold: true, size: 22, font: 'Calibri', color: COLORS.GOLD }),
      new TextRun({ text: q, bold: true, size: 22, font: 'Calibri', color: COLORS.DARK }),
    ],
  });
}

function createScript(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 150 },
    shading: { type: 'clear', fill: COLORS.LIGHT_GOLD_BG },
    border: { left: { color: COLORS.GOLD, space: 1, style: BorderStyle.SINGLE, size: 16 } },
    indent: { left: 200, right: 200 },
    children: [new TextRun({ text, italics: true, size: 20, font: 'Calibri', color: COLORS.DARK })],
  });
}

function createCheckbox(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: '☐  ', size: 22, font: 'Calibri', color: COLORS.GOLD }),
      new TextRun({ text, size: 22, font: 'Calibri', color: COLORS.DARK }),
    ],
  });
}

function createBullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: '•  ', size: 22, font: 'Calibri' }),
      new TextRun({ text, size: 22, font: 'Calibri', color: COLORS.DARK }),
    ],
  });
}

function createParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 150 },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: COLORS.DARK })],
  });
}

export async function createInterviewPrepDOCX(payload: ForgePayloadV1): Promise<Buffer> {
  const name = payload.profile.full_name;
  const firstName = name.split(' ')[0];
  const targetRole = payload.intake.target_role;
  const hasBarriers = (payload.intake.challenges || []).length > 0;
  const elevatorPitch = payload.narrative?.elevator_pitch_30s || '';
  const topJob = (payload.work_history || [])[0];

  const children: Paragraph[] = [];

  // HEADER
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: 'INTERVIEW PREP SHEET', bold: true, size: 48, font: 'Calibri', color: COLORS.DARK })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      border: { bottom: { color: COLORS.GOLD, space: 1, style: BorderStyle.SINGLE, size: 12 } },
      children: [new TextRun({ text: `${firstName}, walk in ready. Walk out hired.`, size: 22, font: 'Calibri', color: COLORS.GRAY })],
    })
  );

  // PRE-INTERVIEW CHECKLIST
  children.push(
    createSectionHeader('PRE-INTERVIEW CHECKLIST'),
    createParagraph('Complete these the day before:'),
    createCheckbox('Research the company (what they do, recent news, company values)'),
    createCheckbox('Review the job description — highlight keywords to mention'),
    createCheckbox('Print 2-3 copies of your resume'),
    createCheckbox('Prepare your outfit (clean, professional, appropriate for industry)'),
    createCheckbox('Plan your route — arrive 10-15 minutes early'),
    createCheckbox('Charge your phone (for GPS and emergency contact)'),
    createCheckbox('Prepare your questions for the interviewer (see below)'),
    createCheckbox('Practice your elevator pitch out loud 3 times'),
  );

  // ELEVATOR PITCH
  children.push(
    createSectionHeader('YOUR ELEVATOR PITCH'),
    createParagraph('When they say "Tell me about yourself," use this:'),
  );
  if (elevatorPitch) {
    children.push(createScript(elevatorPitch));
  } else {
    children.push(createScript(
      `I'm a ${targetRole} with experience in [your top skill]. At [previous company], I [biggest achievement]. I'm looking for a role where I can [what you want to contribute]. What drew me to [Company] is [specific reason].`
    ));
  }

  // COMMON QUESTIONS
  children.push(
    createSectionHeader('COMMON QUESTIONS (WITH YOUR ANSWERS)'),
    createParagraph('Use the STAR method: Situation → Task → Action → Result'),
    
    createQuestion('"Why do you want to work here?"'),
    createScript(`I've researched [COMPANY] and I'm impressed by [specific thing]. My background in ${targetRole} aligns well with what you're looking for, and I'm excited to contribute.`),

    createQuestion('"What\'s your greatest strength?"'),
    createScript(topJob 
      ? `Reliability and getting things done. At ${topJob.company}, I consistently delivered results. My supervisors knew they could count on me.`
      : `Reliability. When I commit to something, I deliver. I show up on time, work hard, and solve problems.`
    ),

    createQuestion('"What\'s your greatest weakness?"'),
    createScript(`I sometimes take on too much because I want to help the team succeed. I've learned to communicate better about workload so I can deliver quality work.`),

    createQuestion('"Why did you leave your last job?"'),
    createScript(`I'm looking for growth and new challenges. I learned a lot at my previous role and I'm ready to bring that experience to a company where I can contribute more.`),

    createQuestion('"Where do you see yourself in 5 years?"'),
    createScript(`I want to grow with a company that values hard work. In 5 years, I see myself as a trusted ${targetRole} who's taken on more responsibility.`),
  );

  // BARRIER SCRIPTS (if applicable)
  if (hasBarriers) {
    children.push(
      createSectionHeader('IF DIFFICULT TOPICS COME UP'),
      createParagraph('Your Alloy Report has detailed scripts. Here\'s the short version:'),
      createBullet('Be honest but brief — don\'t over-explain'),
      createBullet('Pivot to what you\'ve learned and how you\'ve changed'),
      createBullet('Focus on your reliability and what you bring TODAY'),
      createScript(`"I've made mistakes in the past, and I've worked hard to learn from them. I'm committed, reliable, and ready to prove myself."`),
    );
  }

  // QUESTIONS TO ASK
  children.push(
    createSectionHeader('QUESTIONS TO ASK THE INTERVIEWER'),
    createParagraph('Always have 2-3 ready. It shows you\'re serious.'),
    createBullet('"What does a typical day look like in this role?"'),
    createBullet('"What are the most important qualities for someone to succeed here?"'),
    createBullet('"How would you describe the team culture?"'),
    createBullet('"What\'s the next step in the hiring process?"'),
    createParagraph('DON\'T ask about salary or benefits in the first interview — save that for when they make an offer.'),
  );

  // DAY-OF CHECKLIST
  children.push(
    createSectionHeader('DAY-OF CHECKLIST'),
    createCheckbox('Arrive 10-15 minutes early'),
    createCheckbox('Turn phone to silent before entering'),
    createCheckbox('Firm handshake, eye contact, smile'),
    createCheckbox('Bring: resume copies, ID, pen, notepad'),
    createCheckbox('Listen fully before answering — it\'s okay to pause'),
    createCheckbox('Thank them for their time at the end'),
  );

  // AFTER THE INTERVIEW
  children.push(
    createSectionHeader('AFTER THE INTERVIEW'),
    createCheckbox('Send a thank-you email within 24 hours'),
    createParagraph('Template:'),
    createScript(`Subject: Thank you — ${targetRole} Interview\n\nHi [Interviewer Name],\n\nThank you for taking the time to meet with me today. I enjoyed learning more about [Company] and the ${targetRole} role. Our conversation reinforced my excitement about the opportunity.\n\nPlease don't hesitate to reach out if you need any additional information.\n\nBest regards,\n${firstName}`),
  );

  // FOOTER
  children.push(
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
      border: { top: { color: COLORS.GOLD, space: 1, style: BorderStyle.SINGLE, size: 8 } },
      children: [
        new TextRun({ text: 'Steel Man Resumes — ', size: 20, font: 'Calibri', color: COLORS.GRAY }),
        new TextRun({ text: 'You\'ve got this.', size: 20, font: 'Calibri', color: COLORS.GOLD, italics: true }),
      ],
    })
  );

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 1080, right: 1080 } } },
      children,
    }],
  });

  return await Packer.toBuffer(doc);
}
