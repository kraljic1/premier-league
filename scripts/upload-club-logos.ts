/**
 * Script to download club logos from CDN and upload them to Supabase Storage
 * Run with: npx tsx scripts/upload-club-logos.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { CLUBS } from '../lib/clubs';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Download image from URL
 */
function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    };
    
    protocol.get(url, options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Upload logo to Supabase Storage
 */
async function uploadLogo(clubId: string, logoBuffer: Buffer, contentType: string): Promise<string> {
  const fileName = `${clubId}.${contentType.includes('svg') ? 'svg' : 'png'}`;
  const filePath = fileName; // Upload directly to bucket root, no subfolder

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('grbovi1')
    .upload(filePath, logoBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload ${fileName}: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('grbovi1')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Update club logo URL in database
 */
async function updateClubLogoUrl(clubName: string, logoUrl: string): Promise<void> {
  const { error } = await supabase
    .from('clubs')
    .update({ logo_url: logoUrl })
    .eq('name', clubName);

  if (error) {
    throw new Error(`Failed to update logo URL for ${clubName}: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Starting logo upload process...\n');

  // Ensure storage bucket exists (you need to create it manually in Supabase dashboard)
  // Storage > Create bucket > Name: club-logos > Public bucket

  const tempDir = path.join(process.cwd(), 'temp-logos');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    for (const [clubId, club] of Object.entries(CLUBS)) {
      if (!club.logoUrl) {
        console.log(`⚠️  Skipping ${club.name} - no logo URL`);
        continue;
      }

      try {
        console.log(`📥 Downloading logo for ${club.name}...`);
        const logoBuffer = await downloadImage(club.logoUrl);
        
        // Determine content type
        const contentType = club.logoUrl.includes('.svg') 
          ? 'image/svg+xml' 
          : 'image/png';

        console.log(`📤 Uploading logo for ${club.name}...`);
        const publicUrl = await uploadLogo(clubId, logoBuffer, contentType);

        console.log(`💾 Updating database for ${club.name}...`);
        await updateClubLogoUrl(club.name, publicUrl);

        console.log(`✅ Successfully processed ${club.name}`);
        console.log(`   URL: ${publicUrl}\n`);
      } catch (error) {
        console.error(`❌ Error processing ${club.name}:`, error);
        console.log('');
      }
    }

    console.log('✨ Logo upload process completed!');
  } finally {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

main().catch(console.error);
