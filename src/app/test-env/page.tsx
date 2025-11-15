"use client";

import { useEffect, useState } from "react";

export default function TestEnvPage() {
  const [clientEnv, setClientEnv] = useState<Record<string, any>>({});

  useEffect(() => {
    // Check environment variables in browser
    const envCheck = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + "..."
        : "MISSING",
      keyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + "..."
        : "MISSING",
    };

    setClientEnv(envCheck);
    // Debug log removed for production security
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">Environment Variables Test</h1>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Client-Side Check</h2>

          <div className="space-y-4">
            <div>
              <p className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</p>
              <p className={clientEnv.hasUrl ? "text-green-600" : "text-red-600"}>
                {clientEnv.hasUrl ? `✅ Found: ${clientEnv.urlPreview}` : "❌ MISSING"}
              </p>
            </div>

            <div>
              <p className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</p>
              <p className={clientEnv.hasKey ? "text-green-600" : "text-red-600"}>
                {clientEnv.hasKey ? `✅ Found: ${clientEnv.keyPreview}` : "❌ MISSING"}
              </p>
            </div>

            <div className="mt-6 rounded bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                <strong>Troubleshooting:</strong>
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-800">
                <li>
                  If variables are MISSING, check that .env.local has NEXT_PUBLIC_ prefix
                </li>
                <li>Restart the dev server after adding/changing .env.local</li>
                <li>For production builds, rebuild after env changes</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-yellow-50 p-6">
          <h3 className="mb-2 font-semibold text-yellow-900">Raw Values (for debugging):</h3>
          <pre className="overflow-auto rounded bg-white p-4 text-xs">
            {JSON.stringify(clientEnv, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
