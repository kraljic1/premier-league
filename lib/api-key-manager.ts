/**
 * Automated API Key Management and Rotation System
 * Handles key generation, rotation, validation, and lifecycle management
 */

import { securityMonitor } from './security-monitor';

export interface ApiKeyMetadata {
  key: string;
  level: 'read' | 'write' | 'admin';
  createdAt: Date;
  expiresAt: Date;
  lastUsed?: Date;
  usageCount: number;
  isActive: boolean;
  rotatedFrom?: string; // Reference to previous key in rotation chain
  rotationGracePeriod?: Date; // When old key becomes invalid
}

interface KeyRotationConfig {
  rotationIntervalDays: number;
  gracePeriodHours: number;
  maxKeysPerLevel: number;
  enableAutoRotation: boolean;
}

class ApiKeyManager {
  private keys: Map<string, ApiKeyMetadata> = new Map();
  private rotationConfig: KeyRotationConfig;
  private rotationInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<KeyRotationConfig> = {}) {
    this.rotationConfig = {
      rotationIntervalDays: 30, // Rotate keys every 30 days
      gracePeriodHours: 24, // 24 hours grace period for old keys
      maxKeysPerLevel: 3, // Keep max 3 keys per level (current + 2 old)
      enableAutoRotation: true,
      ...config
    };

    this.loadKeysFromEnvironment();
    this.startRotationScheduler();
  }

  /**
   * Load API keys from environment variables
   */
  private loadKeysFromEnvironment() {
    const levels: Array<'read' | 'write' | 'admin'> = ['read', 'write', 'admin'];

    levels.forEach(level => {
      const envKey = `API_KEY_${level.toUpperCase()}`;
      const keyValue = process.env[envKey];

      if (keyValue) {
        // Create metadata for existing keys
        const metadata: ApiKeyMetadata = {
          key: keyValue,
          level,
          createdAt: new Date(), // Assume current keys were created now
          expiresAt: new Date(Date.now() + (this.rotationConfig.rotationIntervalDays * 24 * 60 * 60 * 1000)),
          usageCount: 0,
          isActive: true
        };

        this.keys.set(keyValue, metadata);
      }
    });
  }

  /**
   * Generate a new secure API key
   */
  private generateSecureKey(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    // Use crypto.getRandomValues for better randomness
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      result += chars.charAt(array[i] % chars.length);
    }

    return result;
  }

  /**
   * Rotate keys for a specific level
   */
  async rotateKeysForLevel(level: 'read' | 'write' | 'admin'): Promise<string> {
    const currentKeys = Array.from(this.keys.values())
      .filter(k => k.level === level && k.isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Generate new key
    const newKey = this.generateSecureKey();
    const now = new Date();

    const newKeyMetadata: ApiKeyMetadata = {
      key: newKey,
      level,
      createdAt: now,
      expiresAt: new Date(now.getTime() + (this.rotationConfig.rotationIntervalDays * 24 * 60 * 60 * 1000)),
      usageCount: 0,
      isActive: true,
      rotatedFrom: currentKeys[0]?.key,
      rotationGracePeriod: currentKeys[0] ? new Date(now.getTime() + (this.rotationConfig.gracePeriodHours * 60 * 60 * 1000)) : undefined
    };

    // Add new key
    this.keys.set(newKey, newKeyMetadata);

    // Mark old keys for eventual deactivation
    currentKeys.forEach((oldKey, index) => {
      if (index >= this.rotationConfig.maxKeysPerLevel - 1) {
        // Deactivate oldest keys beyond our limit
        oldKey.isActive = false;
      }
    });

    // Log rotation event
    securityMonitor.logEvent({
      type: 'unusual_pattern',
      severity: 'medium',
      clientId: 'system',
      endpoint: '/api/key-rotation',
      details: {
        action: 'key_rotated',
        level,
        newKeyId: newKey.substring(0, 8) + '...',
        oldKeyCount: currentKeys.length
      }
    });

    console.log(`[API Key Manager] Rotated ${level} key. New key: ${newKey.substring(0, 8)}...`);

    return newKey;
  }

  /**
   * Validate API key and update usage statistics
   */
  validateKey(key: string): { valid: true; level: 'read' | 'write' | 'admin' } | { valid: false; error: string } {
    const metadata = this.keys.get(key);

    if (!metadata) {
      return { valid: false, error: 'Invalid API key' };
    }

    if (!metadata.isActive) {
      return { valid: false, error: 'API key has been deactivated' };
    }

    // Check if key has expired
    if (new Date() > metadata.expiresAt) {
      // Check if we're still in grace period
      if (metadata.rotationGracePeriod && new Date() <= metadata.rotationGracePeriod) {
        // Allow usage but log warning
        securityMonitor.logEvent({
          type: 'unusual_pattern',
          severity: 'low',
          clientId: 'system',
          endpoint: '/api/key-validation',
          details: {
            action: 'expired_key_grace_period',
            keyId: key.substring(0, 8) + '...',
            level: metadata.level
          }
        });
      } else {
        metadata.isActive = false;
        return { valid: false, error: 'API key has expired' };
      }
    }

    // Update usage statistics
    metadata.usageCount++;
    metadata.lastUsed = new Date();

    return { valid: true, level: metadata.level };
  }

  /**
   * Get key statistics for monitoring
   */
  getKeyStatistics(): Record<string, any> {
    const stats = {
      totalKeys: this.keys.size,
      activeKeys: Array.from(this.keys.values()).filter(k => k.isActive).length,
      expiredKeys: Array.from(this.keys.values()).filter(k => !k.isActive).length,
      keysByLevel: {} as Record<string, number>,
      averageUsage: 0,
      oldestKey: null as Date | null,
      newestKey: null as Date | null
    };

    const activeKeys = Array.from(this.keys.values()).filter(k => k.isActive);
    const totalUsage = activeKeys.reduce((sum, k) => sum + k.usageCount, 0);

    stats.averageUsage = activeKeys.length > 0 ? totalUsage / activeKeys.length : 0;

    // Group by level
    activeKeys.forEach(key => {
      stats.keysByLevel[key.level] = (stats.keysByLevel[key.level] || 0) + 1;
    });

    // Find oldest and newest
    if (activeKeys.length > 0) {
      const sortedByAge = activeKeys.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      stats.oldestKey = sortedByAge[0].createdAt;
      stats.newestKey = sortedByAge[sortedByAge.length - 1].createdAt;
    }

    return stats;
  }

  /**
   * Start automatic rotation scheduler
   */
  private startRotationScheduler() {
    if (!this.rotationConfig.enableAutoRotation) return;

    // Check for rotation every 24 hours
    this.rotationInterval = setInterval(async () => {
      await this.checkAndRotateKeys();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Check which keys need rotation and rotate them
   */
  private async checkAndRotateKeys(): Promise<void> {
    const now = new Date();
    const levelsToRotate: Array<'read' | 'write' | 'admin'> = [];

    // Check each level for keys that need rotation
    (['read', 'write', 'admin'] as const).forEach(level => {
      const levelKeys = Array.from(this.keys.values())
        .filter(k => k.level === level && k.isActive);

      if (levelKeys.length === 0) return;

      // Check if any key is close to expiration (within 7 days)
      const needsRotation = levelKeys.some(key => {
        const daysUntilExpiration = (key.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
        return daysUntilExpiration <= 7;
      });

      if (needsRotation) {
        levelsToRotate.push(level);
      }
    });

    // Rotate keys that need it
    for (const level of levelsToRotate) {
      try {
        await this.rotateKeysForLevel(level);
      } catch (error) {
        console.error(`[API Key Manager] Failed to rotate ${level} keys:`, error);
      }
    }
  }

  /**
   * Cleanup old/inactive keys
   */
  cleanupOldKeys(): void {
    const now = new Date();
    const keysToRemove: string[] = [];

    this.keys.forEach((metadata, key) => {
      // Remove keys that are inactive and grace period has expired
      if (!metadata.isActive) {
        const graceExpired = !metadata.rotationGracePeriod || now > metadata.rotationGracePeriod;
        if (graceExpired) {
          keysToRemove.push(key);
        }
      }

      // Remove very old inactive keys (older than 90 days)
      if (!metadata.isActive && (now.getTime() - metadata.createdAt.getTime()) > (90 * 24 * 60 * 60 * 1000)) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => {
      this.keys.delete(key);
    });

    if (keysToRemove.length > 0) {
      console.log(`[API Key Manager] Cleaned up ${keysToRemove.length} old keys`);
    }
  }

  /**
   * Stop the rotation scheduler
   */
  stopRotation(): void {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
  }
}

// Global API key manager instance
export const apiKeyManager = new ApiKeyManager();

// Cleanup old keys every 7 days
setInterval(() => {
  apiKeyManager.cleanupOldKeys();
}, 7 * 24 * 60 * 60 * 1000);