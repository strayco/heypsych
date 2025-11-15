"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/config/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugComponent() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Check environment variables on mount
  useEffect(() => {
    console.log("Environment check:", {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
    });
  }, []);

  const runTests = async () => {
    setLoading(true);
    const testResults: any = {};

    try {
      // Test 1: Environment Variables
      testResults.env = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING",
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      };

      // Test 2: Basic Supabase Connection
      console.log("Testing basic connection...");
      try {
        const { data, error, status, statusText } = await supabase
          .from("entities")
          .select("*")
          .limit(1);

        testResults.basicConnection = {
          success: !error,
          status,
          statusText,
          error: error ? JSON.stringify(error) : null,
          dataReceived: !!data,
          dataCount: data?.length || 0,
        };

        if (data && data.length > 0) {
          testResults.sampleEntity = data[0];
        }
      } catch (err) {
        testResults.basicConnection = {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
          rawError: JSON.stringify(err),
        };
      }

      // Test 3: Check if tables exist
      console.log("Testing table existence...");
      const tableTests = ["entities", "entity_schemas", "collections"];

      for (const tableName of tableTests) {
        try {
          const { data, error } = await supabase
            .from(tableName as "entities" | "entity_schemas" | "collections")
            .select("count(*)")
            .limit(1);

          testResults[`table_${tableName}`] = {
            exists: !error,
            error: error ? JSON.stringify(error) : null,
          };
        } catch (err) {
          testResults[`table_${tableName}`] = {
            exists: false,
            error: err instanceof Error ? err.message : "Unknown error",
          };
        }
      }

      // Test 4: Check for specific data
      console.log("Testing for seeded data...");
      try {
        const { data: entities, error: entitiesError } = await supabase
          .from("entities")
          .select("*")
          .limit(5);

        testResults.entitiesData = {
          success: !entitiesError,
          count: entities?.length || 0,
          error: entitiesError ? JSON.stringify(entitiesError) : null,
          samples: entities?.map((e) => ({ id: e.id, title: e.title, slug: e.slug })) || [],
        };
      } catch (err) {
        testResults.entitiesData = {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }

      // Test 5: Check schemas
      try {
        const { data: schemas, error: schemasError } = await supabase
          .from("entity_schemas")
          .select("*");

        testResults.schemasData = {
          success: !schemasError,
          count: schemas?.length || 0,
          error: schemasError ? JSON.stringify(schemasError) : null,
          schemas:
            schemas?.map((s) => ({
              id: s.id,
              schema_name: s.schema_name,
              display_name: s.display_name,
            })) || [],
        };
      } catch (err) {
        testResults.schemasData = {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }

      // Test 6: Try the actual EntityService query that's failing
      console.log("Testing failing query...");
      try {
        const { data, error } = await supabase
          .from("entities")
          .select(
            `
            *,
            schema:entity_schemas(*)
          `
          )
          .eq("status", "active")
          .eq("visibility", "public")
          .order("name")
          .limit(5);

        testResults.joinQuery = {
          success: !error,
          count: data?.length || 0,
          error: error
            ? {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                full: JSON.stringify(error),
              }
            : null,
          samples: data?.slice(0, 2) || [],
        };
      } catch (err) {
        testResults.joinQuery = {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    } catch (err) {
      testResults.globalError = err instanceof Error ? err.message : "Unknown error";
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Database Debug Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={loading} className="mb-6">
            {loading ? "Running Tests..." : "Run All Tests"}
          </Button>

          {Object.keys(results).length > 0 && (
            <div className="space-y-6">
              {/* Environment Variables */}
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Environment Variables</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    URL: <code className="rounded bg-gray-100 px-2 py-1">{results.env?.url}</code>
                  </p>
                  <p>
                    Has Anon Key:{" "}
                    <span className={results.env?.hasKey ? "text-green-600" : "text-red-600"}>
                      {results.env?.hasKey ? "✅" : "❌"}
                    </span>
                  </p>
                  <p>Key Length: {results.env?.keyLength}</p>
                </div>
              </div>

              {/* Basic Connection */}
              <div
                className={`rounded-lg border p-4 ${results.basicConnection?.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
              >
                <h3 className="mb-2 font-semibold">Basic Connection Test</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    Status:{" "}
                    <span
                      className={
                        results.basicConnection?.success ? "text-green-600" : "text-red-600"
                      }
                    >
                      {results.basicConnection?.success ? "✅ Connected" : "❌ Failed"}
                    </span>
                  </p>
                  <p>HTTP Status: {results.basicConnection?.status}</p>
                  {results.basicConnection?.error && (
                    <p>
                      Error:{" "}
                      <code className="rounded bg-red-100 px-2 py-1 text-xs">
                        {results.basicConnection.error}
                      </code>
                    </p>
                  )}
                  <p>Data Count: {results.basicConnection?.dataCount}</p>
                </div>
              </div>

              {/* Table Existence */}
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Table Existence</h3>
                <div className="space-y-2">
                  {["entities", "entity_schemas", "collections"].map((table) => (
                    <div key={table} className="flex items-center justify-between">
                      <span>{table}:</span>
                      <span
                        className={
                          results[`table_${table}`]?.exists ? "text-green-600" : "text-red-600"
                        }
                      >
                        {results[`table_${table}`]?.exists ? "✅ Exists" : "❌ Missing/Error"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Entities Data */}
              <div
                className={`rounded-lg border p-4 ${results.entitiesData?.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
              >
                <h3 className="mb-2 font-semibold">Entities Data</h3>
                <div className="space-y-1 text-sm">
                  <p>Success: {results.entitiesData?.success ? "✅" : "❌"}</p>
                  <p>Count: {results.entitiesData?.count}</p>
                  {results.entitiesData?.error && (
                    <p>
                      Error:{" "}
                      <code className="rounded bg-red-100 px-2 py-1 text-xs">
                        {results.entitiesData.error}
                      </code>
                    </p>
                  )}
                  {results.entitiesData?.samples?.length > 0 && (
                    <div>
                      <p>Samples:</p>
                      <pre className="max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs">
                        {JSON.stringify(results.entitiesData.samples, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Schemas Data */}
              <div
                className={`rounded-lg border p-4 ${results.schemasData?.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
              >
                <h3 className="mb-2 font-semibold">Schemas Data</h3>
                <div className="space-y-1 text-sm">
                  <p>Success: {results.schemasData?.success ? "✅" : "❌"}</p>
                  <p>Count: {results.schemasData?.count}</p>
                  {results.schemasData?.error && (
                    <p>
                      Error:{" "}
                      <code className="rounded bg-red-100 px-2 py-1 text-xs">
                        {results.schemasData.error}
                      </code>
                    </p>
                  )}
                  {results.schemasData?.schemas?.length > 0 && (
                    <div>
                      <p>Available Schemas:</p>
                      <ul className="list-inside list-disc">
                        {results.schemasData.schemas.map((schema: any) => (
                          <li key={schema.id}>
                            {schema.schema_name} ({schema.display_name})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Join Query Test */}
              <div
                className={`rounded-lg border p-4 ${results.joinQuery?.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
              >
                <h3 className="mb-2 font-semibold">Join Query Test (The Failing Query)</h3>
                <div className="space-y-1 text-sm">
                  <p>Success: {results.joinQuery?.success ? "✅" : "❌"}</p>
                  <p>Count: {results.joinQuery?.count}</p>
                  {results.joinQuery?.error && (
                    <div>
                      <p>Error Details:</p>
                      <pre className="max-h-40 overflow-auto rounded bg-red-100 p-2 text-xs">
                        {JSON.stringify(results.joinQuery.error, null, 2)}
                      </pre>
                    </div>
                  )}
                  {results.joinQuery?.samples?.length > 0 && (
                    <div>
                      <p>Sample Results:</p>
                      <pre className="max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs">
                        {JSON.stringify(results.joinQuery.samples, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Raw Sample Entity */}
              {results.sampleEntity && (
                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-semibold">Sample Entity Structure</h3>
                  <pre className="max-h-40 overflow-auto rounded bg-gray-100 p-2 text-xs">
                    {JSON.stringify(results.sampleEntity, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
