# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**IRL Browser Simulator** is a development tool that simulates the IRL Browser API for local testing of mini-apps. It allows developers to test mini-apps in a regular browser without needing the Antler mobile app.

**Context:** IRL Browser is a mobile app that lets users scan QR codes at physical locations to launch web-based mini-apps. These mini-apps access a special `window.irlBrowser` JavaScript API for user profile data and permissions. This simulator mocks that entire environment to make it easier to test mini-apps in a regular browser.

**Critical:** This is a development-only tool. Never use in production environments.

## Development Commands

### Building
- `npm run build` - Build library in both CommonJS and ESM formats with TypeScript declarations
- `npm run build:bundle` - Build bundled version with all dependencies included (used for testing)
- `npm run dev` - Watch mode for development (rebuilds on file changes)
- `npm run type-check` - Run TypeScript type checking without emitting files

### Testing
Manual testing workflow:
```bash
npm run build:bundle
npx serve dist -p 8000
# Open http://localhost:8000/test.html in browser
```

No automated test suite exists - relies on manual testing via test.html and console inspection.

### Publishing
- `npm run prepublishOnly` - Automatically runs build before publishing to npm

## Code Architecture

### High-Level Structure

The codebase follows a **layered facade pattern** with clear separation of concerns:

```
enableIrlBrowserSimulator()           [Entry Point - src/index.ts]
    ↓
Simulator instance                     [Orchestrator - src/simulator.ts]
    ↓ injects into window.irlBrowser
MockIrlBrowser                         [API Implementation - src/api.ts]
    ↓ uses
JWT utilities + Ed25519 crypto         [src/jwt.ts, src/keyUtils.ts]
```

### Key Components

**src/index.ts** - Public API entry point
- Exports `enableIrlBrowserSimulator()` function
- Exports types and utility functions
- Configuration merging with defaults

**src/simulator.ts** - Core orchestrator class
- Manages state (profile, permissions, manifest, debug UI)
- Handles lifecycle (initialize, disconnect, error events)
- Coordinates between API layer and crypto/UI utilities
- Injects `window.irlBrowser` instance

**src/api.ts** - MockIrlBrowser class
- Implements `IRLBrowser` interface from types.ts
- Delegates to Simulator instance (dependency injection)
- All methods return Promises (simulates async operations)
- Network delay simulation (default 50ms)

**src/jwt.ts** - JWT operations
- `createSignedJwt()` - Creates and signs JWTs using Ed25519
- `decodeJwt()` - Decodes JWT payload
- Uses `@noble/ed25519` for cryptographic signing
- Supports both browser and Node.js environments

**src/keyUtils.ts** - DID and key management
- `generateProfileKeys()` - Creates Ed25519 keypair and DID
- `publicKeyToDid()` - Converts public key to `did:key` format
- Implements W3C DID standard with multicodec prefix (0xed01)

**src/ui.ts** - Debug UI panel
- Floating panel (bottom-right, collapsible)
- Keyboard shortcut: Ctrl+Shift+I to toggle
- Visual feedback for operations
- Inline CSS for zero dependencies

### Critical Patterns

#### 1. JWT Authentication Flow
All data is passed as **signed JWTs** using Ed25519:
```
1. Method called (e.g., getProfile())
2. Simulator creates payload with DID, timestamps, type, data
3. JWT signed with profile's private key
4. JWT string returned to mini-app
5. Mini-app can verify signature using public key from DID
```

JWT structure: `{header}.{payload}.{signature}`
- Header: `{alg: 'EdDSA', typ: 'JWT'}`
- Payload: `{iss: DID, aud: origin, iat, exp, type, ...data}`
- Signature: Ed25519 signature of header.payload

#### 2. DID (Decentralized Identifiers)
Uses `did:key` method with Ed25519 keys:
- Format: `did:key:z{base58-encoded-public-key}`
- Public key has multicodec prefix (0xed01) before base58 encoding
- Compatible with W3C DID standard
- Example: `did:key:z6Mkf5rGMoatrSj1f4CyvuHBeXJELe9RPdzo2PKGNCKVtZxP`

#### 3. Profile System
Profiles contain:
- `did` - Decentralized identifier
- `name`, `avatarUrl`, `socials` - User data
- `privateKey` - Ed25519 private key (Uint8Array)

**Security:** Profile files (`.profile.json`) are gitignored because they contain private keys.

Default profile is "Paul Morphy" (chess player) - see src/simulator.ts for structure.

#### 4. Permission Model
Simulates IRL Browser permission system:
1. Permissions declared in mini-app manifest
2. `requestPermission()` shows browser confirm dialog
3. Permission state tracked (granted/denied)
4. Errors sent via `window.postMessage` if permission not declared

Currently supported: `profile`, `profile:socials`

#### 5. Event System
Uses `window.postMessage` for lifecycle events:
- `irl-browser-disconnect` - Browser closed/user logged out
- `irl-browser-error` - Error occurred

Listen with: `window.addEventListener('message', ...)`

### Build Configuration

**Two build outputs:**

1. **Standard build** (`npm run build`)
   - Output: `dist/` directory
   - Formats: CommonJS (`index.js`) + ESM (`index.mjs`)
   - TypeScript declarations included (`index.d.ts`)
   - External dependencies (not bundled)

2. **Bundle build** (`npm run build:bundle`)
   - Output: `dist-bundle/` directory
   - Format: ESM only
   - All dependencies bundled (noExternal)
   - Minified
   - Used for test.html

**tsconfig.json:**
- Target: ES2020
- Strict mode enabled
- Module: ESNext
- Generates declaration files

## Important Conventions

### Security
- **Never commit `.profile.json` files** - they contain private keys
- **Development only** - simulator is not secure for production use
- **JWT signing** - Uses proper Ed25519 compatible with real IRL Browser
- **Private key format** - Stored as Uint8Array, converted to/from hex for JSON

### Code Style
- **Zero configuration** - Works out-of-the-box with sensible defaults
- **Type safety** - All exports have TypeScript definitions
- **Framework agnostic** - Works with React, Vue, vanilla JS, etc.
- **Realistic simulation** - Includes network delays (configurable)
- **Console logging** - All operations logged for debugging

### Testing Strategy
- Manual testing via test.html
- Visual debugging with Debug UI (Ctrl+Shift+I)
- Console inspection for JWT payloads
- No automated tests (currently)

## Key Dependencies

**Production:**
- `@noble/ed25519` - Ed25519 cryptographic signing
- `@noble/hashes` - SHA-512 hashing for signatures
- `base58-universal` - Base58 encoding for DIDs

**Development:**
- `typescript` - Type checking
- `tsup` - TypeScript bundler (uses esbuild)

## Reference Documentation

- **docs/irl-browser-standard.md** - Complete IRL Browser API specification
  - Defines lifecycle, JWT structure, API methods
  - Security best practices and authentication patterns
  - License: CC BY-SA 4.0

## Common Development Patterns

### Adding a New API Method

1. Add method signature to `IRLBrowser` interface in src/types.ts
2. Implement method in `MockIrlBrowser` class (src/api.ts)
3. Add corresponding logic in `Simulator` class (src/simulator.ts)
4. Update Debug UI button in src/ui.ts if applicable
5. Test via test.html

### Creating Custom Profiles

Use the `generateProfileKeys()` utility:
```typescript
import { generateProfileKeys } from 'irl-browser-simulator';
const profile = await generateProfileKeys('Your Name');
// Save to .profile.json (gitignored)
```

### Modifying JWT Payload Structure

All JWT creation happens in `createSignedJwt()` (src/jwt.ts). Standard claims:
- `iss` (issuer) - Profile's DID
- `aud` (audience) - Origin URL
- `iat` (issued at) - Current timestamp
- `exp` (expiration) - iat + expiresInSeconds
- `type` - Operation type (e.g., 'profile', 'permission')

Add custom claims in the data parameter.
