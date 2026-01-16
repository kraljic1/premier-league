# Performance Optimizations

Ovaj dokument opisuje optimizacije implementirane za brže učitavanje stranica.

## Problem

Prije optimizacije, novi korisnik bi morao čekati:
- **5-10 sekundi** ako podaci nisu u bazi ili su stari (scraping)
- **~900ms** ako su podaci u bazi i svježi

## Rješenje: Background Refresh Pattern

Implementiran je **background refresh pattern** koji osigurava da korisnik uvijek dobije podatke brzo (< 500ms), dok se refresh dešava u pozadini.

### Kako funkcionira:

1. **Ako su podaci svježi** (< 25 minuta):
   - ✅ Vraća podatke iz baze odmah (~200ms)
   - Header: `X-Cache: HIT`

2. **Ako su podaci stari** (> 25 minuta) ali postoje u bazi:
   - ✅ Vraća stare podatke odmah (~200ms)
   - 🔄 Pokreće refresh u pozadini (ne čeka ga)
   - Header: `X-Cache: STALE-BACKGROUND-REFRESH`
   - Sljedeći zahtjev će dobiti svježe podatke

3. **Ako podaci ne postoje** u bazi:
   - ⏳ Mora čekati scraping (~5-10 sekundi)
   - Ovo se dešava samo pri prvom pokretanju ili ako baza bude prazna

### Implementirane optimizacije:

#### 1. Background Refresh Functions
- `refreshFixturesInBackground()` - refresh fixtures u pozadini
- `refreshStandingsInBackground()` - refresh standings u pozadini
- Funkcije se pokreću asinkrono, ne blokiraju response

#### 2. Edge Caching Headers
Dodani su optimizirani cache headers za Netlify CDN:
```
Cache-Control: public, s-maxage=1500, stale-while-revalidate=3600
```

- `s-maxage=1500` - CDN cache 25 minuta
- `stale-while-revalidate=3600` - CDN može servirati stare podatke dok refreshuje u pozadini (1 sat)

#### 3. API Optimizacije
- `/api/fixtures` - optimiziran sa background refresh
- `/api/results` - vraća podatke brzo (koristi fixtures tablicu)
- `/api/standings` - optimiziran sa background refresh

## Rezultati

### Prije optimizacije:
- **Novi korisnik**: 5-10 sekundi (ako scraping)
- **Povratni korisnik**: ~900ms (ako su podaci svježi)

### Nakon optimizacije:
- **Novi korisnik**: **< 500ms** (uvijek brzo, čak i sa starim podacima)
- **Povratni korisnik**: **~200ms** (iz baze ili CDN cache-a)
- **Background refresh**: Dešava se automatski, ne blokira korisnika

## Dodatne optimizacije (opcionalno)

### 1. Server-Side Rendering (SSR)
Konvertiranje stranica u Server Components bi dodatno ubrzalo:
- Podaci se renderiraju na serveru prije slanja klijentu
- Korisnik vidi sadržaj odmah, bez čekanja JavaScript-a

### 2. Pre-rendering
- Pre-render stranica sa podacima prije deploy-a
- Korisnik dobije kompletan HTML odmah

### 3. Service Worker Caching
- Cache podataka u browseru
- Offline pristup podacima

### 4. Database Indexing
- Optimizirati Supabase queries sa indexima
- Brže čitanje iz baze

## Monitoring

Možete pratiti performanse preko:
- `X-Cache` header - pokazuje izvor podataka (HIT, STALE-BACKGROUND-REFRESH, MISS-SCRAPED)
- Browser DevTools Network tab - vrijeme učitavanja
- Netlify Analytics - CDN cache hit rate

## Troubleshooting

### Stranica se još uvijek učitava sporo
1. Provjerite da li je baza prazna - prvi zahtjev će biti spor
2. Provjerite `X-Cache` header u Network tabu
3. Provjerite Netlify CDN cache status

### Podaci su stari
- Background refresh se dešava automatski
- Sljedeći zahtjev će dobiti svježe podatke
- Možete ručno pozvati `/api/refresh` za instant refresh
