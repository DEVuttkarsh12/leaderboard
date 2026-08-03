"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { siteNavigation } from "@/lib/site-content";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const mobileLinks = siteNavigation.flatMap((item) =>
    item.children
      ? item.children
      : item.href
        ? [
            {
              label: item.label,
              href: item.href,
              description: item.description,
            },
          ]
        : []
  );

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 md:px-6">
      <div className="section-wrap">
        <div className="site-nav-shell rounded-[1.75rem] px-3 py-3 md:px-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="brand-mark flex h-11 w-11 items-center justify-center rounded-[1.1rem] text-sm font-semibold text-white shadow-[0_18px_40px_rgba(17,95,89,0.28)]">
              RB
            </div>
            <div className="min-w-0">
              <span className="display-serif block truncate text-[1.45rem] font-semibold tracking-[-0.05em] text-[var(--shib-cream)] md:text-[1.6rem]">
                RankBoard
              </span>
              <span className="hidden text-[0.62rem] uppercase tracking-[0.28em] text-[var(--shib-muted)] md:block">
                Read-only rewards hub
              </span>
            </div>
            </Link>

            <nav className="hidden items-center gap-1 rounded-full border border-[rgba(47,143,131,0.16)] bg-[rgba(15,35,44,0.44)] px-2 py-2 backdrop-blur md:flex">
              {siteNavigation.map((item) => {
                const active = item.href
                  ? isActivePath(pathname, item.href)
                  : item.children?.some((child) =>
                      isActivePath(pathname, child.href)
                    );

                if (item.href) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        active
                          ? "bg-[rgba(255,189,92,0.16)] text-[var(--shib-fur-bright)]"
                          : "text-[var(--shib-muted-soft)] hover:bg-[rgba(15,35,44,0.72)] hover:text-[var(--shib-cream)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <div key={item.label} className="group relative">
                    <button
                      type="button"
                      className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        active
                          ? "bg-[rgba(255,189,92,0.16)] text-[var(--shib-fur-bright)]"
                          : "text-[var(--shib-muted-soft)] hover:bg-[rgba(15,35,44,0.72)] hover:text-[var(--shib-cream)]"
                      }`}
                    >
                      {item.label}
                      <ChevronDown className="h-4 w-4" />
                    </button>

                    <div className="pointer-events-none absolute left-0 top-full mt-3 w-72 translate-y-1 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="surface-panel rounded-[1.5rem] p-3 shadow-[0_24px_60px_rgba(1,0,7,0.38)]">
                        {item.children?.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`block rounded-[1rem] px-4 py-3 transition-all ${
                              isActivePath(pathname, child.href)
                                ? "bg-[rgba(255,189,92,0.1)] text-[var(--shib-fur-bright)]"
                                : "hover:bg-[rgba(255,255,255,0.05)]"
                            }`}
                          >
                            <div className="text-sm font-semibold text-inherit">
                              {child.label}
                            </div>
                            {child.description ? (
                              <div className="mt-1 text-xs leading-5 text-[var(--shib-muted-soft)]">
                                {child.description}
                              </div>
                            ) : null}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/leaderboard"
              className="hidden rounded-full border border-[rgba(47,143,131,0.18)] bg-[rgba(15,35,44,0.48)] px-4 py-3 text-sm font-medium text-[var(--shib-cream)] transition-all hover:-translate-y-0.5 hover:bg-[rgba(15,35,44,0.72)] md:inline-flex"
            >
              Live board
              </Link>
              <Link
                href="/login"
              className="primary-button rounded-full px-5 py-3 text-sm font-semibold text-[#2d1600]"
            >
              Log in
              </Link>
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
            {mobileLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActivePath(pathname, item.href)
                    ? "bg-[rgba(255,189,92,0.16)] text-[var(--shib-fur-bright)]"
                    : "border border-[rgba(47,143,131,0.16)] bg-[rgba(15,35,44,0.44)] text-[var(--shib-muted-soft)]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
