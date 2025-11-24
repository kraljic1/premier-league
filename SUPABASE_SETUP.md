# Supabase Setup Guide

## 1. Create Environment Variables

Create a `.env.local` file in your project root with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### How to get these values:
1. Go to your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy the **Project URL** for `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the **anon/public key** for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Run Database Migration

Go to your Supabase project dashboard:
1. Go to **SQL Editor**
2. Copy and paste the contents of `database/migrations/001_initial_schema.sql`
3. Click **Run** to execute the migration

This will create all necessary tables:
- `clubs` - Team information
- `fixtures` - All matches (scheduled, live, finished)
- `standings` - League table
- `scorers` - Top goal scorers
- `cache_metadata` - Tracks when data was last updated

## 3. Test the Connection

After setting up the environment variables and running the migration, restart your development server:

```bash
npm run dev
```

The API endpoints will now use Supabase instead of in-memory caching.
