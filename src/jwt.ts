import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import type { Profile, JWTPayload, JWTHeader } from './types';

// Initialize SHA-512 for ed25519 signing
// @noble/ed25519 v2.x requires manual SHA-512 setup
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));
ed.etc.sha512Async = async (...m) => sha512(ed.etc.concatBytes(...m));

/**
 * Base64URL encoding helper
 */
function base64UrlEncode(data: string): string {
  if (typeof btoa === 'undefined') {
    // Node.js environment
    return Buffer.from(data)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  // Browser environment
  return btoa(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64URL decoding helper
 */
function base64UrlDecode(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  if (typeof atob === 'undefined') {
    // Node.js environment
    return Buffer.from(base64, 'base64').toString();
  }
  // Browser environment
  return atob(base64);
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Sign a message with ED25519 private key
 */
async function signMessage(message: string, privateKeyHex: string): Promise<string> {
  // Convert private key from hex to Uint8Array
  const privateKeyBytes = hexToBytes(privateKeyHex);

  // Sign the message
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = await ed.sign(messageBytes, privateKeyBytes);

  // Convert signature to base64url
  const signatureString = String.fromCharCode(...signatureBytes);
  return base64UrlEncode(signatureString);
}

/**
 * Create and sign a JWT
 */
export async function createJWT(payload: JWTPayload, profile: Profile): Promise<string> {
  const header: JWTHeader = {
    alg: "EdDSA",
    typ: "JWT"
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  // Sign the message using the profile's private key
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = await signMessage(message, profile.privateKey);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Decode a JWT (for debugging - does NOT verify signature)
 */
export function decodeJWT(jwt: string): { header: JWTHeader; payload: JWTPayload; signature: string } {
  const [encodedHeader, encodedPayload, signature] = jwt.split('.');

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Invalid JWT format');
  }

  const header = JSON.parse(base64UrlDecode(encodedHeader)) as JWTHeader;
  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;

  return { header, payload, signature };
}
