import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion";

export function SectionHeader({
  title,
  href,
  linkLabel,
  action,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  action?: ReactNode;
}) {
  return (
    <Reveal
      as="div"
      className="mb-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2.5">
        <span className="inline-block h-5 w-1 rounded-full bg-primary" />
        {title}
      </h2>
      <div
        className={`flex w-full items-center gap-2 sm:w-auto sm:justify-end ${
          action ? "justify-between" : "justify-end"
        }`}
      >
        {action}
        {href && linkLabel ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 group/link"
          >
            {linkLabel}
            <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        ) : null}
      </div>
    </Reveal>
  );
}
