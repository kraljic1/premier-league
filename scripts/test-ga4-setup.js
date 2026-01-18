#!/usr/bin/env node

/**
 * GA4 Setup Verification Script
 * 
 * This script checks if GA4 is properly configured in your Next.js app.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking GA4 Setup...\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Environment variable
console.log('1️⃣ Checking environment variable...');
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf-8');
  if (envContent.includes('NEXT_PUBLIC_GA_MEASUREMENT_ID=G-')) {
    const match = envContent.match(/NEXT_PUBLIC_GA_MEASUREMENT_ID=(G-[A-Z0-9]+)/);
    if (match) {
      console.log(`   ✅ NEXT_PUBLIC_GA_MEASUREMENT_ID is set: ${match[1]}`);
    }
  } else {
    console.log('   ❌ NEXT_PUBLIC_GA_MEASUREMENT_ID not found in .env.local');
    hasErrors = true;
  }
} else {
  console.log('   ⚠️  .env.local file not found');
  hasWarnings = true;
}

// Check 2: GoogleAnalytics component
console.log('\n2️⃣ Checking GoogleAnalytics component...');
const gaComponentPath = path.join(process.cwd(), 'components', 'GoogleAnalytics.tsx');
if (fs.existsSync(gaComponentPath)) {
  const gaContent = fs.readFileSync(gaComponentPath, 'utf-8');
  
  // Check for nextjs-google-analytics import
  if (gaContent.includes('nextjs-google-analytics')) {
    console.log('   ✅ nextjs-google-analytics package found');
  } else {
    console.log('   ❌ nextjs-google-analytics package not found');
    hasErrors = true;
  }
  
  // Check for cookie consent logic
  if (gaContent.includes('cookie-consent')) {
    console.log('   ✅ Cookie consent logic found');
  } else {
    console.log('   ⚠️  Cookie consent logic not found');
    hasWarnings = true;
  }
  
  // Check for NextJsGoogleAnalytics usage
  if (gaContent.includes('NextJsGoogleAnalytics')) {
    console.log('   ✅ NextJsGoogleAnalytics component usage found');
  } else {
    console.log('   ❌ NextJsGoogleAnalytics component usage not found');
    hasErrors = true;
  }
} else {
  console.log('   ❌ GoogleAnalytics.tsx not found');
  hasErrors = true;
}

// Check 3: Layout integration
console.log('\n3️⃣ Checking layout integration...');
const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
  
  if (layoutContent.includes('GoogleAnalytics')) {
    console.log('   ✅ GoogleAnalytics component imported');
  } else {
    console.log('   ❌ GoogleAnalytics component not imported');
    hasErrors = true;
  }
  
  if (layoutContent.includes('NEXT_PUBLIC_GA_MEASUREMENT_ID')) {
    console.log('   ✅ GA measurement ID passed to component');
  } else {
    console.log('   ❌ GA measurement ID not passed to component');
    hasErrors = true;
  }
} else {
  console.log('   ❌ app/layout.tsx not found');
  hasErrors = true;
}

// Check 4: Middleware CSP configuration
console.log('\n4️⃣ Checking middleware CSP configuration...');
const middlewarePath = path.join(process.cwd(), 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf-8');
  
  if (middlewareContent.includes('googletagmanager.com')) {
    console.log('   ✅ CSP allows googletagmanager.com');
  } else {
    console.log('   ❌ CSP does not allow googletagmanager.com');
    hasErrors = true;
  }
  
  if (middlewareContent.includes('google-analytics.com')) {
    console.log('   ✅ CSP allows google-analytics.com');
  } else {
    console.log('   ❌ CSP does not allow google-analytics.com');
    hasErrors = true;
  }
} else {
  console.log('   ⚠️  middleware.ts not found');
  hasWarnings = true;
}

// Check 5: CookieConsent component
console.log('\n5️⃣ Checking CookieConsent component...');
const cookieConsentPath = path.join(process.cwd(), 'components', 'CookieConsent.tsx');
if (fs.existsSync(cookieConsentPath)) {
  const cookieContent = fs.readFileSync(cookieConsentPath, 'utf-8');
  
  if (cookieContent.includes('cookie-consent-changed')) {
    console.log('   ✅ Cookie consent event dispatching found');
  } else {
    console.log('   ⚠️  Cookie consent event not found');
    hasWarnings = true;
  }
  
  if (cookieContent.includes('localStorage')) {
    console.log('   ✅ localStorage usage found');
  } else {
    console.log('   ❌ localStorage not used for consent');
    hasErrors = true;
  }
} else {
  console.log('   ❌ CookieConsent.tsx not found');
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(50));
if (!hasErrors && !hasWarnings) {
  console.log('✅ All checks passed! GA4 should be working.');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Open browser console (F12)');
  console.log('3. Accept cookies');
  console.log('4. Look for [GA4] logs');
  console.log('5. Check Network tab for requests to google-analytics.com');
} else if (hasErrors) {
  console.log('❌ Setup has ERRORS that need to be fixed!');
  process.exit(1);
} else {
  console.log('⚠️  Setup has warnings but should work.');
  console.log('\nRecommendations:');
  console.log('- Review warnings above');
  console.log('- Test in development mode');
  console.log('- Check browser console for GA4 logs');
}
console.log('='.repeat(50) + '\n');
