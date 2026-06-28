"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type RoleNavItem = {
  href: string;
  label: string;
};

type RoleNavLinksProps = {
  items: RoleNavItem[];
  className?: string;
  itemClassName?: string;
};

export function RoleNavLinks({
  items,
  className,
  itemClassName,
}: RoleNavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className={className}>
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
              itemClassName
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

