"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User, Shield } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { ProfileDialog } from "./profile-dialog";
import { MobileSidebar } from "./mobile-sidebar";
import { useState } from "react";

export function Header() {
  const { data: session } = useSession();
  const t = useTranslations("common");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="flex items-center p-4 border-b bg-white dark:bg-slate-950 sticky top-0 z-50 md:static">
      <MobileSidebar />
      <div className="ml-auto flex items-center gap-x-6">
        <LanguageSwitcher />

        <div className="hidden md:flex items-center gap-x-2">
          <span className="text-sm font-medium">{session?.user?.name}</span>
          {session?.user?.role === "ADMIN" ? (
            <Badge
              statusType="role"
              status={session?.user?.role || "USER"}
              label={
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {session?.user?.role}
                </span>
              }
            />
          ) : (
            <Badge statusType="role" status={session?.user?.role || "USER"} />
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full ring-2 ring-slate-200 dark:ring-slate-800 transition-all hover:ring-primary"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={session?.user?.image || ""}
                  alt={session?.user?.name || ""}
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {session?.user?.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-x-2">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name}
                  </p>
                  <Badge
                    statusType="role"
                    status={session?.user?.role || "USER"}
                  />
                </div>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setIsProfileOpen(true)}
            >
              <User className="mr-2 h-4 w-4" />
              <span>{t("profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ProfileDialog
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      </div>
    </div>
  );
}
