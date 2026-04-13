import { useState } from "react";
import clsx from "clsx";

interface DevOverlayProps {
  region: string;
  lang: string;
  activePage: string;
  onRegionChange: (region: string) => void;
  onLangChange: (lang: string) => void;
}

const REGIONS = [
  { value: "germany", label: "Germany" },
  { value: "france", label: "France" },
  { value: "unknown", label: "Unknown" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "it", label: "Italian" },
  { value: "ar", label: "Arabic" },
];

export function DevOverlay({
  region,
  lang,
  activePage,
  onRegionChange,
  onLangChange,
}: DevOverlayProps) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div
      className={clsx(
        "fixed bottom-4 right-4 z-[9999]",
        "bg-[#18181b] text-white rounded-xl shadow-2xl",
        "font-mono text-xs",
        collapsed ? "p-2 cursor-pointer" : "p-4 w-64",
      )}
      onClick={collapsed ? () => setCollapsed(false) : undefined}
    >
      {collapsed ? (
        <span className="text-[10px] opacity-70">DEV</span>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
              Dev Tools
            </span>
            <button
              className="text-white/40 hover:text-white text-sm leading-none cursor-pointer"
              onClick={() => setCollapsed(true)}
            >
              &times;
            </button>
          </div>

          {/* Current state */}
          <div className="mb-3 text-[10px] text-white/50 space-y-0.5">
            <div>
              page: <span className="text-white/80">{activePage}</span>
            </div>
            <div>
              route:{" "}
              <span className="text-white/80">
                #/{region}/{activePage}?lang={lang}
              </span>
            </div>
          </div>

          {/* Region */}
          <label className="block mb-1 text-[10px] text-white/60">
            Region
          </label>
          <select
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            className="w-full mb-3 px-2 py-1.5 rounded bg-white/10 text-white border border-white/10 text-xs outline-none focus:border-amber-400"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value} className="bg-[#18181b]">
                {r.label}
              </option>
            ))}
          </select>

          {/* Language */}
          <label className="block mb-1 text-[10px] text-white/60">
            Language
          </label>
          <select
            value={lang}
            onChange={(e) => onLangChange(e.target.value)}
            className="w-full px-2 py-1.5 rounded bg-white/10 text-white border border-white/10 text-xs outline-none focus:border-amber-400"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value} className="bg-[#18181b]">
                {l.label}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
