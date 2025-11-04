import * as ed from '@noble/ed25519';
import { encode as base58Encode } from 'base58-universal';

/**
 * Ed25519 multicodec prefix for did:key format
 * 0xed = 237 (Ed25519 public key)
 * 0x01 = 1 (key type identifier)
 */
const ED25519_MULTICODEC_PREFIX = new Uint8Array([0xed, 0x01]);

/**
 * Generate a new Ed25519 keypair
 * @returns Object containing privateKey (hex string) and publicKey (Uint8Array)
 */
export async function generateKeyPair(): Promise<{
  privateKey: string;
  publicKey: Uint8Array;
}> {
  // Generate random private key (32 bytes)
  const privateKeyBytes = ed.utils.randomPrivateKey();

  // Derive public key from private key
  const publicKeyBytes = await ed.getPublicKeyAsync(privateKeyBytes);

  // Convert private key to hex string for storage
  const privateKeyHex = Array.from(privateKeyBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    privateKey: privateKeyHex,
    publicKey: publicKeyBytes
  };
}

/**
 * Create a did:key DID from an Ed25519 public key
 * @param publicKey - The Ed25519 public key as Uint8Array
 * @returns The did:key formatted DID string
 */
export function createDidFromPublicKey(publicKey: Uint8Array): string {
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
 * @returns Object containing privateKey (hex) and did (string)
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

