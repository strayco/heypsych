import TestEnvComponent from "./test-env-component";
import { redirect } from "next/navigation";

export default function TestEnvPage() {
  // Security: Only accessible in development mode
  if (process.env.NODE_ENV !== "development") {
    redirect("/");
  }

  return <TestEnvComponent />;
}
