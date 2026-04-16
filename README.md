# VISA Aero Blue Container App Example

This repo is a sample container application. Its purpose is to show third-party implementers how a host container can authenticate users, embed the Aero Blue viewer in an iframe, and communicate with that viewer through a narrow bridge contract.

Treat this repo as an engineering reference for container-side patterns and architecture. The embedded viewer should be treated as an external application behind an iframe boundary.

## Architecture

The container and embedded viewer are separate applications with separate routing, state, and rendering lifecycles.

- The container owns shell UI such as auth, chrome, layout, and any host-level URL handling.
- The viewer owns its internal screens and route transitions inside the iframe.
- The bridge is the only integration contract between the two sides.

The container should not depend on viewer internals. It should only depend on:

- the iframe URL
- the agreed bridge message names and payload shapes
- the auth/session contract
- the navigation contract

This sample demonstrates those responsibilities with container-side code such as:

- `src/components/BridgedIframe.tsx`
- `src/pages/Main.tsx`
- `src/services/authService.ts`
- `src/navigation/viewerIntent.ts`

## Prerequisites

The container requires the bundled `smt-base-bridge` script to be present in `public/index.html` so `window.SMTBaseBridge.ParentBridge` is available at runtime.

```html
<script src="./smt-base-bridge.min.js"></script>
```

If that script is missing, bridge setup in `src/components/BridgedIframe.tsx` will fail and the container will not be able to communicate with the iframe.

## Configuration

Primary runtime configuration lives in `src/services/authService.ts`:

- `API_BASE_URL`
- `APP_ID`
- `EMBEDDED_VIEWER_URL`

Current defaults:

```ts
export const API_BASE_URL = "https://b.smartmedialabs.io";
export const APP_ID = "29512c85-0f45-44ff-a2d5-8269f2476116";
export const EMBEDDED_VIEWER_URL = "https://embedded.smartmedialabs.io/visa-aero-blue-smart/v3/";
```

Important constraints:

- `APP_ID` must match the viewer configuration.
- `EMBEDDED_VIEWER_URL` must point to the correct viewer deployment for the environment.
- The container should treat the viewer URL as configuration, not as a hardcoded implementation detail.

## Authentication Pattern

This sample authenticates users in the container and stores:

- access token
- refresh token
- serialized user profile

The reference implementation is in:

- `src/services/authService.ts`
- `src/context/AuthContext.tsx`
- `src/components/SignInModal.tsx`

The key integration rule is:

- the container keeps ownership of authentication state
- the viewer does not receive the access token directly from container UI flows
- the viewer requests session information through the bridge when it needs it

## Bridge Contract

The parent bridge is created in `src/components/BridgedIframe.tsx`. In this sample, the important bridge handlers are:

- `session.get`
  Returns the refresh token so the viewer can establish its own authenticated session.
- `session.clear`
  Allows the viewer to request container-side logout handling.
- `session.signIn`
  Allows the viewer to request an interactive sign-in flow from the container.
- `navigation.go`
  Allows the container to request viewer-side navigation without recreating the iframe.
- `viewer.route.loading`
- `viewer.route.error`
- `frame.resize`
  These let the viewer report loading, error, and layout information back to the container.

From a container-implementation perspective, the important principle is that the viewer is an external system. The container should respond to bridge messages and drive host-side behavior, but should not assume access to the viewer's internal code or router.

## Navigation Pattern

This sample uses a container-owned URL intent model for shell-driven viewer navigation. The container parses its own URL, derives viewer intent, and then translates that intent into bridge navigation or controlled iframe URL sync.

The reference implementation is in:

- `src/pages/Main.tsx`
- `src/navigation/viewerIntent.ts`

The detailed navigation model is documented separately in `docs/NAVIGATION.md`.

That document should be treated as internal implementation guidance for this sample. Third-party implementers should use it as a pattern reference, not as a dependency on viewer internals.

## File Guide

Useful sample entry points in this repo:

- `src/components/BridgedIframe.tsx`
  Parent bridge setup and iframe integration boundary.
- `src/pages/Main.tsx`
  Host shell orchestration, URL-intent handling, and viewer lifecycle coordination.
- `src/navigation/viewerIntent.ts`
  URL parsing/serialization helpers for shell-driven viewer navigation.
- `src/services/authService.ts`
  Auth configuration and token persistence.
- `src/components/SignInModal.tsx`
  Example interactive sign-in flow owned by the container.

## Running

Install dependencies:

```bash
yarn install
```

Start the dev server:

```bash
yarn dev
```

Build for production:

```bash
yarn build
```
