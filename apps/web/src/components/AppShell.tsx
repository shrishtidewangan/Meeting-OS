import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { starterRoutes } from "../routes";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">MeetingOS Starter</div>
        <nav className="nav" aria-label="Starter pages">
          {starterRoutes.map((route) => (
            <Link key={route.path} to={route.path}>
              {route.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}

