"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  CalendarClock,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const t = useTranslations("nav");

  const routes = [
    {
      label: t("dashboard"),
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-sky-500",
    },
    {
      label: t("myAttendance"),
      icon: Clock,
      href: "/dashboard/attendance",
      color: "text-violet-500",
    },
    {
      label: t("earlyLeave"),
      icon: CalendarDays,
      href: "/dashboard/leaves",
      color: "text-pink-700",
    },
    {
      label: t("annualLeave"),
      icon: CalendarClock,
      href: "/dashboard/annual-leave",
      color: "text-green-600",
    },
  ];

  const adminRoutes = [
    {
      label: t("adminPanel"),
      icon: ShieldCheck,
      href: "/dashboard/admin",
      color: "text-orange-700",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#111827] text-white">
      {/* Header Area */}
      <div className="px-6 py-6 flex items-center justify-start h-16">
        <Link href="/dashboard" className="flex items-center flex-1">
          <h1 className="text-2xl font-bold leading-none">OpenAttendance</h1>
        </Link>
      </div>

      {/* Navigation Area */}
      <div className="px-3 py-6 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              prefetch={true}
              onClick={onNavigate}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href
                  ? "text-white bg-white/10"
                  : "text-zinc-400",
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
          {role === "ADMIN" && (
            <>
              <div className="my-4 border-t border-gray-700" />
              {adminRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  prefetch={true}
                  onClick={onNavigate}
                  className={cn(
                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                    pathname === route.href
                      ? "text-white bg-white/10"
                      : "text-zinc-400",
                  )}
                >
                  <div className="flex items-center flex-1">
                    <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                    {route.label}
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Settings Area - Bottom */}
      <div className="px-3 py-3 border-t border-gray-700">
        <Link
          href="/dashboard/settings"
          prefetch={true}
          onClick={onNavigate}
          className={cn(
            "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
            pathname === "/dashboard/settings"
              ? "text-white bg-white/10"
              : "text-zinc-400",
          )}
        >
          <div className="flex items-center flex-1">
            <Settings className="h-5 w-5 mr-3 text-gray-400" />
            {t("settings")}
          </div>
        </Link>
      </div>
    </div>
  );
}
