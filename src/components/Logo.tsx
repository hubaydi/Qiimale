export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        aria-hidden="true"
        className={compact ? "size-8" : "size-9"}
        viewBox="0 0 40 40"
        fill="none"
      >
        <rect width="40" height="40" rx="12" fill="#2563EB" />
        <circle cx="20" cy="11.5" r="5.5" fill="white" />
        <circle cx="11.5" cy="26" r="5.5" fill="white" />
        <circle cx="28.5" cy="26" r="5.5" fill="white" />
        <path
          d="m20 15.5 1.9 3.8 4.1.6-3 2.9.7 4.1-3.7-1.9-3.7 1.9.7-4.1-3-2.9 4.1-.6L20 15.5Z"
          fill="#F59E0B"
        />
      </svg>
      {!compact && (
        <span className="font-jakarta text-xl font-bold tracking-tight text-foreground">
          Qiimale
        </span>
      )}
    </span>
  );
}
