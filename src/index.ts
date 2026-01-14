/**
 * Local First Auth Simulator
 * Development tool for testing Local First Auth mini-apps
 */

export { Simulator } from './simulator';
export { MockLocalFirstAuth } from './api';
export { createJWT, decodeJWT, verifyJWT } from './jwt';
export { generateProfileKeys } from './keyUtils';
export { PRESET_PROFILES, getProfileById, getProfileIds, getDefaultProfile } from './profiles';
export { buildUrlWithProfile, getProfileIdFromUrl, hasProfileInUrl } from './urlUtils';
export type { ProfileId } from './profiles';
export type {
  SimulatorConfig,
  LocalFirstAuth,
  AppDetails,
  Profile,
  SocialLink,
  JWTPayload,
  ProfileDetailsPayload,
  AvatarPayload,
  ProfileDisconnectedPayload,
  ErrorPayload
} from './types';
export { SocialPlatform } from './types';

import { Simulator } from './simulator';
import type { SimulatorConfig } from './types';
import { getProfileIdFromUrl } from './urlUtils';
import { getProfileById } from './profiles';

/**
 * Quick start - zero config
 * Enable the Local First Auth simulator with default settings
 *
 * Automatically detects profile from URL parameter (?test_profile=alice)
 * Falls back to Paul (default) if no URL parameter is present
 *
 * @param config - Optional configuration to customize the simulator
 * @returns The simulator instance
 *
 * @example
 * ```typescript
 * import { enableLocalFirstAuthSimulator } from 'local-first-auth-simulator';
 *
 * if (process.env.NODE_ENV === 'development') {
 *   enableLocalFirstAuthSimulator();
 * }
 * ```
 *
 * @example Multi-user testing
 * ```typescript
 * // Open http://localhost:3000?test_profile=alice in one tab
 * // Open http://localhost:3000?test_profile=bob in another tab
 * // Each tab will simulate a different user
 * ```
 */
export function enableLocalFirstAuthSimulator(config?: Partial<SimulatorConfig>): Simulator {
  // URL parameter takes precedence over config for multi-user testing
  const profileId = getProfileIdFromUrl();
  if (profileId) {
    const profile = getProfileById(profileId);
    if (profile) {
      config = { ...config, profile };
      console.log(`[Local First Auth Simulator] Using profile from URL: ${profile.name} (${profileId})`);
    } else {
      console.warn(`[Local First Auth Simulator] Profile ID "${profileId}" not found. Using ${config?.profile ? 'config' : 'default'} profile.`);
    }
  } else if (config?.profile) {
    console.log(`[Local First Auth Simulator] Using profile from config: ${config.profile.name}`);
  }

  return new Simulator(config);
}
