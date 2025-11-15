// src/app/resources/education-guides/page.tsx
// Redirect to articles-guides (combined category)
import { redirect } from "next/navigation";

export default function EducationGuidesPage() {
  redirect("/resources/articles-guides");
}
