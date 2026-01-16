#!/usr/bin/env tsx

/**
 * View what was scraped - displays results in a readable format
 */

import * as fs from 'fs';
import * as path from 'path';
import { scrapeResultsFromOneFootball, scrapeFixturesFromOneFootball } from '../lib/scrapers/onefootball-fixtures';
import { scrapeResults } from '../lib/scrapers/results';
import { scrapeResultsFromRezultati } from '../lib/scrapers/rezultati-results';
import { Fixture } from '../lib/types';

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
}

loadEnv();

function formatDate(date: Date): string {
  return date.toLocaleDateString('hr-HR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function displayResults(results: Fixture[], source: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`📊 REZULTATI IZ: ${source}`);
  console.log('='.repeat(80));
  console.log(`Ukupno rezultata: ${results.length}\n`);
  
  if (results.length === 0) {
    console.log('Nema rezultata.');
    return;
  }
  
  // Group by matchweek
  const byMatchweek: Record<number, Fixture[]> = {};
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
    console.log(`\n📅 KOLO ${mw} (${mwResults.length} utakmica)`);
    console.log('-'.repeat(80));
    
    mwResults.forEach((result, index) => {
      const date = new Date(result.date);
      const dateStr = formatDate(date);
      const score = result.homeScore !== null && result.awayScore !== null
        ? `${result.homeScore} - ${result.awayScore}`
        : 'N/A';
      
      console.log(`${index + 1}. ${result.homeTeam} vs ${result.awayTeam}`);
      console.log(`   Rezultat: ${score} | Datum: ${dateStr} | Kolo: ${result.matchweek}`);
      if (result.isDerby) {
        console.log('   🏆 DERBI');
      }
    });
  });
  
  // Statistics
  console.log('\n' + '='.repeat(80));
  console.log('\n📈 STATISTIKA:');
  console.log(`Ukupno utakmica: ${results.length}`);
  console.log(`Kola pokrivena: ${matchweeks.length}`);
  if (results.length > 0) {
    const dates = results.map(r => new Date(r.date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    console.log(`Raspon datuma: ${formatDate(minDate)} - ${formatDate(maxDate)}`);
    
    // Check for wrong dates (year 2001)
    const wrongDates = results.filter(r => {
      const year = new Date(r.date).getFullYear();
      return year < 2024 || year > 2026;
    });
    if (wrongDates.length > 0) {
      console.log(`⚠️  UPOZORENJE: ${wrongDates.length} rezultata ima pogrešne datume (godina < 2024 ili > 2026)`);
    }
  }
  
  console.log('\nRaspodjela po kolima:');
  matchweeks.forEach(mw => {
    console.log(`  Kolo ${mw}: ${byMatchweek[mw].length} utakmica`);
  });
}

async function main() {
  const source = process.argv[2] || 'onefootball';
  
  try {
    let results: Fixture[] = [];
    
    if (source === 'rezultati') {
      console.log('Povlačenje rezultata sa Rezultati.com...');
      results = await scrapeResultsFromRezultati();
      displayResults(results, 'Rezultati.com');
    } else if (source === 'onefootball') {
      console.log('Povlačenje rezultata sa OneFootball...');
      // Try to get finished fixtures
      const allFixtures = await scrapeFixturesFromOneFootball();
      results = allFixtures.filter(f => f.status === 'finished');
      
      // If no finished fixtures, try results scraper
      if (results.length === 0) {
        console.log('Nema finished fixtures, pokušavam results scraper...');
        results = await scrapeResultsFromOneFootball();
      }
      displayResults(results, 'OneFootball');
    } else if (source === 'official') {
      console.log('Povlačenje rezultata sa službenog sajta Premier League...');
      results = await scrapeResults();
      displayResults(results, 'Premier League Official Site');
    } else {
      console.error(`Nepoznat izvor: ${source}`);
      console.error('Dostupni izvori: rezultati, onefootball, official');
      process.exit(1);
    }
    
    // Save to JSON file
    const outputFile = `scraped-results-${source}-${Date.now()}.json`;
    const outputPath = path.join(process.cwd(), outputFile);
    fs.writeFileSync(outputPath, JSON.stringify({
      source,
      scrapedAt: new Date().toISOString(),
      totalResults: results.length,
      results: results
    }, null, 2), 'utf8');
    console.log(`\n✅ Rezultati spremljeni u: ${outputFile}`);
    
  } catch (error) {
    console.error('❌ Greška:', error);
    process.exit(1);
  }
}

main();
