"use client";

import { initialsOf, cx } from "@/lib/utils";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  accent?: string;
  className?: string;
}

/** Deterministic gradient per name — no external identicon service. */
const GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-fuchsia-500 to-purple-600",
];

export function Avatar({ name, src, size = 40, className }: AvatarProps) {
  const initials = initialsOf(name || "You");
  const hash = [...(name || "you")].reduce((a, c) => a + c.charCodeAt(0), 0);
  const gradient = GRADIENTS[hash % GRADIENTS.length];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cx(
          "shrink-0 rounded-full object-cover ring-1 ring-white/10",
          className
        )}
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ring-1 ring-white/10",
        gradient,
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.floor(size * 0.36)),
      }}
    >
      {initials}
    </div>
  );
}
