"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav({
  children,
  menuLabel,
}: {
  children: React.ReactNode;
  menuLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: close sheet on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
          <span className="sr-only">{menuLabel}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 p-0 flex flex-col">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-jakarta)] text-lg font-bold text-foreground"
          >
            Qiimale
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {children}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
