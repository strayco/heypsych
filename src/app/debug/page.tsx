import DebugPage from "./debug-component";
import { redirect } from "next/navigation";

export default function Debug() {
  // Only accessible in development mode
  if (process.env.NODE_ENV !== "development") {
    redirect("/");
  }

  return <DebugPage />;
}
