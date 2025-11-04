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
- `npm publish` - Publish to npm

### Multi-User Testing

 A major usecase for an IRL Browser mini app is multiple people physically present at the same time, each with their own profile. The simulator supports testing with multiple users simultaneously via URL parameters and preset profiles.

**Quick Start:**
1. Add simulator to your mini-app (works automatically with no config)
2. Open your mini-app in browser - loads with Paul Morphy (default profile)
3. Open Debug UI panel (auto-visible or press Ctrl+Shift+I)
4. Click "Open as Alice Anderson" or any other profile button
5. New tab opens with Alice's profile
6. Repeat for Bob, Charlie, etc. to simulate multiple users

**How it Works:**
- Simulator auto-detects `?irlProfile=<id>` URL parameter
- If no parameter, defaults to Paul Morphy
- Each browser tab = independent user session with their own profile

**Available Preset Profiles:**
- Paul Morphy (`paul`)
- Alice Anderson (`alice`)
- Bob Batterson (`bob`)
- Charlie Kim (`charlie`)
- Divya Patel (`divya`)
- Eva Johnson (`eva`)

**Example URLs:**
```
http://localhost:3000                  → Paul Morphy (default)
http://localhost:3000?irlProfile=alice → Alice Anderson
http://localhost:3000?irlProfile=bob   → Bob Batterson
```

**URL Parameter Handling:**
- Preserves existing query parameters
- Preserves URL hash/fragments (for SPA routing)
- Example: `app.com?foo=bar#/page` → `app.com?foo=bar&irlProfile=alice#/page`

**Notes:**
- Permissions are global (not per-user) for simplicity
- Each profile has pre-generated Ed25519 keys and DID
- Profile colors help distinguish tabs visually
- All profiles exported from `irl-browser-simulator` package

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
- `createJWT()` - Creates and signs JWTs using Ed25519
- `decodeJWT()` - Decodes JWT payload (without verification)
- `verifyJWT()` - Verifies JWT signature using Ed25519 public key
- Uses `@stablelib/ed25519` for cryptographic signing (matching Antler IRL Browser app)
- Uses `base64-js` for base64url encoding
- Supports both browser and Node.js environments

**src/keyUtils.ts** - DID and key management
- `generateProfileKeys()` - Creates Ed25519 keypair and DID
- Implements W3C DID standard with multicodec prefix (0xed01)
- Generates 64-byte secret keys (32-byte seed + 32-byte public key)

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
- `name`, `avatar`, `socials` - User data
- `privateKey` - Ed25519 secret key (64 bytes: 32-byte seed + 32-byte public key), base64-encoded

Default profile is "Paul Morphy". See src/profiles.ts for all preset profiles.

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
- **Development only** - simulator is not secure for production use
- **JWT signing** - Uses @stablelib/ed25519
- **Private key format** - 64-byte secret keys stored as base64 strings (32-byte seed + 32-byte public key)

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
- `@stablelib/ed25519` - Ed25519 cryptographic signing (matches Antler IRL Browser app)
- `base64-js` - Base64/base64url encoding
- `base58-universal` - Base58 encoding for DIDs

**Development:**
- `typescript` - Type checking
- `tsup` - TypeScript bundler (uses esbuild)
- `@types/base64-js` - TypeScript type definitions for base64-js

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

### Modifying JWT Payload Structure

All JWT creation happens in `createJWT()` (src/jwt.ts). Standard claims:
- `iss` (issuer) - Profile's DID
- `aud` (audience) - Origin URL
- `iat` (issued at) - Current timestamp
- `exp` (expiration) - iat + expiresInSeconds
- `type` - Operation type (e.g., 'irl:profile:details', 'irl:avatar')

Add custom claims in the data parameter nested under the `data` field.
