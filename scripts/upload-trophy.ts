/**
 * Script to upload the Premier League trophy image to Supabase Storage
 * Run with: npx tsx scripts/upload-trophy.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log(`🔧 Supabase URL: ${supabaseUrl ? 'Set' : 'Not set'}`);
console.log(`🔑 Service Role Key: ${supabaseServiceRoleKey ? 'Set' : 'Not set'}`);

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Upload trophy image to Supabase Storage
 */
async function uploadTrophy(): Promise<string> {
  const imagePath = path.join(process.cwd(), 'public', 'premier-league-trophy.png');

  if (!fs.existsSync(imagePath)) {
    throw new Error('Trophy image not found at public/premier-league-trophy.png');
  }

  // Read the image file
  const imageBuffer = fs.readFileSync(imagePath);
  const fileName = 'premier-league-trophy.png';
  const filePath = fileName; // Upload directly to bucket root

  console.log('📤 Uploading trophy image to Supabase Storage...');

  console.log(`🔍 Checking bucket access...`);
  // Check if bucket exists
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    throw new Error(`Failed to list buckets: ${bucketsError.message}`);
  }
  console.log(`📦 Available buckets:`, buckets?.map(b => b.name));

  // Upload to Supabase Storage
  console.log(`📤 Uploading to bucket 'grbovi1'...`);
  const { data, error } = await supabase.storage
    .from('grbovi1')
    .upload(filePath, imageBuffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    console.error(`❌ Upload error details:`, error);
    throw new Error(`Failed to upload trophy image: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('grbovi1')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Main function
 */
async function main() {
  console.log('Starting trophy image upload process...\n');

  try {
    const publicUrl = await uploadTrophy();
    console.log('✅ Trophy image uploaded successfully!');
    console.log(`📍 Public URL: ${publicUrl}`);

    // You can optionally update the layout.tsx to use this URL instead of the local file
    console.log('\n💡 To use the uploaded image, update app/layout.tsx:');
    console.log(`   Change src="/premier-league-trophy.jpg" to src="${publicUrl}"`);

  } catch (error) {
    console.error('❌ Error uploading trophy image:', error);
    process.exit(1);
  }
}

main().catch(console.error);