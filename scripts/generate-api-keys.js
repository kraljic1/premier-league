#!/usr/bin/env node

/**
 * Secure API Key Generator
 * Generates cryptographically secure API keys for different access levels
 */

const crypto = require('crypto');

// Generate a secure random API key
function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Generate API keys for different access levels
function generateApiKeys() {
  console.log('🔐 Generating Secure API Keys for Premier League API\n');
  console.log('⚠️  SECURITY WARNING:');
  console.log('   - Keep these keys secure and never commit them to version control');
  console.log('   - Rotate keys regularly (recommended: every 30-90 days)');
  console.log('   - Use different keys for different environments');
  console.log('   - Store keys in secure environment variable management\n');

  const keys = {
    API_KEY_READ: generateSecureKey(),
    API_KEY_WRITE: generateSecureKey(),
    API_KEY_ADMIN: generateSecureKey()
  };

  console.log('📋 Generated API Keys:');
  console.log('====================\n');

  Object.entries(keys).forEach(([keyName, keyValue]) => {
    console.log(`${keyName}=${keyValue}`);

    // Add usage information
    switch (keyName) {
      case 'API_KEY_READ':
        console.log(`# Used for: Reading fixtures, results, standings (public endpoints)`);
        break;
      case 'API_KEY_WRITE':
        console.log(`# Used for: Data refresh operations (/api/refresh)`);
        break;
      case 'API_KEY_ADMIN':
        console.log(`# Used for: Administrative operations (/api/keep-alive)`);
        break;
    }
    console.log('');
  });

  console.log('🔧 Netlify Setup:');
  console.log('================');
  console.log('1. Go to Netlify Dashboard → Site Settings → Environment Variables');
  console.log('2. Add each key as a new environment variable');
  console.log('3. Trigger a new deployment\n');

  console.log('🧪 Testing:');
  console.log('==========');
  console.log('# Test read access:');
  console.log(`curl -H "x-api-key: ${keys.API_KEY_READ}" https://your-domain.netlify.app/api/fixtures`);
  console.log('');
  console.log('# Test write access:');
  console.log(`curl -X POST -H "x-api-key: ${keys.API_KEY_WRITE}" https://your-domain.netlify.app/api/refresh`);
  console.log('');
  console.log('# Test admin access:');
  console.log(`curl -H "x-api-key: ${keys.API_KEY_ADMIN}" https://your-domain.netlify.app/api/keep-alive`);
  console.log('');

  console.log('🔒 Security Best Practices:');
  console.log('===========================');
  console.log('• Use HTTPS only (enforced by security headers)');
  console.log('• Rotate keys every 30-90 days');
  console.log('• Monitor API usage for suspicious activity');
  console.log('• Use different keys for staging/production');
  console.log('• Implement IP allowlisting for admin operations if possible');
  console.log('• Log and alert on authentication failures');
}

if (require.main === module) {
  generateApiKeys();
}

module.exports = { generateSecureKey, generateApiKeys };