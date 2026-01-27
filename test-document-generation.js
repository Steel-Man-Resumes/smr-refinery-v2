#!/usr/bin/env node

/**
 * Test script for document generation
 * Sends test-forge-payload.json to the generate-documents API
 * Saves the resulting ZIP file
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3006/api/generate-documents';
const PAYLOAD_FILE = path.join(__dirname, 'test-forge-payload.json');
const OUTPUT_DIR = path.join(__dirname, 'test-output');
const OUTPUT_ZIP = path.join(OUTPUT_DIR, `test-documents-${Date.now()}.zip`);

async function testDocumentGeneration() {
  console.log('🧪 Testing SMR Refinery Document Generation\n');

  // 1. Read test payload
  console.log('📄 Reading test payload from:', PAYLOAD_FILE);
  if (!fs.existsSync(PAYLOAD_FILE)) {
    console.error('❌ Error: test-forge-payload.json not found');
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(PAYLOAD_FILE, 'utf8'));
  console.log(`   User: ${payload.profile?.full_name || 'N/A'}`);
  console.log(`   Role: ${payload.intake?.target_role || 'N/A'}`);
  console.log(`   Location: ${payload.profile?.city && payload.profile?.state ? `${payload.profile.city}, ${payload.profile.state}` : 'N/A'}\n`);

  // 2. Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 3. Call API
  console.log('🚀 Calling API:', API_URL);
  console.log('⏳ Generating documents (this may take 30-60 seconds)...\n');

  const startTime = Date.now();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      process.exit(1);
    }

    // 4. Save ZIP file
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(OUTPUT_ZIP, buffer);
    const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);

    console.log(`✅ Documents generated successfully in ${duration}s`);
    console.log(`📦 ZIP file saved: ${OUTPUT_ZIP}`);
    console.log(`   Size: ${sizeMB} MB\n`);

    // 5. Extract ZIP for comparison
    console.log('📂 Extracting documents...');
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(OUTPUT_ZIP);
    const extractDir = path.join(OUTPUT_DIR, `extracted-${Date.now()}`);
    zip.extractAllTo(extractDir, true);

    console.log(`✅ Extracted to: ${extractDir}\n`);

    // 6. List generated files
    const files = fs.readdirSync(extractDir);
    console.log('📄 Generated files:');
    files.forEach(file => {
      const filePath = path.join(extractDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`   - ${file} (${sizeKB} KB)`);
    });

    console.log('\n✨ Test complete! Compare documents to TORI standards in:');
    console.log(`   ${path.join(__dirname, '..', 'Sandbox')}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDocumentGeneration();
