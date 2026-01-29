// Environment Variable Checker for SMR-Refinery
// Run with: node check-env.js

const fs = require('fs');
const path = require('path');

const requiredVars = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'PERPLEXITY_API_KEY',
  'RAPIDAPI_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'KV_REST_API_REDIS_URL',
  'BYPASS_CODE',
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_FORGE_URL'
];

console.log('🔍 Checking SMR-Refinery environment variables...\n');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('💡 Copy .env.example to .env.local and fill in your values');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

// Parse .env.local
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

let allValid = true;

// Check each required variable
requiredVars.forEach(varName => {
  const value = envVars[varName];

  if (!value || value === '') {
    console.error(`❌ ${varName} is not set`);
    allValid = false;
  } else if (value.includes('your-') || value.includes('here')) {
    console.error(`❌ ${varName} still has placeholder value`);
    allValid = false;
  } else {
    console.log(`✅ ${varName} is set`);

    // Additional validation
    if (varName === 'ANTHROPIC_API_KEY' && !value.startsWith('sk-ant-')) {
      console.warn(`⚠️  ${varName} doesn't start with 'sk-ant-'`);
    }
    if (varName === 'OPENAI_API_KEY' && !value.startsWith('sk-proj-')) {
      console.warn(`⚠️  ${varName} doesn't start with 'sk-proj-'`);
    }
    if (varName === 'PERPLEXITY_API_KEY' && !value.startsWith('pplx-')) {
      console.warn(`⚠️  ${varName} doesn't start with 'pplx-'`);
    }
    if (varName === 'BYPASS_CODE' && value === 'LETEMCOOK') {
      console.error(`❌ ${varName} is still using the insecure default "LETEMCOOK"!`);
      console.log('   💡 Change to a secure random code (e.g., "SMR2026SecurePromo")');
      allValid = false;
    }
  }
});

console.log('\n' + '='.repeat(50));

if (allValid) {
  console.log('✅ All required environment variables are set!');
  console.log('💡 Run "npm run dev" to test your configuration');
} else {
  console.log('❌ Some environment variables are missing or invalid');
  console.log('💡 Check .env.example for required variables');
  process.exit(1);
}
