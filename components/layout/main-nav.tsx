"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, User, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "../ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

interface NavItem {
  title: string;
  href: string;
}

const publicNavItems: NavItem[] = [
  { title: "Features", href: "#features" },
  { title: "Pricing", href: "#pricing" },
  // { title: "Blog", href: "/blog" },
  // { title: "Docs", href: "/docs" },
];

const authenticatedNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  // { title: "Scrapes", href: "/scrapes" },
  // { title: "Emails", href: "/emails" },
  { title: "Settings", href: "/settings" },
];

export function MainNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  
  // Select the appropriate nav items based on authentication state
  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle scroll events to change navbar appearance
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Check initial scroll position
    handleScroll();
    
    // Clean up event listener
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "sticky-header border-b backdrop-blur transition-all duration-200",
        isScrolled 
          ? "bg-background/95 supports-[backdrop-filter]:bg-background/80 shadow-sm" 
          : "bg-background/50 supports-[backdrop-filter]:bg-background/30"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Logo />
          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary relative group",
                  (pathname === item.href || pathname?.startsWith(`${item.href}/`)) 
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.title}
                <span className={cn(
                  "absolute -bottom-1 left-0 h-0.5 bg-primary rounded-full transition-all duration-200 w-0 group-hover:w-full",
                  (pathname === item.href || pathname?.startsWith(`${item.href}/`)) && "w-full"
                )}></span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop navigation menu */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full transition-transform hover:scale-110">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" asChild size="sm" className="transition-transform hover:scale-105">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="transition-transform hover:scale-105">
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            className="px-2 transition-all"
            aria-label="Toggle mobile menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-[64px] z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto pb-12 bg-background border-t p-6 md:hidden animate-in slide-in-from-top-5 duration-300">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-base font-medium transition-colors hover:text-primary py-2 border-b border-muted",
                    (pathname === item.href || pathname?.startsWith(`${item.href}/`)) 
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <>
                  <Link 
                    href="/profile"
                    className="text-base font-medium transition-colors hover:text-primary text-muted-foreground py-2 border-b border-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Button 
                    variant="destructive" 
                    className="w-full mt-4"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <div className="pt-4 flex flex-col gap-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register">Sign up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
