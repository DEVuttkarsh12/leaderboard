"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { siteNavigation } from "@/lib/site-content";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        shellRef.current &&
        event.target instanceof Node &&
        !shellRef.current.contains(event.target)
      ) {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 md:px-6 md:pt-6">
      <div
        ref={shellRef}
        className={`site-nav-frame ${mobileOpen ? "site-nav-frame--open" : ""}`}
      >
        <div className="site-nav-main">
          <Link
            href="/"
            className="site-nav-brand"
            onClick={() => {
              setOpenMenu(null);
              setMobileOpen(false);
            }}
          >
            <div className="site-nav-brand__mark">RB</div>
            <div className="site-nav-brand__copy">
              <span className="site-nav-brand__title">RankBoard</span>
              <span className="site-nav-brand__subtitle">
                live rewards shell
              </span>
            </div>
          </Link>

          <nav className="site-nav-desktop">
            {siteNavigation.map((item) => {
              const active = item.href
                ? isActivePath(pathname, item.href)
                : item.children?.some((child) =>
                    isActivePath(pathname, child.href)
                  );
              const isOpen = openMenu === item.label;

              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`site-nav-pill ${
                      active ? "site-nav-pill--active" : ""
                    }`}
                    onClick={() => setOpenMenu(null)}
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <div
                  key={item.label}
                  className="site-nav-dropdown-shell"
                  onMouseEnter={() => setOpenMenu(item.label)}
                  onMouseLeave={() =>
                    setOpenMenu((current) =>
                      current === item.label ? null : current
                    )
                  }
                >
                  <button
                    type="button"
                    className={`site-nav-pill ${active ? "site-nav-pill--active" : ""}`}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    onClick={() =>
                      setOpenMenu((current) =>
                        current === item.label ? null : item.label
                      )
                    }
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`site-nav-desktop-dropdown ${
                      isOpen
                        ? "pointer-events-auto translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-1 opacity-0"
                    }`}
                  >
                    {item.children?.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`site-nav-desktop-dropdown__link ${
                          isActivePath(pathname, child.href)
                            ? "site-nav-desktop-dropdown__link--active"
                            : ""
                        }`}
                        onClick={() => setOpenMenu(null)}
                      >
                        <span>{child.label}</span>
                        {child.description ? (
                          <small>{child.description}</small>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="site-nav-actions">
            <Link href="/login" className="site-nav-cta">
              Log in
            </Link>
            <button
              type="button"
              className="site-nav-toggle md:hidden"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setMobileOpen((current) => !current)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="site-nav-mobile-panel md:hidden">
            {siteNavigation.map((item) => {
              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`site-nav-mobile-link ${
                      isActivePath(pathname, item.href)
                        ? "site-nav-mobile-link--active"
                        : ""
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <div key={item.label} className="site-nav-mobile-group">
                  <div className="site-nav-mobile-group__title">{item.label}</div>
                  {item.children?.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`site-nav-mobile-link ${
                        isActivePath(pathname, child.href)
                          ? "site-nav-mobile-link--active"
                          : ""
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </header>
  );
}
