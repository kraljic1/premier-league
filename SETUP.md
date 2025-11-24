# Setup Guide

## Installation

1. Install dependencies:
```bash
npm install
```

2. Replace placeholder icons:
   - Replace `public/icon-192.png` with a 192x192 PNG icon
   - Replace `public/icon-512.png` with a 512x512 PNG icon

## Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Scraping Notes

The scrapers use CSS selectors that may need adjustment based on the actual HTML structure of premierleague.com. If scraping fails:

1. Inspect the actual HTML structure of the pages
2. Update the selectors in:
   - `lib/scrapers/fixtures.ts`
   - `lib/scrapers/standings.ts`
   - `lib/scrapers/scorers.ts`

## Deployment to Netlify

1. Push your code to a Git repository
2. Connect the repository to Netlify
3. Netlify will automatically detect Next.js and build the project
4. The `netlify.toml` file is already configured

## Features

- ✅ Home page with countdown and club management
- ✅ Fixtures page with matchweek filtering
- ✅ Standings page with form indicators
- ✅ Compare page for side-by-side club schedules
- ✅ Top scorers page
- ✅ PWA support (installable on mobile)
- ✅ Dark mode support
- ✅ Dynamic theming based on primary club
- ✅ Calendar export (.ics) for your clubs' matches

## Notes

- Data is cached for 30 minutes (configurable in API routes)
- Maximum 5 clubs can be selected
- Derby matches are automatically detected
- All scraping happens server-side only

