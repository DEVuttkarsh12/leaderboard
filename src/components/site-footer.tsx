import Link from "next/link";
import { footerMenus } from "@/lib/site-content";
import ProductLogo from "./product-logo";

export default function SiteFooter() {
  return (
    <footer className="product-footer">
      <div>
        <ProductLogo />
        <p>Sharp board. Loud shell.</p>
      </div>
      <nav aria-label="Footer navigation">
        {footerMenus.flatMap((menu) => menu.links).slice(0, 8).map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <span>
        LIVE FLOOR · 2026
      </span>
    </footer>
  );
}
