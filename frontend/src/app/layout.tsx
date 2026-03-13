import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "J's Room AI — Live AI Interior Designer",
  description:
    "Show your room, talk about your style, get a shopping list. Powered by Gemini Live API.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
