// Shared icon components for the navigation UI.

import React from "react";

// --- SVG file imports (webpack asset/resource → URL strings) ---

import userCircleSvg from "../resources/images/icons/UserCircle.svg";
import accountSlimSvg from "../resources/images/icons/AccountSlim.svg";
import thumbsUpSvg from "../resources/images/icons/ThumbsUp.svg";
import bellRingingSvg from "../resources/images/icons/BellRinging.svg";
import notificationSvg from "../resources/images/icons/Notification Icon.svg";
import keySvg from "../resources/images/icons/Key.svg";
import logoutSvg from "../resources/images/icons/Logout.svg";
import houseLightSvg from "../resources/images/icons/HouseLight.svg";
import giftLightSvg from "../resources/images/icons/GiftLight.svg";
import mapTriFoldSvg from "../resources/images/icons/MapTriFold.svg";
import callBellSvg from "../resources/images/icons/CallBell.svg";
import medalLightSvg from "../resources/images/icons/MedalLight.svg";
import magnifyingGlassSvg from "../resources/images/icons/MagnifyingGlass.svg";

// --- Account icons ---

export function ProfileIcon() {
  return <img src={userCircleSvg} alt="" width="24" height="24" />;
}

export function AccountSlimIcon() {
  return <img src={accountSlimSvg} alt="" width="22" height="22" />;
}

export function PreferencesIcon() {
  return <img src={thumbsUpSvg} alt="" width="22" height="22" />;
}

export function NotificationsIcon() {
  return <img src={bellRingingSvg} alt="" width="22" height="22" />;
}

export function ManageNotificationsIcon() {
  return <img src={notificationSvg} alt="" width="22" height="22" />;
}

export function SecurityIcon() {
  return <img src={keySvg} alt="" width="22" height="22" />;
}

export function SignOutIcon() {
  return <img src={logoutSvg} alt="" width="22" height="22" />;
}

// --- Nav chrome icons (inline SVG for currentColor support) ---

export function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#04204a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// --- Mobile menu page icons (SVG file imports) ---

export function HomeIcon() {
  return <img src={houseLightSvg} alt="" width="22" height="22" />;
}

export function BenefitsIcon() {
  return <img src={giftLightSvg} alt="" width="22" height="22" />;
}

export function TravelIcon() {
  return <img src={mapTriFoldSvg} alt="" width="22" height="22" />;
}

export function ConciergeIcon() {
  return <img src={callBellSvg} alt="" width="22" height="22" />;
}

export function WatchlistIcon() {
  return <img src={medalLightSvg} alt="" width="22" height="22" />;
}

export function SearchIcon() {
  return <img src={magnifyingGlassSvg} alt="" width="22" height="22" />;
}

export const pageIcons: Record<string, () => React.JSX.Element> = {
  benefits: BenefitsIcon,
  travel: TravelIcon,
  concierge: ConciergeIcon,
  watchlist: WatchlistIcon,
};
