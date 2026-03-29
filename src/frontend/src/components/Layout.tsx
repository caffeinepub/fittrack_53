import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  BarChart2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Dumbbell,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { UserProfile } from "../backend.d.ts";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { Page } from "../types";

const navItems: {
  id: Page | "settings";
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "plans", label: "My Plans", icon: ClipboardList },
  { id: "progress", label: "Progress", icon: BarChart2 },
  { id: "tracker", label: "Workout Tracker", icon: Dumbbell },
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

interface LayoutProps {
  page: Page;
  setPage: (p: Page) => void;
  children: ReactNode;
}

export default function Layout({ page, setPage, children }: LayoutProps) {
  const { identity, clear } = useInternetIdentity();
  const { actor } = useActor();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!actor) return;
    actor
      .getCallerUserProfile()
      .then(setProfile)
      .catch(() => null);
  }, [actor]);

  const principal = identity?.getPrincipal().toString() ?? "";
  const displayName =
    profile?.name || (principal ? `${principal.slice(0, 8)}...` : "User");
  const initials = displayName.slice(0, 2).toUpperCase();

  const mainPages: Page[] = [
    "dashboard",
    "plans",
    "progress",
    "tracker",
    "schedule",
    "history",
  ];

  function handleNav(id: Page | "settings") {
    if (mainPages.includes(id as Page)) {
      setPage(id as Page);
    }
    setMobileOpen(false);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-sidebar transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">FT</span>
          </div>
          <span className="font-bold text-sidebar-foreground text-lg tracking-tight">
            FitTrack
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = id === page;
            return (
              <button
                key={id}
                type="button"
                data-ocid={`nav.${id}.link`}
                onClick={() => handleNav(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-accent text-white text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {displayName}
              </p>
            </div>
            <button
              type="button"
              onClick={clear}
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
        />
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 px-6 py-4 bg-card border-b border-border flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <nav className="hidden lg:flex items-center gap-1">
              {(
                [
                  "dashboard",
                  "plans",
                  "progress",
                  "schedule",
                  "history",
                ] as Page[]
              ).map((p) => (
                <button
                  key={p}
                  type="button"
                  data-ocid={`header.${p}.link`}
                  onClick={() => setPage(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors",
                    page === p
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                >
                  {p === "plans"
                    ? "My Plans"
                    : p === "progress"
                      ? "Progress"
                      : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  data-ocid="header.user.dropdown_menu"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-white text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium text-foreground max-w-24 truncate">
                    {displayName}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={clear}
                  data-ocid="header.logout.button"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              caffeine.ai
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
