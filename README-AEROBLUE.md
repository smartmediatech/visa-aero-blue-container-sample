# VISA Aero Blue - Bridge Configuration Guide

This document provides specific bridge configuration details for integrating the **VISA Aero Blue Embedded Viewer** into your container application. It focuses on the bridge messages and URL parameters required for the AeroBlue context.

## Overview

The AeroBlue embedded viewer is customized for the AeroBlue context and requires specific bridge configurations and URL parameters. This guide covers:

- Required bridge message handlers (`session.get`, `session.clear`)
- Custom bridge message for retrieving user card ID
- URL configuration (language parameter and region path)
- Navigation considerations

## Required Bridge Message Handlers

### 1. `session.get` - Authentication Token Retrieval

The embedded viewer calls `session.get` to retrieve the user's refresh token for authentication.

**Handler Implementation:**

```typescript
bridge.addRequestHandler("session.get", async () => {
  const refreshToken = authService.getRefreshToken();
  console.log("session.get called, returning refreshToken");
  return { refreshToken };
});
```

**Request:**
- **Name:** `session.get`
- **Payload:** None
- **Called by:** Embedded viewer when authentication is needed

**Response:**
```typescript
{
  refreshToken: string  // The user's refresh token from the SMT platform (bearer token string, WITHOUT "Bearer" prefix)
}
```

**Important Notes:**
- The `refreshToken` should be a **string bearer token** from the SMT platform
- Do **NOT** include the `"Bearer"` prefix - return only the token string itself
- The embedded viewer will handle adding the `"Bearer"` prefix when making API requests
- Example: Return `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."` not `"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`

**Example Usage in BridgedIframe.tsx:**

```typescript
// Register session.get handler
bridge.addRequestHandler("session.get", async () => {
  const refreshToken = authService.getRefreshToken();
  console.log(
    "session.get called, returning refreshToken:",
    refreshToken ? "present" : "null"
  );
  return { refreshToken };
});
```

### 2. `session.clear` - Logout Handler

The embedded viewer calls `session.clear` when the user initiates logout from within the embedded viewer or when the refresh token is invalid.

**Handler Implementation:**

```typescript
bridge.addRequestHandler("session.clear", async ({ payload }) => {
  const { reason } = payload as { reason?: 'user-action' | 'invalid-refresh-token' };
  console.log("session.clear called, reason:", reason);
  await authService.logout();
  navigate("/login");
  return {};
});
```

**Request:**
- **Name:** `session.clear`
- **Payload:** 
  ```typescript
  {
    reason?: 'user-action' | 'invalid-refresh-token'  // Optional reason for logout
  }
  ```
- **Called by:** Embedded viewer when user logs out or when authentication fails

**Payload Parameters:**
- `reason` (optional): Indicates why the session is being cleared
  - `'user-action'` - User explicitly logged out
  - `'invalid-refresh-token'` - Refresh token is invalid or expired

**Response:**
```typescript
{}  // Empty object to acknowledge the request
```

**Example Usage in BridgedIframe.tsx:**

```typescript
// Register session.clear handler
bridge.addRequestHandler("session.clear", async ({ payload }) => {
  const { reason } = payload as { reason?: 'user-action' | 'invalid-refresh-token' };
  console.log("session.clear called, reason:", reason);
  
  // You can handle different reasons differently if needed
  if (reason === 'invalid-refresh-token') {
    console.warn("Session cleared due to invalid refresh token");
  }
  
  await authService.logout();
  navigate("/login");
  return {};
});
```

## Custom Bridge Message for AeroBlue

### `user.card.get` - Retrieve User's Tokenized Card ID

The embedded viewer will use this bridge message to retrieve the user's tokenized card ID for AeroBlue-specific functionality.

**Handler Implementation:**

```typescript
bridge.addRequestHandler("user.card.get", async () => {
  // Retrieve the user's tokenized card ID from your authentication service or user data
  const user = authService.getCurrentUser();
  const cardId = user?.cardId || null;
  
  console.log("user.card.get called, returning cardId:", cardId);
  return { cardId };
});
```

**Request:**
- **Name:** `user.card.get`
- **Payload:** None
- **Called by:** Embedded viewer when tokenized card ID is needed for AeroBlue features

**Response:**
```typescript
{
  cardId: string | null  // The user's tokenized card ID, or null if not available
}
```

**Example Implementation:**

```typescript
// In BridgedIframe.tsx, add this handler alongside session.get and session.clear
bridge.addRequestHandler("user.card.get", async () => {
  const user = authService.getCurrentUser();
  const cardId = user?.cardId || null;
  
  if (!cardId) {
    console.warn("user.card.get called but no cardId available");
  }
  
  return { cardId };
});

// Don't forget to clean up in the useEffect return
return () => {
  if (bridge) {
    bridge.removeRequestHandler("session.get");
    bridge.removeRequestHandler("session.clear");
    bridge.removeRequestHandler("user.card.get");
    bridge.dispose();
  }
};
```

**Note:** You may need to extend your `User` type to include the `cardId` field:

```typescript
// In src/types/auth.types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatarUri?: string;
  cardId?: string;  // Add this field
}
```

## URL Configuration

**Embedded Viewer URL:**
- **Development/Staging:** `https://embedded.smartmedialabs.io/visa-aero-blue/`
- **Production/Live:** To be defined

### Language Parameter (`lang`)

The embedded viewer language is specified via the `lang` search parameter in the embedded URL.

**Format:**
```
https://embedded.smartmedialabs.io/visa-aero-blue/?lang={language_code}
```

**Language Code Format:**
- Supports standard language codes (e.g., `en`, `es`, `fr`)
- Supports standard locale codes with country/region (e.g., `en-US`, `es-MX`, `fr-CA`)
- **Default:** `en`


**Example Implementation:**

```typescript
// In src/services/authService.ts or where you construct the URL
getEmbeddedViewerUrl(language: string = 'en'): string {
  const baseUrl = EMBEDDED_VIEWER_URL;
  return `${baseUrl}?lang=${language}`;
}
```

**Usage in Main.tsx:**

```typescript
// Get user's preferred language from user profile or browser settings
const userLanguage = user?.preferredLanguage || navigator.language.split('-')[0] || 'en';

<BridgedIframe
  ref={iframeRef}
  src={authService.getEmbeddedViewerUrl(userLanguage) + "#/discover"}
  className="w-full h-full border-0 flex-1"
/>
```

### Region Path Parameter

The region is specified as part of the URL path. The region can be a country code or a sub-region of a country. If no region is specified, the default (no region) is used.

**Note:** Currently, only global region support is available. Additional regions to be added in the future.

**Format:**
```
https://embedded.smartmedialabs.io/visa-aero-blue/{region}/?lang={language_code}
```

**Region Format:**
- Country code (e.g., `us`, `ca`, `gb`, `de`, `fr`)
- Sub-region of a country (e.g., `us-west`, `us-east`, `ca-qc`)
- **Default:** None (global region)

**Examples:**

**No Region (Global - Default):**
```
https://embedded.smartmedialabs.io/visa-aero-blue/?lang=en
```

**With Country Code (to be added):**
```
https://embedded.smartmedialabs.io/visa-aero-blue/us/?lang=en
https://embedded.smartmedialabs.io/visa-aero-blue/de/?lang=de
https://embedded.smartmedialabs.io/visa-aero-blue/jp/?lang=ja
```

**With Sub-Region (to be added):**
```
https://embedded.smartmedialabs.io/visa-aero-blue/us-west/?lang=en
https://embedded.smartmedialabs.io/visa-aero-blue/ca-qc/?lang=fr-CA
```

**Example Implementation:**

```typescript
// In src/services/authService.ts
getEmbeddedViewerUrl(language: string = 'en', region?: string): string {
  const baseUrl = EMBEDDED_VIEWER_URL;
  const regionPath = region ? `${region}/` : '';
  return `${baseUrl}${regionPath}?lang=${language}`;
}
```

**Usage in Main.tsx:**

```typescript
const userLanguage = user?.preferredLanguage || 'en';
const userRegion = user?.region; // e.g., 'us', 'ca', 'us-west', or undefined

<BridgedIframe
  ref={iframeRef}
  src={authService.getEmbeddedViewerUrl(userLanguage, userRegion) + "#/discover"}
  className="w-full h-full border-0 flex-1"
/>
```

## Navigation Considerations

### `navigation.go` - Unlikely Needed

The `navigation.go` bridge message is **unlikely to be needed** for the AeroBlue embedded viewer context. The embedded viewer is customized for AeroBlue and will handle its own internal navigation.

**Why it's unlikely needed:**
- The AeroBlue embedded viewer is pre-configured with specific features and navigation flows
- The container app typically doesn't need to programmatically change features within the viewer
- User-initiated navigation within the embedded viewer is handled internally

## Complete Bridge Setup Example

Here's a complete example of setting up all required bridge handlers for AeroBlue:

```typescript
// In BridgedIframe.tsx
useEffect(() => {
  const iframe = iframeRef.current;
  if (!iframe || !window.SMTBaseBridge) {
    console.error("Iframe or SMTBaseBridge not available");
    return;
  }

  const childOrigin = new URL(src);
  
  // Create bridge
  const bridge = new window.SMTBaseBridge.ParentBridge(iframe, {
    origin: childOrigin.origin,
    meta: {},
  });
  bridgeRef.current = bridge;

  // REQUIRED: Session authentication
  bridge.addRequestHandler("session.get", async () => {
    const refreshToken = authService.getRefreshToken();
    console.log("session.get called, returning refreshToken");
    return { refreshToken };
  });

  // REQUIRED: Session logout
  bridge.addRequestHandler("session.clear", async ({ payload }) => {
    const { reason } = payload as { reason?: 'user-action' | 'invalid-refresh-token' };
    console.log("session.clear called, reason:", reason);
    await authService.logout();
    navigate("/login");
    return {};
  });

  // AEROBLUE SPECIFIC: User tokenized card ID
  bridge.addRequestHandler("user.card.get", async () => {
    const user = authService.getCurrentUser();
    const cardId = user?.cardId || null;
    console.log("user.card.get called, returning cardId:", cardId);
    return { cardId };
  });

  // OPTIONAL: Navigation handler (only if needed)
  // bridge.addRequestHandler("navigation.go", async ({ payload }) => {
  //   // Implementation here if needed
  // });

  console.log("AeroBlue bridge handlers registered successfully");

  // Set iframe src after bridge is configured
  setIframeSrc(src);

  // Cleanup
  return () => {
    if (bridge) {
      bridge.removeRequestHandler("session.get");
      bridge.removeRequestHandler("session.clear");
      bridge.removeRequestHandler("user.card.get");
      bridge.dispose();
    }
  };
}, [src, navigate]);
```

## Summary

### Required Bridge Messages
1. ✅ **`session.get`** - Returns user's refresh token
2. ✅ **`session.clear`** - Handles logout
3. ✅ **`user.card.get`** - Returns user's tokenized card ID (AeroBlue specific)

### URL Parameters
1. ✅ **`lang`** - Language code as search parameter (e.g., `?lang=en`)
2. ✅ **`region`** - Region as URL path segment (optional, default is none)

### Navigation
- ⚠️ **`navigation.go`** - Unlikely needed for AeroBlue context

### Example Complete URL
```
https://embedded.smartmedialabs.io/visa-aero-blue/?lang=en
```

Where:
- `lang=en` = language parameter
- Region is optional and can be added to the path when regional support is available
- Initial feature/route can be specified with hash fragment (e.g., `#/discover`)

## Additional Resources

- See `README.md` for general container app setup and bridge communication flow
- See `src/components/BridgedIframe.tsx` for bridge implementation reference
- See `src/types/smt-base-bridge/` for TypeScript type definitions
