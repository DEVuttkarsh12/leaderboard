"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ProductLogo from "./product-logo";

const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Board", href: "/leaderboard" },
  { label: "Missions", href: "/challenges" },
  { label: "Hunts", href: "/bonus-hunts" },
  { label: "Vault", href: "/store" },
  { label: "Help", href: "/help" },
] as const;

const accountLinks = [
  { label: "Login", href: "/login" },
  { label: "Support", href: "/support" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const shellRef = useRef<HTMLElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        shellRef.current &&
        event.target instanceof Node &&
        !shellRef.current.contains(event.target)
      ) {
        setMobileOpen(false);
        setAccountOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setAccountOpen(false);
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
    <>
      <header ref={shellRef} className="product-header">
        <ProductLogo
          onClick={() => {
            setMobileOpen(false);
            setAccountOpen(false);
          }}
        />
        <nav className={`product-nav${mobileOpen ? " open" : ""}`} aria-label="Primary navigation">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActivePath(pathname, link.href) ? "active" : ""}
              onClick={() => {
                setMobileOpen(false);
                setAccountOpen(false);
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="product-actions">
          <span className="product-live">
            <i />
            LIVE
          </span>
          <Link className="notification-trigger" href="/leaderboard" aria-label="Open leaderboard">
            <span>◇</span>
            <b>1</b>
          </Link>
          <div className="account-wrap">
            <button
              type="button"
              className="account-trigger"
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              onClick={() => {
                setAccountOpen((current) => !current);
                setMobileOpen(false);
              }}
            >
              <span className="mini-player tone-coral">
                RB
                <i />
              </span>
              <span>
                <strong>PLAY FLOOR</strong>
                <small>VIP lane</small>
              </span>
              <b aria-hidden="true">⌄</b>
            </button>
            {accountOpen ? (
              <div className="account-menu" role="menu">
                <div>
                  <span className="mini-player tone-coral">
                    RB
                    <i />
                  </span>
                  <p>
                    <strong>RankBoard</strong>
                    <small>VIP lane</small>
                  </p>
                </div>
                {accountLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setAccountOpen(false)}
                  >
                    {link.label}
                    <span>↗</span>
                  </Link>
                ))}
                <button type="button" onClick={() => setAccountOpen(false)}>
                  CLOSE
                  <span>→</span>
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="product-menu"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            onClick={() => {
              setMobileOpen((current) => !current);
              setAccountOpen(false);
            }}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>
    </>
  );
}
