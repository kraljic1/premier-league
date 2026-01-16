# Console Errors Log

## Summary
- **Total Messages:** 32
- **Errors:** 22
- **Warnings:** 9
- **Info:** 1

## Error Details

### 1. GET `/api/clubs` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 2. GET `/favicon.ico` - 404 Not Found
- **URL:** `https://plmatches.netlify.app/favicon.ico`
- **Status:** 404 (Not Found)

### 3. GET `/api/clubs?name=Crystal%20Palace` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Crystal%20Palace`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 4. GET `/api/clubs?name=Fulham` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Fulham`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 5. GET `/api/clubs?name=Burnley` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Burnley`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 6. GET `/api/clubs?name=Leeds%20United` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Leeds%20United`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 7. GET `/api/clubs?name=Brentford` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Brentford`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 8. GET `/api/clubs?name=Nottingham%20Forest` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Nottingham%20Forest`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 9. GET `/api/clubs?name=Bournemouth` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Bournemouth`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 10. GET `/api/clubs?name=Everton` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Everton`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 11. GET `/api/clubs?name=Wolverhampton%20Wanderers` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Wolverhampton%20Wanderers`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 12. GET `/api/clubs?name=West%20Ham%20United` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=West%20Ham%20United`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 13. GET `/api/clubs?name=Newcastle%20United` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Newcastle%20United`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 14. GET `/api/clubs?name=Tottenham%20Hotspur` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Tottenham%20Hotspur`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 15. GET `/api/clubs?name=Manchester%20City` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Manchester%20City`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 16. GET `/api/clubs?name=Chelsea` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Chelsea`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 17. GET `/api/clubs?name=Liverpool` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Liverpool`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 18. GET `/api/clubs?name=Aston%20Villa` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Aston%20Villa`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 19. GET `/api/clubs?name=Sunderland` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Sunderland`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 20. GET `/api/clubs?name=Brighton%20%26%20Hove%20Albion` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Brighton%20%26%20Hove%20Albion`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 21. GET `/api/clubs?name=Arsenal` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Arsenal`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

### 22. GET `/api/clubs?name=Manchester%20United` - 500 Internal Server Error
- **URL:** `https://plmatches.netlify.app/api/clubs?name=Manchester%20United`
- **Status:** 500 (Internal Server Error)
- **Source:** `page-4abfe9add5bd2929.js:1`

## Analysis

### Pattern Identified
All errors (except favicon) are related to the `/api/clubs` endpoint:
- 1 generic request to `/api/clubs` without parameters
- 21 requests to `/api/clubs` with specific club names as query parameters

### Common Issues
1. **500 Internal Server Error:** All `/api/clubs` requests are failing with server errors, suggesting a backend issue
2. **Missing Favicon:** The favicon.ico file is not found (404)
3. **Source:** Most errors originate from `page-4abfe9add5bd2929.js:1`, indicating client-side code is making these requests

### Affected Clubs
The following clubs are experiencing API errors:
- Arsenal
- Aston Villa
- Bournemouth
- Brentford
- Brighton & Hove Albion
- Burnley
- Chelsea
- Crystal Palace
- Everton
- Fulham
- Leeds United
- Liverpool
- Manchester City
- Manchester United
- Newcastle United
- Nottingham Forest
- Sunderland
- Tottenham Hotspur
- West Ham United
- Wolverhampton Wanderers
