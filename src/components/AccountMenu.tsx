import React, { useState } from "react";
import { Menu, Drawer } from "@base-ui/react";
import clsx from "clsx";
import {
  ProfileIcon,
  AccountSlimIcon,
  CloseIcon,
  PreferencesIcon,
  NotificationsIcon,
  ManageNotificationsIcon,
  SecurityIcon,
  SignOutIcon,
} from "./icons";

export type AccountItemId =
  | "preferences"
  | "notifications"
  | "manage-notifications"
  | "security"
  | "sign-out";

interface AccountMenuProps {
  user: { name: string; email: string; avatarUri?: string };
  onItemClick: (itemId: AccountItemId) => void;
}

interface AccountMenuItem {
  id: AccountItemId;
  label: string;
  icon: () => React.JSX.Element;
  separatorAfter: boolean;
}

const accountMenuItems: AccountMenuItem[] = [
  { id: "preferences",          label: "Preferences",          icon: PreferencesIcon,          separatorAfter: true },
  { id: "notifications",        label: "Notifications",        icon: NotificationsIcon,        separatorAfter: false },
  { id: "manage-notifications", label: "Manage notifications", icon: ManageNotificationsIcon,  separatorAfter: true },
  { id: "security",             label: "Security & privacy",   icon: SecurityIcon,             separatorAfter: true },
  { id: "sign-out",             label: "Sign out",             icon: SignOutIcon,              separatorAfter: false },
];

const triggerClassName = clsx(
  "p-2 border-0 bg-transparent outline-none cursor-pointer text-text-primary",
  "rounded-full hover:bg-gray-100 transition-colors duration-150",
  "focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
);

const menuItemClassName = clsx(
  "flex items-center gap-3 px-4 py-2.5 mx-1 rounded-lg",
  "text-sm text-text-primary cursor-pointer outline-none",
  "data-[highlighted]:bg-gray-50",
  "transition-colors duration-150",
);

const drawerItemClassName = clsx(
  "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left",
  "border-0 bg-transparent outline-none cursor-pointer",
  "text-text-primary hover:bg-gray-50",
  "transition-colors duration-150",
);

function TriggerContent({ user }: { user: AccountMenuProps["user"] }) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  if (user.avatarUri && !avatarFailed) {
    return (
      <img
        src={user.avatarUri}
        alt=""
        className="w-8 h-8 rounded-full object-cover"
        onError={() => setAvatarFailed(true)}
      />
    );
  }
  return <ProfileIcon />;
}

export function AccountMenu({ user, onItemClick }: AccountMenuProps) {
  return (
    <>
      {/* ===== Desktop: Base UI Menu ===== */}
      <div className="hidden md:block">
        <Menu.Root>
          <Menu.Trigger className={triggerClassName} aria-label="Account menu">
            <TriggerContent user={user} />
          </Menu.Trigger>

          <Menu.Portal>
            <Menu.Positioner side="bottom" align="end" sideOffset={8}>
              <Menu.Popup
                className={clsx(
                  "w-72 bg-white rounded-xl shadow-lg border border-gray-200",
                  "py-2 outline-none",
                  "origin-top-right",
                  "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
                  "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
                  "transition-[opacity,transform] duration-200",
                )}
              >
                {/* User info (non-interactive) */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <AccountSlimIcon />
                  <div>
                    <p className="font-semibold text-text-primary text-sm">
                      {user.name}
                    </p>
                    <p className="text-xs text-text-primary/60 mt-0.5">
                      {user.email}
                    </p>
                  </div>
                </div>

                <Menu.Separator className="h-px bg-gray-200 mx-2 my-1" />

                {accountMenuItems.map((item) => (
                  <React.Fragment key={item.id}>
                    <Menu.Item
                      className={menuItemClassName}
                      onClick={() => onItemClick(item.id)}
                    >
                      <item.icon />
                      {item.label}
                    </Menu.Item>
                    {item.separatorAfter && (
                      <Menu.Separator className="h-px bg-gray-200 mx-2 my-1" />
                    )}
                  </React.Fragment>
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>

      {/* ===== Mobile: Base UI Drawer ===== */}
      <div className="md:hidden">
        <Drawer.Root swipeDirection="left">
          <Drawer.Trigger className={triggerClassName} aria-label="Account menu">
            <TriggerContent user={user} />
          </Drawer.Trigger>

          <Drawer.Portal>
            <Drawer.Backdrop className="fixed inset-0 bg-black/40 backdrop-blur-[2px] data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-300" />
            <Drawer.Viewport>
              <Drawer.Popup className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full transition-transform duration-300">
                <Drawer.Content className="flex flex-col h-full p-6">
                  {/* Drawer header */}
                  <div className="flex items-center justify-between mb-6">
                    <Drawer.Title className="text-xl font-semibold text-text-primary">
                      Account
                    </Drawer.Title>
                    <Drawer.Close
                      className="p-2 border-0 bg-transparent outline-none cursor-pointer text-text-primary"
                      aria-label="Close account menu"
                    >
                      <CloseIcon />
                    </Drawer.Close>
                  </div>

                  {/* User info */}
                  <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <AccountSlimIcon />
                    <div>
                      <p className="font-semibold text-text-primary">
                        {user.name}
                      </p>
                      <p className="text-sm text-text-primary/60 mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <hr className="border-gray-200 mb-2" />

                  {/* Action items */}
                  <nav className="flex flex-col gap-1">
                    {accountMenuItems.map((item) => (
                      <React.Fragment key={item.id}>
                        <Drawer.Close
                          render={<button type="button" />}
                          className={drawerItemClassName}
                          onClick={() => onItemClick(item.id)}
                        >
                          <item.icon />
                          <span className="flex-1">{item.label}</span>
                        </Drawer.Close>
                        {item.separatorAfter && (
                          <hr className="border-gray-200 my-1" />
                        )}
                      </React.Fragment>
                    ))}
                  </nav>
                </Drawer.Content>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    </>
  );
}
