/**
 * Admin Login Page
 *
 * Simple password-protected login for the admin dashboard.
 * Password is configured via ADMIN_PASSWORD environment variable.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/hp-ctrl-8k3m9x/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/hp-ctrl-8k3m9x");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Invalid password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-separator rounded-xl p-8 shadow-sm">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-xl font-semibold text-label-primary">
              Admin Access
            </h1>
            <p className="text-sm text-label-secondary mt-1">
              Enter password to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  autoFocus
                  className="w-full px-4 py-3 pr-12 bg-fill-secondary border border-separator rounded-lg text-label-primary placeholder:text-label-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-secondary"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Back to site link */}
        <p className="text-center mt-4">
          <Link
            href="/"
            className="text-sm text-label-secondary hover:text-label-primary"
          >
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
