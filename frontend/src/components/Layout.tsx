import { ReactNode } from "react";
import { Link } from "react-router-dom";
import itmsLogo from "../assets/itms-logo.png";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-2">
          <img src={itmsLogo} alt="ITMS Group" className="h-12 w-auto sm:h-14" />
          <span className="text-xl font-extrabold tracking-tight text-accent">Trivia</span>
        </Link>
        <Link
          to="/ranking"
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/80 transition hover:bg-white/50 hover:text-ink"
        >
          🏆 Ranking
        </Link>
      </header>
      <main className="relative flex flex-1 flex-col items-center justify-center px-4 pb-16 sm:px-6">
        {children}
      </main>
      <footer className="px-6 pb-6 text-center text-xs text-ink/40">
        © {new Date().getFullYear()} ITMS Group — Evento Trivia
      </footer>
    </div>
  );
}
