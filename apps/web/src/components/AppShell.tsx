import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken, clearToken } from "../services/apiClient";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(getToken());

  function handleSignOut() {
    clearToken();
    navigate("/auth");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-6 border-b border-gray-200 bg-white px-6 py-4">
        <Link to={isLoggedIn ? "/dashboard" : "/auth"} className="text-lg font-bold">
          MeetingOS
        </Link>
        <nav className="flex flex-wrap items-center gap-4" aria-label="Main navigation">
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="font-semibold text-teal-800 hover:underline">
                Dashboard
              </Link>
              <Link to="/meetings/new" className="font-semibold text-teal-800 hover:underline">
                New meeting
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-gray-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="font-semibold text-teal-800 hover:underline">
              Sign In
            </Link>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}