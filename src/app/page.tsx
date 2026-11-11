import { Suspense } from "react";
import { HomeExperience } from "@/components/home/HomeExperience";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#08080a]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      }
    >
      <HomeExperience />
    </Suspense>
  );
}
