/**
 * Local First Auth API Types
 */

export interface AppDetails {
  name: string;                // e.g., "Local First Auth Simulator"
  version: string;             // e.g., "1.0.0"
  platform: "ios" | "android" | "browser";
  supportedPermissions: string[];  // e.g., ["profile"]
}

export interface LocalFirstAuth {
  // Get profile details as signed JWT string
  getProfileDetails(): Promise<string>;

  // Get avatar as signed JWT string (or null if no avatar)
  getAvatar(): Promise<string | null>;

  // Get app information (SYNC - not async!)
  getAppDetails(): AppDetails;

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
  profile?: Profile;  // defaults to Paul Morphy example profile

  jwtDetails?: {
    audience?: string;  // Mini-app domain (defaults to window.location.origin)
    expirationOffsetSeconds?: number;  // JWT expiration offset in seconds from now (defaults to 120)
  };

  // App details returned by getAppDetails()
  appDetails?: AppDetails

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
  appDetails: AppDetails;
  networkDelayMs: number;
  showDebugUI: boolean;
}

/**
 * Profile Structure
 */

export enum SocialPlatform {
  INSTAGRAM = 'instagram',
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok',
  X = 'x',
  BLUESKY = 'bluesky',
  FACEBOOK = 'facebook',
  LINKEDIN = 'linkedin',
  GITHUB = 'github',
  TWITCH = 'twitch',
  SNAPCHAT = 'snapchat',
  REDDIT = 'reddit',
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
  PINTEREST = 'pinterest',
  TUMBLR = 'tumblr',
  SPOTIFY = 'spotify',
  SOUNDCLOUD = 'soundcloud',
  BANDCAMP = 'bandcamp',
  PATREON = 'patreon',
  KO_FI = 'ko_fi',
  WEBSITE = 'website',
  EMAIL = 'email',
  MASTODON = 'mastodon',
}

export interface SocialLink {
  platform: SocialPlatform;
  handle: string;
}

export interface Profile {
  profileId: string;  // Short identifier for URL parameter (e.g., "alice")
  did: string;
  name: string;
  avatar?: string;  // Base64 data URI
  socials?: SocialLink[];
  privateKey: string;  // ED25519 secret key in base64 format (64 bytes: seed + public key)
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
  type: "localFirstAuth:profile:details";
  data: {
    did: string;
    name: string;
    socials?: SocialLink[];
  };
}

export interface AvatarPayload extends BaseJWTPayload {
  type: "localFirstAuth:avatar";
  data: {
    did: string;
    avatar: string;
  };
}

export interface ProfileDisconnectedPayload extends BaseJWTPayload {
  type: "localFirstAuth:profile:disconnected";
  data: {
    did: string;
    name: string;
    socials?: SocialLink[];
  };
}

export interface ErrorPayload extends BaseJWTPayload {
  type: "localFirstAuth:error";
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
    localFirstAuth?: LocalFirstAuth;
  }
}
