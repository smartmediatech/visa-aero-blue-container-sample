import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import ReactCountryFlag from "react-country-flag";
import { Select } from "@base-ui/react";
import clientLogo from "../resources/images/client-logo.svg";

const languages = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "es", label: "Spanish", nativeLabel: "Espanol" },
  { code: "fr-ca", label: "French Canadian", nativeLabel: "Français Canadien" },
  { code: "fr", label: "French European", nativeLabel: "French Européen" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "it", label: "Italian", nativeLabel: "Italiano" },
  { code: "pt-br", label: "Portuguese (Brazil)", nativeLabel: "Português (Brasil)" },
  { code: "ru", label: "Russian", nativeLabel: "русский" },
  { code: "uk", label: "Ukranian", nativeLabel: "українська" },
];

const countries = [
  { code: "US", label: "United States" },
  { code: "IT", label: "Italy" },
  { code: "CH", label: "Switzerland" },
  { code: "GR", label: "Greece" },
  { code: "FR", label: "France" },
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

function CircleFlag({ code, size = 36 }: { code: string; size?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <ReactCountryFlag
        countryCode={code}
        svg
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        aria-hidden="true"
      />
    </span>
  );
}

export interface FooterProps {
  className?: string;
  lang?: string;
  onLangChange?: (lang: string) => void;
  country?: string;
  onCountryChange?: (country: string) => void;
}

export function Footer({ className, lang = "en", onLangChange, country = "US", onCountryChange }: FooterProps) {
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
        "relative z-10 bg-[#f0f1f4] border-t border-[#d9dbe1]",
        className,
      )}
    >
      {/* Visa watermark — clipped inside its own container so footer overflow is visible */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <svg
          className="absolute right-0 bottom-0 opacity-[0.06] pointer-events-none select-none w-full h-auto translate-x-[5%] translate-y-[20%] md:w-auto md:h-[calc(125%-3.125rem)] md:translate-x-0"
          viewBox="0 0 85 24"
          preserveAspectRatio="xMidYMax meet"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M53.0684 0C55.5954 2.76439e-05 57.6252 0.504161 59.2051 1.0293L58.0518 5.95215C55.1157 4.71344 52.5264 4.79997 51.585 4.91309C49.6875 5.13939 48.8224 6.02525 48.8018 6.85742C48.7383 9.55093 57.735 9.91932 57.9883 15.7744L57.9961 16.0576C57.9755 20.8839 53.4685 23.9999 46.5752 24C43.6419 23.9731 40.8112 23.4103 39.2783 22.7666L40.4668 17.6816C41.9908 18.3307 43.9031 19.1922 47.2012 19.1465C49.0901 19.1196 51.1113 18.4327 51.1289 16.876C51.1404 15.8582 50.2816 15.1285 47.7256 13.9922C45.2395 12.8799 41.9415 11.0159 41.9824 7.67383C42.0207 3.15718 46.5838 0 53.0684 0ZM75.8877 0.422852L81.1836 23.6396H75.1172V23.6367L74.3252 20.168H65.9082L64.54 23.6367H57.6523L67.4971 2.125C67.9679 1.09367 69.03 0.422852 70.2891 0.422852H75.8877zM11.3184 0.422852C12.7422 0.422852 14.019 1.29017 14.3428 2.79004L17.1055 16.2246L23.9316 0.422852H30.8252L20.1982 23.6367H13.2637L8.0293 5.1123C7.71154 3.97035 7.43476 3.55265 6.46973 3.07324C4.89565 2.28952 2.29191 1.55379 0 1.09863L0.15625 0.422852H11.3184zM34.7705 23.6367H28.21L33.6406 0.422852H40.1963L34.7705 23.6367zM67.7969 15.4111H73.2334L71.248 6.69531L67.7969 15.4111z"
            fill="#021E4C"
          />
        </svg>
      </div>

      <div className="relative z-10 px-8 md:px-16 py-10 flex flex-col md:flex-row md:items-start gap-8 md:gap-12">
        {/* Visa logo — mobile only (navbar carries it on desktop) */}
        <img
          src={clientLogo}
          alt="Visa"
          className="block md:hidden h-6 w-auto self-start"
        />

        {/* Link columns — always side-by-side */}
        <div className="flex gap-12">
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
        </div>

        {/* Spacer — desktop only */}
        <div className="hidden md:block flex-1" />

        {/* Country / Language */}
        <div className="flex items-center h-6 gap-3 text-[14px] leading-[22px] tracking-[1px] font-medium text-[#1a1f36]">
          {/* Country select (Base UI) */}
          <Select.Root
            value={country}
            onValueChange={(val) => { if (val) onCountryChange?.(val); }}
          >
            <Select.Trigger className="flex items-center gap-2.5 cursor-pointer focus:outline-none hover:opacity-80 transition-opacity">
              <CircleFlag code={country} size={24} />
              <span>{countries.find((c) => c.code === country)?.label ?? country}</span>
            </Select.Trigger>

            <Select.Portal>
              <Select.Positioner side="top" sideOffset={10} alignItemWithTrigger={false} className="z-50">
                <Select.Popup className="bg-white rounded-xl py-1 min-w-[220px] focus:outline-none [box-shadow:4px_4px_16px_0px_rgba(0,0,0,0.10)]">
                  {countries.map((c) => (
                    <Select.Item
                      key={c.code}
                      value={c.code}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer text-sm text-[#1a1f36] data-[highlighted]:bg-[#f7f7f8] data-[selected]:bg-[#f0f1f4] focus:outline-none"
                    >
                      <CircleFlag code={c.code} size={28} />
                      <Select.ItemText>{c.label}</Select.ItemText>
                      <Select.ItemIndicator className="ml-auto">
                        <svg className="w-4 h-4 text-[#1a1f36] shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M2.5 8L6.5 12L13.5 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>

          {/* Divider */}
          <span className="text-[#c5c8d0] select-none text-base leading-none">|</span>

          {/* Language dropdown */}
          <div ref={dropdownRef} className="relative flex items-center">
            <button
              type="button"
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-haspopup="listbox"
            >
              {selectedLang.nativeLabel}
              {/* Solid filled triangle ▼ */}
              <svg className="w-2 h-2 fill-[#1a1f36] shrink-0 mt-px" viewBox="0 0 8 5" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M0 0L4 5L8 0H0Z" />
              </svg>
            </button>

            {open && (
              <ul
                role="listbox"
                className="absolute right-0 bottom-full mb-2 bg-white rounded-xl py-1 min-w-[220px] z-20 [box-shadow:4px_4px_16px_0px_rgba(0,0,0,0.10)]"
              >
                {languages.map((l) => (
                  <li
                    key={l.code}
                    role="option"
                    aria-selected={l.code === lang}
                    className={clsx(
                      "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors",
                      l.code === lang
                        ? "bg-[#f0f1f4]"
                        : "hover:bg-[#f7f7f8]",
                    )}
                    onClick={() => {
                      onLangChange?.(l.code);
                      setOpen(false);
                    }}
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#1a1f36]">{l.nativeLabel}</div>
                      {l.nativeLabel !== l.label && (
                        <div className="text-xs text-[#6b7280]">{l.label}</div>
                      )}
                    </div>
                    {l.code === lang && (
                      <svg className="w-4 h-4 text-[#1a1f36] ml-3 shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M2.5 8L6.5 12L13.5 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
