# Setting Up Premier League Flask API

## Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/tarun7r/Premier-League-API.git
cd Premier-League-API
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Run the Flask API:**
```bash
python main.py
```

The API will run on `http://localhost:5000` by default.

## Available Endpoints

- `GET /table` - Premier League standings
- `GET /players/{player_name}` - Player statistics
- `GET /fixtures/{team_name}` - Next 3 fixtures for a team

## Integration with Next.js App

1. Set the API URL in your `.env.local`:
```env
PREMIER_LEAGUE_API_URL=http://localhost:5000
```

2. The wrapper functions in `lib/api/premier-league-api.ts` will automatically use this URL.

3. You can now use the API in your routes:
```typescript
import { fetchTableFromAPI } from '@/lib/api/premier-league-api';

// In your API route
const table = await fetchTableFromAPI();
```

## Note

The Flask API provides:
- ✅ Standings table (can replace our scraper)
- ✅ Player stats (if needed)
- ❌ Only next 3 fixtures per team (not all fixtures/matchweeks)
- ❌ No results endpoint

So we'll still need our scrapers for:
- All fixtures (all matchweeks)
- Results (finished matches)
- Top scorers

## Production Deployment

For production, you'll need to:
1. Deploy the Flask API separately (e.g., on Railway, Render, or Heroku)
2. Update `PREMIER_LEAGUE_API_URL` to point to the deployed service
3. Or run both services in the same deployment (more complex)

