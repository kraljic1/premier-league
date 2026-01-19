import React from 'react';

export interface HelpContent {
  title: string;
  content: React.ReactNode;
}

export const HELP_CONTENT: Record<string, HelpContent> = {
  home: {
    title: "Home Page Help",
    content: (
      <div className="help-content">
        <div className="help-section">
          <h4 className="help-section__title">My Clubs</h4>
          <p className="help-section__text">
            Personalize your experience by selecting your favorite Premier League clubs. You can choose up to 6 teams from the club selector below.
            These clubs will be highlighted throughout the app with special styling, making it easy to quickly identify matches and information
            related to your favorite teams. Your selections are saved locally in your browser and will persist across sessions.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Next Match</h4>
          <p className="help-section__text">
            This section displays the next upcoming match for your selected clubs. If you have multiple clubs selected, it shows the chronologically
            next match across all your favorite teams. The countdown shows exactly how much time remains until kickoff. This helps you stay aware
            of upcoming fixtures for teams you care about most, so you never miss an important match.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Current Match Week</h4>
          <p className="help-section__text">
            Shows all Premier League fixtures for the current match week. This includes matches that are scheduled (upcoming), currently live,
            or have finished. The current match week is automatically determined by the highest match week that has completed matches.
            Matches are displayed in a 4-3-3 formation grid for easy visual scanning, with your selected clubs highlighted for quick identification.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Next Match Week</h4>
          <p className="help-section__text">
            Provides a preview of all fixtures for the upcoming match week. This helps you plan ahead and see what matches are coming up next.
            Like the current match week, fixtures are displayed in a formation grid. You can see which teams will be playing and when,
            helping you prepare for the weekend's football action and avoid scheduling conflicts with other activities.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Match Status</h4>
          <p className="help-section__text">
            Each match card shows its current status with a colored badge in the top-right corner:<br />
            <strong>• SCHEDULED:</strong> Match is upcoming and has not yet started. Shows the scheduled date and time.<br />
            <strong>• LIVE:</strong> Match is currently in progress. The app will automatically refresh to show live scores during match days.<br />
            <strong>• FT:</strong> Match has finished (Full Time). Shows the final score and result.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Derby Matches</h4>
          <p className="help-section__text">
            Local derby matches between rival clubs are given special prominence with a distinctive red border around the match card
            and a 🏆 DERBY MATCH badge. These are high-stakes local rivalries that carry extra significance beyond just league points.
            Examples include Manchester derby (Man City vs Man United), North London derby (Arsenal vs Tottenham), and Merseyside derby
            (Liverpool vs Everton). These matches are automatically detected and highlighted to draw your attention to these special fixtures.
          </p>
        </div>
      </div>
    ),
  },

  standings: {
    title: "Standings Page Help",
    content: (
      <div className="help-content">
        <div className="help-section">
          <h4 className="help-section__title">League Table</h4>
          <p className="help-section__text">
            The Premier League standings table displays all 20 teams ranked by their current position in the league. Teams are ordered from
            1st to 20th place, with the champion at the top and teams fighting relegation at the bottom. The table is updated in real-time
            as matches are played, giving you the most current league standings. The table reflects the competitive nature of the Premier League,
            where even small point differences can change positions dramatically.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Table Columns</h4>
          <p className="help-section__text">Each column provides important statistical information about team performance:</p>
          <ul className="help-section__list">
            <li><strong>Pos:</strong> Current league position (1-20)</li>
            <li><strong>Team:</strong> Club name and official logo</li>
            <li><strong>P:</strong> Games played so far this season</li>
            <li><strong>W:</strong> Number of matches won</li>
            <li><strong>D:</strong> Number of matches drawn</li>
            <li><strong>L:</strong> Number of matches lost</li>
            <li><strong>GF:</strong> Goals for - total goals scored by the team</li>
            <li><strong>GA:</strong> Goals against - total goals conceded by the team</li>
            <li><strong>GD:</strong> Goal difference (GF - GA) - shows attacking vs defensive strength</li>
            <li><strong>Pts:</strong> Points earned (3 for win, 1 for draw, 0 for loss)</li>
          </ul>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">European Qualification</h4>
          <p className="help-section__text">
            The top positions in the league table determine European competition qualification for the following season:<br />
            • <strong>Positions 1-4:</strong> Qualify for the prestigious UEFA Champions League, Europe's top club competition<br />
            • <strong>Positions 5-6:</strong> Qualify for the UEFA Europa League<br />
            • <strong>Position 7:</strong> Qualifies for the UEFA Conference League, Europe's third-tier competition<br />
            These qualifications are highly coveted and can bring significant financial rewards to clubs.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Relegation Zone</h4>
          <p className="help-section__text">
            The bottom three teams (positions 18-20) are at risk of relegation to the EFL Championship at the end of the season.
            Relegation means losing Premier League status, which has massive financial implications for clubs. The relegation battle
            is often intense, with teams fighting desperately to avoid the drop. Points gained in the final weeks of the season
            become crucial for survival, and the gap between safety and relegation is often very small.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">My Clubs Highlighting</h4>
          <p className="help-section__text">
            If you've selected favorite clubs on the Home page, those teams will be highlighted with special styling in the standings table.
            This makes it easy to quickly locate and track the performance of your preferred teams among the 20 clubs. The highlighting
            includes visual cues like different background colors or borders, helping you focus on the teams that matter most to you
            while still being able to see the full league context.
          </p>
        </div>
      </div>
    ),
  },

  fixturesResults: {
    title: "Fixtures & Results Page Help",
    content: (
      <div className="help-content">
        <div className="help-section">
          <h4 className="help-section__title">Matchweek Selector</h4>
          <p className="help-section__text">
            Use the matchweek selector to browse through different weeks of the season. You can view past results by selecting earlier
            matchweeks or look ahead at upcoming fixtures. The selector shows matchweek numbers (typically 1-38 for a full Premier League season).
            This allows you to explore historical results or plan ahead for future fixtures, giving you complete control over which part
            of the season you want to examine.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Competition Filter</h4>
          <p className="help-section__text">
            Filter matches by different competitions to focus on specific tournaments. Available filters include:<br />
            • <strong>Premier League:</strong> The main domestic league fixtures<br />
            • <strong>FA Cup:</strong> England's primary cup competition<br />
            • <strong>Carabao Cup:</strong> The League Cup competition<br />
            • <strong>UEFA Champions League:</strong> Europe's premier club competition<br />
            • <strong>UEFA Europa League:</strong> Europe's secondary club competition<br />
            • <strong>UEFA Conference League:</strong> Europe's third-tier club competition<br />
            You can select multiple competitions to see a comprehensive schedule.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Match Cards</h4>
          <p className="help-section__text">
            Each match is displayed in a card format showing essential information at a glance. Home teams are listed on the left,
            away teams on the right. The card includes the match date and scheduled time. For completed matches, you'll see the final score
            displayed prominently in the center. Each card also shows the competition type and has status indicators to show whether
            the match is scheduled, live, or finished. This format makes it easy to scan through multiple matches quickly.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Match Status Indicators</h4>
          <p className="help-section__text">Match status badges help you understand the current state of each fixture:</p>
          <ul className="help-section__list">
            <li><strong>SCHEDULED:</strong> Match is upcoming and confirmed. Shows when the match is scheduled to take place.</li>
            <li><strong>LIVE:</strong> Match is currently in progress. During match days, the app automatically refreshes to show live scores and updates.</li>
            <li><strong>FT:</strong> Match has finished (Full Time). Displays the final result and score.</li>
          </ul>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Navigation</h4>
          <p className="help-section__text">
            Navigate through matchweeks using the arrow buttons on either side of the matchweek selector. Click the left arrow to go
            to the previous matchweek or the right arrow to advance to the next matchweek. Alternatively, you can click directly on
            any matchweek number in the selector to jump immediately to that specific week. This flexible navigation system allows
            you to quickly move through the season's schedule or jump to specific periods you're interested in.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">My Clubs Highlighting</h4>
          <p className="help-section__text">
            When you have clubs selected on the Home page, any matches involving those teams are automatically highlighted with
            special visual styling. This makes it easy to quickly identify fixtures that involve your favorite clubs, even when
            browsing through large lists of matches. The highlighting helps you focus on the games that matter most to you while
            still maintaining visibility of the full match schedule.
          </p>
        </div>
      </div>
    ),
  },

  compareFixtures: {
    title: "Compare Fixtures Page Help",
    content: (
      <div className="help-content">
        <div className="help-section">
          <h4 className="help-section__title">Club Selection</h4>
          <p className="help-section__text">
            This page is designed to compare upcoming fixtures across your selected clubs. To use this feature, you must first choose
            your favorite clubs on the Home page. The comparison view will then display each of your selected clubs in separate cards,
            allowing you to see how their schedules align or conflict. This is particularly useful for fans who follow multiple teams
            and want to understand fixture congestion or plan their viewing schedule.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Future Matches Filter</h4>
          <p className="help-section__text">
            Control how far ahead you want to look by selecting the number of upcoming matches to display for each club. Options include:<br />
            • <strong>5 matches:</strong> Short-term view for immediate planning<br />
            • <strong>10 matches:</strong> Medium-term schedule overview<br />
            • <strong>20 matches:</strong> Extended view for comprehensive planning<br />
            • <strong>All:</strong> Complete remaining fixture list for the season<br />
            This filter helps you focus on the timeframe that's most relevant to your planning needs.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Competition Filter</h4>
          <p className="help-section__text">
            Expand your view beyond Premier League fixtures by including matches from other competitions. You can choose to include:<br />
            • <strong>FA Cup:</strong> England's knockout cup competition<br />
            • <strong>Carabao Cup:</strong> The domestic League Cup<br />
            • <strong>UEFA Champions League:</strong> Europe's top club competition<br />
            • <strong>UEFA Europa League:</strong> Europe's secondary competition<br />
            • <strong>UEFA Conference League:</strong> Europe's third-tier club competition<br />
            This gives you a complete picture of each club's full schedule across all competitions they participate in.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Fixture Cards</h4>
          <p className="help-section__text">
            Each club gets its own card displaying their upcoming matches in chronological order. The cards are arranged side by side,
            making it easy to compare schedules across different teams. Each match shows the opponent, date, competition, and venue.
            The chronological layout helps you identify busy periods, double gameweeks, or fixture congestion where teams play
            multiple matches in a short timeframe. This visual comparison is key to understanding fixture difficulty and scheduling conflicts.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Match Details</h4>
          <p className="help-section__text">
            Click on any individual match in the fixture cards to see expanded details. This includes the full match date and time,
            the specific venue/stadium, the competition name, and any additional context about the fixture. For cup matches,
            you'll also see which round of the competition it is. This detailed view helps you understand the full context
            of each fixture and make informed decisions about attending matches or planning your schedule around them.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Use Cases</h4>
          <p className="help-section__text">This comparison tool is invaluable for several planning scenarios:</p>
          <ul className="help-section__list">
            <li><strong>Travel Planning:</strong> See when away games occur and plan trips accordingly</li>
            <li><strong>Schedule Conflicts:</strong> Identify when your clubs play at the same time to avoid missing matches</li>
            <li><strong>Fixture Difficulty:</strong> Compare how busy each club's schedule is and assess fixture congestion</li>
            <li><strong>Cup Progress:</strong> Track how your clubs are performing across multiple competitions</li>
            <li><strong>Season Planning:</strong> Understand busy periods vs rest weeks for comprehensive season management</li>
          </ul>
        </div>
      </div>
    ),
  },

  compareSeason: {
    title: "Compare Season Page Help",
    content: (
      <div className="help-content">
        <div className="help-section">
          <h4 className="help-section__title">Season Comparison</h4>
          <p className="help-section__text">
            This powerful tool allows you to compare the historical performance of two Premier League clubs across different seasons.
            By analyzing past performance data, you can understand how teams have performed relative to each other over time, identify
            trends, and gain insights into team consistency and improvement. This historical perspective helps contextualize current
            performance and provides valuable insights for understanding team dynamics and rivalries.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Club Selection</h4>
          <p className="help-section__text">
            Choose any two Premier League clubs to compare - you're not limited to just your favorite clubs selected on the Home page.
            You can select historical rivals, teams from different eras, or any combination that interests you. The comparison will
            show data for seasons where both clubs were in the Premier League (or its predecessor, the First Division). This flexibility
            allows you to explore interesting matchups and historical rivalries regardless of your personal team preferences.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Season Selection</h4>
          <p className="help-section__text">
            Select multiple seasons for each club to analyze performance trends over time. You can choose recent seasons to see
            current form, or go back decades to analyze long-term performance patterns. The tool allows you to select different
            seasons for each club, so you can compare how teams performed in different eras. This multi-season analysis helps
            identify whether a team's success is consistent or cyclical, and how their performance compares to rivals over time.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Statistics Displayed</h4>
          <p className="help-section__text">The comparison shows comprehensive performance metrics for each selected season:</p>
          <ul className="help-section__list">
            <li><strong>Final Position:</strong> The team's finishing position in the league table at season's end</li>
            <li><strong>Points:</strong> Total points accumulated (3 for win, 1 for draw, 0 for loss)</li>
            <li><strong>Wins/Draws/Losses:</strong> Complete match record showing victories, draws, and defeats</li>
            <li><strong>Goals For/Against:</strong> Offensive and defensive output - goals scored vs goals conceded</li>
            <li><strong>Goal Difference:</strong> The net difference between goals scored and conceded (key ranking factor)</li>
          </ul>
          <p className="help-section__text">These metrics provide a complete picture of each team's performance in their respective seasons.</p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Comparison Chart</h4>
          <p className="help-section__text">
            Visual bar charts provide an immediate, intuitive way to compare performance metrics between the two selected clubs.
            The charts display key statistics side by side, making it easy to see at a glance which team performed better in each
            category for each season. Color coding helps distinguish between the clubs, and the visual representation makes it
            simple to identify patterns and trends across multiple seasons. This graphical approach transforms complex data
            into easily digestible insights.
          </p>
        </div>

        <div className="help-section">
          <h4 className="help-section__title">Use Cases</h4>
          <p className="help-section__text">This historical comparison tool serves many analytical purposes:</p>
          <ul className="help-section__list">
            <li><strong>Historical Rivalries:</strong> Compare classic rivalries like Manchester vs Liverpool or Arsenal vs Chelsea over decades</li>
            <li><strong>Team Improvement:</strong> Track how teams like Leicester City evolved from mid-table to champions</li>
            <li><strong>Performance Trends:</strong> Analyze whether teams maintain consistent performance or experience peaks and valleys</li>
            <li><strong>Manager Impact:</strong> See how different managerial eras affected team performance</li>
            <li><strong>Season Predictions:</strong> Use historical data to inform predictions about current season outcomes</li>
            <li><strong>Investment Research:</strong> Understand team stability and performance consistency for investment decisions</li>
          </ul>
        </div>
      </div>
    ),
  },
};

export function getHelpContent(pageKey: string): HelpContent | null {
  return HELP_CONTENT[pageKey] || null;
}