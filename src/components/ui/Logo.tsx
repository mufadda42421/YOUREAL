import { cx } from "@/lib/utils";

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="YOU logo"
      className={cx("shrink-0", className)}
    >
      <rect width="48" height="48" rx="13" fill="url(#you-mark-g)" />
      <path
        d="M14 14.5 24 25.5 34 14.5"
        stroke="#fff"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 25.5v9.5"
        stroke="#fff"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="38.5" cy="38.5" r="2.4" fill="#c7d2fe" />
      <defs>
        <linearGradient id="you-mark-g" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="0.5" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "select-none text-[1.35rem] font-extrabold leading-none tracking-[-0.04em] text-[var(--app-text)]",
        className
      )}
    >
      YOU<span className="text-indigo-400">.</span>
    </span>
  );
}
