# VISA Aero Blue - Container App Example

This project demonstrates a **container application** that embeds and communicates with the **VISA Aero Blue Embedded Viewer** using the `smt-base-bridge` library. The container app handles authentication, passes auth tokens to the embedded viewer, manages navigation between features/pages, and handles logout functionality.

## Overview

This example showcases:
- **User Authentication**: Login flow with email/password
- **Auth Token Passing**: Securely passing refresh tokens to the embedded viewer
- **Feature Navigation**: Changing pages/features within the embedded viewer (e.g., Discover, Saved/Inventory)
- **Logout Handling**: Coordinated logout between container and embedded viewer
- **Bridge Communication**: Two-way communication using the `smt-base-bridge` library

## Prerequisites

The **`smt-base-bridge.min.js`** library from the `public/` directory must be loaded in your HTML to enable communication between the container app and the embedded viewer.

```html
<!-- public/index.html -->
<script src="./smt-base-bridge.min.js"></script>
```

This library provides the `SMTBaseBridge.ParentBridge` class used to establish communication with the child iframe.

## Configuration

### App ID and Embedded Viewer URL

Configure the App ID and Embedded Viewer URL in `src/services/authService.ts`:

```typescript
export const API_BASE_URL = "https://b.smartmedialabs.io";
export const APP_ID = "29512c85-0f45-44ff-a2d5-8269f2476116";
export const EMBEDDED_VIEWER_URL = "https://embedded.smartmedialabs.io/visa-aero-blue/";
```

**⚠️ IMPORTANT**: The `APP_ID` configured here **must match** the App ID that the embedded viewer is configured to use. Mismatched App IDs will cause authentication and communication failures.

## Key Features

### 1. Login Flow

The login page (`src/pages/Login.tsx`) authenticates users via email and password:

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    await login({ email, password });
    navigate('/');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Login failed');
  } finally {
    setLoading(false);
  }
};
```

The `authService.login()` method (`src/services/authService.ts`) makes an API call and stores the access token and refresh token:

```typescript
async login(credentials: LoginCredentials): Promise<AuthResponse> {
  const payload: ApiLoginPayload = {
    token: credentials.email,
    token_type: "email",
    auth_data: {
      password: credentials.password,
    },
  };

  const response = await fetch(`${API_BASE_URL}/v1/user/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "App-Id": APP_ID,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Invalid email or password");
  }

  const data: ApiLoginResponse = await response.json();
  const token = data.payload.access_token.token;
  const refreshToken = data.payload.refresh_token.token;

  // Store tokens in localStorage
  localStorage.setItem(this.STORAGE_KEY, token);
  localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(this.USER_KEY, JSON.stringify(user));

  return { user, token, refreshToken };
}
```

### 2. Passing Auth to the Embedded Viewer

The `BridgedIframe` component (`src/components/BridgedIframe.tsx`) establishes communication with the embedded viewer and handles authentication requests:

```typescript
useEffect(() => {
  const iframe = iframeRef.current;
  if (!iframe || !window.SMTBaseBridge) {
    console.error("Iframe or SMTBaseBridge not available");
    return;
  }

  const childOrigin = new URL(src);
  
  // Create bridge using ParentBridge constructor
  const bridge = new window.SMTBaseBridge.ParentBridge(iframe, {
    origin: childOrigin.origin,
    meta: {},
  });
  bridgeRef.current = bridge;

  // Register session.get handler - provides refresh token to embedded viewer
  bridge.addRequestHandler("session.get", async () => {
    const refreshToken = authService.getRefreshToken();
    console.log("session.get called, returning refreshToken");
    return { refreshToken };
  });

  // Register session.clear handler - handles logout from embedded viewer
  bridge.addRequestHandler("session.clear", async () => {
    console.log("session.clear called");
    await authService.logout();
    navigate("/login");
    return {};
  });

  // Set iframe src after bridge is configured
  setIframeSrc(src);

  return () => {
    // Cleanup handlers
    if (bridgeRef.current) {
      bridgeRef.current.removeRequestHandler("session.get");
      bridgeRef.current.removeRequestHandler("session.clear");
    }
  };
}, [src, navigate]);
```

When the embedded viewer needs authentication, it calls `session.get` through the bridge, and the container responds with the refresh token.

### 3. Changing Features/Pages

The container app can navigate the embedded viewer to different features using the bridge's `sendRequest` method:

**Main Page Navigation** (`src/pages/Main.tsx`):

```typescript
const handleGoToHome = async () => {
  try {
    await iframeRef.current?.goTo({ feature: "discover" });
  } catch (error) {
    console.error("Navigation to home failed:", error);
  }
};

const handleGoToInventory = async () => {
  try {
    await iframeRef.current?.goTo({ feature: "inventory" });
  } catch (error) {
    console.error("Navigation to inventory failed:", error);
  }
};
```

**BridgedIframe Component** (`src/components/BridgedIframe.tsx`):

```typescript
// Expose goTo function via ref
useImperativeHandle(ref, () => ({
  goTo: async (params: {
    feature: string;
    focus?: string;
    extra?: string;
    params?: Record<string, any>;
  }) => {
    if (!bridgeRef.current) {
      throw new Error("Bridge not initialized");
    }
    return bridgeRef.current.sendRequest("navigation.go", params);
  },
}));
```

The embedded viewer can also request navigation changes, which the container can approve or reject:

```typescript
bridge.addRequestHandler("navigation.go", async ({ payload }) => {
  const { feature, focus, extra, params } = payload as {
    feature: string;
    focus: string;
    extra: string;
    params: Record<string, any>;
  };

  // Reject certain features
  if (
    feature === "ar" ||
    feature === "ar-face-filter" ||
    feature === "ar-wearable" ||
    feature === "ar-engaged" ||
    feature === "eight-wall"
  ) {
    alert("Request to goto " + feature + " rejected");
    return {};
  }
  
  // Approve supported routes
  return { feature, focus, extra, params };
});
```

### 4. Logout

Logout can be initiated from either the container or the embedded viewer:

**Container-Initiated Logout** (`src/pages/Main.tsx`):

```typescript
const handleLogout = async () => {
  setLoading(true);
  try {
    await logout();
    navigate("/login");
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    setLoading(false);
  }
};
```

**Embedded Viewer-Initiated Logout** (handled in `BridgedIframe.tsx`):

```typescript
// Register session.clear handler
bridge.addRequestHandler("session.clear", async () => {
  console.log("session.clear called");
  await authService.logout();
  navigate("/login");
  return {};
});
```

The `authService.logout()` method clears all stored tokens:

```typescript
async logout(): Promise<void> {
  localStorage.removeItem(this.STORAGE_KEY);
  localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  localStorage.removeItem(this.USER_KEY);
}
```

## Project Structure

```
visa-aero-blue-embedded/
├── public/
│   ├── index.html                    # Loads smt-base-bridge.min.js
│   ├── smt-base-bridge.min.js        # Bridge library for iframe communication
│   └── smt-base-bridge.min.js.map
├── src/
│   ├── components/
│   │   ├── BridgedIframe.tsx         # Iframe component with bridge communication
│   │   ├── Navbar.tsx                # Navigation bar with page switching
│   │   └── ProtectedRoute.tsx        # Route protection wrapper
│   ├── context/
│   │   └── AuthContext.tsx           # Authentication context provider
│   ├── pages/
│   │   ├── Login.tsx                 # Login page
│   │   └── Main.tsx                  # Main page with embedded viewer
│   ├── services/
│   │   └── authService.ts            # Authentication service (CONFIG HERE)
│   ├── types/                        # TypeScript type definitions
│   ├── App.tsx                       # Root application component
│   └── index.tsx                     # Application entry point
├── package.json
└── webpack.config.js
```

## Installation & Running

### Install Dependencies

```bash
yarn install
```

### Development Server

```bash
yarn dev
```

The app will be available at `https://localhost:3000`

### Production Build

```bash
yarn build
```

## Bridge Communication Flow

1. **Container loads** the embedded viewer in an iframe
2. **Bridge initialization**: `ParentBridge` is created with the iframe reference and origin
3. **Request handlers registered**: Container registers handlers for `session.get`, `session.clear`, `navigation.go`, etc.
4. **Embedded viewer requests auth**: Calls `session.get` through the bridge
5. **Container responds**: Returns the refresh token
6. **Embedded viewer authenticates**: Uses the refresh token to obtain access tokens
7. **Navigation requests**: Either side can request navigation changes through the bridge
8. **Logout coordination**: Either side can initiate logout, which is handled by both

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **smt-base-bridge** - Iframe communication library
- **Webpack** - Module bundler

## License

Apache-2.0
