"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  BarChart,
  Database,
  FileSpreadsheet,
  Home,
  Menu,
  Settings,
  LogOut,
  User,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Database,
  },
  {
    title: "AI Sourcing",
    href: "/ai-sourcing",
    icon: Sparkles,
  },
  {
    title: "Results",
    href: "/results",
    icon: FileSpreadsheet,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden fixed left-4 top-4 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[280px] p-0 bg-background border-r"
        >
          <SidebarContent pathname={pathname} />
        </SheetContent>
      </Sheet>

      <aside className="hidden md:flex fixed left-0 top-0 z-30 h-screen w-[280px] flex-col bg-background border-r">
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  const { user, logout } = useAuth();
  
  // Generate initials from user name
  const getInitials = (name: string | undefined) => {
    if (!name) return "AU";
    
    const names = name.split(" ");
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[70px] items-center justify-between border-b px-7 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer flex w-full items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout} 
                className="cursor-pointer text-red-500 focus:text-red-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="flex-1 py-8">
        <nav className="grid gap-2 px-4">
          {sidebarNavItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant={pathname === item.href ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-all duration-200 h-11",
                pathname === item.href
                  ? "bg-primary text-primary-foreground font-medium shadow-md"
                  : "text-foreground hover:text-primary hover:bg-muted/80"
              )}
            >
              <Link href={item.href} className="flex items-center gap-4">
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px]",
                    pathname === item.href
                      ? "text-primary-foreground"
                      : "text-foreground"
                  )}
                />
                <span className="font-medium">{item.title}</span>
              </Link>
            </Button>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <p className="text-sm text-foreground/80 text-center font-medium">
          © 2025 Autorec AI
        </p>
      </div>
    </div>
  );
}
