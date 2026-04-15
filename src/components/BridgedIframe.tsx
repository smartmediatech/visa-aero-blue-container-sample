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
  onLoadError?: () => void;
  onRouteLoading?: (payload: { routeKey?: string }) => void;
  onRouteError?: (payload: {
    routeKey?: string;
    code?: string;
    message?: string;
    retryable?: boolean;
    legacy?: boolean;
  }) => void;
  onLayoutStable?: (payload: {
    routeKey?: string;
    height: number;
    stable?: boolean;
  }) => void;
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
    routeKey?: string;
    params?: Record<string, any>;
  }) => Promise<unknown>;
}

export const BridgedIframe = forwardRef<
  BridgedIframeHandle,
  BridgedIframeProps
>(({
  src,
  className,
  style,
  onLoadError,
  onRouteLoading,
  onRouteError,
  onLayoutStable,
  onSessionClear,
  onSignInRequest,
  onNavigation,
}, ref) => {
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
  const bridgeRef = useRef<ParentBridge | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setIframeRef = useCallback((element: HTMLIFrameElement | null) => {
    setIframe(element);
  }, []);

  const onLoadErrorRef = useRef(onLoadError);
  onLoadErrorRef.current = onLoadError;
  const onRouteLoadingRef = useRef(onRouteLoading);
  onRouteLoadingRef.current = onRouteLoading;
  const onRouteErrorRef = useRef(onRouteError);
  onRouteErrorRef.current = onRouteError;
  const onLayoutStableRef = useRef(onLayoutStable);
  onLayoutStableRef.current = onLayoutStable;
  const onSessionClearRef = useRef(onSessionClear);
  onSessionClearRef.current = onSessionClear;
  const onSignInRequestRef = useRef(onSignInRequest);
  onSignInRequestRef.current = onSignInRequest;
  const onNavigationRef = useRef(onNavigation);
  onNavigationRef.current = onNavigation;

  useEffect(() => {
    if (!iframe) return;

    if (!window.SMTBaseBridge) {
      console.error("SMTBaseBridge not available on window object");
      return;
    }

    const childOrigin = new URL(src);
    const bridge = new window.SMTBaseBridge.ParentBridge(iframe, {
      origin: childOrigin.origin,
      meta: {},
    });
    bridgeRef.current = bridge;

    let loadTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      setIsLoading(false);
      onRouteErrorRef.current?.({ legacy: true });
      onLoadErrorRef.current?.();
    }, 10000);

    bridge.addRequestHandler("session.get", async () => {
      if (loadTimeout !== null) {
        clearTimeout(loadTimeout);
        loadTimeout = null;
      }
      setIsLoading(false);
      const refreshToken = authService.getRefreshToken();
      return { refreshToken };
    });

    bridge.addRequestHandler("session.clear", async () => {
      await onSessionClearRef.current?.();
      return {};
    });

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
      return { feature, focus, extra, params };
    });

    bridge.addRequestHandler("navigation.open", async ({ payload }) => {
      const { url } = payload ?? {};
      window.open(url, "_blank");
      return {};
    });

    bridge.addRequestHandler("viewer.route.loading", async ({ payload }) => {
      const { routeKey } = (payload ?? {}) as { routeKey?: string };
      onRouteLoadingRef.current?.({ routeKey });
      return {};
    });

    bridge.addRequestHandler("viewer.route.error", async ({ payload }) => {
      const { routeKey, code, message, retryable } = (payload ?? {}) as {
        routeKey?: string;
        code?: string;
        message?: string;
        retryable?: boolean;
      };
      onRouteErrorRef.current?.({ routeKey, code, message, retryable });
      return {};
    });

    bridge.addRequestHandler("frame.resize", async ({ payload }) => {
      const {
        height,
        routeKey,
        stable,
      } = payload as {
        height: number;
        routeKey?: string;
        stable?: boolean;
      };

      if (typeof height === "number" && height > 0) {
        onLayoutStableRef.current?.({
          routeKey,
          height,
          stable,
        });
      }
      return {};
    });

    return () => {
      if (loadTimeout !== null) {
        clearTimeout(loadTimeout);
        loadTimeout = null;
      }
      bridge.removeRequestHandler("session.get");
      bridge.removeRequestHandler("session.clear");
      bridge.removeRequestHandler("session.signIn");
      bridge.removeRequestHandler("navigation.go");
      bridge.removeRequestHandler("navigation.open");
      bridge.removeRequestHandler("viewer.route.loading");
      bridge.removeRequestHandler("viewer.route.error");
      bridge.removeRequestHandler("frame.resize");
      bridge.dispose();
      if (bridgeRef.current === bridge) {
        bridgeRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- bridge depends on iframe element and origin only
  }, [iframe]);

  useEffect(() => {
    if (!iframe) return;
    setIframeSrc(src);
  }, [src, iframe]);

  useImperativeHandle(ref, () => ({
    goTo: async (params: {
      feature: string;
      focus?: string;
      extra?: string;
      routeKey?: string;
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
      <div className="relative h-full w-full">
        <iframe
          ref={setIframeRef}
          src={iframeSrc || undefined}
          className="h-full w-full border-0"
          aria-busy={isLoading}
          style={{ visibility: isLoading ? "hidden" : "visible" }}
          title="Embedded Content"
          allow="geolocation; camera; microphone; fullscreen; autoplay; clipboard-write; encrypted-media; gyroscope; accelerometer; web-share"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
});

BridgedIframe.displayName = "BridgedIframe";
