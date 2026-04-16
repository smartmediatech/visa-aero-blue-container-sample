export const VIEWER_TARGET = "smt-viewer" as const;

export const VIEWER_FEATURES = ["landing", "home", "benefits"] as const;

export type ViewerFeature = (typeof VIEWER_FEATURES)[number];

export type ViewerFeatureIntent = {
  target: typeof VIEWER_TARGET;
  kind: "feature";
  feature: ViewerFeature;
  region: string;
  lang: string;
};

export type ViewerPathIntent = {
  target: typeof VIEWER_TARGET;
  kind: "path";
  path: string;
};

export type ViewerIntent = ViewerFeatureIntent | ViewerPathIntent;

type ViewerOfferPathOptions = {
  region: string;
  lang?: string;
};

type ViewerOfferIdPathOptions = ViewerOfferPathOptions & {
  offerId: string;
};

type ViewerSmtIdPathOptions = ViewerOfferPathOptions & {
  smtId: string;
  smtTemplate: string;
};

export type ParsedViewerIntent =
  | { kind: "none" }
  | { kind: "other-target"; target: string }
  | { kind: "invalid"; message: string }
  | { kind: "viewer"; intent: ViewerIntent; canonicalHash: string };

type ViewerIntentDefaults = {
  region: string;
  lang: string;
};

type ViewerPathMetadata = {
  region: string;
  lang: string;
  activeFeature?: ViewerFeature;
};

export function createFeatureIntent(
  feature: ViewerFeature,
  region: string,
  lang: string,
): ViewerFeatureIntent {
  return { target: VIEWER_TARGET, kind: "feature", feature, region, lang };
}

export function createDefaultViewerIntent(
  isAuthenticated: boolean,
  defaults: ViewerIntentDefaults,
): ViewerFeatureIntent {
  return createFeatureIntent(
    isAuthenticated ? "home" : "landing",
    defaults.region,
    defaults.lang,
  );
}

export function parseViewerIntentHash(
  hash: string,
  defaults: ViewerIntentDefaults,
): ParsedViewerIntent {
  const params = getHashSearchParams(hash);
  if (!params) {
    return { kind: "none" };
  }

  const target = params.get("target");
  if (!target) {
    return { kind: "none" };
  }

  if (target !== VIEWER_TARGET) {
    return { kind: "other-target", target };
  }

  const feature = params.get("feature");
  const path = params.get("path");

  if (feature && path) {
    return {
      kind: "invalid",
      message: "The smt-viewer URL must specify either feature or path, not both.",
    };
  }

  if (!feature && !path) {
    return {
      kind: "invalid",
      message: "The smt-viewer URL is missing a destination.",
    };
  }

  if (path) {
    if (!path.startsWith("/")) {
      return {
        kind: "invalid",
        message: "The smt-viewer path must begin with '/'.",
      };
    }

    const intent: ViewerPathIntent = {
      target: VIEWER_TARGET,
      kind: "path",
      path,
    };

    return {
      kind: "viewer",
      intent,
      canonicalHash: serializeViewerIntentHash(intent),
    };
  }

  if (!isViewerFeature(feature)) {
    return {
      kind: "invalid",
      message: `Unsupported smt-viewer feature "${feature}".`,
    };
  }

  const region = params.get("region") || defaults.region;
  const lang = params.get("lang") || defaults.lang;

  const intent: ViewerFeatureIntent = {
    target: VIEWER_TARGET,
    kind: "feature",
    feature,
    region,
    lang,
  };

  return {
    kind: "viewer",
    intent,
    canonicalHash: serializeViewerIntentHash(intent),
  };
}

export function serializeViewerIntentHash(intent: ViewerIntent): string {
  const params = new URLSearchParams();
  params.set("target", intent.target);

  if (intent.kind === "feature") {
    params.set("feature", intent.feature);
    params.set("region", intent.region);
    params.set("lang", intent.lang);
  } else {
    params.set("path", intent.path);
  }

  return `#/?${params.toString()}`;
}

export function getViewerIntentKey(intent: ViewerIntent): string {
  return intent.kind === "feature"
    ? `feature:${intent.feature}:${intent.region}:${intent.lang}`
    : `path:${intent.path}`;
}

export function getViewerPathMetadata(
  intent: ViewerIntent | null,
  defaults: ViewerIntentDefaults,
): ViewerPathMetadata {
  if (!intent) {
    return {
      region: defaults.region,
      lang: defaults.lang,
    };
  }

  if (intent.kind === "feature") {
    return {
      region: intent.region,
      lang: intent.lang,
      activeFeature: intent.feature,
    };
  }

  return extractPathMetadata(intent.path, defaults);
}

export function updateViewerIntentRegion(
  intent: ViewerIntent,
  region: string,
  defaults: ViewerIntentDefaults,
): ViewerIntent {
  if (intent.kind === "feature") {
    return { ...intent, region };
  }

  const metadata = extractPathMetadata(intent.path, defaults);
  return {
    ...intent,
    path: rewriteViewerPath(intent.path, { region, lang: metadata.lang }),
  };
}

export function updateViewerIntentLang(
  intent: ViewerIntent,
  lang: string,
  defaults: ViewerIntentDefaults,
): ViewerIntent {
  if (intent.kind === "feature") {
    return { ...intent, lang };
  }

  const metadata = extractPathMetadata(intent.path, defaults);
  return {
    ...intent,
    path: rewriteViewerPath(intent.path, { region: metadata.region, lang }),
  };
}

export function appendRouteKeyToViewerPath(path: string, routeKey: string): string {
  const url = new URL(path, "https://container.local");
  url.searchParams.set("routeKey", routeKey);
  return `${url.pathname}${url.search}`;
}

export function buildViewerOfferPath({
  region,
  offerId,
  lang,
}: ViewerOfferIdPathOptions): string;
export function buildViewerOfferPath({
  region,
  smtId,
  smtTemplate,
  lang,
}: ViewerSmtIdPathOptions): string;
export function buildViewerOfferPath(
  options: ViewerOfferIdPathOptions | ViewerSmtIdPathOptions,
): string {
  const url = new URL(`/${options.region}/offer/${getOfferPathId(options)}`, "https://container.local");

  if (options.lang) {
    url.searchParams.set("lang", options.lang);
  }

  if ("smtTemplate" in options) {
    url.searchParams.set("smtTemplate", options.smtTemplate);
  }

  return `${url.pathname}${url.search}`;
}

function getHashSearchParams(hash: string): URLSearchParams | null {
  const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const searchIndex = normalizedHash.indexOf("?");
  if (searchIndex === -1) {
    return null;
  }

  const search = normalizedHash.slice(searchIndex + 1);
  return new URLSearchParams(search);
}

export function isViewerFeature(feature: string | null): feature is ViewerFeature {
  return !!feature && VIEWER_FEATURES.includes(feature as ViewerFeature);
}

function extractPathMetadata(
  path: string,
  defaults: ViewerIntentDefaults,
): ViewerPathMetadata {
  const url = new URL(path, "https://container.local");
  const segments = url.pathname.split("/").filter(Boolean);
  const region = segments[0] || defaults.region;
  const maybeFeature = segments[1];
  const lang = url.searchParams.get("lang") || defaults.lang;

  return {
    region,
    lang,
    activeFeature: isViewerFeature(maybeFeature) ? maybeFeature : undefined,
  };
}

function rewriteViewerPath(
  path: string,
  next: { region: string; lang: string },
): string {
  const url = new URL(path, "https://container.local");
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    segments.push(next.region);
  } else {
    segments[0] = next.region;
  }

  url.pathname = `/${segments.join("/")}`;
  url.searchParams.set("lang", next.lang);
  return `${url.pathname}${url.search}`;
}

function getOfferPathId(
  options: ViewerOfferIdPathOptions | ViewerSmtIdPathOptions,
): string {
  return "offerId" in options ? options.offerId : options.smtId;
}
