import type { Metadata, Viewport } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/manrope";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

// Self-hosted (via npm, not Google's font CDN) so this works offline and
// with no external request at build or runtime. Two distinct typefaces on
// purpose: Space Grotesk's squared-off, slightly technical character gives
// big numbers (the Score, set counts) a personality of their own, while
// Manrope stays warm and easy to read for body copy.

export const metadata: Metadata = {
  title: "Splitter",
  description: "Train your way. Know your split.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Splitter",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
