import type { Metadata } from "next";
import "./globals.css";
import { PrivacyProvider } from "@/contexts/PrivacyContext";

export const metadata: Metadata = {
  title: "Expenses",
  description: "Personal expense tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg-base text-ink-primary antialiased font-sans min-h-screen">
        <PrivacyProvider>
          {children}
        </PrivacyProvider>
      </body>
    </html>
  );
}
