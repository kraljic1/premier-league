# 🔗 Frontend API Integration Guide

## 🎯 **Zašto ovaj pristup NE pomaže eksploataciji API-ja**

### ❌ **Problem sa tradicionalnim pristupom:**
```javascript
// POGREŠNO - API ključ u frontend kodu
const API_KEY = 'K66OJVCSie2CjtdbP9IJQP3Z7Cj1OHBs';
fetch('/api/fixtures', {
  headers: { 'x-api-key': API_KEY }
});
```

**Problemi:**
- API ključ je vidljiv u browser dev tools
- Ključ se može ukrasti iz JavaScript bundle-a
- Nema zaštite od neovlaštenog korištenja

### ✅ **Naš sigurnosni pristup:**

#### 1. **Public API-ji bez autentifikacije**
```javascript
// TAČNO - Bez API ključa u frontend-u
fetch('/api/fixtures').then(r => r.json());
```

**Zaštite:**
- Rate limiting (300 requests/15min)
- CORS policy (samo dozvoljene domene)
- Request size limits
- Security headers

#### 2. **Admin API-ji sa autentifikacijom**
```javascript
// Samo za admin operacije (server-side)
const response = await fetch('/api/refresh', {
  headers: { 'x-api-key': process.env.API_KEY_WRITE }
});
```

## 🚀 **Kako koristiti API u frontend-u**

### 1. **Koristi naš API Client**

```typescript
import { useApi } from '@/lib/api-client';

function MyComponent() {
  const api = useApi();

  const loadFixtures = async () => {
    const response = await api.getFixtures({
      competitions: 'Premier League',
      limit: 10
    });

    if (response.success) {
      setFixtures(response.data);
    } else {
      setError(response.error);
    }
  };

  return (
    <button onClick={loadFixtures}>
      Load Fixtures
    </button>
  );
}
```

### 2. **Direktni fetch pozivi**

```typescript
// Fixtures
const fixtures = await fetch('/api/fixtures').then(r => r.json());

// Results
const results = await fetch('/api/results').then(r => r.json());

// Standings
const standings = await fetch('/api/standings').then(r => r.json());

// Sa parametrima
const limitedFixtures = await fetch('/api/fixtures?limit=5&competitions=Premier%20League')
  .then(r => r.json());
```

### 3. **Error handling**

```typescript
const response = await fetch('/api/fixtures');

if (!response.ok) {
  if (response.status === 429) {
    // Rate limited
    showError('Too many requests. Please wait.');
  } else if (response.status === 403) {
    // CORS violation
    showError('Access denied.');
  } else {
    // Other error
    showError('Failed to load data.');
  }
} else {
  const data = await response.json();
  // Process data
}
```

## 🔒 **Sigurnosne razine**

| API Endpoint | Autentifikacija | Rate Limit | CORS |
|-------------|----------------|------------|------|
| `/api/fixtures` | ❌ Ne | 300/15min | ✅ Dozvoljene domene |
| `/api/results` | ❌ Ne | 300/15min | ✅ Dozvoljene domene |
| `/api/standings` | ❌ Ne | 300/15min | ✅ Dozvoljene domene |
| `/api/refresh` | ✅ Admin ključ | 5/15min | ❌ Blokirano |
| `/api/keys` | ✅ Admin ključ | 5/15min | ❌ Blokirano |

## 🎛️ **Environment Variables**

Frontend-u nisu potrebne nikakve environment varijable za API pozive!

```typescript
// ❌ NE TREBA
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

// ✅ SAMO ovo
const data = await fetch('/api/fixtures').then(r => r.json());
```

## 🛡️ **Zaštite koje sprječavaju eksploataciju**

### 1. **Rate Limiting**
- Automatski blokira abuse
- Burst protection dozvoljava legitimate traffic spikes
- Sliding window sprečava gaming sistema

### 2. **CORS Policy**
- Samo dozvoljene domene mogu pristupati
- Blokira cross-origin attacks
- Sprječava CSRF attacks

### 3. **Request Validation**
- Size limits sprječavaju DoS attacks
- Parameter validation
- Timeout kontrole

### 4. **Security Headers**
- XSS zaštita
- Clickjacking prevention
- Content type sniffing protection

## 📱 **Primjer React komponente**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/lib/api-client';

export function FixturesList() {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    loadFixtures();
  }, []);

  const loadFixtures = async () => {
    const response = await api.getFixtures({
      competitions: 'Premier League',
      limit: 20
    });

    setLoading(false);

    if (response.success) {
      setFixtures(response.data);
    } else {
      console.error('Failed to load fixtures:', response.error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {fixtures.map(fixture => (
        <div key={fixture.id}>
          {fixture.homeTeam} vs {fixture.awayTeam}
        </div>
      ))}
    </div>
  );
}
```

## 🚨 **Šta se događa ako neko pokuša eksploataciju**

### Scenario 1: Previše zahtjeva
```bash
curl "http://your-domain.com/api/fixtures" # OK
# Ponovi 300+ puta u 15 minuta...
# Rezultat: 429 Too Many Requests
```

### Scenario 2: Pogrešna domena
```javascript
// Sa evil.com
fetch('https://your-domain.com/api/fixtures') // 403 CORS error
```

### Scenario 3: Pokusaj admin operacija
```bash
curl "http://your-domain.com/api/refresh" # 401 API key required
```

## 🎯 **Zaključak**

**Ovaj pristup je SIGURNIJI od tradicionalnog jer:**
- ✅ API ključevi nisu izloženi u frontend-u
- ✅ Rate limiting štiti od abuse-a
- ✅ CORS policy sprječava unauthorized access
- ✅ Security headers pružaju dodatnu zaštitu
- ✅ Request validation sprječava malicious input

**Za korištenje u kodu:**
```typescript
import { useApi } from '@/lib/api-client';

const api = useApi();
const fixtures = await api.getFixtures();
```

**Gotovo! 🚀**