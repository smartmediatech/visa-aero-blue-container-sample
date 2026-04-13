import { useId, forwardRef } from "react";
import { Tabs, Drawer } from "@base-ui/react";
import clsx from "clsx";
import clientLogo from "../resources/images/client-logo.svg";
import {
  HamburgerIcon,
  CloseIcon,
  CheckIcon,
  ChevronRightIcon,
  HomeIcon,
  SearchIcon,
  pageIcons,
} from "./icons";
import { AccountMenu, type AccountItemId } from "./AccountMenu";
import type { User } from "../types/auth.types";

export interface NavbarProps {
  pages: { id: string; label: string }[];
  /** Optional additional CSS classes */
  className?: string;
  onPageClick: (page: string) => void;
  activePage?: string;
  isAuthenticated: boolean;
  onLogoutClick: () => void;
  onSignInClick: () => void;
  onLogoClick?: () => void;
  user?: User;
  onAccountItemClick?: (itemId: AccountItemId) => void;
}

const Navbar = forwardRef<HTMLElement, NavbarProps>(
  function Navbar(props, ref) {
    const {
      className,
      pages,
      onPageClick,
      activePage,
      isAuthenticated,
      onSignInClick,
      onLogoClick,
      user,
      onAccountItemClick,
    } = props;

    const navId = useId();

    const tabClassName = clsx(
      "navbar__tab group",
      "relative px-4 py-2 whitespace-nowrap h-full min-w-40 cursor-pointer",
      "border-0 bg-transparent outline-none",
      "transition-colors duration-200",
      "focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
      "text-text-primary/60 data-[active]:text-text-primary",
    );

    const drawerItemClassName = clsx(
      "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left",
      "border-0 bg-transparent outline-none cursor-pointer",
      "text-text-primary hover:bg-gray-50",
      "transition-colors duration-150",
    );

    return (
      <header
        ref={ref}
        className={clsx("navbar", "w-full bg-background", className)}
      >
        {/* Top Bar */}
        <div
          className={clsx(
            "navbar__top-bar",
            "flex items-center justify-between px-6 h-16 md:h-20",
          )}
        >
          {/* Logo */}
          <div className={clsx("navbar__logo-container", "flex items-center")}>
            <img
              alt="Logo"
              src={clientLogo}
              className={clsx(
                "navbar__logo",
                "max-w-[230px] min-w-[100px] h-6",
                isAuthenticated && onLogoClick && "cursor-pointer",
              )}
              onClick={isAuthenticated && onLogoClick ? onLogoClick : undefined}
              role={isAuthenticated && onLogoClick ? "button" : undefined}
            />
          </div>

          {/* Desktop Navigation - Hidden on mobile, only shown when authenticated */}
          {isAuthenticated && (
            <nav
              className={clsx(
                "navbar__nav-desktop",
                "hidden md:flex items-center flex-1 ml-6 h-full overflow-x-auto",
              )}
              aria-labelledby={`${navId}-desktop`}
            >
              <span id={`${navId}-desktop`} className="sr-only">
                App Navigation
              </span>
              <Tabs.Root
                value={activePage}
                onValueChange={(val) => onPageClick(val as string)}
                className="flex items-center h-full flex-1"
              >
                <Tabs.List className="flex items-center gap-1 h-full flex-1">
                  {pages.map((page) => (
                    <Tabs.Tab
                      key={page.id}
                      value={page.id}
                      className={tabClassName}
                    >
                      {page.label}
                      <span
                        className="navbar__indicator absolute bottom-0 left-0 right-0 h-[3px] bg-[#04204a] opacity-0 group-data-[active]:opacity-100 transition-opacity duration-200"
                        aria-hidden="true"
                      />
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs.Root>
            </nav>
          )}

          {/* Spacer when not authenticated to push sign-in to the right */}
          {!isAuthenticated && <div className="flex-1" />}

          {/* Right-side controls */}
          <div className="flex items-center gap-1">
            {/* Account menu (profile icon → Menu on desktop, Drawer on mobile) */}
            {isAuthenticated && user && onAccountItemClick && (
              <AccountMenu user={user} onItemClick={onAccountItemClick} />
            )}

            {/* Mobile hamburger nav drawer */}
            {isAuthenticated && (
              <Drawer.Root swipeDirection="left">
                <Drawer.Trigger
                  className="md:hidden p-2 border-0 bg-transparent outline-none cursor-pointer text-text-primary"
                  aria-label="Open menu"
                >
                  <HamburgerIcon />
                </Drawer.Trigger>

                <Drawer.Portal>
                  <Drawer.Backdrop className="fixed inset-0 bg-black/40 backdrop-blur-[2px] data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-300" />
                  <Drawer.Viewport>
                    <Drawer.Popup className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full transition-transform duration-300">
                      <Drawer.Content className="flex flex-col h-full p-6">
                        {/* Drawer header */}
                        <div className="flex items-center justify-between mb-6">
                          <Drawer.Title className="text-xl font-semibold text-text-primary">
                            Menu
                          </Drawer.Title>
                          <Drawer.Close
                            className="p-2 border-0 bg-transparent outline-none cursor-pointer text-text-primary"
                            aria-label="Close menu"
                          >
                            <CloseIcon />
                          </Drawer.Close>
                        </div>

                        {/* Navigation items */}
                        <nav className="flex flex-col gap-1">
                          {/* Home */}
                          <Drawer.Close
                            render={<button type="button" />}
                            className={drawerItemClassName}
                            onClick={() => onLogoClick?.()}
                          >
                            <HomeIcon />
                            <span className="flex-1">Home</span>
                            {activePage === "home" && <CheckIcon />}
                          </Drawer.Close>

                          {/* Dynamic pages */}
                          {pages.map((page) => {
                            const Icon = pageIcons[page.id];
                            return (
                              <Drawer.Close
                                key={page.id}
                                render={<button type="button" />}
                                className={drawerItemClassName}
                                onClick={() => onPageClick(page.id)}
                              >
                                {Icon ? <Icon /> : <span className="w-[22px]" />}
                                <span className="flex-1">{page.label}</span>
                                {activePage === page.id && <CheckIcon />}
                              </Drawer.Close>
                            );
                          })}

                          {/* Search */}
                          <Drawer.Close
                            render={<button type="button" />}
                            className={drawerItemClassName}
                            onClick={() => onPageClick("search")}
                          >
                            <SearchIcon />
                            <span className="flex-1">Search</span>
                            <ChevronRightIcon />
                          </Drawer.Close>
                        </nav>
                      </Drawer.Content>
                    </Drawer.Popup>
                  </Drawer.Viewport>
                </Drawer.Portal>
              </Drawer.Root>
            )}

            {/* Sign in (unauthenticated only) */}
            {!isAuthenticated && (
              <button
                type="button"
                className={clsx(
                  "navbar__sign-in-button",
                  "px-4 py-2 font-medium text-sm cursor-pointer",
                  "text-text-primary/80 hover:text-text-primary",
                  "transition-colors duration-200",
                )}
                onClick={() => {
                  onSignInClick();
                }}
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>
    );
  },
);

export default Navbar;
