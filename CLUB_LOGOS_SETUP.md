# Postavljanje Grbova Klubova u Supabase

Ovaj vodič objašnjava kako spremiti grbove klubova u Supabase Storage i ažurirati bazu podataka.

## Korak 1: Pokrenite Migraciju

1. Idite u Supabase Dashboard → SQL Editor
2. Otvorite datoteku `database/migrations/002_add_logo_url_to_clubs.sql`
3. Kopirajte SQL kod i pokrenite ga

Ovo će dodati `logo_url` kolonu u `clubs` tabelu.

## Korak 2: Kreirajte Storage Bucket

1. Idite u Supabase Dashboard → Storage
2. Kliknite "New bucket"
3. Unesite ime: `club-logos`
4. Označite "Public bucket" (važno!)
5. Kliknite "Create bucket"

## Korak 3: Postavite Storage Policies

U Supabase Dashboard → Storage → Policies → `club-logos`:

1. Kliknite "New Policy"
2. Odaberite "For full customization"
3. Dodajte sljedeću policy:

```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'club-logos');
```

## Korak 4: Pokrenite Skriptu za Upload

```bash
# Provjerite da imate SUPABASE_SERVICE_ROLE_KEY u .env.local
npx tsx scripts/upload-club-logos.ts
```

Ova skripta će:
1. Preuzeti sve grbove s trenutnih CDN URL-ova
2. Uploadati ih u Supabase Storage
3. Ažurirati `logo_url` u `clubs` tabeli

## Korak 5: Provjerite Rezultate

Nakon što se skripta izvrši, provjerite:

1. Storage → `club-logos` bucket - trebali bi biti svi grbovi
2. Table Editor → `clubs` - svaki klub trebao bi imati `logo_url` popunjen

## Troubleshooting

### Greška: "Bucket not found"
- Provjerite da ste kreirali `club-logos` bucket u Storage sekciji

### Greška: "Permission denied"
- Provjerite da je bucket javan (Public bucket)
- Provjerite da ste postavili Storage policies

### Greška: "Failed to download"
- Neki CDN URL-ovi možda ne rade
- Skripta će preskočiti te klubove i nastaviti s ostalima

### Grbovi se ne prikazuju
- Provjerite browser konzolu za CORS greške
- Provjerite da su URL-ovi u bazi ispravni
- Hard refresh stranice (Ctrl+Shift+R)
