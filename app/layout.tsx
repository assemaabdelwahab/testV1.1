import type { Metadata } from "next";
import "./globals.css";
import { PrivacyProvider } from "@/contexts/PrivacyContext";
import NavBar from "@/components/ui/NavBar";
import Header from "@/components/ui/Header";

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Personal expense tracking and visualization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg-primary text-text-primary antialiased font-sans">
        <PrivacyProvider>
          <div className="flex min-h-screen">
            <NavBar />
            <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
                {children}
              </main>
            </div>
          </div>
        </PrivacyProvider>
      </body>
    </html>
  );
}
