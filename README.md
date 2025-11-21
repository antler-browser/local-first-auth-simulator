# IRL Browser Simulator

Development simulator for IRL Browser mini-apps. Test your mini-apps locally on a regular browser without needing Antler or another IRL Browser.

## What is this?

Antler IRL Browser is a mobile app that lets users scan QR codes at physical locations to launch web-based mini-apps. When running inside the Antler app or another IRL Browser mobile app, your mini-app has access to the `window.irlBrowser` JavaScript Object / API for getting user profile data, requesting permissions, and more.

This package injects a mock `window.irlBrowser` API into your browser, complete with a floating debug UI for triggering events and inspecting JWTs.

## Features

- Mock `window.irlBrowser` API that matches the real IRL Browser behavior
- Floating debug UI for triggering API methods and events
- JWT signing with ED25519 keys using @stablelib/ed25519
- Multi-user testing support with multiple tabs using URL parameter `?irlProfile=<id>`
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
if (import.meta.env.DEV) {
  const simulator = await import('irl-browser-simulator')
  simulator.enableIrlBrowserSimulator({
    profile: simulator.getProfileById('alice')
  })
}
```

## Multi-User Testing

A major usecase for an IRL Browser mini app is multiple people physically present at the same time, each with their own profile. You can simulate multiple users by opening multiple tabs with the same mini app, each with a different URL parameter `?irlProfile=<id>`.

The simulator comes with 6 preset profiles for testing multi-user scenarios.

**Testing via URL:**
- Open `http://localhost:your-port?irlProfile=alice` in one tab → Alice's profile
- Open `http://localhost:your-port?irlProfile=bob` in another tab → Bob's profile
- Each tab simulates a different user!

**Debug UI:**
The debug UI includes buttons to quickly open new tabs with different profiles.

## Changing the default profile
By default, the simulator will use the Paul Morphy profile. To use a different profile, pass in the ID of the profile to the `enableIrlBrowserSimulator` function. You can get the profile by its ID using the `getProfileById` function.

```typescript
if (import.meta.env.DEV) {
  const simulator = await import('irl-browser-simulator')
  simulator.enableIrlBrowserSimulator({
    profile: simulator.getProfileById('alice')
  })
}
```

That's it! The simulator will:
- Inject `window.irlBrowser` into your page
- Load a default test profile (Paul Morphy)
- Show a floating debug panel
- Automatically load the profile from the URL parameter `?irlProfile=<id>`
- Test multi-user scenarios across tabs
- Be ready for your mini-app to use

## IRL Browser Specification

See `docs/irl-browser-specification.md` for the IRL Browser Specification, which defines how an IRL Browser communicates and what is being mocked in this package.

## Configuration Options

```typescript
interface SimulatorConfig {
  profile?: Profile;  // Custom profile object, defaults to Paul Morphy profile if no profile is provided
                      
  jwtDetails?: {
    audience?: string;  // Mini-app domain (defaults to window.location.origin)
    expirationOffsetSeconds?: number;  // JWT expiration (defaults to 120)
  };

  browserDetails?: {
    name?: string;  // defaults to "IRL Browser Simulator"
    version?: string;  // defaults to "1.0.0"
    platform?: 'ios' | 'android' | 'browser';  // defaults to "ios"
    supportedPermissions?: string[];  // defaults to ["profile"]
  };

  networkDelayMs?: number;  // Simulated delay (defaults to 50ms)
  showDebugUI?: boolean;  // Show debug panel (defaults to true)
}
```

## Debug UI

The floating debug panel provides:
- Current profile information with color-coded badge
- Buttons to trigger API methods (getProfileDetails, getAvatar, etc.)
- Buttons to open new tabs with different user profiles
- Buttons to send events (disconnect, errors)
- Keyboard shortcut: `Ctrl+Shift+I` to toggle visibility
- Quick testing without writing code

## Security Notes

- This is a development tool - do not use in production!
- JWTs are properly signed using @stablelib/ed25519
- All JWTs can be verified using the issuer's public key extracted from the DID