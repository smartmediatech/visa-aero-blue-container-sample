// Shared icon components for the navigation UI.

import React from "react";
import * as PhosphorIcons from "@phosphor-icons/react";

// --- Account icons ---

export function ProfileIcon() {
  return <PhosphorIcons.UserCircleIcon size={24} aria-hidden="true" />;
}

export function AccountSlimIcon() {
  return <PhosphorIcons.UserIcon size={22} weight="light" aria-hidden="true" />;
}

export function PreferencesIcon() {
  return <PhosphorIcons.ThumbsUpIcon size={22} aria-hidden="true" />;
}

export function NotificationsIcon() {
  return <PhosphorIcons.BellRingingIcon size={22} aria-hidden="true" />;
}

export function ManageNotificationsIcon() {
  return <PhosphorIcons.BellIcon size={22} aria-hidden="true" />;
}

export function SecurityIcon() {
  return <PhosphorIcons.KeyIcon size={22} aria-hidden="true" />;
}

export function SignOutIcon() {
  return <PhosphorIcons.SignOutIcon size={22} aria-hidden="true" />;
}

// --- Nav chrome icons ---

export function HamburgerIcon() {
  return <PhosphorIcons.ListIcon size={24} aria-hidden="true" />;
}

export function CloseIcon() {
  return <PhosphorIcons.XIcon size={24} aria-hidden="true" />;
}

export function CheckIcon() {
  return <PhosphorIcons.CheckIcon size={20} color="#04204a" aria-hidden="true" />;
}

export function ChevronRightIcon() {
  return <PhosphorIcons.CaretRightIcon size={20} aria-hidden="true" />;
}

// --- Mobile menu page icons ---

export function HomeIcon() {
  return <PhosphorIcons.HouseIcon size={22} weight="light" aria-hidden="true" />;
}

export function BenefitsIcon() {
  return <PhosphorIcons.GiftIcon size={22} weight="light" aria-hidden="true" />;
}

export function TravelIcon() {
  return <PhosphorIcons.MapTrifoldIcon size={22} aria-hidden="true" />;
}

export function ConciergeIcon() {
  return <PhosphorIcons.BellSimpleIcon size={22} aria-hidden="true" />;
}

export function WatchlistIcon() {
  return <PhosphorIcons.MedalIcon size={22} weight="light" aria-hidden="true" />;
}

export function SearchIcon() {
  return <PhosphorIcons.MagnifyingGlassIcon size={22} aria-hidden="true" />;
}

export const pageIcons: Record<string, () => React.JSX.Element> = {
  benefits: BenefitsIcon,
  travel: TravelIcon,
  concierge: ConciergeIcon,
  watchlist: WatchlistIcon,
};
