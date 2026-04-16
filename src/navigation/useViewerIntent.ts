import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  createDefaultViewerIntent,
  getViewerIntentKey,
  getViewerPathMetadata,
  parseViewerIntentHash,
  serializeViewerIntentHash,
  type ParsedViewerIntent,
  type ViewerIntent,
} from "./viewerIntent";

const DEFAULT_REGION = "germany";
const DEFAULT_LANG = "en";

interface UseViewerIntentOptions {
  isAuthenticated: boolean;
  authLoading: boolean;
}

export function useViewerIntent({ isAuthenticated, authLoading }: UseViewerIntentOptions) {
  const [locationHash, setLocationHash] = useState<string>(() => window.location.hash || "");
  const lastAppliedIntentKeyRef = useRef<string | null>(null);

  const defaultRegion = localStorage.getItem("preferredRegion") || DEFAULT_REGION;
  const defaultLang = localStorage.getItem("preferredLang") || DEFAULT_LANG;

  // Sync hash from browser navigation
  useEffect(() => {
    const syncHash = () => setLocationHash(window.location.hash || "");
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, []);

  // Parse intent from current hash
  const parsedViewerIntent = useMemo(
    () =>
      parseViewerIntentHash(locationHash, {
        region: defaultRegion,
        lang: defaultLang,
      }),
    [defaultLang, defaultRegion, locationHash],
  );

  const currentViewerIntent =
    parsedViewerIntent.kind === "viewer" ? parsedViewerIntent.intent : null;

  const fallbackViewerIntent = useMemo(
    () =>
      createDefaultViewerIntent(isAuthenticated, {
        region: defaultRegion,
        lang: defaultLang,
      }),
    [defaultLang, defaultRegion, isAuthenticated],
  );

  const effectiveViewerIntent = currentViewerIntent ?? fallbackViewerIntent;

  const shellMetadata = useMemo(
    () =>
      getViewerPathMetadata(effectiveViewerIntent, {
        region: defaultRegion,
        lang: defaultLang,
      }),
    [effectiveViewerIntent, defaultLang, defaultRegion],
  );

  // Write intent to browser hash
  const updateBrowserHash = useCallback((nextHash: string, replace = false) => {
    if (window.location.hash === nextHash) {
      return;
    }

    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history[replace ? "replaceState" : "pushState"](null, "", nextUrl);
    setLocationHash(nextHash);
  }, []);

  const writeViewerIntent = useCallback(
    (intent: ViewerIntent, replace = false) => {
      updateBrowserHash(serializeViewerIntentHash(intent), replace);
    },
    [updateBrowserHash],
  );

  // Auto-normalize URL: empty hash → default intent, non-canonical → canonical
  useEffect(() => {
    if (authLoading) return;

    if (parsedViewerIntent.kind === "none") {
      writeViewerIntent(fallbackViewerIntent, true);
      return;
    }

    if (
      parsedViewerIntent.kind === "viewer" &&
      parsedViewerIntent.canonicalHash !== locationHash
    ) {
      updateBrowserHash(parsedViewerIntent.canonicalHash, true);
    }
  }, [
    authLoading,
    fallbackViewerIntent,
    locationHash,
    parsedViewerIntent,
    updateBrowserHash,
    writeViewerIntent,
  ]);

  // Navigation dedup helpers
  const shouldNavigate = useCallback((intent: ViewerIntent) => {
    return lastAppliedIntentKeyRef.current !== getViewerIntentKey(intent);
  }, []);

  const markIntentApplied = useCallback((intent: ViewerIntent) => {
    lastAppliedIntentKeyRef.current = getViewerIntentKey(intent);
  }, []);

  const resetAppliedIntent = useCallback(() => {
    lastAppliedIntentKeyRef.current = null;
  }, []);

  return {
    parsedViewerIntent,
    currentViewerIntent,
    effectiveViewerIntent,
    activePage: shellMetadata.activeFeature,
    region: shellMetadata.region,
    lang: shellMetadata.lang,
    defaultRegion,
    defaultLang,
    writeViewerIntent,
    shouldNavigate,
    markIntentApplied,
    resetAppliedIntent,
  };
}
