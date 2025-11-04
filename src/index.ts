/**
 * IRL Browser Simulator
 * Development tool for testing IRL Browser mini-apps
 */

export { Simulator } from './simulator';
export { MockIrlBrowser } from './api';
export { createJWT, decodeJWT } from './jwt';
export { generateProfileKeys } from './keyUtils';
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

/**
 * Quick start - zero config
 * Enable the IRL Browser simulator with default settings
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
 */
export function enableIrlBrowserSimulator(config?: Partial<SimulatorConfig>): Simulator {
  return new Simulator(config);
}
