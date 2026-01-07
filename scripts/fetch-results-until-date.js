#!/usr/bin/env node

/**
 * Premier League Tracker - Fetch Results Until Date Script
 * Fetches all finished results from the current season until a specified date
 * 
 * Usage:
 *   node scripts/fetch-results-until-date.js
 *   node scripts/fetch-results-until-date.js 2026-01-07
 *   END_DATE=2026-01-07 node scripts/fetch-results-until-date.js
 *   OUTPUT_FILE=results.json node scripts/fetch-results-until-date.js
 * 
 * Note: This script calls the API endpoint. Make sure your Next.js server is running.
 *       Alternatively, use the TypeScript version (fetch-results-until-date.ts) with tsx
 *       to run scrapers directly without needing the server.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Parse command line arguments or environment variables
const endDateStr = process.argv[2] || process.env.END_DATE || '2026-01-07';
const outputFile = process.env.OUTPUT_FILE || 'results-until-date.json';
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Parse the end date
const endDate = new Date(endDateStr);
if (isNaN(endDate.getTime())) {
  console.error(`❌ Invalid date format: ${endDateStr}`);
  console.error('Please use format: YYYY-MM-DD (e.g., 2026-01-07)');
  process.exit(1);
}

function log(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${timestamp}] ${message}`);
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatDateTime(date) {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
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
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
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

async function fetchResultsFromAPI() {
  log(`Fetching results from API: ${API_URL}/api/results`);
  
  try {
    const results = await makeRequest(`${API_URL}/api/results`);
    log(`✅ Successfully fetched ${results.length} results from API`);
    return results;
  } catch (error) {
    log(`❌ Error fetching from API: ${error.message}`);
    log(`Make sure your Next.js server is running at ${API_URL}`);
    throw error;
  }
}

function filterResultsUntilDate(results) {
  const filtered = results.filter(fixture => {
    const fixtureDate = new Date(fixture.date);
    return fixtureDate <= endDate && fixture.status === 'finished';
  });
  
  log(`Filtered to ${filtered.length} results until ${formatDate(endDate)}`);
  
  // Sort by matchweek, then by date
  filtered.sort((a, b) => {
    if (a.matchweek !== b.matchweek) {
      return a.matchweek - b.matchweek;
    }
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  return filtered;
}

function displayResults(results) {
  console.log('\n' + '='.repeat(80));
  console.log(`📊 RESULTS SUMMARY (until ${formatDate(endDate)})`);
  console.log('='.repeat(80));
  console.log(`Total results: ${results.length}\n`);
  
  if (results.length === 0) {
    console.log('No results found for the specified date range.');
    return;
  }
  
  // Group by matchweek
  const byMatchweek = {};
  results.forEach(result => {
    if (!byMatchweek[result.matchweek]) {
      byMatchweek[result.matchweek] = [];
    }
    byMatchweek[result.matchweek].push(result);
  });
  
  // Display by matchweek
  const matchweeks = Object.keys(byMatchweek)
    .map(Number)
    .sort((a, b) => a - b);
  
  matchweeks.forEach(mw => {
    const mwResults = byMatchweek[mw];
    console.log(`\n📅 MATCHWEEK ${mw} (${mwResults.length} matches)`);
    console.log('-'.repeat(80));
    
    mwResults.forEach((result, index) => {
      const date = new Date(result.date);
      const dateStr = formatDateTime(date);
      const score = result.homeScore !== null && result.awayScore !== null
        ? `${result.homeScore} - ${result.awayScore}`
        : 'N/A';
      
      console.log(`${index + 1}. ${result.homeTeam} vs ${result.awayTeam}`);
      console.log(`   Score: ${score} | Date: ${dateStr}`);
      if (result.isDerby) {
        console.log('   🏆 DERBY MATCH');
      }
    });
  });
  
  // Summary statistics
  console.log('\n' + '='.repeat(80));
  console.log('\n📈 STATISTICS:');
  console.log(`Total matches: ${results.length}`);
  console.log(`Matchweeks covered: ${matchweeks.length}`);
  if (results.length > 0) {
    console.log(`Date range: ${formatDateTime(new Date(results[0].date))} - ${formatDateTime(new Date(results[results.length - 1].date))}`);
  }
  
  // Matchweek distribution
  console.log('\nMatchweek distribution:');
  matchweeks.forEach(mw => {
    console.log(`  Matchweek ${mw}: ${byMatchweek[mw].length} matches`);
  });
}

function saveResults(results, filename) {
  const outputPath = path.join(process.cwd(), filename);
  const data = {
    metadata: {
      fetchedAt: new Date().toISOString(),
      endDate: formatDate(endDate),
      totalResults: results.length,
      matchweeks: Array.from(new Set(results.map(r => r.matchweek))).sort((a, b) => a - b),
    },
    results: results,
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  log(`✅ Results saved to: ${outputPath}`);
}

async function main() {
  try {
    log(`Fetching results until ${formatDate(endDate)}...`);
    
    const allResults = await fetchResultsFromAPI();
    const filteredResults = filterResultsUntilDate(allResults);
    
    if (filteredResults.length === 0) {
      log('⚠️  No results found for the specified date range.');
      process.exit(0);
    }
    
    // Display results
    displayResults(filteredResults);
    
    // Save to file
    saveResults(filteredResults, outputFile);
    
    log('\n✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    log(`❌ Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
