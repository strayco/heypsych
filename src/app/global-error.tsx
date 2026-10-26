"use client";

/**
 * Global error boundary.
 *
 * Renders when the root layout itself fails, so neither the site stylesheet
 * nor its fonts can be relied on. Everything is inline and self-contained,
 * in the same paper, ink, and serif as the rest of HeyPsych.
 */

import { useEffect } from "react";
import { BrandMark } from "@/components/brand/Wordmark";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  const serif = '"Iowan Old Style", "Newsreader", Georgia, serif';
  const sans =
    'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#FAF9F6", color: "#252925", fontFamily: sans }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <BrandMark size={44} />
            <h1
              style={{
                fontFamily: serif,
                fontWeight: 400,
                fontSize: 40,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                margin: "20px 0 12px",
              }}
            >
              HeyPsych didn&apos;t load properly.
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: "#565C57", margin: 0 }}>
              Something went wrong on our side. Reloading usually fixes it.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  border: 0,
                  borderRadius: 999,
                  background: "#252925",
                  color: "#FFFFFF",
                  fontSize: 15,
                  fontWeight: 500,
                  padding: "12px 20px",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
              {/* A full page load is intended here: the root layout has failed,
                  so client-side navigation cannot be relied on. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                style={{
                  borderRadius: 999,
                  border: "1px solid #DCD7CC",
                  background: "#FFFFFF",
                  color: "#252925",
                  fontSize: 15,
                  fontWeight: 500,
                  padding: "11px 20px",
                  textDecoration: "none",
                }}
              >
                Go home
              </a>
            </div>
            <p style={{ fontSize: 14, color: "#565C57", marginTop: 32 }}>
              Need help right now?{" "}
              <a href="tel:988" style={{ color: "#252925", fontWeight: 600 }}>
                Call or text 988
              </a>{" "}
              in the US, any time.
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
