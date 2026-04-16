import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { SignInModal } from "../components/SignInModal";
import { BridgedIframe } from "../components/BridgedIframe";
import type { BridgedIframeHandle } from "../components/BridgedIframe";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import {
  appendRouteKeyToViewerPath,
  createDefaultViewerIntent,
  createFeatureIntent,
  isViewerFeature,
  updateViewerIntentLang,
  updateViewerIntentRegion,
} from "../navigation/viewerIntent";
import { useViewerIntent } from "../navigation/useViewerIntent";

const pages = [
  { id: "benefits", label: "Benefits" },
  { id: "travel", label: "Travel", disabled: true },
  { id: "concierge", label: "Concierge", disabled: true },
  { id: "watchlist", label: "Watchlist", disabled: true },
];

const DEFAULT_FOOTER_HEIGHT = 188;

type LayoutPhase =
  | "cold_loading"
  | "loading_with_previous_height"
  | "ready"
  | "error";

type ShellErrorState =
  | { type: "viewer"; code?: string; message?: string; retryable?: boolean }
  | { type: "invalid_intent"; message: string };

export const Main = () => {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    parsedViewerIntent,
    currentViewerIntent,
    effectiveViewerIntent,
    activePage,
    region,
    lang,
    defaultRegion,
    defaultLang,
    writeViewerIntent,
    shouldNavigate,
    markIntentApplied,
    resetAppliedIntent,
  } = useViewerIntent({ isAuthenticated, authLoading });

  const iframeRef = useRef<BridgedIframeHandle>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const signInResolveRef = useRef<((result: { refreshToken: string | null }) => void) | null>(null);
  const [lastMeasuredViewerHeight, setLastMeasuredViewerHeight] = useState<number | null>(null);
  const [layoutPhase, setLayoutPhase] = useState<LayoutPhase>("cold_loading");
  const [shellError, setShellError] = useState<ShellErrorState | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [activeRouteKey, setActiveRouteKey] = useState<string | null>(null);
  const activeRouteKeyRef = useRef<string | null>(null);
  const pendingContainerRouteKeyRef = useRef<string | null>(null);
  const [showLoadingCover, setShowLoadingCover] = useState(true);
  const [viewportHeight, setViewportHeight] = useState<number>(() => window.innerHeight);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(DEFAULT_FOOTER_HEIGHT);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const routeSettledTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (routeSettledTimeoutRef.current !== null) {
        window.clearTimeout(routeSettledTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (signInResolveRef.current) {
        signInResolveRef.current({ refreshToken: null });
        signInResolveRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nextHeight = Math.round(entry.contentRect.height);
        if (entry.target === headerRef.current) {
          setHeaderHeight(nextHeight);
        }
        if (entry.target === footerRef.current) {
          setFooterHeight(nextHeight);
        }
      }
    });

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }
    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => observer.disconnect();
  }, [layoutPhase]);

  const standardMainHeight = useMemo(
    () => Math.max(viewportHeight - headerHeight - footerHeight, 320),
    [footerHeight, headerHeight, viewportHeight],
  );

  const footerVisible = layoutPhase === "ready" || layoutPhase === "error";
  const isViewerTransitioning = layoutPhase === "loading_with_previous_height";
  const currentShellHeight = useMemo(() => {
    if (
      (layoutPhase === "ready" ||
        layoutPhase === "loading_with_previous_height" ||
        layoutPhase === "error") &&
      lastMeasuredViewerHeight
    ) {
      return Math.max(lastMeasuredViewerHeight, standardMainHeight);
    }

    return standardMainHeight;
  }, [lastMeasuredViewerHeight, layoutPhase, standardMainHeight]);

  const createRouteKey = useCallback(() => {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return `route-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }, []);

  const baseUrl = authService.getEmbeddedViewerUrl();

  const buildFeatureIframeUrl = useCallback(
    (feature: string, reg: string, lng: string, routeKey?: string | null) => {
      const params = new URLSearchParams({ lang: lng });
      if (routeKey) {
        params.set("routeKey", routeKey);
      }
      return `${baseUrl}#/${reg}/${feature}?${params.toString()}`;
    },
    [baseUrl],
  );

  const buildPathIframeUrl = useCallback(
    (path: string, routeKey?: string | null) => {
      const nextPath = routeKey ? appendRouteKeyToViewerPath(path, routeKey) : path;
      return `${baseUrl}#${nextPath}`;
    },
    [baseUrl],
  );

  const clearRouteSettledTimeout = useCallback(() => {
    if (routeSettledTimeoutRef.current !== null) {
      window.clearTimeout(routeSettledTimeoutRef.current);
      routeSettledTimeoutRef.current = null;
    }
  }, []);

  const armRouteSettledTimeout = useCallback((routeKey: string) => {
    clearRouteSettledTimeout();
    routeSettledTimeoutRef.current = window.setTimeout(() => {
      routeSettledTimeoutRef.current = null;
      setLayoutPhase((prev) => {
        if (prev !== "loading_with_previous_height") {
          return prev;
        }
        return activeRouteKeyRef.current === routeKey ? "ready" : prev;
      });
    }, 1500);
  }, [clearRouteSettledTimeout]);

  const prepareNavigation = useCallback(
    (isSameRouteIdentity: boolean, options?: { keepFooterVisible?: boolean }) => {
      const routeKey = createRouteKey();
      setActiveRouteKey(routeKey);
      activeRouteKeyRef.current = routeKey;
      pendingContainerRouteKeyRef.current = routeKey;
      setShellError(null);
      setShowLoadingCover(!isSameRouteIdentity);

      if (isSameRouteIdentity && lastMeasuredViewerHeight !== null) {
        setLayoutPhase("loading_with_previous_height");
        armRouteSettledTimeout(routeKey);
      } else if (!options?.keepFooterVisible) {
        setLayoutPhase("cold_loading");
      } else if (lastMeasuredViewerHeight !== null) {
        setLayoutPhase("loading_with_previous_height");
      }

      return routeKey;
    },
    [armRouteSettledTimeout, createRouteKey, lastMeasuredViewerHeight],
  );

  const navigateFeatureIntent = useCallback(
    async (
      feature: string,
      reg: string,
      lng: string,
      options?: { forceReload?: boolean; keepFooterVisible?: boolean },
    ) => {
      const isSameRouteIdentity =
        currentViewerIntent?.kind === "feature" &&
        currentViewerIntent.feature === feature &&
        currentViewerIntent.region === reg &&
        currentViewerIntent.lang === lng;
      const routeKey = prepareNavigation(isSameRouteIdentity, options);
      const nextIframeSrc = buildFeatureIframeUrl(feature, reg, lng, routeKey);

      if (options?.forceReload || !iframeRef.current || !iframeSrc) {
        setIframeSrc(nextIframeSrc);
        return;
      }

      try {
        await iframeRef.current?.goTo({
          feature,
          routeKey,
          params: { region: reg, lang: lng },
        });
      } catch {
        console.warn("[container] Bridge nav failed, falling back to src sync");
        setIframeSrc(nextIframeSrc);
      }
    },
    [buildFeatureIframeUrl, currentViewerIntent, iframeSrc, prepareNavigation],
  );

  const navigatePathIntent = useCallback(
    (
      path: string,
      options?: { keepFooterVisible?: boolean },
    ) => {
      const isSameRouteIdentity =
        currentViewerIntent?.kind === "path" && currentViewerIntent.path === path;
      const routeKey = prepareNavigation(isSameRouteIdentity, options);
      setIframeSrc(buildPathIframeUrl(path, routeKey));
    },
    [buildPathIframeUrl, currentViewerIntent, prepareNavigation],
  );

  useEffect(() => {
    if (authLoading) return;

    if (parsedViewerIntent.kind === "other-target") {
      clearRouteSettledTimeout();
      pendingContainerRouteKeyRef.current = null;
      setShowLoadingCover(false);
      setLayoutPhase("error");
      setShellError({
        type: "invalid_intent",
        message: `Unsupported target "${parsedViewerIntent.target}".`,
      });
      return;
    }

    if (parsedViewerIntent.kind === "invalid") {
      clearRouteSettledTimeout();
      pendingContainerRouteKeyRef.current = null;
      setShowLoadingCover(false);
      setLayoutPhase("error");
      setShellError({
        type: "invalid_intent",
        message: parsedViewerIntent.message,
      });
      return;
    }

    if (parsedViewerIntent.kind !== "viewer") return;

    setShellError((prev) => prev?.type === "invalid_intent" ? null : prev);

    if (!shouldNavigate(parsedViewerIntent.intent)) return;
    markIntentApplied(parsedViewerIntent.intent);

    if (parsedViewerIntent.intent.kind === "feature") {
      void navigateFeatureIntent(
        parsedViewerIntent.intent.feature,
        parsedViewerIntent.intent.region,
        parsedViewerIntent.intent.lang,
      );
      return;
    }

    navigatePathIntent(parsedViewerIntent.intent.path);
  }, [
    authLoading,
    clearRouteSettledTimeout,
    markIntentApplied,
    navigateFeatureIntent,
    navigatePathIntent,
    parsedViewerIntent,
    shouldNavigate,
  ]);

  const handleRouteError = useCallback((payload: {
    routeKey?: string;
    code?: string;
    message?: string;
    retryable?: boolean;
  }) => {
    if (
      payload.routeKey &&
      activeRouteKey &&
      payload.routeKey !== activeRouteKey &&
      payload.routeKey !== pendingContainerRouteKeyRef.current &&
      pendingContainerRouteKeyRef.current !== null
    ) {
      return;
    }

    setShellError({
      type: "viewer",
      code: payload.code,
      message: payload.message,
      retryable: payload.retryable,
    });
    clearRouteSettledTimeout();
    pendingContainerRouteKeyRef.current = null;
    setShowLoadingCover(false);
    setLayoutPhase("error");
  }, [activeRouteKey, clearRouteSettledTimeout]);

  const handleLoadError = useCallback(() => {
    handleRouteError({});
  }, [handleRouteError]);

  const handleRouteLoading = useCallback(({ routeKey }: { routeKey?: string }) => {
    if (routeKey && routeKey !== activeRouteKeyRef.current) {
      setActiveRouteKey(routeKey);
      activeRouteKeyRef.current = routeKey;
    }

    setShellError((prev) => prev?.type === "viewer" ? null : prev);
    setShowLoadingCover((prev) => (
      prev || routeKey !== pendingContainerRouteKeyRef.current
    ));
    setLayoutPhase((prev) => {
      if (routeKey !== pendingContainerRouteKeyRef.current) {
        return "cold_loading";
      }
      if (lastMeasuredViewerHeight !== null) return "loading_with_previous_height";
      return "cold_loading";
    });
  }, [lastMeasuredViewerHeight]);

  const handleLayoutStable = useCallback((payload: {
    routeKey?: string;
    height: number;
    stable?: boolean;
  }) => {
    if (
      payload.routeKey &&
      activeRouteKey &&
      payload.routeKey !== activeRouteKey &&
      payload.routeKey !== pendingContainerRouteKeyRef.current &&
      pendingContainerRouteKeyRef.current !== null
    ) {
      return;
    }

    const isStable = payload.stable ?? true;
    if (!isStable) {
      return;
    }

    if (payload.routeKey && payload.routeKey !== activeRouteKeyRef.current) {
      setActiveRouteKey(payload.routeKey);
      activeRouteKeyRef.current = payload.routeKey;
    }

    setLastMeasuredViewerHeight((prev) => {
      if (prev !== null && Math.abs(prev - payload.height) < 2) return prev;
      return payload.height;
    });
    clearRouteSettledTimeout();
    pendingContainerRouteKeyRef.current = null;
    setShellError((prev) => prev?.type === "viewer" ? null : prev);
    setShowLoadingCover(false);
    setLayoutPhase("ready");
  }, [activeRouteKey, clearRouteSettledTimeout]);

  const doLogout = useCallback(async () => {
    await logout();
    setShowSignIn(false);
    setRetryKey((k) => k + 1);
    resetAppliedIntent();
    writeViewerIntent(createFeatureIntent("landing", region, lang));
  }, [lang, logout, region, resetAppliedIntent, writeViewerIntent]);

  const handleSessionClear = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      return;
    }
    await doLogout();
  }, [doLogout]);

  const handleLogout = useCallback(async () => {
    try {
      await doLogout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [doLogout]);

  const handleSignInSuccess = () => {
    setShowSignIn(false);
    if (signInResolveRef.current) {
      const token = authService.getRefreshToken();
      signInResolveRef.current({ refreshToken: token });
      signInResolveRef.current = null;
      return;
    }

    writeViewerIntent(createFeatureIntent("home", region, lang));
  };

  const handleSignInClose = () => {
    setShowSignIn(false);
    if (signInResolveRef.current) {
      signInResolveRef.current({ refreshToken: null });
      signInResolveRef.current = null;
    }
  };

  const handleSignInRequest = useCallback(async (): Promise<{ refreshToken: string | null }> => {
    return new Promise((resolve) => {
      signInResolveRef.current = resolve;
      setShowSignIn(true);
    });
  }, []);

  const handlePageNavigation = useCallback(
    (pageId: string) => {
      if (!isViewerFeature(pageId)) {
        console.warn(`[container] No viewer route for "${pageId}"`);
        return;
      }

      writeViewerIntent(createFeatureIntent(pageId, region, lang));
    },
    [lang, region, writeViewerIntent],
  );

  const handleCountryChange = useCallback(
    (slug: string) => {
      if (slug === region) return;
      localStorage.setItem("preferredRegion", slug);
      const nextIntent = effectiveViewerIntent
        ? updateViewerIntentRegion(effectiveViewerIntent, slug, {
            region: defaultRegion,
            lang: defaultLang,
          })
        : createDefaultViewerIntent(isAuthenticated, {
            region: slug,
            lang,
          });
      writeViewerIntent(nextIntent);
    },
    [defaultLang, defaultRegion, effectiveViewerIntent, isAuthenticated, lang, region, writeViewerIntent],
  );

  const handleLangChange = useCallback(
    (newLang: string) => {
      if (newLang === lang) return;
      localStorage.setItem("preferredLang", newLang);
      const nextIntent = effectiveViewerIntent
        ? updateViewerIntentLang(effectiveViewerIntent, newLang, {
            region: defaultRegion,
            lang: defaultLang,
          })
        : createDefaultViewerIntent(isAuthenticated, {
            region,
            lang: newLang,
          });
      writeViewerIntent(nextIntent);
    },
    [defaultLang, defaultRegion, effectiveViewerIntent, isAuthenticated, lang, region, writeViewerIntent],
  );

  const handleRetry = useCallback(() => {
    if (shellError?.type === "invalid_intent") {
      writeViewerIntent(
        createDefaultViewerIntent(isAuthenticated, {
          region: defaultRegion,
          lang: defaultLang,
        }),
      );
      return;
    }

    if (!currentViewerIntent) {
      return;
    }

    setRetryKey((k) => k + 1);
    resetAppliedIntent();

    if (currentViewerIntent.kind === "feature") {
      void navigateFeatureIntent(
        currentViewerIntent.feature,
        currentViewerIntent.region,
        currentViewerIntent.lang,
        { forceReload: true, keepFooterVisible: layoutPhase === "error" },
      );
      return;
    }

    navigatePathIntent(currentViewerIntent.path, {
      keepFooterVisible: layoutPhase === "error",
    });
  }, [
    currentViewerIntent,
    defaultLang,
    defaultRegion,
    isAuthenticated,
    layoutPhase,
    navigateFeatureIntent,
    navigatePathIntent,
    resetAppliedIntent,
    shellError,
    writeViewerIntent,
  ]);

  const shellStyle = useMemo(
    () => ({ minHeight: `${currentShellHeight}px` }),
    [currentShellHeight],
  );
  const errorOffset = Math.max(Math.round(currentShellHeight * 0.382 - 72), 40);
  const showPlaceholder =
    layoutPhase === "cold_loading" ||
    (layoutPhase === "loading_with_previous_height" && showLoadingCover);
  const showError = layoutPhase === "error" && !!shellError;
  const errorMessage = shellError?.message || "The content couldn't be loaded. Please try again.";
  const errorActionLabel = shellError?.type === "invalid_intent" ? "Reset URL" : "Retry";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[10002] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#1a1f36] focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div ref={headerRef}>
        <Navbar
          pages={pages}
          activePage={activePage}
          isAuthenticated={isAuthenticated}
          user={user ?? undefined}
          onPageClick={(id) => {
            if (id === activePage) return;
            void handlePageNavigation(id);
          }}
          onAccountItemClick={(itemId) => {
            if (itemId === "sign-out") {
              void handleLogout();
            }
          }}
          onLogoutClick={() => {
            void handleLogout();
          }}
          onSignInClick={() => {
            setShowSignIn(true);
          }}
          onLogoClick={() => {
            if (activePage !== "home") {
              void handlePageNavigation("home");
            }
          }}
        />
      </div>

      <main id="main-content" tabIndex={-1} className="flex-none">
        <div className="relative bg-white" style={shellStyle}>
          {iframeSrc && (
            <BridgedIframe
              key={retryKey}
              ref={iframeRef}
              src={iframeSrc}
              className="w-full border-0"
              onLoadError={handleLoadError}
              onRouteLoading={handleRouteLoading}
              onRouteError={handleRouteError}
              onLayoutStable={handleLayoutStable}
              onSessionClear={handleSessionClear}
              onSignInRequest={handleSignInRequest}
              style={{ height: `${currentShellHeight}px` }}
            />
          )}

          {showPlaceholder && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-400" />
            </div>
          )}

          {showError && (
            <div className="absolute inset-0 bg-white px-6 md:px-10">
              <div
                className="mx-auto flex max-w-md flex-col items-center gap-4 text-center"
                style={{ paddingTop: `${errorOffset}px` }}
              >
                <p className="text-sm leading-6 text-slate-500">
                  {errorMessage}
                </p>
                <button
                  onClick={handleRetry}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
                >
                  {errorActionLabel}
                </button>
              </div>
            </div>
          )}

          {isViewerTransitioning && !showError && (
            <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-slate-50/96 px-3.5 py-2 text-xs font-medium text-slate-500 shadow-sm backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                Updating content
              </div>
            </div>
          )}
        </div>
      </main>

      {footerVisible && (
        <div ref={footerRef}>
          <Footer
            lang={lang}
            onLangChange={handleLangChange}
            country={region}
            onCountryChange={handleCountryChange}
            disabled={isViewerTransitioning}
          />
        </div>
      )}

      {showSignIn && (
        <SignInModal
          onClose={handleSignInClose}
          onSuccess={handleSignInSuccess}
        />
      )}
    </div>
  );
};
