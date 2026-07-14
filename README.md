# Local First Auth Simulator

Development simulator for Local First Auth mini-apps. Test your mini-apps locally on a regular browser without needing Antler or another Local First Auth app.

## What is this?

Antler is a demo Local First Auth app that lets users scan QR codes at physical locations to launch web-based mini-apps. When running inside Antler or another Local First Auth mobile app, your mini-app has access to the `window.localFirstAuth` JavaScript Object / API for getting user profile data, requesting permissions, and more.

This package injects a mock `window.localFirstAuth` API into your browser, complete with a floating debug UI for triggering events and inspecting JWTs.

## Features

- Mock `window.localFirstAuth` API that matches the real Local First Auth behavior
- Floating debug UI for triggering API methods and events
- JWT signing with ED25519 keys using @stablelib/ed25519
- Multi-user testing support with multiple tabs using URL parameter `?test_profile=<id>`
- Simulated network delays for realistic testing
- Permission request flows
- TypeScript support with full type definitions
- Zero configuration - just import and enable
- Framework agnostic - works with React, Vue, vanilla JS, etc.

## Installation

```bash
npm install --save-dev local-first-auth-simulator
```

## Quick Start

```typescript
if (import.meta.env.DEV) {
  const simulator = await import('local-first-auth-simulator')
  simulator.enableLocalFirstAuthSimulator({
    profile: simulator.getProfileById('alice')
  })
}
```

## Multi-User Testing

A major usecase for a Local First Auth mini app is multiple people physically present at the same time, each with their own profile. You can simulate multiple users by opening multiple tabs with the same mini app, each with a different URL parameter `?test_profile=<id>`.

The simulator comes with 6 preset profiles for testing multi-user scenarios.

**Testing via URL:**
- Open `http://localhost:your-port?test_profile=alice` in one tab → Alice's profile
- Open `http://localhost:your-port?test_profile=bob` in another tab → Bob's profile
- Each tab simulates a different user!

**Debug UI:**
The debug UI includes buttons to quickly open new tabs with different profiles.

## Changing the default profile
By default, the simulator will use the Paul Morphy profile. To use a different profile, pass in the ID of the profile to the `enableLocalFirstAuthSimulator` function. You can get the profile by its ID using the `getProfileById` function.

```typescript
if (import.meta.env.DEV) {
  const simulator = await import('local-first-auth-simulator')
  simulator.enableLocalFirstAuthSimulator({
    profile: simulator.getProfileById('alice')
  })
}
```

That's it! The simulator will:
- Inject `window.localFirstAuth` into your page
- Load a default test profile (Paul Morphy)
- Show a floating debug panel
- Automatically load the profile from the URL parameter `?test_profile=<id>`
- Test multi-user scenarios across tabs
- Be ready for your mini-app to use

## Local First Auth Specification

See `docs/local-first-auth-specification.md` for the Local First Auth Specification, which defines how a Local First Auth app communicates and what is being mocked in this package.

## Per-Origin DIDs

Per the spec's ["Privacy: Per-Origin Key Derivation"](docs/local-first-auth-spec.md) section, a Local First Auth app never signs mini-app payloads with a profile's root key. The simulator follows this: the `iss` and `data.did` in every JWT are a **per-origin DID**, derived deterministically (HKDF-SHA256) from the profile's root key and your app's origin.

What this means when testing:
- The DID your mini-app sees is **stable for your origin** — the same profile always produces the same DID at the same origin, across reloads.
- The same profile produces a **different DID at a different origin** (scheme, host, and port all count).
- The DID your mini-app sees is **not** the preset profile's `did` field (that's the root DID). To assert against the derived value, use `simulator.getOriginDid()`, or derive it yourself with the exported `deriveOriginKeys(rootPrivateKey, origin)`.

> **Breaking change (v2):** prior versions signed with the root key, so JWTs carried the preset profiles' root DIDs. Any test that hard-coded those DIDs needs to switch to `simulator.getOriginDid()`.

## Configuration Options

```typescript
interface SimulatorConfig {
  profile?: Profile;  // Custom profile object, defaults to Paul Morphy profile if no profile is provided

  jwtDetails?: {
    audience?: string;  // Mini-app origin (defaults to window.location.origin); used as the JWT `aud` claim and for per-origin key derivation
    expirationOffsetSeconds?: number;  // JWT expiration (defaults to 120)
  };

  appDetails?: {
    name?: string;  // defaults to "Local First Auth Simulator"
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
- Keyboard shortcut: `Ctrl+Shift+D` to toggle visibility
- Quick testing without writing code

## Security Notes

- This is a development tool - do not use in production!
- JWTs are properly signed using @stablelib/ed25519
- All JWTs can be verified using the issuer's public key extracted from the DID
