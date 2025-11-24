#!/usr/bin/env node

/**
 * Premier League Tracker - Data Refresh Script (Node.js)
 * This script calls the refresh API endpoint to update all scraped data
 * 
 * Usage:
 *   node scripts/refresh-data.js
 *   API_URL=http://localhost:3000 node scripts/refresh-data.js
 */

const http = require('http');
const https = require('https');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const ENDPOINT = `${API_URL}/api/refresh`;

function log(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${timestamp}] ${message}`);
}

function makeRequest() {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 300000, // 5 minutes timeout
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function refreshData() {
  try {
    log('Starting data refresh...');
    
    const result = await makeRequest();
    
    if (result.statusCode === 200) {
      log('✅ Data refresh completed successfully');
      log(`Response: ${result.body}`);
      process.exit(0);
    } else {
      log(`❌ Data refresh failed with HTTP code: ${result.statusCode}`);
      log(`Response: ${result.body}`);
      process.exit(1);
    }
  } catch (error) {
    log(`❌ Error during data refresh: ${error.message}`);
    process.exit(1);
  }
}

refreshData();

