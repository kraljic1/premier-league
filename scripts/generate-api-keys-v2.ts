/**
 * Enhanced API Key Generation Script v2
 * Compatible with the new automated key rotation system
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { apiKeyManager } from '../lib/api-key-manager';

function generateSecureKey(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  // Use crypto.getRandomValues for better randomness
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    result += chars.charAt(array[i] % chars.length);
  }

  return result;
}

function generateApiKeys() {
  console.log('🔑 Generating new API keys with rotation support...\n');

  const keys = {
    API_KEY_READ: generateSecureKey(),
    API_KEY_WRITE: generateSecureKey(),
    API_KEY_ADMIN: generateSecureKey(),
  };

  // Display keys for immediate use
  console.log('📋 New API Keys Generated:');
  console.log('==========================');
  Object.entries(keys).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
  console.log('==========================\n');

  // Create .env.local content
  const envContent = `# API Keys - Generated on ${new Date().toISOString()}
# These keys are managed by the automated rotation system
${Object.entries(keys).map(([key, value]) => `${key}=${value}`).join('\n')}

# Key Rotation Settings
API_KEY_ROTATION_ENABLED=true
API_KEY_ROTATION_INTERVAL_DAYS=30
API_KEY_GRACE_PERIOD_HOURS=24
`;

  const envPath = join(process.cwd(), '.env.local');

  try {
    writeFileSync(envPath, envContent, { encoding: 'utf8' });
    console.log('✅ Keys saved to .env.local');
    console.log('⚠️  Remember to restart your development server after updating environment variables');
  } catch (error) {
    console.error('❌ Failed to write to .env.local:', error);
    console.log('\n📝 Manual .env.local content:');
    console.log(envContent);
  }

  console.log('\n🔄 Key Rotation Features:');
  console.log('- Keys automatically rotate every 30 days');
  console.log('- 24-hour grace period for old keys');
  console.log('- Maximum 3 keys per level maintained');
  console.log('- Usage statistics and monitoring included');

  console.log('\n📊 Key Management API:');
  console.log('- GET /api/v1/keys - View key statistics');
  console.log('- POST /api/v1/keys - Rotate keys (admin only)');
}

generateApiKeys();