"use client";

import { Menu } from "lucide-react";
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
      <SheetContent side="right" className="w-64 pt-12">
        <nav className="flex flex-col gap-1">{children}</nav>
      </SheetContent>
    </Sheet>
  );
}
