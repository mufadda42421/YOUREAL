import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/providers/Toast";
import { AppProvider } from "@/components/providers/AppProvider";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "YOU: Your World. Your Way.",
    template: "%s · YOU",
  },
  description:
    "YOU is your private digital universe — a personal workspace that understands your identity, adapts to your preferences, and grows with you. Build your own worlds, import your own media, and live more intentionally.",
  keywords: ["personal universe", "digital workspace", "personalization", "journal", "worlds"],
  openGraph: {
    title: "YOU: Your World. Your Way.",
    description:
      "An all-in-one personal digital universe for self-discovery, identity, habits, journaling, memories, and meaningful connections.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "YOU: Your World. Your Way." },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08080a" },
    { media: "(prefers-color-scheme: light)", color: "#f6f6f8" },
  ],
};

const themeBootstrap = `
(function () {
  try {
    var stored = localStorage.getItem('you-theme') || 'dark';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored === 'dark' || (stored === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable} dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-dvh">
        <ToastProvider>
          <AppProvider>{children}</AppProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
