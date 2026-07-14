/**
 * Verifies deriveOriginKeys() against the test vectors in
 * docs/local-first-auth-spec.md ("Privacy: Per-Origin Key Derivation").
 *
 * Usage: npm run build && npm run test:vectors
 */
import { deriveOriginKeys } from '../dist/index.mjs';

const ROOT_PRIVATE_KEY = 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwfqSmxj4pxSCr71UHsTLsX5lUd2rr6+e5JCHuppFEbSLA==';
const ROOT_DID = 'did:key:z6MkvDqGT54cXesYGvABpF1UapVNwjCqRcafi4Px6Thv5T3Z';

const VECTORS = [
  ['https://example.com', 'did:key:z6MksHmq5juqxMRUt6UYxnbCfprSmsEcaLd9riXhYZPB7hCF'],
  ['https://other.app', 'did:key:z6MkuPzxjqnHVeV3eupgRqjD9Me4EhAyKoohjU6PkkoBhLSt'],
  ['http://localhost:8787', 'did:key:z6MkoShWB63jPRQAMhWJD3J2Gq5BizC65JnRetMj5uj7EepD'],
];

let failed = false;

for (const [origin, expectedDid] of VECTORS) {
  const { did } = deriveOriginKeys(ROOT_PRIVATE_KEY, origin);

  if (did !== expectedDid) {
    failed = true;
    console.error(`❌ ${origin}\n   expected ${expectedDid}\n   got      ${did}`);
  } else if (did === ROOT_DID) {
    failed = true;
    console.error(`❌ ${origin}: derived DID equals the root DID (root key must never sign mini-app payloads)`);
  } else {
    console.log(`✅ ${origin} → ${did}`);
  }
}

if (failed) {
  console.error('\nSpec test vectors FAILED');
  process.exit(1);
}

console.log('\nAll spec test vectors passed');
