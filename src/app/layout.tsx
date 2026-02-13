import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";
import { Bus, List, PlusCircle } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Fleet Dispatch",
  description: "Automated Voicemail Triage MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-slate-50 text-slate-900`}>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            <header className="border-b bg-white sticky top-0 z-10">
              <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900 hover:opacity-80 transition-opacity">
                  <div className="bg-blue-600 p-1 rounded-md">
                    <Bus className="w-6 h-6 text-white" />
                  </div>
                  <span>FleetAI</span>
                </Link>
                <nav className="flex items-center gap-6">
                  <Link href="/incidents" className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1.5 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors">
                    <List className="w-4 h-4" />
                    List
                  </Link>
                  <Link href="/" className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 px-4 py-2 rounded-md shadow-sm transition-colors">
                    <PlusCircle className="w-4 h-4" />
                    New Intake
                  </Link>
                </nav>
              </div>
            </header>
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t bg-white py-8">
              <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm italic font-medium">
                AI Voicemail Triage Dispatch Agent • MVP v1.0
              </div>
            </footer>
          </div>
          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </body>
    </html>
  );
}
