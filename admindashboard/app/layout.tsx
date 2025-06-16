import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LoadingProvider, QueryProvider } from "./contexts";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FoodHouse Admin Dashboard",
  description:
    "Admin dashboard for FoodHouse - connecting farmers with customers",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <LoadingProvider>
            {children}
            <Toaster />
          </LoadingProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
