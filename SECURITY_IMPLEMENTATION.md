# 🔒 Security Implementation Guide

This document outlines the comprehensive security measures implemented in the Premier League API system.

## 🛡️ Security Layers Implemented

### 1. Authentication & Authorization

#### API Key Authentication
- **3-tier access control**: Read, Write, Admin levels
- **Cryptographically secure keys**: 32-character hex keys
- **Environment-based secrets**: Keys stored as environment variables
- **Access level validation**: Each endpoint validates required permission level

#### Key Management
```bash
# Generate secure API keys
npm run generate-api-keys

# Environment variables required:
API_KEY_READ=...    # Public endpoints (fixtures, results, standings)
API_KEY_WRITE=...   # Write operations (/api/refresh)
API_KEY_ADMIN=...   # Admin operations (/api/keep-alive)
```

### 2. Rate Limiting

#### Request Throttling
- **Public APIs**: 100 requests per 15 minutes
- **Sensitive APIs**: 5 requests per 15 minutes
- **Client identification**: IP + User-Agent based tracking
- **Automatic cleanup**: Rate limit windows reset appropriately

#### Rate Limit Headers
- `Retry-After`: Seconds until limit resets
- `X-RateLimit-Reset`: ISO timestamp of reset time

### 3. Input Validation & Sanitization

#### Request Validation
- **Zod schemas** for all API inputs
- **Type-safe validation** with detailed error messages
- **Request size limits**: 1MB body limit, 4MB response limit
- **Automatic sanitization** of error messages

#### Validation Schemas
```typescript
export const validationSchemas = {
  refreshRequest: z.object({
    force: z.boolean().optional(),
    source: z.enum(['onefootball', 'official']).optional(),
    matchweek: z.number().min(1).max(38).optional()
  })
};
```

### 4. Security Headers

#### HTTP Security Headers
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security: max-age=31536000` - Forces HTTPS
- `Referrer-Policy: strict-origin-when-cross-origin` - Referrer control

#### CSP Headers
- `Content-Security-Policy: default-src 'none'` - Strict CSP for APIs
- `Cross-Origin-Resource-Policy: same-origin` - CORP protection
- `Cross-Origin-Opener-Policy: same-origin` - COOP protection

### 5. CORS Protection

#### Origin Validation
```typescript
const ALLOWED_ORIGINS = [
  'https://plmatches.netlify.app',
  'https://plmatches-staging.netlify.app',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
].filter(Boolean);
```

#### Preflight Handling
- Validates `Origin` header for all API requests
- Returns appropriate CORS headers only for allowed origins
- Handles OPTIONS preflight requests securely

### 6. Security Monitoring & Alerting

#### Event Logging
- All API requests logged with client identification
- Authentication failures tracked and alerted
- Rate limiting violations monitored
- Suspicious patterns detected automatically

#### Security Events
```typescript
interface SecurityEvent {
  timestamp: string;
  type: 'auth_failure' | 'rate_limit' | 'suspicious_request';
  severity: 'low' | 'medium' | 'high' | 'critical';
  clientId: string;
  endpoint: string;
  details: Record<string, any>;
}
```

#### Risk Scoring
- Client behavior analysis
- Risk score calculation (0-100)
- Automatic alerting for high-risk clients
- Pattern detection for unusual activity

### 7. Error Handling Security

#### Safe Error Responses
- Never expose internal error details
- Generic error messages for clients
- Detailed logging for administrators
- Stack traces logged server-side only

#### Error Sanitization
```typescript
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    console.error('[INTERNAL ERROR]', error.message, error.stack);
    return 'Internal server error';
  }
  return 'Unknown error occurred';
}
```

## 🔧 API Endpoint Security

### Public Endpoints (`API_KEY_READ`)
- `/api/fixtures` - Match fixtures data
- `/api/results` - Match results
- `/api/standings` - League standings

### Write Endpoints (`API_KEY_WRITE`)
- `/api/refresh` - Data refresh operations
  - Requires authentication
  - Rate limited: 5 requests/15min
  - Input validation
  - Matchweek filtering support

### Admin Endpoints (`API_KEY_ADMIN`)
- `/api/keep-alive` - Database connection maintenance
  - Requires admin authentication
  - Rate limited: 5 requests/15min
  - System-level operations only

## 🚨 Security Alerts & Monitoring

### Alert Types
1. **Authentication Failures**: High rate of failed auth attempts
2. **Rate Limit Violations**: Excessive requests from single client
3. **Suspicious Patterns**: Unusual request patterns
4. **High-Risk Clients**: Clients with elevated risk scores

### Alert Thresholds
- Auth failures/hour: 10
- Rate limit hits/hour: 50
- Requests/minute: 100
- Risk score threshold: 70

### Monitoring Dashboard
Security statistics available via:
```typescript
import { securityMonitor } from '@/lib/security-monitor';

// Get current security stats
const stats = securityMonitor.getStats();

// Get recent security events
const events = securityMonitor.getRecentEvents(50);

// Analyze client behavior
const analysis = securityMonitor.analyzeClientBehavior(clientId);
```

## 🧪 Security Testing

### Authentication Testing
```bash
# Should fail - no API key
curl https://api.example.com/api/refresh

# Should fail - insufficient permissions
curl -H "x-api-key: READ_KEY" https://api.example.com/api/refresh

# Should succeed
curl -X POST -H "x-api-key: WRITE_KEY" https://api.example.com/api/refresh
```

### Rate Limiting Testing
```bash
# Make multiple rapid requests to trigger rate limiting
for i in {1..10}; do
  curl -H "x-api-key: READ_KEY" https://api.example.com/api/fixtures
done
```

### Security Headers Testing
```bash
# Check security headers
curl -I https://api.example.com/api/fixtures
```

## 🔄 Security Maintenance

### Key Rotation
1. Generate new keys: `npm run generate-api-keys`
2. Update environment variables in Netlify dashboard
3. Deploy changes
4. Monitor for authentication failures during transition
5. Remove old keys after successful deployment

### Regular Audits
- Weekly: Review security logs
- Monthly: Rotate API keys
- Quarterly: Security assessment
- Annually: Penetration testing

### Log Analysis
```bash
# Search for security events in logs
grep "SECURITY ALERT" /path/to/logs

# Analyze authentication patterns
grep "auth_failure" /path/to/logs | jq -r '.clientId' | sort | uniq -c | sort -nr
```

## 📊 Security Metrics

### Key Metrics to Monitor
- Authentication success/failure rates
- Rate limiting hit rates
- Average response times
- Error rates by endpoint
- Client risk score distribution

### Incident Response
1. **Detection**: Security monitoring alerts
2. **Assessment**: Review event logs and client behavior
3. **Containment**: Block suspicious clients if necessary
4. **Recovery**: Rotate keys, update configurations
5. **Lessons Learned**: Update security rules and documentation

## 🎯 Security Best Practices Implemented

- ✅ **Defense in Depth**: Multiple security layers
- ✅ **Principle of Least Privilege**: Minimum required access
- ✅ **Fail-Safe Defaults**: Secure by default configuration
- ✅ **Security Logging**: Comprehensive audit trails
- ✅ **Input Validation**: All inputs validated and sanitized
- ✅ **Error Handling**: Secure error responses
- ✅ **Key Management**: Secure key generation and rotation
- ✅ **Monitoring**: Real-time security monitoring
- ✅ **Rate Limiting**: Protection against abuse
- ✅ **CORS Protection**: Origin validation
- ✅ **Security Headers**: HTTP security headers
- ✅ **Access Control**: Role-based access control

This implementation provides enterprise-grade security for your Premier League API while maintaining usability and performance.