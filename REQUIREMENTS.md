# Premier League 2025/26 Tracker - Project Requirements

## Project Overview

A complete Next.js 14+ (App Router) project in TypeScript for a private Premier League 2025/26 tracker (personal use only, hosted on Netlify).

**Key Constraint:** NO EXTERNAL PAID APIs – scrape everything from official premierleague.com using Cheerio + Axios on server-side only (in app/api routes).

## Required Pages

### Home (/)
- Big countdown to next match of "My Clubs"
- Quick preview of today's/weekend fixtures
- "My Clubs" manager

### /fixtures
- Full schedule by matchweek with filters

### /standings
- Current league table with form (last 6)

### /compare
- Compare schedule of 1–5 selected clubs side-by-side
- Use club colors for visual distinction

### /top-scorers
- Top 20 goalscorers + assists from pl.com/stats

## API Routes (app/api)

### GET /api/fixtures
Returns all matches of current season (2025/26) with:
- date
- home/away teams
- score
- matchweek

### GET /api/standings
Returns current table with:
- position
- played
- W/D/L (won/drawn/lost)
- GF/GA (goals for/goals against)
- GD (goal difference)
- points
- form (last 6 results as string "WWDLWD")

### GET /api/scorers
Returns top 20 players with:
- name
- club
- goals
- assists

### POST /api/refresh
Triggers re-scraping of all data (manual refresh button)

## Scraping Sources

### Fixtures
- URL: `https://www.premierleague.com/matches?competition=8&season=2025`

### Standings
- URL: `https://www.premierleague.com/tables?competition=8&season=2025`

### Scorers
- Goals: `https://www.premierleague.com/stats/top/players/goals`
- Assists: `https://www.premierleague.com/stats/top/players/goal_assist`

## Tech Stack

- **Framework:** Next.js 14+ App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand (myClubs array max 5, primaryClub for theme)
- **Data Fetching:** TanStack Query (30min revalidate)
- **Scraping:** Cheerio + Axios (server-side only)
- **Date Handling:** date-fns
- **Calendar Export:** ics library

## Code Rules (STRICT)

- Every reusable component ≤ 200 lines
- Every arrow function / handler ≤ 50 lines
- If longer → split immediately
- All styles with Tailwind only (no inline styles)
- Dynamic club theme: when primary club selected → change header/bg/accent colors using CLUBS object

## Required Features

### Core Files

#### /lib/clubs.ts
Must include all 20 Premier League clubs with:
- name
- shortName
- primaryColor
- secondaryColor
- textColor

#### Derby Detection
Hardcoded pairs like:
- Arsenal-Tottenham
- Man Utd-Man City
- Liverpool-Everton
- etc.

### PWA Support
- PWA manifest
- Service worker (installable on mobile)

### Components

#### MatchCountdown
Beautiful countdown component showing time until next match

#### AddToCalendarButton
Generates .ics file for all "My Clubs" matches

### Design Requirements

- Responsive design
- Mobile-first approach
- Dark mode supported
- Production-ready
- Clean and beautiful UI

## Project Structure

```
/
├── app/
│   ├── api/
│   │   ├── fixtures/
│   │   ├── standings/
│   │   ├── scorers/
│   │   └── refresh/
│   ├── compare/
│   ├── fixtures/
│   ├── standings/
│   ├── top-scorers/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── MatchCountdown.tsx
│   ├── AddToCalendarButton.tsx
│   ├── ClubSelector.tsx
│   └── ...
├── lib/
│   ├── clubs.ts
│   ├── types.ts
│   ├── utils.ts
│   ├── store.ts
│   └── scrapers/
│       ├── fixtures.ts
│       ├── standings.ts
│       └── scorers.ts
└── public/
    ├── manifest.json
    └── sw.js
```

## Implementation Notes

- All scraping happens server-side only (in API routes)
- Data is cached for 30 minutes (configurable)
- Maximum 5 clubs can be selected in "My Clubs"
- Primary club selection changes theme colors dynamically
- Derby matches are automatically detected and highlighted
- Calendar export includes all matches for selected clubs

## Deployment

- Target: Netlify
- Build command: `npm run build`
- Output directory: `.next`

