import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import { authService } from "../services/authService";
import type ParentBridge from "@/types/smt-base-bridge/parent-bridge";

interface BridgedIframeProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  onHeightChange?: (height: number) => void;
  onLoadError?: () => void;
  onSessionClear?: () => void | Promise<void>;
  onSignInRequest?: () => Promise<{ refreshToken: string | null }>;
  onNavigation?: (
    feature: string,
    focus?: string,
    extra?: string,
    params?: Record<string, string | boolean | number>,
  ) => Promise<
    | {
        feature: string;
        focus?: string;
        extra?: string;
        params: Record<string, string | boolean | number>;
      }
    | undefined
  >;
}

export interface BridgedIframeHandle {
  goTo: (params: {
    feature: string;
    focus?: string;
    extra?: string;
    params?: Record<string, any>;
  }) => Promise<unknown>;
}

export const BridgedIframe = forwardRef<
  BridgedIframeHandle,
  BridgedIframeProps
>(({ src, className, style, onHeightChange, onLoadError, onSessionClear, onSignInRequest, onNavigation }, ref) => {
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
  const bridgeRef = useRef<ParentBridge | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasConnectedRef = useRef(false);

  const setIframeRef = useCallback(
    (element: HTMLIFrameElement | null) => {
      setIframe(element);
    },
    [setIframe],
  );

  // Store callbacks in refs so the bridge effect doesn't re-run when they change
  const onHeightChangeRef = useRef(onHeightChange);
  onHeightChangeRef.current = onHeightChange;
  const onLoadErrorRef = useRef(onLoadError);
  onLoadErrorRef.current = onLoadError;
  const onSessionClearRef = useRef(onSessionClear);
  onSessionClearRef.current = onSessionClear;
  const onSignInRequestRef = useRef(onSignInRequest);
  onSignInRequestRef.current = onSignInRequest;
  const onNavigationRef = useRef(onNavigation);
  onNavigationRef.current = onNavigation;

  // Bridge setup — only depends on the iframe element, not on src or callbacks.
  // The bridge origin is derived from src, but only the origin matters (not the hash).
  useEffect(() => {
    if (!iframe) return;

    if (!window.SMTBaseBridge) {
      console.error("SMTBaseBridge not available on window object");
      return;
    }

    const childOrigin = new URL(src);
    // Create bridge using ParentBridge constructor
    const bridge = new window.SMTBaseBridge.ParentBridge(iframe, {
      origin: childOrigin.origin,
      meta: {},
    });
    bridgeRef.current = bridge;

    // Start a timeout — if session.get isn't received within 10s the viewer
    // didn't load (cert rejected, network error, not running, etc.)
    let loadTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      setIsLoading(false);
      onLoadErrorRef.current?.();
    }, 10000);

    // Register session.get handler
    bridge.addRequestHandler("session.get", async () => {
      if (loadTimeout !== null) {
        clearTimeout(loadTimeout);
        loadTimeout = null;
      }
      hasConnectedRef.current = true;
      setIsLoading(false);
      const refreshToken = authService.getRefreshToken();
      return { refreshToken };
    });

    // Register session.clear handler
    bridge.addRequestHandler("session.clear", async () => {
      await onSessionClearRef.current?.();
      return {};
    });

    // Register session.signIn handler — viewer requests the container to
    // show the sign-in modal and returns the refresh token on success.
    bridge.addRequestHandler("session.signIn", async () => {
      if (onSignInRequestRef.current) {
        return await onSignInRequestRef.current();
      }
      return { refreshToken: null };
    });

    bridge.addRequestHandler("navigation.go", async ({ payload }) => {
      const { feature, focus, extra, params } = payload as {
        feature: string;
        focus: string;
        extra: string;
        params: Record<string, any>;
      };
      if (onNavigationRef.current) {
        return (await onNavigationRef.current(feature, focus, extra, params)) ?? {};
      }
      //supported route
      return { feature, focus, extra, params };
    });

    bridge.addRequestHandler("navigation.open", async ({ payload }) => {
      const { url } = payload ?? {};
      window.open(url, "_blank");
      return {};
    });

    // Register frame.resize handler — the viewer sends its content height
    // so the container can size the iframe and allow the footer to flow below.
    // IMPORTANT: Do NOT set iframe.style.height directly here — that creates a
    // feedback loop (viewer measures viewport → reports height → iframe grows →
    // viewer sees more space → reports larger height → …). Instead, delegate
    // to the parent via onHeightChange so it can set height through React state.
    bridge.addRequestHandler("frame.resize", async ({ payload }) => {
      const { height } = payload as { height: number };
      if (typeof height === "number" && height > 0) {
        onHeightChangeRef.current?.(height);
      }
      return {};
    });
    // Cleanup
    return () => {
      if (loadTimeout !== null) {
        clearTimeout(loadTimeout);
        loadTimeout = null;
      }
      hasConnectedRef.current = false;
      if (bridge) {
        bridge.removeRequestHandler("session.get");
        bridge.removeRequestHandler("session.clear");
        bridge.removeRequestHandler("session.signIn");
        bridge.removeRequestHandler("navigation.go");
        bridge.removeRequestHandler("navigation.open");
        bridge.removeRequestHandler("frame.resize");
        bridge.dispose();
        if (bridgeRef.current === bridge) {
          bridgeRef.current = null;
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- bridge depends on iframe element and origin only
  }, [iframe]);

  // Src updates — set the iframe src whenever the prop changes.
  // This is separate from bridge setup so hash-only navigation doesn't
  // tear down the bridge or restart the load timeout.
  useEffect(() => {
    if (!iframe) return;
    setIframeSrc(src);
  }, [src, iframe]);

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

  return (
    <div className={className} style={style}>
      <div className="relative w-full h-full">
        <iframe
          ref={setIframeRef}
          src={iframeSrc || undefined}
          className="w-full h-full border-0"
          style={{ visibility: isLoading ? "hidden" : "visible" }}
          title="Embedded Content"
          allow="geolocation; camera; microphone; fullscreen; autoplay; clipboard-write; encrypted-media; gyroscope; accelerometer; web-share"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
});

BridgedIframe.displayName = "BridgedIframe";
