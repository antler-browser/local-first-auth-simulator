import type { SimulatorConfig, ResolvedSimulatorConfig, Profile, JWTPayload } from './types';
import { createJWT } from './jwt';
import { MockLocalFirstAuth } from './api';
import { createDebugUI } from './ui';
import { getDefaultProfile } from './profiles';

/**
 * Core Simulator class
 */
export class Simulator {
  public config: ResolvedSimulatorConfig;
  private profile: Profile;
  private permissionStates: Map<string, 'granted' | 'denied'> = new Map();

  constructor(config: Partial<SimulatorConfig> = {}) {
    // Load profile first (before merging config)
    this.profile = this.loadProfile(config);

    // Merge with defaults
    this.config = this.mergeWithDefaults(config);

    // Inject window.localFirstAuth API
    if (typeof window !== 'undefined') {
      window.localFirstAuth = new MockLocalFirstAuth(this);
    }

    // Show debug UI if enabled
    if (this.config.showDebugUI && typeof document !== 'undefined') {
      createDebugUI(this);
    }

    // Log initialization
    console.log('[Local First Auth Simulator] Started with profile:', this.profile.name);
    console.log('[Local First Auth Simulator] DID:', this.profile.did);
  }

  getCurrentProfile(): Profile {
    return this.profile;
  }

  async createJWT(payload: JWTPayload, profile: Profile): Promise<string> {
    return createJWT(payload, profile);
  }

  async delay(): Promise<void> {
    return new Promise(resolve =>
      setTimeout(resolve, this.config.networkDelayMs)
    );
  }

  getManifestPermissions(): string[] {
    // For simulator, return all supported permissions
    // Real implementation would parse local-first-auth-manifest.json
    return this.config.appDetails.supportedPermissions;
  }

  getPermissionState(permission: string): 'granted' | 'denied' | undefined {
    return this.permissionStates.get(permission);
  }

  setPermissionState(permission: string, state: 'granted' | 'denied'): void {
    this.permissionStates.set(permission, state);
  }

  async showPermissionPrompt(permission: string): Promise<boolean> {
    // Show browser confirm dialog
    return confirm(
      `[Local First Auth Simulator]\n\n` +
      `Grant "${permission}" permission?\n\n` +
      `(This would show a native permission dialog in the real Local First Auth app)`
    );
  }

  sendError(code: string, message: string): void {
    const payload: JWTPayload = {
      iss: this.profile.did,
      aud: this.config.jwtDetails.audience,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.config.jwtDetails.expirationOffsetSeconds,
      type: 'localFirstAuth:error',
      data: { code, message }
    };

    this.createJWT(payload, this.profile).then(jwt => {
      window.postMessage({ jwt }, window.location.origin);
    });
  }

  sendDisconnectMessage(): void {
    const payload: JWTPayload = {
      iss: this.profile.did,
      aud: this.config.jwtDetails.audience,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.config.jwtDetails.expirationOffsetSeconds,
      type: 'localFirstAuth:profile:disconnected',
      data: {
        did: this.profile.did,
        name: this.profile.name,
        socials: this.profile.socials
      }
    };

    this.createJWT(payload, this.profile).then(jwt => {
      window.postMessage({ jwt }, window.location.origin);
    });
  }

  private mergeWithDefaults(config: Partial<SimulatorConfig>): ResolvedSimulatorConfig {
    return {
      jwtDetails: {
        audience: config.jwtDetails?.audience || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost'),
        expirationOffsetSeconds: config.jwtDetails?.expirationOffsetSeconds ?? 120
      },
      appDetails: {
        name: config.appDetails?.name || 'Local First Auth Simulator',
        version: config.appDetails?.version || '1.0.0',
        platform: config.appDetails?.platform || 'ios',
        supportedPermissions: config.appDetails?.supportedPermissions || ['profile']
      },
      networkDelayMs: config.networkDelayMs ?? 50,
      showDebugUI: config.showDebugUI ?? true
    };
  }

  private loadProfile(config: Partial<SimulatorConfig>): Profile {
    // If user provided a profile object, use it
    if (config.profile) {
      console.log('[Local First Auth Simulator] Using custom profile:', config.profile.name);
      return config.profile;
    }

    // Otherwise, use the default profile from profiles.ts
    const defaultProfile = getDefaultProfile();
    console.log('[Local First Auth Simulator] Using default profile:', defaultProfile.name);
    return defaultProfile;
  }
}
