"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Monitor,
  Users,
  MapPin,
  Activity,
  Calendar,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Devices", href: "/devices", icon: Monitor },
  { label: "Profiles", href: "/profiles", icon: Users },
  { label: "Locations", href: "/locations", icon: MapPin },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Stream", href: "/stream", icon: Activity },
];

const disabledItems: { label: string; icon: typeof Calendar }[] = [];

export function SidebarNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setCollapsed(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200 md:relative md:translate-x-0",
          collapsed ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center gap-2 px-4">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold text-sidebar-foreground">
            Event Streams
          </h1>
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setCollapsed(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

            <Separator className="my-2" />

            {disabledItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/50 cursor-default"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                <span className="ml-auto text-xs text-muted-foreground/40">
                  drill-down
                </span>
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Event Streams Dashboard</p>
        </div>
      </aside>
    </>
  );
}
