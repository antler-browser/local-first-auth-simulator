import * as ed25519 from '@stablelib/ed25519';
import { HKDF } from '@stablelib/hkdf';
import { SHA256 } from '@stablelib/sha256';
import { encode as base58Encode, decode as base58Decode } from 'base58-universal';
import * as base64 from 'base64-js';

/**
 * Ed25519 multicodec prefix for did:key format
 * 0xed = 237 (Ed25519 public key)
 * 0x01 = 1 (key type identifier)
 */
const ED25519_MULTICODEC_PREFIX = new Uint8Array([0xed, 0x01]);

// Key sizes
const SEED_SIZE = 32; // Ed25519 seed size in bytes
const SECRET_KEY_SIZE = 64; // Ed25519 secret key size in bytes (32-byte seed + 32-byte public key)

/**
 * HKDF salt for per-origin key derivation (normative, from the Local First Auth spec)
 */
const ORIGIN_KEY_SALT = 'local-first-auth:origin-key:v1';

/**
 * Generates a cryptographically secure random seed for key generation
 */
function generateRandomSeed(): Uint8Array {
  // Use crypto.getRandomValues in browser, or crypto.randomBytes in Node.js
  const seed = new Uint8Array(SEED_SIZE);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser environment
    crypto.getRandomValues(seed);
  } else if (typeof require !== 'undefined') {
    // Node.js environment
    const nodeCrypto = require('crypto');
    const randomBytes = nodeCrypto.randomBytes(SEED_SIZE);
    seed.set(randomBytes);
  } else {
    throw new Error('No secure random number generator available');
  }

  return seed;
}

/**
 * Generate a new Ed25519 keypair
 * @returns Object containing privateKey (base64 string, 64 bytes) and publicKey (Uint8Array, 32 bytes)
 */
async function generateKeyPair(): Promise<{
  privateKey: string;
  publicKey: Uint8Array;
}> {
  // Generate random seed (32 bytes)
  const seed = generateRandomSeed();

  // Generate keypair from seed
  const keyPair = ed25519.generateKeyPairFromSeed(seed);

  // Ed25519 secretKey is 64 bytes (includes 32-byte seed + 32-byte public key)
  // Encode as base64 for storage (matching Antler app format)
  const privateKey = base64.fromByteArray(keyPair.secretKey);

  return {
    privateKey,
    publicKey: keyPair.publicKey
  };
}

/**
 * Create a did:key DID from an Ed25519 public key
 * @param publicKey - The Ed25519 public key as Uint8Array
 * @returns The did:key formatted DID string
 */
function createDidFromPublicKey(publicKey: Uint8Array): string {
  // Prepend multicodec prefix to public key
  const multicodecKey = new Uint8Array(ED25519_MULTICODEC_PREFIX.length + publicKey.length);
  multicodecKey.set(ED25519_MULTICODEC_PREFIX);
  multicodecKey.set(publicKey, ED25519_MULTICODEC_PREFIX.length);

  // Base58 encode and prepend 'z' for base58btc multibase encoding
  const encoded = base58Encode(multicodecKey);

  // Return did:key format (z prefix indicates base58btc encoding)
  return `did:key:z${encoded}`;
}

/**
 * Generate a complete profile with Ed25519 keypair and DID
 * @returns Object containing privateKey (base64) and did (string)
 */
export async function generateProfileKeys(): Promise<{
  privateKey: string;
  did: string;
}> {
  const { privateKey, publicKey } = await generateKeyPair();
  const did = createDidFromPublicKey(publicKey);

  return {
    privateKey,
    did
  };
}

/**
 * Per-origin keypair derived from a profile's root key
 */
export interface OriginKeys {
  privateKey: string;    // base64-encoded 64-byte Ed25519 secret key (per-origin)
  publicKey: Uint8Array; // 32-byte Ed25519 public key
  did: string;           // per-origin did:key
}

/**
 * Normalize a value to a WHATWG origin (scheme://host[:port], lowercase,
 * default ports omitted). Returns the input unchanged (with a warning) if it
 * cannot be parsed as a URL.
 */
export function normalizeOrigin(value: string): string {
  try {
    const origin = new URL(value).origin;
    if (origin === 'null') {
      console.warn(`[Local First Auth Simulator] Audience "${value}" has an opaque origin; using it as-is for key derivation`);
      return value;
    }
    return origin;
  } catch {
    console.warn(`[Local First Auth Simulator] Audience "${value}" is not a valid URL; using it as-is for key derivation`);
    return value;
  }
}

/**
 * Derive the per-origin Ed25519 keypair and DID for an origin, per the
 * Local First Auth spec ("Privacy: Per-Origin Key Derivation"):
 *
 *   originSeed = HKDF-SHA256(
 *     ikm  = rootSeed,  // first 32 bytes of the 64-byte secret key
 *     salt = "local-first-auth:origin-key:v1",
 *     info = origin,
 *     length = 32
 *   )
 *
 * @param rootPrivateKey - The profile's root secret key (base64, 64 bytes)
 * @param origin - The WHATWG origin of the mini app (e.g. "https://example.com")
 */
export function deriveOriginKeys(rootPrivateKey: string, origin: string): OriginKeys {
  const rootKeyBytes = base64.toByteArray(rootPrivateKey);

  if (rootKeyBytes.length !== SECRET_KEY_SIZE) {
    throw new Error(`Invalid private key length: ${rootKeyBytes.length} bytes (expected ${SECRET_KEY_SIZE})`);
  }

  const rootSeed = rootKeyBytes.slice(0, SEED_SIZE);
  const encoder = new TextEncoder();

  const originSeed = new HKDF(
    SHA256,
    rootSeed,
    encoder.encode(ORIGIN_KEY_SALT),
    encoder.encode(origin)
  ).expand(SEED_SIZE);

  const keyPair = ed25519.generateKeyPairFromSeed(originSeed);

  return {
    privateKey: base64.fromByteArray(keyPair.secretKey),
    publicKey: keyPair.publicKey,
    did: createDidFromPublicKey(keyPair.publicKey)
  };
}
