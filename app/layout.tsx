import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const font = Geist({
  variable: "--font-main",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-digits",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Box Timer", template: "%s · Box Timer" },
  description: "Workout timer for a CrossFit box: set up on a computer, run full screen on a phone.",
  appleWebApp: {
    capable: true,
    title: "Box Timer",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${font.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}