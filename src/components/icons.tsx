// Shared icon components for the navigation UI.

import React from "react";
import {
  UserCircle,
  User,
  ThumbsUp,
  BellRinging,
  Bell,
  Key,
  SignOut,
  House,
  Gift,
  MapTrifold,
  BellSimple,
  Medal,
  MagnifyingGlass,
  List,
  X,
  Check,
  CaretRight,
} from "@phosphor-icons/react";

// --- Account icons ---

export function ProfileIcon() {
  return <UserCircle size={24} />;
}

export function AccountSlimIcon() {
  return <User size={22} weight="light" />;
}

export function PreferencesIcon() {
  return <ThumbsUp size={22} />;
}

export function NotificationsIcon() {
  return <BellRinging size={22} />;
}

export function ManageNotificationsIcon() {
  return <Bell size={22} />;
}

export function SecurityIcon() {
  return <Key size={22} />;
}

export function SignOutIcon() {
  return <SignOut size={22} />;
}

// --- Nav chrome icons ---

export function HamburgerIcon() {
  return <List size={24} />;
}

export function CloseIcon() {
  return <X size={24} />;
}

export function CheckIcon() {
  return <Check size={20} color="#04204a" />;
}

export function ChevronRightIcon() {
  return <CaretRight size={20} />;
}

// --- Mobile menu page icons ---

export function HomeIcon() {
  return <House size={22} weight="light" />;
}

export function BenefitsIcon() {
  return <Gift size={22} weight="light" />;
}

export function TravelIcon() {
  return <MapTrifold size={22} />;
}

export function ConciergeIcon() {
  return <BellSimple size={22} />;
}

export function WatchlistIcon() {
  return <Medal size={22} weight="light" />;
}

export function SearchIcon() {
  return <MagnifyingGlass size={22} />;
}

export const pageIcons: Record<string, () => React.JSX.Element> = {
  benefits: BenefitsIcon,
  travel: TravelIcon,
  concierge: ConciergeIcon,
  watchlist: WatchlistIcon,
};
