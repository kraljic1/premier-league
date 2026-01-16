#!/usr/bin/env tsx

/**
 * Premier League Tracker - Auto Update Results Script
 * 
 * This script automatically updates match results after they finish.
 * It's designed to be run periodically (e.g., via cron job) to keep the database up-to-date.
 * 
 * Features:
 * - Fetches recent results from Rezultati.com (without clicking "show more")
 * - Compares with scheduled matches in the database
 * - Updates only matches that have finished
 * - Also updates the standings table
 * 
 * Usage:
 *   npx tsx scripts/auto-update-results.ts
 * 
 * Scheduling with cron (example - run every 15 minutes during match hours):
 *   See AUTO_UPDATE_SETUP.md for cron configuration examples
 */

import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local file BEFORE importing supabase
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
    console.log('[AutoUpdate] Loaded environment variables');
  } else {
    console.warn('[AutoUpdate] Warning: .env.local file not found');
  }
}

loadEnv();

import { createClient } from '@supabase/supabase-js';
import { Fixture, Standing } from '../lib/types';
import { isDerby } from '../lib/clubs';
import { scrapePage, closeBrowser } from '../lib/scrapers/browser';
import { scrapeStandings } from '../lib/scrapers/standings';

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('[AutoUpdate] Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const REZULTATI_URL = 'https://www.rezultati.com/nogomet/engleska/premier-league/rezultati';

function log(message: string) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Parse date string from Rezultati.com format
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // DD.MM. HH:mm format (no year)
  const ddmmTime = dateStr.match(/(\d{1,2})\.(\d{1,2})\.\s*(\d{1,2}):(\d{2})/);
  if (ddmmTime) {
    const day = parseInt(ddmmTime[1]);
    const month = parseInt(ddmmTime[2]) - 1;
    const hour = parseInt(ddmmTime[3]);
    const minute = parseInt(ddmmTime[4]);
    const currentYear = month >= 7 ? 2025 : 2026;
    const date = new Date(currentYear, month, day, hour, minute);
    if (!isNaN(date.getTime())) return date;
  }
  
  // DD.MM.YYYY format
  const ddmmyyyy = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1]);
    const month = parseInt(ddmmyyyy[2]) - 1;
    const year = parseInt(ddmmyyyy[3]);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
}

/**
 * Normalize team name for comparison
 */
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\d+$/, '')
    .trim();
}

/**
 * Scrape recent results from Rezultati.com (first page only - recent matches)
 */
async function scrapeRecentResults(): Promise<Fixture[]> {
  let page;
  
  try {
    log('Fetching recent results from Rezultati.com...');
    page = await scrapePage(REZULTATI_URL, undefined, 30000);
    
    // Set viewport for proper rendering
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Wait for page to load fully
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      await page.waitForSelector('.event__match', { timeout: 15000 });
      log('Found match elements');
    } catch (e) {
      log('Waiting for elements... trying alternative selectors');
      // Try alternative selectors
      try {
        await page.waitForSelector('[class*="event__match"]', { timeout: 10000 });
        log('Found elements with alternative selector');
      } catch (e2) {
        log('Could not find match elements');
      }
    }
    
    // Additional wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract results (without clicking "show more" - just visible matches)
    const rawData = await page.evaluate(() => {
      var matches: any[] = [];
      var debug: string[] = [];
      
      var container = document.querySelector('.sportName.soccer');
      if (!container) {
        container = document.querySelector('.event--results') || document.body;
        debug.push('Using fallback container');
      }
      
      var allElements = container.querySelectorAll('.event__round, .event__match');
      debug.push('Found ' + allElements.length + ' elements');
      
      var currentMatchweek = 0;
      var matchweeksFound: number[] = [];
      
      for (var i = 0; i < allElements.length; i++) {
        var el = allElements[i];
        
        if (el.classList.contains('event__round')) {
          var roundText = el.textContent || '';
          var roundMatch = roundText.match(/(\d+)\.\s*kolo/i);
          if (roundMatch) {
            currentMatchweek = parseInt(roundMatch[1]);
            matchweeksFound.push(currentMatchweek);
          }
          continue;
        }
        
        if (!el.classList.contains('event__match')) continue;
        
        // Try multiple selector patterns
        var homeEl = el.querySelector('.event__participant--home') ||
                     el.querySelector('[class*="homeParticipant"]') ||
                     el.querySelector('[class*="participant--home"]');
        var awayEl = el.querySelector('.event__participant--away') ||
                     el.querySelector('[class*="awayParticipant"]') ||
                     el.querySelector('[class*="participant--away"]');
        var homeScoreEl = el.querySelector('.event__score--home') ||
                          el.querySelector('[class*="score--home"]');
        var awayScoreEl = el.querySelector('.event__score--away') ||
                          el.querySelector('[class*="score--away"]');
        var timeEl = el.querySelector('.event__time') ||
                     el.querySelector('[class*="time"]');
        
        var homeTeam = homeEl ? (homeEl.textContent || '').trim() : '';
        var awayTeam = awayEl ? (awayEl.textContent || '').trim() : '';
        homeTeam = homeTeam.replace(/\d+$/, '').trim();
        awayTeam = awayTeam.replace(/\d+$/, '').trim();
        
        var homeScore = homeScoreEl ? parseInt((homeScoreEl.textContent || '').trim()) : NaN;
        var awayScore = awayScoreEl ? parseInt((awayScoreEl.textContent || '').trim()) : NaN;
        var dateStr = timeEl ? (timeEl.textContent || '').trim() : '';
        
        if (homeTeam && awayTeam && !isNaN(homeScore) && !isNaN(awayScore)) {
          matches.push({
            homeTeam,
            awayTeam,
            homeScore,
            awayScore,
            dateStr,
            matchweek: currentMatchweek || 22
          });
        }
      }
      
      if (matchweeksFound.length > 0) {
        debug.push('Matchweeks: ' + matchweeksFound[0] + ' to ' + matchweeksFound[matchweeksFound.length - 1]);
      }
      
      return { matches, debug };
    });
    
    // Log debug info
    if (rawData.debug) {
      rawData.debug.forEach((d: string) => log(`[Debug] ${d}`));
    }
    
    const matches = rawData.matches || [];
    log(`Found ${matches.length} recent results`);
    
    const results: Fixture[] = [];
    const seenIds = new Set<string>();
    
    for (const match of matches) {
      const parsedDate = parseDate(match.dateStr);
      if (!parsedDate) continue;
      
      const homeTeam = match.homeTeam.trim().replace(/\s+/g, ' ');
      const awayTeam = match.awayTeam.trim().replace(/\s+/g, ' ');
      
      if (homeTeam.length < 3 || awayTeam.length < 3) continue;
      
      const dateOnly = parsedDate.toISOString().split('T')[0];
      const fixtureId = `${homeTeam.toLowerCase().replace(/\s+/g, '-')}-${awayTeam.toLowerCase().replace(/\s+/g, '-')}-${dateOnly}-${match.matchweek}`;
      
      if (seenIds.has(fixtureId)) continue;
      seenIds.add(fixtureId);
      
      results.push({
        id: fixtureId,
        date: parsedDate.toISOString(),
        homeTeam,
        awayTeam,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        matchweek: match.matchweek,
        status: 'finished',
        isDerby: isDerby(homeTeam, awayTeam),
      });
    }
    
    return results;
  } catch (error) {
    log(`Error scraping results: ${error}`);
    throw error;
  } finally {
    if (page) await page.close();
  }
}

/**
 * Get scheduled matches from database that might have finished
 */
async function getScheduledMatches(): Promise<any[]> {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  const { data, error } = await supabase
    .from('fixtures')
    .select('*')
    .eq('status', 'scheduled')
    .gte('date', threeDaysAgo.toISOString())
    .lte('date', now.toISOString());
  
  if (error) {
    log(`Error fetching scheduled matches: ${error.message}`);
    return [];
  }
  
  return data || [];
}

/**
 * Update match results in the database
 */
async function updateMatchResults(results: Fixture[]): Promise<number> {
  if (results.length === 0) return 0;
  
  const dbResults = results.map(result => ({
    id: result.id,
    date: result.date,
    home_team: result.homeTeam,
    away_team: result.awayTeam,
    home_score: result.homeScore,
    away_score: result.awayScore,
    matchweek: result.matchweek,
    status: 'finished' as const,
    is_derby: result.isDerby || false
  }));
  
  const { error } = await supabase
    .from('fixtures')
    .upsert(dbResults, {
      onConflict: 'home_team,away_team,date',
      ignoreDuplicates: false
    });
  
  if (error) {
    log(`Error updating results: ${error.message}`);
    throw error;
  }
  
  return results.length;
}

/**
 * Update standings in the database
 */
async function updateStandings(): Promise<number> {
  try {
    log('Fetching latest standings...');
    const standings = await scrapeStandings();
    
    if (standings.length === 0) {
      log('No standings found');
      return 0;
    }
    
    log(`Found ${standings.length} standings`);
    
    const dbStandings = standings.map(standing => ({
      position: standing.position,
      club: standing.club,
      played: standing.played,
      won: standing.won,
      drawn: standing.drawn,
      lost: standing.lost,
      goals_for: standing.goalsFor,
      goals_against: standing.goalsAgainst,
      goal_difference: standing.goalDifference,
      points: standing.points,
      form: standing.form,
      season: '2025'
    }));
    
    // Delete existing standings and insert new ones
    await supabase.from('standings').delete().eq('season', '2025');
    
    const { error } = await supabase.from('standings').insert(dbStandings);
    
    if (error) {
      log(`Error updating standings: ${error.message}`);
      throw error;
    }
    
    return standings.length;
  } catch (error) {
    log(`Error in updateStandings: ${error}`);
    return 0;
  }
}

/**
 * Update cache metadata
 */
async function updateCacheMetadata() {
  await supabase
    .from('cache_metadata')
    .upsert({
      key: 'last_auto_update',
      last_updated: new Date().toISOString(),
      data_count: 0
    }, { onConflict: 'key' });
}

/**
 * Main function
 */
async function main() {
  const startTime = Date.now();
  
  try {
    log('='.repeat(60));
    log('Starting auto-update...');
    log('='.repeat(60));
    
    // Step 1: Get scheduled matches that might have finished
    const scheduledMatches = await getScheduledMatches();
    log(`Found ${scheduledMatches.length} scheduled matches in recent time window`);
    
    // Step 2: Scrape recent results
    const recentResults = await scrapeRecentResults();
    log(`Scraped ${recentResults.length} recent results`);
    
    // Step 3: Find matches that need updating
    const matchesToUpdate: Fixture[] = [];
    
    for (const result of recentResults) {
      const normalizedHome = normalizeTeamName(result.homeTeam);
      const normalizedAway = normalizeTeamName(result.awayTeam);
      
      // Check if this match was scheduled and now has a result
      const matchingScheduled = scheduledMatches.find(scheduled => {
        const scheduledHome = normalizeTeamName(scheduled.home_team);
        const scheduledAway = normalizeTeamName(scheduled.away_team);
        
        return (
          (scheduledHome.includes(normalizedHome) || normalizedHome.includes(scheduledHome)) &&
          (scheduledAway.includes(normalizedAway) || normalizedAway.includes(scheduledAway))
        );
      });
      
      if (matchingScheduled) {
        matchesToUpdate.push(result);
        log(`Match to update: ${result.homeTeam} ${result.homeScore} - ${result.awayScore} ${result.awayTeam}`);
      }
    }
    
    // Step 4: Update matches in database
    let updatedCount = 0;
    if (matchesToUpdate.length > 0) {
      log(`Updating ${matchesToUpdate.length} matches in database...`);
      updatedCount = await updateMatchResults(matchesToUpdate);
      log(`Updated ${updatedCount} match results`);
    } else {
      log('No new match results to update');
    }
    
    // Step 5: Always update recent results (even if not in scheduled)
    // This ensures we capture any matches we might have missed
    if (recentResults.length > 0) {
      log('Syncing all recent results to database...');
      await updateMatchResults(recentResults);
    }
    
    // Step 6: Update standings if we updated any results
    let standingsUpdated = 0;
    if (updatedCount > 0 || scheduledMatches.length > 0) {
      log('Updating standings...');
      standingsUpdated = await updateStandings();
      log(`Updated ${standingsUpdated} standings`);
    }
    
    // Step 7: Update cache metadata
    await updateCacheMetadata();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    log('='.repeat(60));
    log('Auto-update completed successfully!');
    log(`Duration: ${duration} seconds`);
    log(`Results updated: ${updatedCount}`);
    log(`Total recent results synced: ${recentResults.length}`);
    log(`Standings updated: ${standingsUpdated}`);
    log('='.repeat(60));
    
  } catch (error) {
    log(`Error in auto-update: ${error}`);
    console.error(error);
    process.exit(1);
  } finally {
    await closeBrowser();
  }
}

main();
