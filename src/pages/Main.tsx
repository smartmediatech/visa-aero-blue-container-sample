import { useState, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { SignInModal } from "../components/SignInModal";
import { BridgedIframe } from "../components/BridgedIframe";
import type { BridgedIframeHandle } from "../components/BridgedIframe";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import { DevOverlay } from "../components/DevOverlay";

const pages = [
  { id: "benefits", label: "Benefits" },
  { id: "travel", label: "Travel" },
  { id: "concierge", label: "Concierge" },
  { id: "watchlist", label: "Watchlist" },
];

/*
 * --------------------------------------------------------------------------
 * TODO: Proper bridge-based navigation (Option B)
 * --------------------------------------------------------------------------
 * Currently navigation works by setting the iframe src directly (Option A).
 * This causes a full iframe reload on each tab click.
 *
 * The intended architecture is for navigation to go through the bridge:
 *
 * 1. The viewer app (visa-aero-blue-viewer) needs to:
 *    a. Load smt-base-bridge.min.js in its index.html
 *    b. Initialize a ChildBridge in its entry point:
 *         const bridge = new window.SMTBaseBridge.ChildBridge({
 *           origin: '<container-origin>',
 *           meta: {},
 *         });
 *    c. Register a navigation.go handler that maps feature names to routes:
 *         bridge.addRequestHandler('navigation.go', async ({ payload }) => {
 *           const { feature } = payload;
 *           // Use react-router's navigate() to switch routes internally
 *           // e.g. feature "benefits" → navigate("/global/benefits")
 *           return { feature };
 *         });
 *
 * 2. The container (this file) would then use the bridge instead of src:
 *         await iframeRef.current?.goTo({ feature: "benefits" });
 *    This avoids iframe reloads and enables smooth in-app transitions.
 *
 * 3. The viewer should also register a session.get handler so it can
 *    request the refresh token from the container on startup.
 *
 * See embedded-viewer-example for a working reference of this pattern,
 * specifically its BridgedIframe.tsx and Discover.tsx components.
 * --------------------------------------------------------------------------
 */

export const Main = () => {
  const [loading, setLoading] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const iframeRef = useRef<BridgedIframeHandle>(null);
  const [activePage, setPage] = useState<string>(() =>
    authService.isAuthenticated() ? "home" : "landing"
  );
  const [region, setRegion] = useState<string>("germany");
  const [lang, setLang] = useState<string>("en");
  const [showSignIn, setShowSignIn] = useState(false);
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
      console.log("[container] buildUrl:", url);
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
    await logout();
    navigateIframe("landing", region, lang);
    setPage("landing");
    setShowSignIn(false);
  }, [logout, navigateIframe, region, lang]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      // Navigate iframe to landing page
      navigateIframe("landing", region, lang);
      setPage("landing");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignInSuccess = () => {
    setShowSignIn(false);
    // Navigate iframe to home (authenticated landing)
    navigateIframe("home", region, lang);
    setPage("home");
  };

  const handlePageNavigation = useCallback(
    (pageId: string) => {
      // Only navigate pages that exist in the viewer
      const viewerPages = ["benefits", "travel", "concierge", "watchlist", "home", "landing"];
      if (!viewerPages.includes(pageId)) {
        console.warn(`[container] No viewer route for "${pageId}"`);
        return;
      }
      navigateIframe(pageId, region, lang);
      setPage(pageId);
    },
    [navigateIframe, region, lang],
  );

  const handleRegionChange = useCallback(
    (newRegion: string) => {
      setRegion(newRegion);
      navigateIframe(activePage, newRegion, lang);
    },
    [navigateIframe, activePage, lang],
  );

  const handleLangChange = useCallback(
    (newLang: string) => {
      setLang(newLang);
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
          } else {
            console.log(`[container] Account action: ${itemId}`);
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
            style={{ height: iframeHeight ? `${iframeHeight}px` : "100vh" }}
          />
        )}
      </main>

      {/* Footer */}
      <Footer lang={lang} onLangChange={handleLangChange} />

      {/* Dev tools */}
      <DevOverlay
        region={region}
        lang={lang}
        activePage={activePage}
        onRegionChange={handleRegionChange}
        onLangChange={handleLangChange}
      />

      {/* Sign-in modal */}
      <SignInModal
        open={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSuccess={handleSignInSuccess}
      />
    </div>
  );
};
