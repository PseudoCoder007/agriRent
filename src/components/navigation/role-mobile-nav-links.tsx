"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type RoleNavItem = {
  href: string;
  label: string;
};

type RoleMobileNavLinksProps = {
  items: RoleNavItem[];
};

export function RoleMobileNavLinks({ items }: RoleMobileNavLinksProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <SheetClose
            key={item.href}
            nativeButton={false}
            render={
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-emerald-100 text-foreground dark:bg-emerald-950/40"
                    : "text-muted-foreground hover:bg-emerald-50 hover:text-foreground dark:hover:bg-emerald-950/30"
                )}
              />
            }
          >
            {item.label}
          </SheetClose>
        );
      })}
    </div>
  );
}

