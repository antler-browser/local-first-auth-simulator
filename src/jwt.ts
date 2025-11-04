import * as ed25519 from '@stablelib/ed25519';
import * as base64 from 'base64-js';
import type { Profile, JWTPayload, JWTHeader } from './types';

/**
 * Helper function to encode to base64url (RFC 4648)
 * Converts standard base64 to base64url by replacing + with -, / with _, and removing padding =
 */
const base64url = {
  encode: (input: Uint8Array): string => {
    const base64String = base64.fromByteArray(input);
    return base64String
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  },

  decode: (input: string): Uint8Array => {
    // Convert base64url back to base64
    let base64String = input
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Add padding if needed
    const padding = (4 - (base64String.length % 4)) % 4;
    base64String += '='.repeat(padding);

    return base64.toByteArray(base64String);
  }
};

/**
 * Create and sign a JWT using Ed25519
 * Matches the Antler IRL Browser app implementation
 *
 * @param payload - JWT payload containing claims
 * @param profile - Profile with privateKey (base64-encoded 64-byte secret key)
 * @returns Signed JWT string
 */
export async function createJWT(payload: JWTPayload, profile: Profile): Promise<string> {
  // Decode the private key from base64
  const privateKeyBytes = base64.toByteArray(profile.privateKey);

  // Ed25519 secret key is 64 bytes (32-byte seed + 32-byte public key)
  if (privateKeyBytes.length !== 64) {
    throw new Error('Invalid private key length. Expected 64 bytes.');
  }

  // Build JWT header
  const header: JWTHeader = {
    alg: 'EdDSA',
    typ: 'JWT',
  };

  // Encode header and payload as base64url
  const headerB64 = base64url.encode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64url.encode(new TextEncoder().encode(JSON.stringify(payload)));

  // Create signing input: "header.payload"
  const signingInput = `${headerB64}.${payloadB64}`;
  const signingInputBytes = new TextEncoder().encode(signingInput);

  // Sign with Ed25519
  const signature = ed25519.sign(privateKeyBytes, signingInputBytes);

  // Encode signature as base64url
  const signatureB64 = base64url.encode(signature);

  // Return complete JWT: "header.payload.signature"
  return `${signingInput}.${signatureB64}`;
}

/**
 * Decode a JWT (for debugging - does NOT verify signature)
 * Use verifyJWT() to verify the signature
 */
export function decodeJWT(jwt: string): { header: JWTHeader; payload: JWTPayload; signature: string } {
  const parts = jwt.split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid JWT format. Expected 3 parts separated by dots.');
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Invalid JWT format: missing parts');
  }

  // Decode header and payload
  const headerBytes = base64url.decode(encodedHeader);
  const payloadBytes = base64url.decode(encodedPayload);

  const header = JSON.parse(new TextDecoder().decode(headerBytes)) as JWTHeader;
  const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as JWTPayload;

  return { header, payload, signature };
}

/**
 * Verify a JWT signature using the public key from the DID
 *
 * @param jwt - The JWT string to verify
 * @param publicKey - The Ed25519 public key (32 bytes) to verify against
 * @returns true if signature is valid, false otherwise
 */
export function verifyJWT(jwt: string, publicKey: Uint8Array): boolean {
  try {
    const parts = jwt.split('.');

    if (parts.length !== 3) {
      return false;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    // Reconstruct the signing input
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signingInputBytes = new TextEncoder().encode(signingInput);

    // Decode the signature
    const signatureBytes = base64url.decode(encodedSignature);

    // Verify the signature
    return ed25519.verify(publicKey, signingInputBytes, signatureBytes);
  } catch (error) {
    console.error('JWT verification error:', error);
    return false;
  }
}
