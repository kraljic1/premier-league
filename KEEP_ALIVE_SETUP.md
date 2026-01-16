# Keep-Alive Setup za Supabase

Ovaj dokument objašnjava kako postaviti automatski keep-alive za Supabase bazu podataka kako bi se spriječilo pauziranje projekta.

## Problem

Supabase projekti na free tieru se automatski pauziraju nakon određenog perioda neaktivnosti. Kada se projekt pauzira, DNS lookup neće uspjeti i aplikacija neće moći pristupiti bazi podataka.

## Rješenje

Kreiran je API endpoint `/api/keep-alive` koji izvršava jednostavan upit na bazu podataka. Ovaj endpoint treba biti pozvan svakih 24 sati kako bi se održala aktivnost projekta.

## Postavljanje Cron Job-a

### Opcija 1: cron-job.org (Preporučeno - Besplatno)

1. Idite na [cron-job.org](https://cron-job.org) i kreirajte besplatni account
2. Kliknite na "Create cronjob"
3. Postavite sljedeće:
   - **Title**: `Supabase Keep-Alive`
   - **Address**: `https://your-app-url.netlify.app/api/keep-alive`
   - **Schedule**: `0 2 * * *` (svaki dan u 2:00 AM)
   - **Request method**: `GET`
   - **Save response**: Ne (opcionalno)
4. Kliknite "Create cronjob"

### Opcija 2: EasyCron (Besplatno)

1. Idite na [EasyCron](https://www.easycron.com) i kreirajte account
2. Kliknite "Add Cron Job"
3. Postavite:
   - **Cron Job Name**: `Supabase Keep-Alive`
   - **URL**: `https://your-app-url.netlify.app/api/keep-alive`
   - **Schedule Pattern**: `0 2 * * *` (svaki dan u 2:00 AM)
   - **HTTP Method**: `GET`
4. Kliknite "Add"

### Opcija 3: Netlify Scheduled Functions (Napredno)

Ako želite koristiti Netlify Scheduled Functions umjesto eksternog cron servisa:

1. Kreirajte `netlify/functions/keep-alive.ts`:

```typescript
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const handler: Handler = async (event, context) => {
  try {
    const { data, error } = await supabase
      .from('cache_metadata')
      .select('key')
      .limit(1);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Keep-alive successful' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Unknown error' })
    };
  }
};
```

2. Dodajte u `netlify.toml`:

```toml
[[plugins]]
  package = "@netlify/plugin-scheduled-functions"

[[schedule]]
  cron = "0 2 * * *"
  function = "keep-alive"
```

## Testiranje

Nakon postavljanja cron job-a, možete testirati endpoint ručno:

```bash
curl https://your-app-url.netlify.app/api/keep-alive
```

Ili otvorite URL u browseru. Trebali biste dobiti JSON odgovor:

```json
{
  "success": true,
  "message": "Database keep-alive successful",
  "timestamp": "2025-01-XX...",
  "data": [...]
}
```

## Raspored

Preporučeni raspored je **svaki dan u 2:00 AM** (Cron: `0 2 * * *`). Možete promijeniti vrijeme prema potrebi:

- `0 2 * * *` - Svaki dan u 2:00 AM
- `0 */12 * * *` - Svakih 12 sati
- `0 0 * * *` - Svaki dan u ponoć

**Napomena**: Supabase projekti se obično pauziraju nakon 7 dana neaktivnosti, ali je sigurnije pozivati endpoint svakih 24 sata.

## Provjera Statusa

Možete provjeriti da li cron job radi tako što ćete:

1. Provjeriti logove na cron-job.org ili EasyCron dashboardu
2. Dodati email notifikacije u cron job postavkama
3. Provjeriti Netlify Functions logove (ako koristite Scheduled Functions)

## Troubleshooting

### Endpoint vraća grešku 500
- Provjerite da su Supabase environment varijable postavljene u Netlify dashboardu
- Provjerite da je Supabase projekt aktivan (ne pauziran)

### Cron job ne radi
- Provjerite da je URL točan (uključuje `https://`)
- Provjerite da cron job nije pauziran u dashboardu
- Provjerite email notifikacije za greške

### Supabase projekt se i dalje pauzira
- Provjerite da cron job stvarno poziva endpoint (provjerite logove)
- Smanjite interval poziva (npr. svakih 12 sati umjesto 24)
- Provjerite da endpoint vraća `success: true`
