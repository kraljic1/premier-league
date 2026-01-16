/**
 * Security Monitoring and Alerting System
 * Monitors API usage patterns and alerts on suspicious activity
 */

interface SecurityEvent {
  timestamp: string;
  type: 'auth_failure' | 'rate_limit' | 'suspicious_request' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  clientId: string;
  endpoint: string;
  details: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

interface SecurityStats {
  totalRequests: number;
  authFailures: number;
  rateLimitHits: number;
  uniqueClients: number;
  timeWindow: string;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private stats: SecurityStats;
  private readonly maxEvents = 1000; // Keep last 1000 events
  private readonly alertThresholds = {
    authFailuresPerHour: 10,
    rateLimitHitsPerHour: 50,
    requestsPerMinute: 100
  };

  constructor() {
    this.stats = this.initializeStats();
    // Reset stats every hour
    setInterval(() => {
      this.stats = this.initializeStats();
    }, 60 * 60 * 1000);
  }

  private initializeStats(): SecurityStats {
    return {
      totalRequests: 0,
      authFailures: 0,
      rateLimitHits: 0,
      uniqueClients: 0,
      timeWindow: new Date().toISOString()
    };
  }

  /**
   * Log a security event
   */
  logEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.events.push(securityEvent);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Update stats
    this.stats.totalRequests++;

    if (event.type === 'auth_failure') {
      this.stats.authFailures++;
    } else if (event.type === 'rate_limit') {
      this.stats.rateLimitHits++;
    }

    // Check for alerts
    this.checkAlerts(securityEvent);

    // Log critical events immediately
    if (event.severity === 'critical') {
      console.error('[SECURITY ALERT - CRITICAL]', JSON.stringify(securityEvent));
    } else if (event.severity === 'high') {
      console.warn('[SECURITY ALERT - HIGH]', JSON.stringify(securityEvent));
    }
  }

  /**
   * Check if current activity triggers alerts
   */
  private checkAlerts(event: SecurityEvent) {
    // Auth failure rate alert
    if (event.type === 'auth_failure' && this.stats.authFailures >= this.alertThresholds.authFailuresPerHour) {
      this.alert('High authentication failure rate detected', {
        failures: this.stats.authFailures,
        timeWindow: this.stats.timeWindow
      });
    }

    // Rate limit alert
    if (event.type === 'rate_limit' && this.stats.rateLimitHits >= this.alertThresholds.rateLimitHitsPerHour) {
      this.alert('High rate limiting activity detected', {
        hits: this.stats.rateLimitHits,
        timeWindow: this.stats.timeWindow
      });
    }

    // Suspicious patterns
    if (event.type === 'suspicious_request') {
      this.alert('Suspicious request pattern detected', event.details);
    }
  }

  /**
   * Trigger security alert
   */
  private alert(message: string, details: Record<string, any>) {
    const alertData = {
      timestamp: new Date().toISOString(),
      message,
      details,
      stats: { ...this.stats }
    };

    console.error('[🚨 SECURITY ALERT]', JSON.stringify(alertData, null, 2));

    // In production, this would send alerts to:
    // - Email/SMS notifications
    // - Slack/Discord webhooks
    // - Security monitoring services (DataDog, Sentry, etc.)
    // - SIEM systems
  }

  /**
   * Get security statistics
   */
  getStats(): SecurityStats {
    return { ...this.stats };
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit = 50): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Analyze client behavior patterns
   */
  analyzeClientBehavior(clientId: string): {
    totalRequests: number;
    authFailures: number;
    rateLimitHits: number;
    riskScore: number;
    lastActivity: string;
  } {
    const clientEvents = this.events.filter(e => e.clientId === clientId);
    const recentEvents = clientEvents.filter(e =>
      new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    const analysis = {
      totalRequests: clientEvents.length,
      authFailures: clientEvents.filter(e => e.type === 'auth_failure').length,
      rateLimitHits: clientEvents.filter(e => e.type === 'rate_limit').length,
      lastActivity: clientEvents.length > 0 ?
        clientEvents[clientEvents.length - 1].timestamp : 'never'
    };

    // Calculate risk score (0-100)
    const riskScore = Math.min(100,
      (analysis.authFailures * 20) +
      (analysis.rateLimitHits * 10) +
      (recentEvents.length > 100 ? 30 : 0) // High volume
    );

    return { ...analysis, riskScore };
  }

  /**
   * Detect unusual patterns
   */
  detectUnusualPatterns(request: Request, clientId: string) {
    const clientAnalysis = this.analyzeClientBehavior(clientId);

    // High risk indicators
    if (clientAnalysis.riskScore > 70) {
      this.logEvent({
        type: 'suspicious_request',
        severity: 'high',
        clientId,
        endpoint: new URL(request.url).pathname,
        details: {
          riskScore: clientAnalysis.riskScore,
          reason: 'High risk score based on behavior patterns'
        }
      });
    }

    // Rapid auth failures
    const recentAuthFailures = this.events
      .filter(e => e.clientId === clientId && e.type === 'auth_failure')
      .filter(e => new Date(e.timestamp) > new Date(Date.now() - 5 * 60 * 1000)) // Last 5 minutes
      .length;

    if (recentAuthFailures >= 3) {
      this.logEvent({
        type: 'unusual_pattern',
        severity: 'medium',
        clientId,
        endpoint: new URL(request.url).pathname,
        details: {
          pattern: 'rapid_auth_failures',
          count: recentAuthFailures,
          timeWindow: '5 minutes'
        }
      });
    }
  }
}

// Global security monitor instance
export const securityMonitor = new SecurityMonitor();

/**
 * Security monitoring middleware helper
 */
export function monitorSecurity(request: Request, clientId: string) {
  securityMonitor.detectUnusualPatterns(request, clientId);
}