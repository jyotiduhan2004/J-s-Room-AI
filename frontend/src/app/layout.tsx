import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Live Room AI — AI Interior Designer",
  description:
    "Live voice AI interior designer. Show your room, choose a style, get a shopping list. Powered by Gemini Live & Imagen.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
        {children}
      </body>
    </html>
  );
}
