import type { IRLBrowser, BrowserDetails } from './types';
import type { Simulator } from './simulator';

/**
 * Mock implementation of the IRL Browser API
 */
export class MockIrlBrowser implements IRLBrowser {
  constructor(private simulator: Simulator) {}

  async getProfileDetails(): Promise<string> {
    console.log('[IRL Browser Simulator] getProfileDetails() called');

    // Get current profile first
    const profile = this.simulator.getCurrentProfile();

    const payload = {
      iss: profile.did,
      aud: this.simulator.config.jwtDetails?.audience || window.location.origin,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (this.simulator.config.jwtDetails?.expirationOffsetSeconds || 120),
      type: 'irl:profile:details' as const,
      data: {
        did: profile.did,
        name: profile.name,
        socials: profile.socials
      }
    };

    const jwt = await this.simulator.createJWT(payload, profile);

    // Simulate network delay
    await this.simulator.delay();

    return jwt;
  }

  async getAvatar(): Promise<string | null> {
    console.log('[IRL Browser Simulator] getAvatar() called');

    const profile = this.simulator.getCurrentProfile();

    // Return null if no avatar
    if (!profile.avatar) {
      await this.simulator.delay();
      return null;
    }

    const payload = {
      iss: profile.did,
      aud: this.simulator.config.jwtDetails?.audience || window.location.origin,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (this.simulator.config.jwtDetails?.expirationOffsetSeconds || 120),
      type: 'irl:avatar' as const,
      data: {
        did: profile.did,
        avatar: profile.avatar
      }
    };

    const jwt = await this.simulator.createJWT(payload, profile);

    await this.simulator.delay();

    return jwt;
  }

  getBrowserDetails(): BrowserDetails {
    return {
      name: this.simulator.config.browserDetails?.name || 'IRL Browser Simulator',
      version: this.simulator.config.browserDetails?.version || '1.0.0',
      platform: this.simulator.config.browserDetails?.platform || 'ios',
      supportedPermissions: this.simulator.config.browserDetails?.supportedPermissions || ['profile']
    };
  }

  async requestPermission(permission: string): Promise<boolean> {
    console.log(`[IRL Browser Simulator] requestPermission("${permission}") called`);

    // 1. Check if permission is in manifest
    const manifestPermissions = this.simulator.getManifestPermissions();

    if (!manifestPermissions.includes(permission)) {
      // Send error via postMessage
      this.simulator.sendError('PERMISSION_NOT_DECLARED', `Permission "${permission}" not in manifest`);
      return false;
    }

    // 2. Check if already granted/denied
    const currentState = this.simulator.getPermissionState(permission);
    if (currentState === 'granted') return true;
    if (currentState === 'denied') return false;

    // 3. Show prompt based on config
    const granted = await this.simulator.showPermissionPrompt(permission);

    this.simulator.setPermissionState(permission, granted ? 'granted' : 'denied');

    return granted;
  }

  close(): void {
    console.log('[IRL Browser Simulator] close() called');

    // Send disconnect message
    this.simulator.sendDisconnectMessage();

    alert('[IRL Browser Simulator]\n\nWebView would close here (returning to QR scanner)');
  }
}
