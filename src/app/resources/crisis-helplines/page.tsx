// src/app/resources/crisis-helplines/page.tsx
// Redirect to support-community (crisis resources merged there)
import { redirect } from "next/navigation";

export default function CrisisHelplinesPage() {
  redirect("/resources/support-community");
}
