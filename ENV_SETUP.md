# Environment Variables Setup

## Quick Setup

After running the database migration, you need to create a `.env.local` file in your project root with your Supabase credentials.

### Step 1: Create `.env.local` file

Create a file named `.env.local` in the root of your project (same directory as `package.json`):

```bash
touch .env.local
```

### Step 2: Add your Supabase credentials

Open `.env.local` and add the following (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 3: Get your Supabase credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → Use for `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

### Step 4: Verify it works

After creating `.env.local`, restart your terminal/script and run:

```bash
npx tsx scripts/check-historical-seasons.ts
```

You should no longer see "Missing Supabase environment variables" error.

## Security Notes

- ✅ `.env.local` is already in `.gitignore` - it won't be committed to git
- ⚠️ Never commit your actual keys to version control
- 🔴 `SUPABASE_SERVICE_ROLE_KEY` is a secret - keep it safe!

## Troubleshooting

If you still see "Missing Supabase environment variables":
1. Make sure `.env.local` is in the project root (same folder as `package.json`)
2. Make sure there are no typos in variable names
3. Restart your terminal after creating the file
4. For Next.js dev server, restart it: `npm run dev`
