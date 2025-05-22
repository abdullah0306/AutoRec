import { MainNav } from "@/components/layout/main-nav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MainNav />
      <div className="sticky-header-offset"></div>
      <div className="flex flex-col min-h-[calc(100vh-64px)]">
        <main className="flex-1">{children}</main>
        <footer className="border-t py-8 md:py-12 mt-auto">
          <div className="container flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Autorec AI. All rights reserved.
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground">
                Privacy
              </a>
              <a href="/terms" className="hover:text-foreground">
                Terms
              </a>
              {/* Contact link commented out as per request
              <a href="/contact" className="hover:text-foreground">
                Contact
              </a>
              */}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
