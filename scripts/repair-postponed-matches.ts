import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import { normalizeClubName } from "../lib/utils/club-name-utils";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const SEASONS = ["2020/21", "2021/22", "2022/23", "2023/24"];

async function processSeason(season: string) {
  console.log(`Processing season ${season}...`);
  
  const { data: fixtures, error } = await supabase
    .from("fixtures")
    .select("*")
    .eq("season", season)
    .order("matchweek", { ascending: true });

  if (error || !fixtures) {
    console.error(`Failed to fetch fixtures for ${season}:`, error);
    return;
  }

  // Group by matchweek
  const mwMap = new Map<number, any[]>();
  fixtures.forEach(f => {
    const mw = f.matchweek; // We use the current assigned matchweek (which is likely the PLAYED matchweek)
    if (!mwMap.has(mw)) mwMap.set(mw, []);
    mwMap.get(mw).push(f);
  });

  const overloadedMWs: number[] = [];
  const underloadedMWs: number[] = [];

  for (let mw = 1; mw <= 38; mw++) {
    const count = (mwMap.get(mw) || []).length;
    if (count > 10) overloadedMWs.push(mw);
    if (count < 10) underloadedMWs.push(mw);
  }

  console.log(`Overloaded MWs: ${overloadedMWs.join(", ")}`);
  console.log(`Underloaded MWs: ${underloadedMWs.join(", ")}`);

  for (const sourceMW of overloadedMWs) {
    const matches = mwMap.get(sourceMW) || [];
    
    // Calculate mode date
    const dates = matches.map(m => new Date(m.date).toDateString());
    const dateCounts = {};
    dates.forEach(d => { dateCounts[d] = (dateCounts[d] || 0) + 1; });
    
    let modeDateStr = "";
    let maxCount = 0;
    for (const d in dateCounts) {
      if (dateCounts[d] > maxCount) {
        maxCount = dateCounts[d];
        modeDateStr = d;
      }
    }
    const modeTime = new Date(modeDateStr).getTime();

    // Identify matches that are likely rescheduled (furthest from mode date)
    // Sort matches by distance from mode date
    matches.sort((a, b) => {
      const distA = Math.abs(new Date(a.date).getTime() - modeTime);
      const distB = Math.abs(new Date(b.date).getTime() - modeTime);
      return distB - distA; // Descending distance
    });

    // Try to move the most distant matches
    const matchesToMoveCount = matches.length - 10;
    
    for (let i = 0; i < matchesToMoveCount; i++) {
      const candidate = matches[i];
      console.log(`Candidate for move from MW ${sourceMW}: ${candidate.home_team} vs ${candidate.away_team} (${candidate.date})`);

      // Find a target MW
      let targetMW = -1;
      
      for (const target of underloadedMWs) {
        const targetMatches = mwMap.get(target) || [];
        
        // Check if Home or Away team already plays in Target MW
        const homePlays = targetMatches.some(m => m.home_team === candidate.home_team || m.away_team === candidate.home_team);
        const awayPlays = targetMatches.some(m => m.home_team === candidate.away_team || m.away_team === candidate.away_team);
        
        if (!homePlays && !awayPlays) {
          // Check if adding this match brings count to <= 10 (it should, since it's underloaded)
          if (targetMatches.length < 10) {
            targetMW = target;
            break;
          }
        }
      }

      if (targetMW !== -1) {
        console.log(`  -> Moving to MW ${targetMW}`);
        
        // Update DB
        const { error: updateError } = await supabase
          .from("fixtures")
          .update({ original_matchweek: targetMW })
          .eq("id", candidate.id);
          
        if (updateError) {
          console.error("Failed to update:", updateError);
        } else {
          // Update local state to reflect move (so we don't double fill)
          mwMap.get(targetMW)?.push(candidate);
          // Remove from source? No need for this loop logic, but strictly yes.
        }
      } else {
        console.log(`  -> No suitable target MW found.`);
      }
    }
  }
}

async function run() {
  for (const season of SEASONS) {
    await processSeason(season);
  }
}

run().catch(console.error);
