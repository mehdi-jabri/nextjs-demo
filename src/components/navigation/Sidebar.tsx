"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Home as HomeIcon,
  LayoutDashboard,
  Menu as MenuIcon,
  X as XIcon,
} from "lucide-react";

// Define navigation items with allowed roles
const navigationItems = [
  {
    name: "Home",
    href: "/",
    icon: <HomeIcon className="h-5 w-5 text-gray-500" />,
    roles: ["user", "admin"],
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5 text-gray-500" />,
    roles: ["admin"],
  },
];

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  // If no session exists, do not render the sidebar at all.
  if (!session) return null;

  const user = session.user;

  const hasRole = (allowedRoles: string[]) =>
    user.roles ? allowedRoles.some((role) => user.roles.includes(role)) : false;

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const handleLogout = () => {
    signOut();
  };

  const SidebarContent = () => (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-4 flex items-center">
        <Link href="/">
          <Image src="/logo.svg" alt="Logo" width={60} height={60} />
        </Link>
      </div>
      {/* Navigation */}
      <nav className="flex-1 px-2">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            if (!hasRole(item.roles)) return null;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-2 rounded hover:bg-gray-100 ${
                    isActive(item.href)
                      ? "bg-gray-200 font-semibold"
                      : "text-gray-600"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* User info and Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? "/default-avatar.png"} alt={user.name ?? "Guest"} />
            <AvatarFallback>{(user.name ?? "Guest").charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
        <div className="mt-4">
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            Log out
          </Button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <div className="sm:hidden p-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <div className="flex items-center">
          <Link href="/">
            <Image src="/logo.svg" alt="Logo" width={40} height={40} />
          </Link>
        </div>
        <div className="w-6" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="relative z-50">
            <SidebarContent />
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 focus:outline-none"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden sm:block">
        <SidebarContent />
      </div>
    </>
  );
}
