import Link from "next/link";
import { footerMenus } from "@/lib/site-content";

export default function SiteFooter() {
  return (
    <footer className="px-4 pb-8 pt-10 md:px-6 md:pb-10 md:pt-14">
      <div className="section-wrap">
        <div className="surface-panel rounded-[2rem] px-6 py-8 md:px-8 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_repeat(3,0.8fr)]">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <div className="brand-mark flex h-12 w-12 items-center justify-center rounded-[1rem] text-sm font-semibold text-white">
                  RB
                </div>
                <div>
                  <div className="display-serif text-2xl font-semibold tracking-[-0.05em] text-[var(--shib-cream)]">
                    RankBoard
                  </div>
                  <div className="text-[0.7rem] uppercase tracking-[0.24em] text-[var(--shib-muted)]">
                    Multi-page rewards shell
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-[var(--shib-muted-soft)]">
                The live leaderboard remains read-only and untouched. These new
                pages extend the product surface around it with the same visual
                language and a more complete route structure.
              </p>
            </div>

            {footerMenus.map((menu) => (
              <div key={menu.title}>
                <div className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--shib-muted)]">
                  {menu.title}
                </div>
                <div className="mt-4 space-y-3">
                  {menu.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block text-sm font-medium text-[var(--shib-cream)] transition-colors hover:text-[var(--shib-fur-bright)]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
