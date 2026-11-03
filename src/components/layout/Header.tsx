"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { MediaImage } from "@/components/ui/MediaImage";
import { useCart } from "@/lib/state/cart";
import { useWishlist } from "@/lib/state/wishlist";
import { useEscape, useScrolled } from "@/lib/hooks/ui";
import { collectionsMenu, mainNav, shopMenu } from "@/lib/navigation";
import { cx } from "@/lib/format";
import { SearchOverlay } from "./SearchOverlay";
import { MobileMenu } from "./MobileMenu";

type MenuKey = "shop" | "collections" | null;

const ease = [0.22, 1, 0.36, 1] as const;

export function Header() {
  const pathname = usePathname();
  const scrolled = useScrolled(40);
  const { count, hydrated, open: openCart } = useCart();
  const wishlist = useWishlist();
  const [menu, setMenu] = useState<MenuKey>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const overlay = pathname === "/" && !scrolled && !menu && !searchOpen;
  const closeAll = useCallback(() => {
    setMenu(null);
    setSearchOpen(false);
  }, []);
  useEscape(!!menu || searchOpen, closeAll);

  // close transient UI on navigation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset transient menus when the route changes
    setMenu(null);
    setSearchOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const openMenu = (m: MenuKey) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setSearchOpen(false);
    setMenu(m);
  };
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMenu(null), 160);
  };

  const iconBtn = "relative inline-flex h-10 w-10 items-center justify-center transition-opacity duration-300 hover:opacity-60";

  return (
    <>
      <header
        className={cx(
          "sticky top-0 z-50 transition-[background-color,color,border-color,box-shadow] duration-700 ease-[var(--ease-luxe)]",
          overlay ? "border-b border-transparent bg-transparent text-ivory" : "border-b border-line bg-ivory/95 text-ink backdrop-blur-md",
        )}
        onMouseLeave={scheduleClose}
      >
        <div className="container-luxe grid h-[var(--header-h)] grid-cols-[1fr_auto_1fr] items-center xl:grid-cols-[auto_1fr_auto] xl:gap-10">
          {/* left: mobile controls */}
          <div className="flex items-center gap-1 xl:hidden">
            <button type="button" className={iconBtn} onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={20} strokeWidth={1.2} />
            </button>
            <button type="button" className={iconBtn} onClick={() => setSearchOpen((v) => !v)} aria-label="Search">
              <Search size={19} strokeWidth={1.2} />
            </button>
          </div>

          {/* logo */}
          <Link href="/" aria-label="LA Luxury Gold — home" className="justify-self-center text-[12px] sm:text-[13px] xl:justify-self-start xl:text-[14px]">
            <Logo tone={overlay ? "ivory" : "ink"} />
          </Link>

          {/* desktop nav */}
          <nav aria-label="Main" className="hidden justify-center xl:flex">
            <ul className="flex items-center gap-9">
              {mainNav.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <li key={item.href} onMouseEnter={() => (item.menu ? openMenu(item.menu) : scheduleClose())}>
                    <Link
                      href={item.href}
                      aria-haspopup={item.menu ? "true" : undefined}
                      aria-expanded={item.menu ? menu === item.menu : undefined}
                      onFocus={() => item.menu && openMenu(item.menu)}
                      className={cx(
                        "relative py-3 text-[0.68rem] font-medium uppercase tracking-[0.22em] transition-opacity duration-300 hover:opacity-100",
                        active ? "opacity-100" : "opacity-80",
                      )}
                    >
                      {item.label}
                      <span
                        className={cx(
                          "absolute -bottom-0.5 left-0 h-px bg-current transition-all duration-500 ease-[var(--ease-luxe)]",
                          active || menu === item.menu ? "w-full" : "w-0",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* right icons */}
          <div className="flex items-center justify-self-end gap-0.5 sm:gap-1">
            <button type="button" className={cx(iconBtn, "max-xl:hidden")} onClick={() => { setMenu(null); setSearchOpen((v) => !v); }} aria-label="Search" aria-expanded={searchOpen}>
              <Search size={19} strokeWidth={1.2} />
            </button>
            <Link href="/account" className={cx(iconBtn, "max-sm:hidden")} aria-label="Account">
              <User size={19} strokeWidth={1.2} />
            </Link>
            <Link href="/wishlist" className={cx(iconBtn, "max-sm:hidden")} aria-label={`Wishlist${wishlist.hydrated && wishlist.ids.length ? `, ${wishlist.ids.length} items` : ""}`}>
              <Heart size={19} strokeWidth={1.2} />
              {wishlist.hydrated && wishlist.ids.length > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-champagne" />}
            </Link>
            <button type="button" className={iconBtn} onClick={openCart} aria-label={`Shopping bag, ${hydrated ? count : 0} items`}>
              <ShoppingBag size={19} strokeWidth={1.2} />
              <AnimatePresence>
                {hydrated && count > 0 && (
                  <m.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ duration: 0.4, ease }}
                    className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-champagne px-1 text-[0.58rem] font-semibold text-ink"
                  >
                    {count}
                  </m.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* mega menus */}
        <AnimatePresence>
          {menu && (
            <m.div
              key={menu}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease }}
              className="absolute inset-x-0 top-full hidden border-b border-line bg-ivory text-ink shadow-[0_30px_60px_-40px_rgba(17,17,17,0.35)] xl:block"
              onMouseEnter={() => openMenu(menu)}
              onMouseLeave={scheduleClose}
            >
              {menu === "shop" ? <ShopMega /> : <CollectionsMega />}
            </m.div>
          )}
        </AnimatePresence>

        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

function MegaColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="eyebrow mb-6 text-stone">{title}</p>
      <ul className="space-y-3.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="font-display text-[1.35rem] leading-none transition-colors duration-300 hover:text-champagne">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MegaTile({ href, media, title, caption }: { href: string; media: string; title: string; caption: string }) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        <MediaImage mediaKey={media} alt="" sizes="260px" className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-luxe)] group-hover:scale-105" />
      </div>
      <p className="mt-4 font-display text-xl">{title}</p>
      <p className="eyebrow mt-1 text-stone">{caption}</p>
    </Link>
  );
}

function ShopMega() {
  return (
    <div className="container-luxe grid grid-cols-[1fr_1fr_1fr_1.25fr_1.25fr] gap-12 py-12">
      <MegaColumn title="Categories" links={shopMenu.categories} />
      <MegaColumn title="By gold purity" links={shopMenu.purity} />
      <MegaColumn title="Discover" links={shopMenu.discover} />
      <MegaTile href="/collections/rings" media="editorial/category-rings" title="Rings" caption="Bands · Signets · Domes" />
      <MegaTile href="/gold-bars" media="editorial/category-bars" title="24K Gold Bars" caption="Minted & cast" />
    </div>
  );
}

function CollectionsMega() {
  return (
    <div className="container-luxe grid grid-cols-[1.6fr_1fr_1fr] gap-12 py-12">
      <div>
        <p className="eyebrow mb-6 text-stone">Curated collections</p>
        <ul className="space-y-6">
          {collectionsMenu.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="group block max-w-md">
                <span className="font-display text-[1.6rem] leading-none transition-colors duration-300 group-hover:text-champagne">{c.label}</span>
                <span className="mt-1.5 block text-sm leading-relaxed text-stone">{c.intro}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <MegaTile href="/collections/signature" media="editorial/story" title="The Signature Edit" caption="Sculpted silhouettes" />
      <MegaTile href="/collections/gifting" media="editorial/social-6" title="The Gift Edit" caption="For milestones" />
    </div>
  );
}
