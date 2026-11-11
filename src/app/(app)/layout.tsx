import { Suspense } from "react";
import { ProtectedShell, Splash } from "@/components/app/ProtectedShell";

// This group gates everything behind client-side auth + PIN state, so the
// static shell deliberately can't be instant-validated.
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Splash label="Opening your world…" />}>
      <ProtectedShell>{children}</ProtectedShell>
    </Suspense>
  );
}
