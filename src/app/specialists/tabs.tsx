"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SpecialistsTabs({ browse, join }: { browse: string; join: string }) {
  const path = usePathname();
  const tabs = [
    { href: "/specialists", label: browse, on: path !== "/specialists/join" },
    { href: "/specialists/join", label: join, on: path === "/specialists/join" },
  ];
  return (
    <nav className="flex gap-1 border-b border-line">
      {tabs.map((x) => (
        <Link
          key={x.href}
          href={x.href}
          aria-current={x.on ? "page" : undefined}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${
            x.on ? "border-brand text-brand-dark" : "border-transparent text-ink-soft hover:text-brand"
          }`}
        >
          {x.label}
        </Link>
      ))}
    </nav>
  );
}
