# Premier League App

A Next.js application that displays Premier League fixtures, results, standings, and top scorers.

## Features

- **Fixtures**: All Premier League matches (scheduled, live, finished) from matchweek 1-38
- **Results**: Completed matches with final scores
- **Standings**: Current league table
- **Top Scorers**: Goal scorers leaderboard

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Scraping**: Puppeteer for web scraping
- **State Management**: Zustand

## Database Setup

This app uses Supabase as its database. Follow these steps to set up:

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Wait for the database to be ready

### 2. Run Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `database/migrations/001_initial_schema.sql`
3. Paste it into the SQL Editor and click **Run**

This creates all necessary tables:
- `clubs` - Team information
- `fixtures` - All matches (scheduled, live, finished)
- `standings` - League table
- `scorers` - Top goal scorers
- `cache_metadata` - Tracks when data was last updated

### 3. Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

To get these values:
1. Go to your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy the **Project URL** and **anon/public key**

### 4. Install Dependencies

```bash
npm install
```

### 5. Populate Database

After setting up the environment variables, populate the database with fresh data:

```bash
# This will scrape all data and store it in Supabase
curl -X POST http://localhost:3000/api/refresh
```

Or visit `/api/refresh` in your browser and click the refresh button.

## Development

```bash
npm run dev
```

## API Endpoints

- `GET /api/fixtures` - All matches (scheduled, live, finished)
- `GET /api/results` - Completed matches only
- `GET /api/standings` - League table
- `GET /api/scorers` - Top goal scorers
- `POST /api/refresh` - Refresh all data from Premier League website

## Data Flow

1. **Scraping**: Puppeteer scrapes data from Premier League website
2. **Storage**: Data is stored in Supabase database
3. **Caching**: API endpoints check database first, fall back to scraping if data is stale
4. **Frontend**: React components fetch from API endpoints

## Database Schema

### Fixtures Table
```sql
CREATE TABLE fixtures (
  id VARCHAR(100) PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  matchweek INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  is_derby BOOLEAN DEFAULT FALSE
);
```

### Standings Table
```sql
CREATE TABLE standings (
  position INTEGER NOT NULL,
  club VARCHAR(100) NOT NULL,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  form VARCHAR(10),
  season VARCHAR(20) NOT NULL
);
```

### Scorers Table
```sql
CREATE TABLE scorers (
  name VARCHAR(100) NOT NULL,
  club VARCHAR(100) NOT NULL,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  season VARCHAR(20) NOT NULL
);
```

## Deployment

This app can be deployed to Netlify, Vercel, or any platform that supports Next.js.

For Netlify deployment, you may need to:
1. Set environment variables in Netlify dashboard
2. Configure build settings
3. Ensure the database is accessible from the deployment environment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request