import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TEKAD Arcade",
  applicationName: "TEKAD Arcade",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/branding/tekad-arcade-red.png", type: "image/png" }],
    apple: [{ url: "/branding/apple-touch-icon.png?v=red1", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: "TEKAD Arcade", statusBarStyle: "default" },
  description: "Kumpulan game TEKAD bersama Timmy, Eldric, Kirana, Adelia, dan Dylan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
