# Secure Netlify Environment Variables Setup

## Required Environment Variables

⚠️ **SECURITY NOTICE**: All API keys must be rotated regularly and never committed to version control.

Za Netlify produkciju, trebate dodati sljedeće environment varijable u Netlify dashboardu:

### 1. Database Configuration

#### NEXT_PUBLIC_SUPABASE_URL (Required)
- **Opis**: URL vašeg Supabase projekta
- **Format**: `https://your-project-id.supabase.co`
- **Gdje naći**: Supabase Dashboard → Settings → API → Project URL
- **Security**: Public - safe to expose in client code

#### NEXT_PUBLIC_SUPABASE_ANON_KEY (Required)
- **Opis**: Anon/public key za Supabase
- **Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Gdje naći**: Supabase Dashboard → Settings → API → anon/public key
- **Security**: Public - safe to expose in client code

#### SUPABASE_SERVICE_ROLE_KEY (Required)
- **Opis**: Service role key za server-side pristup (bypass RLS)
- **Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Gdje naći**: Supabase Dashboard → Settings → API → service_role key
- **Security**: 🔴 SECRET - Never expose in client-side code!

### 2. API Security Keys

#### API_KEY_READ (Required)
- **Opis**: API key za čitanje podataka (fixtures, results, standings)
- **Format**: Generate a secure random string (32+ characters)
- **Usage**: Required for all public API endpoints
- **Security**: 🔴 SECRET - Keep confidential

#### API_KEY_WRITE (Required)
- **Opis**: API key za pisanje podataka (refresh endpoint)
- **Format**: Generate a secure random string (32+ characters)
- **Usage**: Required for `/api/refresh` endpoint
- **Security**: 🔴 SECRET - Keep confidential, restrict access

#### API_KEY_ADMIN (Required)
- **Opis**: API key za administrativne operacije (keep-alive)
- **Format**: Generate a secure random string (32+ characters)
- **Usage**: Required for `/api/keep-alive` endpoint
- **Security**: 🔴 SECRET - Maximum restriction, admin-only access

## Kako dodati na Netlify

### Korak 1: Generirajte API Keys
Prvo generirajte sigurne API ključeve:

```bash
npm run generate-api-keys
```

Ova naredba će generirati tri sigurna API ključa i prikazati upute za upotrebu.

### Korak 2: Otvorite Netlify Dashboard
1. Idite na [Netlify Dashboard](https://app.netlify.com)
2. Odaberite vaš site (`plmatches`)

### Korak 3: Dodajte Environment Variables
1. Idite na **Site settings** → **Environment variables**
2. Kliknite **Add a variable** za svaku varijablu:

#### Obavezne Database Varijable:
```
NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Sigurnosne API Keys (generirane u Koraku 1):
```
API_KEY_READ = [generated-read-key]
API_KEY_WRITE = [generated-write-key]
API_KEY_ADMIN = [generated-admin-key]
```

### Korak 4: Triggerajte novi deploy
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

## Testing Security Implementation

### Test API Access Levels
Nakon postavljanja varijabli, testirajte sigurnost:

```bash
# Test bez API ključa (treba vratiti 401)
curl https://plmatches.netlify.app/api/refresh

# Test s read ključem na write endpoint (treba vratiti 401)
curl -H "x-api-key: YOUR_READ_KEY" https://plmatches.netlify.app/api/refresh

# Test s write ključem na refresh endpoint (treba raditi)
curl -X POST -H "x-api-key: YOUR_WRITE_KEY" https://plmatches.netlify.app/api/refresh

# Test s admin ključem na keep-alive endpoint (treba raditi)
curl -H "x-api-key: YOUR_ADMIN_KEY" https://plmatches.netlify.app/api/keep-alive
```

### Security Headers Check
Provjerite da su sigurnosna zaglavlja postavljena:

```bash
curl -I https://plmatches.netlify.app/api/fixtures
```

Treba vidjeti zaglavlja kao:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000...`

## Troubleshooting

### Problem: API vraća 401 Unauthorized
- **Rješenje**: Provjerite da je API ključ ispravan i da ima odgovarajuću razinu pristupa
- Za `/api/refresh` potreban je `API_KEY_WRITE` ili `API_KEY_ADMIN`
- Za `/api/keep-alive` potreban je `API_KEY_ADMIN`

### Problem: API još uvijek vraća samo scraped podatke
- **Rješenje**: Provjerite da su sve database varijable postavljene
- Provjerite Netlify Functions logove za greške
- Provjerite da je `SUPABASE_SERVICE_ROLE_KEY` postavljen

### Problem: "Missing Supabase environment variables" u logovima
- **Rješenje**: Provjerite da su sve varijable dodane u Netlify dashboardu
- Provjerite da nema tipfelera u imenima varijabli
- Provjerite da su vrijednosti kopirane u cijelosti

### Problem: Rate limiting aktiviran
- **Rješenje**: Pričekajte da istekne rate limit window (15 minuta)
- Smanjite frekvenciju API poziva
- Za `/api/refresh` limit je 5 poziva po 15 minuta

## Sigurnost - Critical Security Notes

🚨 **CRITICAL SECURITY REQUIREMENTS**:

### API Keys
- 🔴 `SUPABASE_SERVICE_ROLE_KEY` - Never expose in client-side code!
- 🔴 `API_KEY_*` - Keep confidential, never commit to Git
- 🔄 Rotate all keys every 30-90 days
- 🛡️ Use different keys for staging/production environments

### Access Control
- **Read Access** (`API_KEY_READ`): Public endpoints (fixtures, results, standings)
- **Write Access** (`API_KEY_WRITE`): Data modification endpoints (/api/refresh)
- **Admin Access** (`API_KEY_ADMIN`): System administration (/api/keep-alive)

### Best Practices
- Nikada ne commitajte `.env*` datoteke u Git
- Koristite Netlify's encrypted environment variables
- Monitor API logs for suspicious activity
- Implement IP allowlisting for admin operations when possible
- Regular security audits and penetration testing

### Security Monitoring
- All API requests are logged with client identification
- Authentication failures are logged and alerted
- Rate limiting violations are tracked
- Sensitive operations require explicit authorization
