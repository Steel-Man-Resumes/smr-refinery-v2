#!/usr/bin/env node

/**
 * Generate favicons from the white SMR logo
 * Requires: sharp (npm install sharp)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'SMR-Website', 'assets', 'SMR_Icon_White_Transparent.jpg');
const OUTPUT_DIR = path.join(__dirname, 'public');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

async function generateFavicons() {
  console.log('Source file:', SOURCE);
  console.log('Output directory:', OUTPUT_DIR);

  if (!fs.existsSync(SOURCE)) {
    console.error('Source file not found:', SOURCE);
    process.exit(1);
  }

  // Generate each size
  for (const { name, size } of sizes) {
    const output = path.join(OUTPUT_DIR, name);
    console.log(`Generating ${name} (${size}x${size})...`);

    await sharp(SOURCE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(output);

    console.log(`✓ Created ${name}`);
  }

  // Generate favicon.ico (32x32 embedded)
  console.log('Generating favicon.ico...');
  await sharp(SOURCE)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'favicon.ico'));

  console.log('✓ Created favicon.ico');
  console.log('\n✅ All favicons generated successfully!');
}

generateFavicons().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
