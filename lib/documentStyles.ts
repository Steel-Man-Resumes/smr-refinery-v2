// =============================================================================
// DOCUMENT STYLES - TORI-standard styling patterns for docx-js
// File: lib/documentStyles.ts
// =============================================================================

import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  Header, Footer, PageNumber, PageBreak,
  ITableCellOptions, IParagraphOptions, IRunOptions,
  IBorderOptions,
} from 'docx';

// =============================================================================
// BRAND COLORS
// =============================================================================

export const COLORS = {
  GOLD: 'D4A84B',
  DARK: '1a1a1a',
  LIGHT_GOLD: 'FFF8E7',
  GRAY: '666666',
  LIGHT_GRAY: 'F5F5F5',
  GREEN: '228B22',
  RED: '8B0000',
  LIGHT_RED: 'FFF5F5',
  WHITE: 'FFFFFF',
  BLACK: '000000',
};

// =============================================================================
// BORDER PRESETS
// =============================================================================

export const BORDERS = {
  none: { style: BorderStyle.NONE, size: 0, color: COLORS.WHITE } as IBorderOptions,
  goldThick: { style: BorderStyle.SINGLE, size: 16, color: COLORS.GOLD } as IBorderOptions,
  goldMedium: { style: BorderStyle.SINGLE, size: 8, color: COLORS.GOLD } as IBorderOptions,
  goldThin: { style: BorderStyle.SINGLE, size: 4, color: COLORS.GOLD } as IBorderOptions,
  grayThin: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' } as IBorderOptions,
  redMedium: { style: BorderStyle.SINGLE, size: 8, color: COLORS.RED } as IBorderOptions,
  redThin: { style: BorderStyle.SINGLE, size: 4, color: COLORS.RED } as IBorderOptions,
};

export const NO_BORDERS = {
  top: BORDERS.none,
  bottom: BORDERS.none,
  left: BORDERS.none,
  right: BORDERS.none,
};

export const GOLD_BOX_BORDERS = {
  top: BORDERS.goldThick,
  bottom: BORDERS.goldThick,
  left: BORDERS.goldThick,
  right: BORDERS.goldThick,
};

export const GRAY_BOX_BORDERS = {
  top: BORDERS.grayThin,
  bottom: BORDERS.grayThin,
  left: BORDERS.grayThin,
  right: BORDERS.grayThin,
};

// =============================================================================
// TEXT STYLES
// =============================================================================

export function createTextRun(text: string, options: Partial<IRunOptions> = {}): TextRun {
  return new TextRun({
    text,
    font: 'Arial',
    size: 22, // 11pt default
    ...options,
  });
}

export function boldText(text: string, size: number = 22, color?: string): TextRun {
  return createTextRun(text, { bold: true, size, color });
}

export function goldText(text: string, size: number = 22, bold: boolean = false): TextRun {
  return createTextRun(text, { color: COLORS.GOLD, size, bold });
}

export function grayText(text: string, size: number = 20): TextRun {
  return createTextRun(text, { color: COLORS.GRAY, size });
}

export function whiteText(text: string, size: number = 22, bold: boolean = false): TextRun {
  return createTextRun(text, { color: COLORS.WHITE, size, bold });
}

// =============================================================================
// HEADER BOX (Dark background with gold border)
// =============================================================================

export function createHeaderBox(
  title: string,
  subtitle?: string,
  subSubtitle?: string
): Table {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [whiteText(title, 48, true)],
    }),
  ];

  if (subtitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100 },
        children: [goldText(subtitle, 26)],
      })
    );
  }

  if (subSubtitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80 },
        children: [grayText(subSubtitle, 22)],
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: GOLD_BOX_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.DARK, type: ShadingType.CLEAR },
            borders: NO_BORDERS,
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
            children,
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// SECTION HEADER (Gold underline)
// =============================================================================

export function createSectionHeader(title: string, count?: number): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: BORDERS.none,
      left: BORDERS.none,
      right: BORDERS.none,
      bottom: { style: BorderStyle.SINGLE, size: 12, color: COLORS.GOLD },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: NO_BORDERS,
            margins: { top: 200, bottom: 100 },
            children: [
              new Paragraph({
                children: [
                  boldText(title, 28, COLORS.GOLD),
                  ...(count !== undefined ? [grayText(` (${count})`, 24)] : []),
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
// EMPLOYER CARD (Gold header + light content)
// =============================================================================

export interface EmployerCardData {
  index: number;
  name: string;
  industry: string;
  location: string;
  website?: string;
  activePosting?: string;
  whyGoodFit: string;
  applyLink?: string;
}

export function createEmployerCard(employer: EmployerCardData): Table {
  const contentChildren: Paragraph[] = [
    new Paragraph({
      spacing: { after: 80 },
      children: [
        boldText('Industry: ', 22),
        createTextRun(employer.industry),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        boldText('Location: ', 22),
        createTextRun(employer.location),
      ],
    }),
  ];

  if (employer.website) {
    contentChildren.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          boldText('Website: ', 22),
          createTextRun(employer.website, { color: '0066CC' }),
        ],
      })
    );
  }

  if (employer.activePosting) {
    contentChildren.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          boldText('Active Posting: ', 22, COLORS.GREEN),
          createTextRun(employer.activePosting),
        ],
      })
    );
  }

  contentChildren.push(
    new Paragraph({
      spacing: { before: 100, after: 80 },
      children: [
        boldText('WHY YOU FIT: ', 22, COLORS.GOLD),
        createTextRun(employer.whyGoodFit),
      ],
    })
  );

  if (employer.applyLink) {
    contentChildren.push(
      new Paragraph({
        spacing: { before: 80 },
        children: [
          boldText('► APPLY: ', 22),
          createTextRun(employer.applyLink, { color: '0066CC' }),
        ],
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: BORDERS.goldMedium,
      left: BORDERS.goldMedium,
      bottom: BORDERS.goldMedium,
      right: BORDERS.goldMedium,
    },
    rows: [
      // Gold header row
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.GOLD, type: ShadingType.CLEAR },
            borders: NO_BORDERS,
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: [
              new Paragraph({
                children: [whiteText(`${employer.index}. ${employer.name}`, 26, true)],
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
            borders: NO_BORDERS,
            margins: { top: 120, bottom: 120, left: 150, right: 150 },
            children: contentChildren,
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// COMPACT EMPLOYER ROW (For Tier 2/3)
// =============================================================================

export function createCompactEmployerRow(
  index: number,
  name: string,
  industry: string,
  location: string,
  whyGoodFit: string
): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: GRAY_BOX_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.LIGHT_GRAY, type: ShadingType.CLEAR },
            borders: NO_BORDERS,
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: [
              new Paragraph({
                children: [
                  boldText(`${index}. ${name}`, 24),
                  grayText(` — ${industry}`, 22),
                ],
              }),
              new Paragraph({
                spacing: { before: 60 },
                children: [grayText(location, 20)],
              }),
              new Paragraph({
                spacing: { before: 80 },
                children: [createTextRun(whyGoodFit)],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// SCRIPT BOX (Left gold accent border)
// =============================================================================

export function createScriptBox(title: string, script: string, context?: string): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [
    new Paragraph({
      spacing: { after: 80 },
      children: [goldText(title, 22, true)],
    }),
  ];

  if (context) {
    elements.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [createTextRun(context, { italics: true, color: COLORS.GRAY, size: 20 })],
      })
    );
  }

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: BORDERS.grayThin,
        left: BORDERS.goldThin, // Gold accent on left
        bottom: BORDERS.grayThin,
        right: BORDERS.grayThin,
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: 'FAFAFA', type: ShadingType.CLEAR },
              borders: NO_BORDERS,
              margins: { top: 100, bottom: 100, left: 150, right: 150 },
              children: [
                new Paragraph({
                  children: [createTextRun(`"${script}"`, { italics: true })],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  return elements;
}

// =============================================================================
// CALLOUT BOX (Various colors)
// =============================================================================

export function createCalloutBox(
  content: Paragraph[],
  style: 'gold' | 'red' | 'gray' = 'gold'
): Table {
  const colors = {
    gold: { fill: COLORS.LIGHT_GOLD, border: COLORS.GOLD },
    red: { fill: COLORS.LIGHT_RED, border: COLORS.RED },
    gray: { fill: COLORS.LIGHT_GRAY, border: 'CCCCCC' },
  };

  const { fill, border } = colors[style];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: border },
      left: { style: BorderStyle.SINGLE, size: 8, color: border },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: border },
      right: { style: BorderStyle.SINGLE, size: 8, color: border },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill, type: ShadingType.CLEAR },
            borders: NO_BORDERS,
            margins: { top: 150, bottom: 150, left: 200, right: 200 },
            children: content,
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// WEEK HEADER (For Action Plan)
// =============================================================================

export function createWeekHeader(weekNum: number, title: string, dateRange?: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: BORDERS.goldThick,
      left: BORDERS.goldThick,
      bottom: BORDERS.none,
      right: BORDERS.goldThick,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLORS.GOLD, type: ShadingType.CLEAR },
            borders: NO_BORDERS,
            margins: { top: 120, bottom: 120, left: 150, right: 150 },
            children: [
              new Paragraph({
                children: [
                  whiteText(`WEEK ${weekNum}: ${title}`, 28, true),
                  ...(dateRange ? [whiteText(`  |  ${dateRange}`, 22)] : []),
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
// DAY BOX (For Action Plan)
// =============================================================================

export function createDayBox(
  dayNum: string | number,
  title: string,
  tasks: string[],
  targetCompanies?: string
): Table {
  const contentChildren: Paragraph[] = [
    new Paragraph({
      spacing: { after: 100 },
      children: [
        goldText(`DAY ${dayNum}: `, 24, true),
        boldText(title, 24),
      ],
    }),
  ];

  if (targetCompanies) {
    contentChildren.push(
      new Paragraph({
        spacing: { after: 100 },
        shading: { fill: COLORS.LIGHT_GOLD, type: ShadingType.CLEAR },
        children: [
          boldText('🎯 Target: ', 20),
          createTextRun(targetCompanies, { size: 20 }),
        ],
      })
    );
  }

  for (const task of tasks) {
    contentChildren.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [createTextRun(`☐ ${task}`)],
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: BORDERS.none,
      left: BORDERS.goldThick,
      bottom: BORDERS.grayThin,
      right: BORDERS.goldThick,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: NO_BORDERS,
            margins: { top: 120, bottom: 120, left: 150, right: 150 },
            children: contentChildren,
          }),
        ],
      }),
    ],
  });
}

// =============================================================================
// STATS BAR (4 metrics in a row)
// =============================================================================

export interface StatItem {
  value: string;
  label: string;
}

export function createStatsBar(stats: StatItem[]): Table {
  const cellWidth = Math.floor(9360 / stats.length); // Full width divided by number of stats

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: GRAY_BOX_BORDERS,
    columnWidths: stats.map(() => cellWidth),
    rows: [
      new TableRow({
        children: stats.map((stat, index) =>
          new TableCell({
            width: { size: cellWidth, type: WidthType.DXA },
            borders: {
              top: BORDERS.none,
              left: BORDERS.none,
              bottom: BORDERS.none,
              right: index < stats.length - 1 ? BORDERS.grayThin : BORDERS.none,
            },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [goldText(stat.value, 36, true)],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [grayText(stat.label, 18)],
              }),
            ],
          })
        ),
      }),
    ],
  });
}

// =============================================================================
// STANDARD HEADER/FOOTER
// =============================================================================

export function createStandardHeader(text: string): Header {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [createTextRun(text, { size: 18, color: COLORS.GRAY, italics: true })],
      }),
    ],
  });
}

export function createStandardFooter(prefix: string = 'Steel Man Resumes'): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          grayText(`${prefix} | Page `),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: COLORS.GRAY, font: 'Arial' }),
        ],
      }),
    ],
  });
}

// =============================================================================
// PAGE SETTINGS
// =============================================================================

export const PAGE_SETTINGS = {
  usLetter: {
    size: { width: 12240, height: 15840 }, // 8.5" x 11" in DXA
    margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5" margins
  },
  usLetterNarrow: {
    size: { width: 12240, height: 15840 },
    margin: { top: 576, right: 576, bottom: 576, left: 576 }, // 0.4" margins
  },
};

// =============================================================================
// SPACING HELPERS
// =============================================================================

export function spacer(twips: number = 200): Paragraph {
  return new Paragraph({ spacing: { before: twips, after: twips } });
}

export function pageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

export default {
  COLORS,
  BORDERS,
  createHeaderBox,
  createSectionHeader,
  createEmployerCard,
  createCompactEmployerRow,
  createScriptBox,
  createCalloutBox,
  createWeekHeader,
  createDayBox,
  createStatsBar,
  createStandardHeader,
  createStandardFooter,
  PAGE_SETTINGS,
  spacer,
  pageBreak,
  boldText,
  goldText,
  grayText,
  whiteText,
  createTextRun,
};
