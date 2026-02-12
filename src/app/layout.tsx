import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Event Streams Dashboard",
  description: "Real-time event streams monitoring and analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex h-screen overflow-hidden">
          <SidebarNav />
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="animate-pulse text-muted-foreground">
                    Loading...
                  </div>
                </div>
              }
            >
              {children}
            </Suspense>
          </main>
        </div>
      </body>
    </html>
  );
}
