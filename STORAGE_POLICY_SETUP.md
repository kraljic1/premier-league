# Supabase Storage Policy Setup za Grbove

## Pravilna Policy za Bucket `grbovi1`

U Supabase Dashboard → Storage → Policies → `grbovi1`, kreirajte sljedeću policy:

### Policy za Public Read Access (SELECT)

**Policy Name:** `Public read access to all logos`

**Allowed Operations:** 
- ✅ SELECT (za čitanje fajlova)

**Target Roles:**
- `anon` (anonymous/public)

**Policy Definition (SQL):**
```sql
bucket_id = 'grbovi1'
```

Ovo će omogućiti svima da čitaju sve fajlove iz bucket-a `grbovi1`.

---

## Alternativno: Ako želite ograničiti samo na slike

Ako želite biti precizniji i dozvoliti samo slike (jpg, png, svg):

**Policy Name:** `Public read access to image files`

**Policy Definition (SQL):**
```sql
bucket_id = 'grbovi1' 
AND (
  storage."extension"(name) IN ('jpg', 'jpeg', 'png', 'svg', 'webp')
)
```

---

## Važno

- **NE** koristite folder ograničenja (`storage.foldername(name)`) - skripta sprema fajlove direktno u root bucket-a
- **NE** ograničavajte samo na JPG - imamo SVG i PNG formate
- **DO** koristite jednostavnu policy koja dozvoljava SELECT za sve fajlove u bucketu

---

## Nakon postavljanja policy

Pokrenite skriptu ponovo:
```bash
npx tsx scripts/upload-club-logos.ts
```
