// =============================================================================
// REFINERY API DIAGNOSTIC
// Run: node diagnose-refinery.js
// =============================================================================

const fs = require('fs');
const path = require('path');

console.log('\n========================================');
console.log('REFINERY API DIAGNOSTIC');
console.log('========================================\n');

// -----------------------------------------------------------------------------
// CHECK 1: Environment Variables
// -----------------------------------------------------------------------------
console.log('CHECK 1: Environment Variables\n');

// Try to load .env.local
const envPaths = [
  '.env.local',
  '.env',
  '../.env.local',
  '../.env',
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`  Found env file: ${envPath}`);
    try {
      require('dotenv').config({ path: envPath });
      envLoaded = true;
      console.log(`  ✓ Loaded: ${envPath}`);
    } catch (e) {
      console.log(`  ✗ Failed to load (dotenv not installed?): ${e.message}`);
    }
  }
}

if (!envLoaded) {
  console.log('  ⚠ No .env file found. Checking raw process.env...');
}

const rapidApiKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY || process.env.JSEARCH_API_KEY;

if (rapidApiKey) {
  console.log(`  ✓ API Key found: ${rapidApiKey.substring(0, 8)}...${rapidApiKey.substring(rapidApiKey.length - 4)}`);
  console.log(`  Key length: ${rapidApiKey.length} characters`);
} else {
  console.log('  ✗ NO API KEY FOUND');
  console.log('  Checked: RAPIDAPI_KEY, RAPID_API_KEY, JSEARCH_API_KEY');
  console.log('\n  ACTION: Add to .env.local:');
  console.log('  RAPIDAPI_KEY=your_key_here\n');
}

// -----------------------------------------------------------------------------
// CHECK 2: API Connectivity Test
// -----------------------------------------------------------------------------
console.log('\nCHECK 2: API Connectivity Test\n');

async function testApiConnection() {
  if (!rapidApiKey) {
    console.log('  ✗ Skipping - no API key');
    return false;
  }

  const testUrl = 'https://jsearch.p.rapidapi.com/search?query=warehouse%20supervisor%20in%20Austin%2C%20TX&page=1&num_pages=1';

  console.log('  Testing JSearch API...');
  console.log(`  URL: ${testUrl.substring(0, 60)}...`);

  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    });

    console.log(`  Response status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      const jobCount = data.data?.length || 0;
      console.log(`  ✓ API WORKING - Got ${jobCount} jobs`);

      if (jobCount > 0) {
        console.log(`  Sample employer: ${data.data[0].employer_name}`);
      }
      return true;
    } else {
      const errorText = await response.text();
      console.log(`  ✗ API ERROR: ${errorText.substring(0, 200)}`);

      if (response.status === 403) {
        console.log('\n  ACTION: API key may be invalid or subscription expired');
        console.log('  Check: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch');
      }
      return false;
    }
  } catch (err) {
    console.log(`  ✗ NETWORK ERROR: ${err.message}`);
    return false;
  }
}

// -----------------------------------------------------------------------------
// CHECK 3: Find Refinery Employer Code
// -----------------------------------------------------------------------------
console.log('\nCHECK 3: Scanning for employer-related code\n');

function findFiles(dir, pattern, results = []) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
          findFiles(fullPath, pattern, results);
        } else if (file.match(/\.(js|ts|jsx|tsx)$/)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content.match(pattern)) {
            results.push(fullPath);
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
  return results;
}

const searchPatterns = [
  { name: 'JSearch API calls', pattern: /jsearch\.p\.rapidapi|rapidapi.*jsearch/i },
  { name: 'Employer generation', pattern: /target.?employers|employer.?search|generateEmployers/i },
  { name: 'RapidAPI usage', pattern: /X-RapidAPI-Key|rapidapi/i },
  { name: 'API key references', pattern: /RAPIDAPI_KEY|RAPID_API_KEY|process\.env\.(RAPID|JSEARCH)/i },
];

const cwd = process.cwd();
console.log(`  Scanning: ${cwd}\n`);

for (const { name, pattern } of searchPatterns) {
  const files = findFiles(cwd, pattern);
  if (files.length > 0) {
    console.log(`  ${name}:`);
    files.slice(0, 5).forEach(f => console.log(`    - ${f.replace(cwd, '.')}`));
    if (files.length > 5) console.log(`    ... and ${files.length - 5} more`);
  } else {
    console.log(`  ${name}: NOT FOUND`);
  }
  console.log('');
}

// -----------------------------------------------------------------------------
// CHECK 4: Package.json dependencies
// -----------------------------------------------------------------------------
console.log('CHECK 4: Dependencies\n');

try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const required = ['docx', 'dotenv'];
  const optional = ['node-fetch', 'axios'];

  for (const dep of required) {
    if (deps[dep]) {
      console.log(`  ✓ ${dep}: ${deps[dep]}`);
    } else {
      console.log(`  ✗ ${dep}: NOT INSTALLED`);
      console.log(`    ACTION: npm install ${dep}`);
    }
  }

  console.log('');
  for (const dep of optional) {
    if (deps[dep]) {
      console.log(`  ○ ${dep}: ${deps[dep]} (optional)`);
    }
  }
} catch (e) {
  console.log(`  ✗ Could not read package.json: ${e.message}`);
}

// -----------------------------------------------------------------------------
// RUN ASYNC CHECKS
// -----------------------------------------------------------------------------
async function runDiagnostic() {
  const apiWorks = await testApiConnection();

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================\n');

  if (!rapidApiKey) {
    console.log('❌ PROBLEM: No API key found');
    console.log('   FIX: Add RAPIDAPI_KEY to .env.local');
  } else if (!apiWorks) {
    console.log('❌ PROBLEM: API key exists but API call failed');
    console.log('   FIX: Check key validity at RapidAPI dashboard');
  } else {
    console.log('✓ API key and connectivity OK');
    console.log('\n❓ If employers still not appearing, the Refinery');
    console.log('   code path may not be calling the API.');
    console.log('\n   NEXT: Check which file generates Target Employers');
    console.log('   and verify it actually calls JSearch.');
  }

  console.log('\n========================================\n');
}

runDiagnostic();
