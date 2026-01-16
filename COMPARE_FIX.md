# Compare Page Fix - Januar 2026

## Problem
Compare stranica nije prikazivala sljedeće utakmice za neke klubove.

## Uzroci

### 1. Nekonzistentni nazivi klubova u bazi podataka
Isti klub je imao različite nazive u fixtures tablici:
- "Brighton" vs "Brighton & Hove Albion"
- "Newcastle" vs "Newcastle United"
- "Tottenham" vs "Tottenham Hotspur"
- "West Ham" vs "West Ham United"
- "Wolves" vs "Wolverhampton Wanderers"
- "Manchester Utd" vs "Manchester United"
- "Liverpool" vs "Liverpool FC"
- itd.

### 2. Pogrešni klubovi u CLUBS objektu
CLUBS objekt je sadržavao klubove iz 2024/25 sezone:
- Ipswich Town
- Leicester City
- Southampton

Umjesto klubova iz 2025/26 sezone:
- Burnley
- Leeds United
- Sunderland

### 3. TypeScript greške
Nekoliko TypeScript grešaka u scraper fileovima koje su blokirale build.

## Rješenje

### 1. Normalizacija naziva u bazi (scripts/normalize-team-names.ts)
Kreirao sam script koji je:
- Mapirao sve varijante naziva na kanonske nazive (iz lib/clubs.ts)
- Ažurirao 220 fixtures u bazi podataka
- Rezultat: svi klubovi sada koriste konzistentne nazive

**Primjer mappinga:**
```typescript
"Brighton" → "Brighton & Hove Albion"
"Newcastle" → "Newcastle United"
"Tottenham" → "Tottenham Hotspur"
"Wolves" → "Wolverhampton Wanderers"
```

### 2. Ažuriranje CLUBS objekta (lib/clubs.ts)
Zamijenio sam klubove iz prethodne sezone sa aktualnim:

**Uklonjeno:**
- Ipswich Town
- Leicester City
- Southampton

**Dodano:**
- Burnley (id: "burnley")
- Leeds United (id: "leeds")
- Sunderland (id: "sunderland")

### 3. TypeScript ispravke
Popravio sam TypeScript greške u:
- `lib/scrapers/rezultati-results-simple.ts` - dodao provjere za null vrijednosti
- `lib/scrapers/rezultati-results.ts` - dodao tipove za funkcije i varijable

## Rezultat

✓ Svi klubovi (20/20) sada imaju fixtures u bazi  
✓ Compare stranica prikazuje fixtures za sve klubove  
✓ Build prolazi bez grešaka  
✓ Sve TypeScript greške su ispravljene  

## Verifikacija

Pokreni script za verifikaciju:
```bash
npx tsx scripts/verify-all-clubs.ts
```

Trebalo bi prikazati ✓ za svih 20 klubova.

## Napomene

- OneFootball.com ne prikazuje fixtures za Ipswich Town, Leicester City i Southampton jer nisu u trenutnoj Premier League sezoni
- Burnley, Leeds United i Sunderland su promotirani u Premier League za 2025/26 sezonu
- Fixtures u bazi sada koriste kanonske nazive koji odgovaraju CLUBS objektu
