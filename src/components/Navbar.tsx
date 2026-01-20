import { useId, forwardRef } from "react";
import clsx from "clsx";
import clientLogo from "../resources/images/client-logo.svg";

export interface NavbarProps {
  pages: { id: string; label: string }[];
  /** Optional additional CSS classes */
  className?: string;
  onPageClick: (page: string) => void;
  activePage?: string;
  onLogoutClick: () => void;
}

const Navbar = forwardRef<HTMLElement, NavbarProps>(
  function Navbar(props, ref) {
    const { className, pages, onPageClick, activePage, onLogoutClick } = props;

    const navId = useId();

    const isActivePage = (page: { id: string }): boolean => {
      return activePage === page.id;
    };

    return (
      <header
        ref={ref}
        className={clsx("navbar", "w-full bg-background", className)}
      >
        {/* Top Bar: Logo and Avatar */}
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
              )}
            />
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav
            className={clsx(
              "navbar__nav-desktop",
              "hidden md:flex items-center gap-1 overflow-x-auto flex-1 ml-6 h-full",
            )}
            aria-labelledby={`${navId}-desktop`}
          >
            <span id={`${navId}-desktop`} className="sr-only">
              App Navigation
            </span>
            {pages.map((page) => {
              const isActive = isActivePage(page);
              return (
                <button
                  key={page.id}
                  type="button"
                  className={clsx(
                    "navbar__tab",
                    "relative px-4 py-2 whitespace-nowrap h-full min-w-40 cursor-pointer",
                    "transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2",
                    isActive && "navbar__tab--active text-text-primary",
                    !isActive && "text-text-primary/60",
                  )}
                  onClick={(): void => {
                    onPageClick(page.id);
                  }}
                  aria-label={page.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {page.label}
                  {isActive && (
                    <span
                      className={clsx(
                        "navbar__indicator",
                        "absolute top-0 left-0 right-0 h-1 bg-[#021e4c]",
                      )}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            className={clsx(
              "navbar__logout-button",
              "px-4 py-2 font-medium rounded-[9px] text-sm min-w-[85px] leading-5",
              "bg-[#18181B] text-white",
              "hover:bg-[#27272A] active:bg-[#18181B]",
              "transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2",
              "shadow-none"
            )}
            onClick={() => {
              onLogoutClick();
            }}
          >
            Logout
          </button>
        </div>

        {/* Mobile Navigation - Hidden on desktop */}
        <nav
          className={clsx(
            "navbar__nav-mobile",
            "flex md:hidden items-center gap-1 h-12",
            "bg-background-secondary",
          )}
          aria-labelledby={`${navId}-mobile`}
        >
          <span id={`${navId}-mobile`} className="sr-only">
            App Navigation
          </span>
          {pages.map((page) => {
            const isActive = isActivePage(page);
            return (
              <button
                key={page.id}
                type="button"
                className={clsx(
                  "navbar__tab",
                  "relative px-4 py-2 min-h-full whitespace-nowrap flex-1 cursor-pointer",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2",
                  isActive && "navbar__tab--active text-text-primary",
                  !isActive && "text-text-primary/60",
                )}
                onClick={(): void => {
                  onPageClick(page.id);
                }}
                aria-label={page.label}
                aria-current={isActive ? "page" : undefined}
              >
                {page.label}
                {isActive && (
                  <span
                    className={clsx(
                      "navbar__indicator",
                      "absolute bottom-0 left-0 right-0 h-1 bg-[#021e4c]",
                    )}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </header>
    );
  },
);

export default Navbar;
