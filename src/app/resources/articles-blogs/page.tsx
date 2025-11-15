// src/app/resources/articles-blogs/page.tsx
// Redirect to knowledge-hub (migrated category)
import { redirect } from "next/navigation";

export default function ArticlesBlogsPage() {
  redirect("/resources/knowledge-hub");
}
