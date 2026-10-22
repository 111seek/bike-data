"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/ui";

const LINKS = [
  { href: "/", label: "轮胎" },
  { href: "/frames", label: "车架" },
  { href: "/rankings", label: "排行榜" },
  { href: "/brands", label: "品牌" },
  { href: "/compare", label: "对比" },
  { href: "/about", label: "关于数据" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-3 px-4 sm:gap-6 md:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="relative grid h-9 w-9 place-items-center rounded-full border-2 border-ink">
            <span className="absolute inset-[5px] rounded-full border border-ink/30" />
            <span className="h-2.5 w-2.5 rounded-full bg-accent transition-transform group-hover:scale-125" />
            <span className="absolute -top-[3px] left-1/2 h-[5px] w-[3px] -translate-x-1/2 bg-ink" />
            <span className="absolute -bottom-[3px] left-1/2 h-[5px] w-[3px] -translate-x-1/2 bg-ink" />
            <span className="absolute -left-[3px] top-1/2 h-[3px] w-[5px] -translate-y-1/2 bg-ink" />
            <span className="absolute -right-[3px] top-1/2 h-[3px] w-[5px] -translate-y-1/2 bg-ink" />
          </span>
          <span className="leading-none">
            <span className="block whitespace-nowrap text-[16px] font-bold tracking-tight sm:text-[17px]">滚阻库</span>
            <span className="mt-1 hidden text-[9px] font-semibold tracking-[0.22em] text-muted sm:block">
              ROLLING DATA
            </span>
          </span>
        </Link>

        <nav className="ml-auto flex min-w-0 items-center gap-0.5 overflow-x-auto text-[12px] sm:text-[13px]">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-2 py-2 whitespace-nowrap transition-colors sm:px-3",
                  link.href === "/about" && "hidden sm:block",
                  active
                    ? "bg-ink text-paper"
                    : "text-ink-soft hover:bg-ink/5 hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <a
          href="https://www.bicyclerollingresistance.com/road-bike-reviews"
          target="_blank"
          rel="noreferrer noopener"
          className="hidden shrink-0 items-center gap-1.5 rounded-full border border-line-strong px-3 py-2 text-[12px] font-medium text-ink-soft transition-colors hover:border-ink hover:text-ink lg:flex"
        >
          原始数据
          <span aria-hidden>↗</span>
        </a>
      </div>
    </header>
  );
}
