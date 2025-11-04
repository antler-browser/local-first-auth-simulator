/**
 * IRL Browser Simulator
 * Development tool for testing IRL Browser mini-apps
 */

export { Simulator } from './simulator';
export { MockIrlBrowser } from './api';
export { createJWT, decodeJWT, verifyJWT } from './jwt';
export { generateProfileKeys } from './keyUtils';
export { PRESET_PROFILES, getProfileById, getProfileIds, getDefaultProfile } from './profiles';
export { buildUrlWithProfile, getProfileIdFromUrl, hasProfileInUrl } from './urlUtils';
export type { ProfileId } from './profiles';
export type {
  SimulatorConfig,
  IRLBrowser,
  BrowserDetails,
  Profile,
  Social,
  JWTPayload,
  ProfileDetailsPayload,
  AvatarPayload,
  ProfileDisconnectedPayload,
  ErrorPayload
} from './types';

import { Simulator } from './simulator';
import type { SimulatorConfig } from './types';
import { getProfileIdFromUrl } from './urlUtils';
import { getProfileById } from './profiles';

/**
 * Quick start - zero config
 * Enable the IRL Browser simulator with default settings
 *
 * Automatically detects profile from URL parameter (?irlProfile=alice)
 * Falls back to Paul (default) if no URL parameter is present
 *
 * @param config - Optional configuration to customize the simulator
 * @returns The simulator instance
 *
 * @example
 * ```typescript
 * import { enableIrlBrowserSimulator } from 'irl-browser-simulator';
 *
 * if (process.env.NODE_ENV === 'development') {
 *   enableIrlBrowserSimulator();
 * }
 * ```
 *
 * @example Multi-user testing
 * ```typescript
 * // Open http://localhost:3000?irlProfile=alice in one tab
 * // Open http://localhost:3000?irlProfile=bob in another tab
 * // Each tab will simulate a different user
 * ```
 */
export function enableIrlBrowserSimulator(config?: Partial<SimulatorConfig>): Simulator {
  // URL parameter takes precedence over config for multi-user testing
  const profileId = getProfileIdFromUrl();
  if (profileId) {
    const profile = getProfileById(profileId);
    if (profile) {
      config = { ...config, profile };
      console.log(`[IRL Browser Simulator] Using profile from URL: ${profile.name} (${profileId})`);
    } else {
      console.warn(`[IRL Browser Simulator] Profile ID "${profileId}" not found. Using ${config?.profile ? 'config' : 'default'} profile.`);
    }
  } else if (config?.profile) {
    console.log(`[IRL Browser Simulator] Using profile from config: ${config.profile.name}`);
  }

  return new Simulator(config);
}
