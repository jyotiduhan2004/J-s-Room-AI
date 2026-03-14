"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useSession } from "@/context/SessionContext";

const MAX_SESSION_SEC = 10 * 60;

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { state, actions } = useSession();
  const pathname = usePathname();

  const isConnected = state.connectionStatus === "connected";
  const timeRemaining = MAX_SESSION_SEC - state.sessionElapsed;
  const isLowTime = timeRemaining <= 60 && isConnected;

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 py-2 sm:py-2.5 bg-white dark:bg-slate-950 z-10 shrink-0">
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-primary to-blue-600 p-1.5 rounded-lg shadow-sm shadow-primary/25">
              <span className="material-symbols-outlined text-white !text-lg sm:!text-xl">design_services</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">J&apos;s Room AI</h1>
          </Link>

          {/* Nav links — visible on all sizes */}
          <nav className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/"
              onClick={() => actions.resetSession()}
              className={`text-xs sm:text-sm font-medium transition-colors ${
                pathname === "/" ? "text-primary font-semibold" : "text-slate-500 dark:text-slate-400 hover:text-primary"
              }`}
            >
              Studio
            </Link>
            <Link
              href="/projects"
              className={`text-xs sm:text-sm font-medium transition-colors ${
                pathname === "/projects" ? "text-primary font-semibold" : "text-slate-500 dark:text-slate-400 hover:text-primary"
              }`}
            >
              Projects
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Session timer */}
          {isConnected && (
            <div
              className={`flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-mono ${
                isLowTime
                  ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <span className="material-symbols-outlined !text-[10px] sm:!text-xs">timer</span>
              <span className="hidden sm:inline">{formatTime(state.sessionElapsed)} / {formatTime(MAX_SESSION_SEC)}</span>
              <span className="sm:hidden">{formatTime(state.sessionElapsed)}</span>
            </div>
          )}

          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
