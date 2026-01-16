# Netlify Environment Variables Setup

## Required Environment Variables

Za Netlify produkciju, trebate dodati sljedeće environment varijable u Netlify dashboardu:

### 1. NEXT_PUBLIC_SUPABASE_URL
- **Opis**: URL vašeg Supabase projekta
- **Format**: `https://your-project-id.supabase.co`
- **Gdje naći**: Supabase Dashboard → Settings → API → Project URL

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Opis**: Anon/public key za Supabase
- **Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Gdje naći**: Supabase Dashboard → Settings → API → anon/public key

### 3. SUPABASE_SERVICE_ROLE_KEY (Preporučeno)
- **Opis**: Service role key za server-side pristup (bypass RLS)
- **Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Gdje naći**: Supabase Dashboard → Settings → API → service_role key
- **Važno**: Ovaj ključ je tajni i ne smije biti izložen u client-side kodu!

## Kako dodati na Netlify

### Korak 1: Otvorite Netlify Dashboard
1. Idite na [Netlify Dashboard](https://app.netlify.com)
2. Odaberite vaš site (`plmatches`)

### Korak 2: Dodajte Environment Variables
1. Idite na **Site settings** → **Environment variables**
2. Kliknite **Add a variable** za svaku varijablu:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Korak 3: Triggerajte novi deploy
Nakon dodavanja varijabli, triggerajte novi deploy:
1. Idite na **Deploys** tab
2. Kliknite **Trigger deploy** → **Deploy site**
3. Ili napravite novi commit i push na GitHub

## Provjera

Nakon deploya, provjerite da li API vraća ispravne podatke:

```bash
# Provjerite broj rezultata
curl https://plmatches.netlify.app/api/results | jq '. | length'
# Trebalo bi vratiti 210

# Provjerite broj fixtures
curl https://plmatches.netlify.app/api/fixtures | jq '[.[] | select(.status != "finished")] | length'
# Trebalo bi vratiti 170
```

## Troubleshooting

### Problem: API još uvijek vraća samo scraped podatke
- **Rješenje**: Provjerite da su sve tri varijable postavljene
- Provjerite Netlify Functions logove za greške
- Provjerite da je `SUPABASE_SERVICE_ROLE_KEY` postavljen (ne samo anon key)

### Problem: "Missing Supabase environment variables" u logovima
- **Rješenje**: Provjerite da su varijable dodane u Netlify dashboardu
- Provjerite da nema tipfelera u imenima varijabli
- Provjerite da su vrijednosti kopirane u cijelosti (bez razmaka)

### Problem: RLS (Row Level Security) greške
- **Rješenje**: Koristite `SUPABASE_SERVICE_ROLE_KEY` umjesto samo anon key
- Service role key zaobilazi RLS i omogućava server-side pristup svim podacima

## Sigurnost

⚠️ **VAŽNO**: 
- `SUPABASE_SERVICE_ROLE_KEY` je tajni ključ i ne smije biti izložen u client-side kodu
- Koristi se samo u server-side API rutama
- Nikada ne commitajte `.env.local` file u Git!
