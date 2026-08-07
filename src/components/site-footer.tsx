import Link from "next/link";
import { footerMenus } from "@/lib/site-content";

export default function SiteFooter() {
  return (
    <footer className="site-footer px-4 pb-8 pt-14 md:px-6 md:pb-10 md:pt-18">
      <div className="section-wrap">
        <div className="site-footer__inner">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(3,minmax(0,0.7fr))]">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <div className="site-nav-brand__mark">RB</div>
                <div>
                  <div className="display-logo text-[2.2rem] leading-none text-[var(--shib-cream)]">
                    RankBoard
                  </div>
                  <div className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--shib-muted)]">
                    read-only leaderboard shell
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-[var(--shib-muted-soft)]">
                Live standings still run through the same protected route. This
                pass only reshapes the public shell around it.
              </p>

              <div className="footer-meta-grid mt-6">
                <div className="footer-meta-card">
                  <div className="footer-meta-card__label">Access</div>
                  <div className="footer-meta-card__value">Read only</div>
                </div>
                <div className="footer-meta-card">
                  <div className="footer-meta-card__label">Refresh</div>
                  <div className="footer-meta-card__value">60 sec</div>
                </div>
                <div className="footer-meta-card">
                  <div className="footer-meta-card__label">Provider</div>
                  <div className="footer-meta-card__value">Live route</div>
                </div>
              </div>
            </div>

            {footerMenus.map((menu) => (
              <div key={menu.title}>
                <div className="text-[0.7rem] uppercase tracking-[0.24em] text-[var(--shib-muted)]">
                  {menu.title}
                </div>
                <div className="mt-4 space-y-3">
                  {menu.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block text-sm font-medium text-[var(--shib-cream)] transition-colors hover:text-[var(--shib-gold)]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="site-footer__bottom">
            <span>© 2026 RankBoard.</span>
            <span>The leaderboard engine remains untouched.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
