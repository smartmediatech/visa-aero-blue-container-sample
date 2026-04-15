import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { SignInModal } from "../components/SignInModal";
import { BridgedIframe } from "../components/BridgedIframe";
import type { BridgedIframeHandle } from "../components/BridgedIframe";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";

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

interface ViewerErrorState {
  code?: string;
  message?: string;
  retryable?: boolean;
}


export const Main = () => {
  const [loading, setLoading] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const iframeRef = useRef<BridgedIframeHandle>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const [activePage, setPage] = useState<string>(() =>
    authService.isAuthenticated() ? "home" : "landing"
  );
  const [region, setRegion] = useState<string>(
    () => localStorage.getItem("preferredRegion") || "germany",
  );
  const [lang, setLang] = useState<string>(
    () => localStorage.getItem("preferredLang") || "en",
  );
  const [showSignIn, setShowSignIn] = useState(false);
  const signInResolveRef = useRef<((result: { refreshToken: string | null }) => void) | null>(null);
  const [lastMeasuredViewerHeight, setLastMeasuredViewerHeight] = useState<number | null>(null);
  const [layoutPhase, setLayoutPhase] = useState<LayoutPhase>("cold_loading");
  const [viewerError, setViewerError] = useState<ViewerErrorState | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [activeRouteKey, setActiveRouteKey] = useState<string | null>(null);
  const activeRouteKeyRef = useRef<string | null>(null);
  const pendingContainerRouteKeyRef = useRef<string | null>(null);
  const [showLoadingCover, setShowLoadingCover] = useState(true);
  const [viewportHeight, setViewportHeight] = useState<number>(() => window.innerHeight);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(DEFAULT_FOOTER_HEIGHT);
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

  const buildIframeUrl = useCallback(
    (page: string, reg: string, lng: string, routeKey?: string | null) => {
      const params = new URLSearchParams({ lang: lng });
      if (routeKey) {
        params.set("routeKey", routeKey);
      }
      return `${baseUrl}#/${reg}/${page}?${params.toString()}`;
    },
    [baseUrl],
  );

  const initialRouteKey = useRef(createRouteKey());
  const [iframeSrc, setIframeSrc] = useState(() =>
    buildIframeUrl(activePage, region, lang, initialRouteKey.current),
  );

  useEffect(() => {
    setActiveRouteKey(initialRouteKey.current);
    activeRouteKeyRef.current = initialRouteKey.current;
  }, []);

  const navigateIframe = useCallback(
    (page: string, reg: string, lng: string, routeKey?: string | null) => {
      setViewerError(null);
      setIframeSrc(buildIframeUrl(page, reg, lng, routeKey));
    },
    [buildIframeUrl],
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

  const startNavigation = useCallback(
    async (
      page: string,
      reg: string,
      lng: string,
      options?: { forceReload?: boolean; keepFooterVisible?: boolean },
    ) => {
      const isSameRouteIdentity =
        page === activePage && reg === region && lng === lang;
      const routeKey = createRouteKey();
      setActiveRouteKey(routeKey);
      activeRouteKeyRef.current = routeKey;
      pendingContainerRouteKeyRef.current = routeKey;
      setViewerError(null);
      setShowLoadingCover(!isSameRouteIdentity);

      if (isSameRouteIdentity && lastMeasuredViewerHeight !== null) {
        setLayoutPhase("loading_with_previous_height");
        armRouteSettledTimeout(routeKey);
      } else if (!options?.keepFooterVisible) {
        setLayoutPhase("cold_loading");
      } else if (lastMeasuredViewerHeight !== null) {
        setLayoutPhase("loading_with_previous_height");
      }

      if (options?.forceReload) {
        navigateIframe(page, reg, lng, routeKey);
        return;
      }

      try {
        await iframeRef.current?.goTo({
          feature: page,
          routeKey,
          params: { region: reg, lang: lng },
        });
      } catch {
        console.warn("[container] Bridge nav failed, falling back to src sync");
        navigateIframe(page, reg, lng, routeKey);
      }
    },
    [activePage, armRouteSettledTimeout, createRouteKey, lang, lastMeasuredViewerHeight, navigateIframe, region],
  );

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

    setViewerError({
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

    setViewerError(null);
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
    setViewerError(null);
    setShowLoadingCover(false);
    setLayoutPhase("ready");
  }, [activeRouteKey, clearRouteSettledTimeout]);

  const handleSessionClear = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      return;
    }

    await logout();
    setPage("landing");
    setShowSignIn(false);
    setRetryKey((k) => k + 1);
    await startNavigation("landing", region, lang, {
      forceReload: true,
      keepFooterVisible: lastMeasuredViewerHeight !== null,
    });
  }, [lang, lastMeasuredViewerHeight, logout, region, startNavigation]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setPage("landing");
      setRetryKey((k) => k + 1);
      await startNavigation("landing", region, lang, {
        forceReload: true,
        keepFooterVisible: lastMeasuredViewerHeight !== null,
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignInSuccess = () => {
    setShowSignIn(false);
    if (signInResolveRef.current) {
      const token = authService.getRefreshToken();
      signInResolveRef.current({ refreshToken: token });
      signInResolveRef.current = null;
      return;
    }

    setPage("home");
    void startNavigation("home", region, lang);
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
    async (pageId: string) => {
      const viewerPages = ["benefits", "travel", "concierge", "watchlist", "home", "landing"];
      if (!viewerPages.includes(pageId)) {
        console.warn(`[container] No viewer route for "${pageId}"`);
        return;
      }

      setPage(pageId);
      await startNavigation(pageId, region, lang);
    },
    [lang, region, startNavigation],
  );

  const handleCountryChange = useCallback(
    (slug: string) => {
      if (slug === region) return;
      setRegion(slug);
      localStorage.setItem("preferredRegion", slug);
      void startNavigation(activePage, slug, lang, {
        keepFooterVisible: layoutPhase === "error",
      });
    },
    [activePage, lang, layoutPhase, region, startNavigation],
  );

  const handleLangChange = useCallback(
    (newLang: string) => {
      if (newLang === lang) return;
      setLang(newLang);
      localStorage.setItem("preferredLang", newLang);
      void startNavigation(activePage, region, newLang, {
        keepFooterVisible: layoutPhase === "error",
      });
    },
    [activePage, lang, layoutPhase, region, startNavigation],
  );

  const handleRetry = useCallback(() => {
    setRetryKey((k) => k + 1);
    void startNavigation(activePage, region, lang, {
      forceReload: true,
      keepFooterVisible: layoutPhase === "error",
    });
  }, [activePage, lang, layoutPhase, region, startNavigation]);

  const shellStyle = useMemo(
    () => ({ minHeight: `${currentShellHeight}px` }),
    [currentShellHeight],
  );
  const errorOffset = Math.max(Math.round(currentShellHeight * 0.382 - 72), 40);
  const showPlaceholder =
    layoutPhase === "cold_loading" ||
    (layoutPhase === "loading_with_previous_height" && showLoadingCover);
  const showError = layoutPhase === "error" && !!viewerError;
  const errorMessage = viewerError?.message || "The content couldn't be loaded. Please try again.";

  return (
    <div className="flex min-h-screen flex-col bg-white">
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

      <main className="flex-none">
        <div className="relative bg-white" style={shellStyle}>
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
                  Retry
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

      <SignInModal
        open={showSignIn}
        onClose={handleSignInClose}
        onSuccess={handleSignInSuccess}
      />
    </div>
  );
};
