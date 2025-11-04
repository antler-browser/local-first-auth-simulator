# IRL Browser Simulator

Development simulator for IRL Browser mini-apps. Test your mini-apps locally on a regular browser without needing Antler or another IRL Browser.

## What is this?

Antler IRL Browser is a mobile app that lets users scan QR codes at physical locations to launch web-based mini-apps. When running inside the Antler app or another IRL Browser mobile app, your mini-app has access to the `window.irlBrowser` JavaScript Object / API for getting user profile data, requesting permissions, and more.

This package injects a mock `window.irlBrowser` API into your browser, complete with a floating debug UI for triggering events and inspecting JWTs.

## Features

- Mock `window.irlBrowser` API that matches the real IRL Browser behavior
- Floating debug UI for triggering API methods and events
- JWT signing with ED25519 keys (fully compatible with real IRL Browser)
- Simulated network delays for realistic testing
- Permission request flows
- TypeScript support with full type definitions
- Zero configuration - just import and enable
- Framework agnostic - works with React, Vue, vanilla JS, etc.

## Installation

```bash
npm install --save-dev irl-browser-simulator
```

## Quick Start

```typescript
import { enableIrlBrowserSimulator } from 'irl-browser-simulator';

// Enable in development mode
if (process.env.NODE_ENV === 'development') {
  enableIrlBrowserSimulator();
}
```

That's it! The simulator will:
- Inject `window.irlBrowser` into your page
- Load a default test profile (Paul Morphy)
- Show a floating debug panel
- Be ready for your mini-app to use

## Usage Examples

### Example 1: Zero Config (Recommended for Quick Start)

```javascript
import { enableIrlBrowserSimulator } from 'irl-browser-simulator';

if (import.meta.env.DEV) { // Check if we are in development mode
  enableIrlBrowserSimulator();
}
```

### Example 2: Custom Profile

```javascript
import { enableIrlBrowserSimulator } from 'irl-browser-simulator';
import myProfile from './danny.profile.json';  // Import your profile JSON

if (import.meta.env.DEV) { // Check if we are in development mode
  enableIrlBrowserSimulator({
    profile: myProfile,  // Pass the imported profile object
    jwtDetails: {
      audience: 'https://my-mini-app.com',
      expirationOffsetSeconds: 300  // 5 minutes
    },
    browserDetails: {
      platform: 'android',
      supportedPermissions: ['profile', 'location']
    },
    networkDelayMs: 100,  // Slower network simulation
    showDebugUI: true
  });
}
```

**Note:** Your bundler (Vite, Next.js, etc.) handles the JSON import.

## Generating Your Own Keys

The simulator includes a utility to generate Ed25519 keypairs and DIDs:

```typescript
import { generateProfileKeys } from 'irl-browser-simulator';

// Generate a complete profile key set
const { privateKey, did } = await generateProfileKeys();

console.log('DID:', did);         // did:key:z...
console.log('Private Key:', privateKey);  // hex string
```

Use these values in your custom profile configuration. **Important:** Never commit private keys to version control!

## IRL Browser Standard

See `docs/irl-browser-standard.md` for the IRL Browser Standard, which defines how an IRL Browser communicates and what is being mocked in this package.

## Configuration Options

```typescript
interface SimulatorConfig {
  profile?: Profile;  // Custom profile object (import from your project)
                      // Defaults to Paul Morphy example profile if no profile is provided
                      
  jwtDetails?: {
    audience?: string;  // Mini-app domain (defaults to window.location.origin)
    expirationOffsetSeconds?: number;  // JWT expiration (defaults to 120)
  };

  browserDetails?: {
    name?: string;  // defaults to "IRL Browser Simulator"
    version?: string;  // defaults to "1.0.0"
    platform?: 'ios' | 'android';  // defaults to "ios"
    supportedPermissions?: string[];  // defaults to ["profile"]
  };

  networkDelayMs?: number;  // Simulated delay (defaults to 50ms)
  showDebugUI?: boolean;  // Show debug panel (defaults to true)
}

// Profile structure
interface Profile {
  did: string;              // Decentralized identifier (did:key:z...)
  name: string;             // Display name
  avatar?: string;          // Base64 data URI (optional)
  socials?: Social[];       // Array of social platform handles (optional, defaults to empty array)
  privateKey: string;       // ED25519 private key (hex format) for JWT signing
}
```

## Debug UI

The floating debug panel provides:
- Current profile information
- Buttons to trigger API methods
- Buttons to send events (disconnect, errors)
- Quick testing without writing code

## Security Notes

- Never commit `*.profile.json` files with real private keys
- This is a development tool - do not use in production! 
- JWTs are properly signed and can be verified using the issuer's public key