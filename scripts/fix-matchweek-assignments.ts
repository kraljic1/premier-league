import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface MatchweekIssue {
  team: string;
  duplicateMatchweeks: number[];
  missingMatchweeks: number[];
  totalMatches: number;
}

async function analyzeAndFixMatchweeks() {
  console.log("=== Matchweek Assignment Analysis ===\n");

  // Get all fixtures for 2024/25
  const { data: allFixtures, error } = await supabase
    .from("fixtures")
    .select("*")
    .eq("season", "2024/25")
    .order("matchweek", { ascending: true });

  if (error || !allFixtures) {
    console.error("Error:", error);
    return;
  }

  console.log(`Total fixtures: ${allFixtures.length}\n`);

  // All Premier League teams for 2024/25
  const allTeams = [
    'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton & Hove Albion',
    'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich Town',
    'Leicester City', 'Liverpool', 'Manchester City', 'Manchester United',
    'Newcastle United', "Nott'm Forest", 'Southampton', 'Tottenham Hotspur',
    'West Ham United', 'Wolverhampton Wanderers'
  ];

  const issues: MatchweekIssue[] = [];

  // Analyze each team
  for (const team of allTeams) {
    const teamFixtures = allFixtures.filter(f => f.home_team === team || f.away_team === team);
    const matchweeks = teamFixtures.map(f => f.matchweek);
    
    // Find duplicates
    const matchweekCounts: Record<number, number> = {};
    matchweeks.forEach(mw => {
      matchweekCounts[mw] = (matchweekCounts[mw] || 0) + 1;
    });
    
    const duplicates = Object.entries(matchweekCounts)
      .filter(([_, count]) => count > 1)
      .map(([mw, _]) => parseInt(mw))
      .sort((a, b) => a - b);
    
    // Find missing matchweeks (1-38)
    const missing: number[] = [];
    for (let mw = 1; mw <= 38; mw++) {
      if (!matchweeks.includes(mw)) {
        missing.push(mw);
      }
    }
    
    if (duplicates.length > 0 || missing.length > 0) {
      issues.push({
        team,
        duplicateMatchweeks: duplicates,
        missingMatchweeks: missing,
        totalMatches: teamFixtures.length
      });
    }
  }

  // Report issues
  if (issues.length === 0) {
    console.log("✅ No matchweek assignment issues found!\n");
    return;
  }

  console.log(`⚠️  Found issues for ${issues.length} teams:\n`);

  issues.forEach(issue => {
    console.log(`${issue.team} (${issue.totalMatches} matches):`);
    if (issue.missingMatchweeks.length > 0) {
      console.log(`  Missing MW: ${issue.missingMatchweeks.join(', ')}`);
    }
    if (issue.duplicateMatchweeks.length > 0) {
      console.log(`  Duplicate MW: ${issue.duplicateMatchweeks.join(', ')}`);
      
      // Show which matches are duplicates
      issue.duplicateMatchweeks.forEach(mw => {
        const matches = allFixtures.filter(f => 
          f.matchweek === mw && (f.home_team === issue.team || f.away_team === issue.team)
        );
        matches.forEach(m => {
          const opponent = m.home_team === issue.team ? m.away_team : m.home_team;
          const location = m.home_team === issue.team ? 'H' : 'A';
          console.log(`    MW ${mw}: vs ${opponent} (${location}) - ${m.home_score}-${m.away_score} [${m.date}]`);
        });
      });
    }
    console.log();
  });

  // Provide recommendations
  console.log("\n=== Recommendations ===\n");
  console.log("To fix these issues, you need to:");
  console.log("1. Obtain official Premier League fixture list with correct matchweeks");
  console.log("2. Match your database fixtures to official fixtures (by teams and date)");
  console.log("3. Update matchweek numbers to match official data");
  console.log("\nOptions:");
  console.log("  a) Manually update in Supabase dashboard");
  console.log("  b) Create a mapping file and run batch update");
  console.log("  c) Re-scrape from a reliable source with correct matchweek data");
  console.log("\nData sources to consider:");
  console.log("  - Premier League official website");
  console.log("  - ESPN or BBC Sport");
  console.log("  - Fantasy Premier League API");
}

analyzeAndFixMatchweeks().catch(console.error);
