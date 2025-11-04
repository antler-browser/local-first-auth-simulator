/**
 * IRL Browser API Types
 */

export interface BrowserDetails {
  name: string;                // e.g., "IRL Browser Simulator"
  version: string;             // e.g., "1.0.0"
  platform: "ios" | "android";
  supportedPermissions: string[];  // e.g., ["profile"]
}

export interface IRLBrowser {
  // Get profile details as signed JWT string
  getProfileDetails(): Promise<string>;

  // Get avatar as signed JWT string (or null if no avatar)
  getAvatar(): Promise<string | null>;

  // Get browser information (SYNC - not async!)
  getBrowserDetails(): BrowserDetails;

  // Request additional permissions
  requestPermission(permission: string): Promise<boolean>;

  // Close the WebView (return to QR scanner)
  close(): void;
}

/**
 * Simulator Configuration
 */

export interface SimulatorConfig {
  // Profile to use for simulation
  // Import your profile JSON in your project and pass it here
  // Example: import myProfile from './danny.profile.json'
  // Then: enableIrlBrowserSimulator({ profile: myProfile })
  profile?: Profile;  // defaults to Paul Morphy example profile

  jwtDetails?: {
    audience?: string;  // Mini-app domain (defaults to window.location.origin)
    expirationOffsetSeconds?: number;  // JWT expiration offset in seconds from now (defaults to 120)
  };

  // Browser details returned by getBrowserDetails()
  browserDetails?: {
    name?: string;  // defaults to "IRL Browser Simulator"
    version?: string;  // defaults to "1.0.0"
    platform?: 'ios' | 'android';  // defaults to "ios"
    supportedPermissions?: string[];  // defaults to ["profile"]
  };

  // Network simulation
  networkDelayMs?: number;  // Simulated network delay in milliseconds (defaults to 50)

  // UI configuration
  showDebugUI?: boolean;  // Show floating debug panel (defaults to true)
}

/**
 * Internal configuration with all required fields (used by Simulator)
 */
export interface ResolvedSimulatorConfig {
  jwtDetails: {
    audience: string;
    expirationOffsetSeconds: number;
  };
  browserDetails: {
    name: string;
    version: string;
    platform: 'ios' | 'android';
    supportedPermissions: string[];
  };
  networkDelayMs: number;
  showDebugUI: boolean;
}

/**
 * Profile Structure
 */

export interface Social {
  platform: string;
  handle: string;
}

export interface Profile {
  did: string;
  name: string;
  avatar?: string;  // Base64 data URI
  socials?: Social[];
  privateKey: string;  // ED25519 private key in hex format
}

/**
 * JWT Payload Types
 */

export interface JWTHeader {
  alg: "EdDSA";
  typ: "JWT";
}

export interface BaseJWTPayload {
  iss: string;  // Issuer DID
  aud: string;  // Audience (mini-app domain)
  iat: number;  // Issued at (Unix timestamp)
  exp: number;  // Expiration (Unix timestamp)
  type: string; // JWT type
}

export interface ProfileDetailsPayload extends BaseJWTPayload {
  type: "irl:profile:details";
  data: {
    did: string;
    name: string;
    socials?: Social[];
  };
}

export interface AvatarPayload extends BaseJWTPayload {
  type: "irl:avatar";
  data: {
    did: string;
    avatar: string;
  };
}

export interface ProfileDisconnectedPayload extends BaseJWTPayload {
  type: "irl:profile:disconnected";
  data: {
    did: string;
    name: string;
    socials?: Social[];
  };
}

export interface ErrorPayload extends BaseJWTPayload {
  type: "irl:error";
  data: {
    code: string;
    message: string;
  };
}

export type JWTPayload =
  | ProfileDetailsPayload
  | AvatarPayload
  | ProfileDisconnectedPayload
  | ErrorPayload;

/**
 * Window extension for TypeScript
 */

declare global {
  interface Window {
    irlBrowser?: IRLBrowser;
  }
}
