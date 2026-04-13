import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

const languages = [
  { code: "en", label: "English" },
  { code: "it", label: "Italian" },
  { code: "ar", label: "Arabic" },
];

const aboutLinks = [
  { label: "Terms & conditions", href: "#" },
  { label: "Terms of use", href: "#" },
  { label: "Privacy notice", href: "#" },
];

const supportLinks = [
  { label: "FAQ", href: "#" },
  { label: "Contact us", href: "#" },
];

export interface FooterProps {
  className?: string;
  lang?: string;
  onLangChange?: (lang: string) => void;
}

export function Footer({ className, lang = "en", onLangChange }: FooterProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedLang = languages.find((l) => l.code === lang) ?? languages[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);
  return (
    <footer
      className={clsx(
        "relative overflow-hidden bg-[#f0f1f4] border-t border-[#d9dbe1]",
        className,
      )}
    >
      {/* Visa watermark */}
      <svg
        className="absolute right-0 top-1/2 -translate-y-1/2 h-[120%] w-auto opacity-[0.06] pointer-events-none select-none"
        viewBox="0 0 85 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M53.0684 0C55.5954 2.76439e-05 57.6252 0.504161 59.2051 1.0293L58.0518 5.95215C55.1157 4.71344 52.5264 4.79997 51.585 4.91309C49.6875 5.13939 48.8224 6.02525 48.8018 6.85742C48.7383 9.55093 57.735 9.91932 57.9883 15.7744L57.9961 16.0576C57.9755 20.8839 53.4685 23.9999 46.5752 24C43.6419 23.9731 40.8112 23.4103 39.2783 22.7666L40.4668 17.6816C41.9908 18.3307 43.9031 19.1922 47.2012 19.1465C49.0901 19.1196 51.1113 18.4327 51.1289 16.876C51.1404 15.8582 50.2816 15.1285 47.7256 13.9922C45.2395 12.8799 41.9415 11.0159 41.9824 7.67383C42.0207 3.15718 46.5838 0 53.0684 0ZM75.8877 0.422852L81.1836 23.6396H75.1172V23.6367L74.3252 20.168H65.9082L64.54 23.6367H57.6523L67.4971 2.125C67.9679 1.09367 69.03 0.422852 70.2891 0.422852H75.8877zM11.3184 0.422852C12.7422 0.422852 14.019 1.29017 14.3428 2.79004L17.1055 16.2246L23.9316 0.422852H30.8252L20.1982 23.6367H13.2637L8.0293 5.1123C7.71154 3.97035 7.43476 3.55265 6.46973 3.07324C4.89565 2.28952 2.29191 1.55379 0 1.09863L0.15625 0.422852H11.3184zM34.7705 23.6367H28.21L33.6406 0.422852H40.1963L34.7705 23.6367zM67.7969 15.4111H73.2334L71.248 6.69531L67.7969 15.4111z"
          fill="#021E4C"
        />
      </svg>

      <div className="relative z-10 px-8 md:px-16 py-10 flex flex-wrap gap-12 items-start">
        {/* About us */}
        <div className="min-w-[140px]">
          <h3 className="font-semibold text-sm text-[#1a1f36] mb-3">
            About us
          </h3>
          <ul className="space-y-2">
            {aboutLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-[#1a1f36]/80 hover:text-[#1a1f36] transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div className="min-w-[140px]">
          <h3 className="font-semibold text-sm text-[#1a1f36] mb-3">
            Support
          </h3>
          <ul className="space-y-2">
            {supportLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-[#1a1f36]/80 hover:text-[#1a1f36] transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Country / Language */}
        <div ref={dropdownRef} className="relative flex items-center gap-2 text-sm text-[#1a1f36]">
          <span className="text-xl" role="img" aria-label="United States flag">
            🇺🇸
          </span>
          <span>United States</span>
          <span className="text-[#d9dbe1] mx-1">|</span>
          <button
            type="button"
            className="flex items-center gap-1 cursor-pointer hover:text-[#1a1f36]/70 transition-colors"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            {selectedLang.label}
            <span className="text-xs">&#9662;</span>
          </button>

          {open && (
            <ul
              role="listbox"
              className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-lg border border-[#d9dbe1] py-1 min-w-[120px] z-20"
            >
              {languages.map((l) => (
                <li
                  key={l.code}
                  role="option"
                  aria-selected={l.code === lang}
                  className={clsx(
                    "px-4 py-2 cursor-pointer text-sm transition-colors",
                    l.code === lang
                      ? "bg-[#f0f1f4] font-medium"
                      : "hover:bg-[#f7f7f8]",
                  )}
                  onClick={() => {
                    onLangChange?.(l.code);
                    setOpen(false);
                  }}
                >
                  {l.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
