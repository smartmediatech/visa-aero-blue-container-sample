import { useState, useRef, useCallback } from "react";
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

export const Main = () => {
  const [loading, setLoading] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const iframeRef = useRef<BridgedIframeHandle>(null);
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
  const [iframeHeight, setIframeHeight] = useState<number | null>(null);
  const [viewerError, setViewerError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = useCallback(() => {
    setViewerError(false);
    setRetryKey((k) => k + 1);
  }, []);

  const handleLoadError = useCallback(() => setViewerError(true), []);

  const handleHeightChange = useCallback((height: number) => {
    setIframeHeight((prev) => {
      if (prev !== null && Math.abs(prev - height) < 2) return prev;
      return height;
    });
  }, []);

  const baseUrl = authService.getEmbeddedViewerUrl();

  // Build iframe URL from current region, page, and language
  const buildIframeUrl = useCallback(
    (page: string, reg: string, lng: string) => {
      const url = `${baseUrl}#/${reg}/${page}?lang=${lng}`;
      return url;
    },
    [baseUrl],
  );

  const [iframeSrc, setIframeSrc] = useState(() =>
    buildIframeUrl(activePage, region, lang),
  );

  const navigateIframe = useCallback(
    (page: string, reg: string, lng: string) => {
      setIframeHeight(null);
      setViewerError(false);
      setIframeSrc(buildIframeUrl(page, reg, lng));
    },
    [buildIframeUrl],
  );

  const handleSessionClear = useCallback(async () => {
    // The SDK fires session.clear both for intentional logouts AND as error
    // recovery when it gets a 401 during token exchange (e.g. auto-fetch on
    // an unauthenticated page).  Only treat it as a real logout when we
    // actually have tokens to clear — otherwise it's a no-op "I have no
    // session" signal that shouldn't disrupt the UI.
    if (!authService.isAuthenticated()) {
      return;
    }
    await logout();
    navigateIframe("landing", region, lang);
    setPage("landing");
    setShowSignIn(false);
  }, [logout, navigateIframe, region, lang]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      // Navigate iframe to landing page and force a full remount so the
      // viewer's in-memory session state is discarded.  A hash-only src
      // change doesn't reload the iframe, so the SDK would still have
      // the old user — causing LandingPage's auth guard to redirect
      // straight back to home.
      navigateIframe("landing", region, lang);
      setPage("landing");
      setRetryKey((k) => k + 1);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignInSuccess = () => {
    setShowSignIn(false);
    // Resolve any pending bridge sign-in request
    if (signInResolveRef.current) {
      const token = authService.getRefreshToken();
      signInResolveRef.current({ refreshToken: token });
      signInResolveRef.current = null;
      return;
    }
    // Navigate iframe to home (authenticated landing)
    navigateIframe("home", region, lang);
    setPage("home");
  };

  const handleSignInClose = () => {
    setShowSignIn(false);
    // Resolve with null if the user dismissed the modal
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
      // Only navigate pages that exist in the viewer
      const viewerPages = ["benefits", "travel", "concierge", "watchlist", "home", "landing"];
      if (!viewerPages.includes(pageId)) {
        console.warn(`[container] No viewer route for "${pageId}"`);
        return;
      }
      // Use bridge navigation (no iframe reload) when the bridge is connected.
      // Falls back to src-based navigation if the bridge isn't ready.
      try {
        await iframeRef.current?.goTo({
          feature: pageId,
          params: { region, lang },
        });
        setPage(pageId);
      } catch {
        console.warn("[container] Bridge nav failed, falling back to src reload");
        navigateIframe(pageId, region, lang);
        setPage(pageId);
      }
    },
    [navigateIframe, region, lang],
  );

  const handleCountryChange = useCallback(
    (slug: string) => {
      setRegion(slug);
      localStorage.setItem("preferredRegion", slug);
      navigateIframe(activePage, slug, lang);
    },
    [navigateIframe, activePage, lang],
  );

  const handleLangChange = useCallback(
    (newLang: string) => {
      setLang(newLang);
      localStorage.setItem("preferredLang", newLang);
      navigateIframe(activePage, region, newLang);
    },
    [navigateIframe, activePage, region],
  );

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <Navbar
        pages={pages}
        activePage={activePage}
        isAuthenticated={isAuthenticated}
        user={user ?? undefined}
        onPageClick={(id) => {
          if (id === activePage) return;
          handlePageNavigation(id);
        }}
        onAccountItemClick={(itemId) => {
          if (itemId === "sign-out") {
            handleLogout();
          }
        }}
        onLogoutClick={() => {
          handleLogout();
        }}
        onSignInClick={() => {
          setShowSignIn(true);
        }}
        onLogoClick={() => {
          if (activePage !== "home") handlePageNavigation("home");
        }}
      />

      {/* Main Content - Iframe */}
      <main className="flex-1">
        {viewerError ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center px-4">
            <p className="text-gray-600 text-base">
              The content couldn't be loaded. Please try again.
            </p>
            <button
              onClick={handleRetry}
              className="px-5 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <BridgedIframe
            key={retryKey}
            ref={iframeRef}
            src={iframeSrc}
            className="w-full border-0"
            onHeightChange={handleHeightChange}
            onLoadError={handleLoadError}
            onSessionClear={handleSessionClear}
            onSignInRequest={handleSignInRequest}
            style={{ height: iframeHeight ? `${iframeHeight}px` : "100vh" }}
          />
        )}
      </main>

      {/* Footer */}
      <Footer lang={lang} onLangChange={handleLangChange} country={region} onCountryChange={handleCountryChange} />

      {/* Sign-in modal */}
      <SignInModal
        open={showSignIn}
        onClose={handleSignInClose}
        onSuccess={handleSignInSuccess}
      />
    </div>
  );
};
