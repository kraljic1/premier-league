# Database Migration Instructions

## Migracija za sezonu 2025/2026

Koristite fajl `database/migrations/001_initial_schema_2025_2026.sql` za kreiranje baze podataka.

## Koraci za migraciju:

1. **Otvorite Supabase Dashboard**
   - Idite na vaš Supabase projekt
   - Kliknite na "SQL Editor" u lijevom meniju

2. **Kopirajte SQL migraciju**
   - Otvorite fajl `database/migrations/001_initial_schema_2025_2026.sql`
   - Kopirajte sav sadržaj

3. **Pokrenite migraciju**
   - Zalijepite SQL kod u SQL Editor
   - Kliknite na "Run" ili pritisnite `Ctrl+Enter` (Windows/Linux) ili `Cmd+Enter` (Mac)
   - Sačekajte da se migracija završi

4. **Provjerite da su tabele kreirane**
   - U SQL Editoru pokrenite:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
   - Trebali biste vidjeti: `clubs`, `fixtures`, `standings`, `scorers`, `cache_metadata`

## Što migracija kreira:

- **clubs** - Tabela sa informacijama o klubovima (boje, kratki nazivi)
- **fixtures** - Tabela sa svim utakmicama (scheduled, live, finished)
- **standings** - Tabela sa ljestvicom (tablica)
- **scorers** - Tabela sa najboljim strijelcima
- **cache_metadata** - Tabela za praćenje kada su podaci posljednji put ažurirani

## Nakon migracije:

1. Pokrenite skriptu za popunjavanje rezultata:
   ```bash
   npx tsx scripts/fetch-results-by-matchweek.ts --start=1 --end=38
   ```

2. Ili pokrenite za specifična kola:
   ```bash
   npx tsx scripts/fetch-results-by-matchweek.ts 19 20 21
   ```

## Napomene:

- Migracija je idempotentna - možete je pokrenuti više puta bez problema
- Sve postojeće podatke će ažurirati ako već postoje
- RLS (Row Level Security) je omogućen za sve tabele
- Service role ima puni pristup za insert/update/delete operacije
