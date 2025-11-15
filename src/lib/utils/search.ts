// Search utility for Support & Community resources

interface Searchable {
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  keywords?: string[];
  organization?: string;
}

export function matchesQuery(item: Searchable, query: string): boolean {
  if (!query || query.trim() === "") return true;

  const normalizedQuery = query.trim().toLowerCase();

  const searchableText = [
    item.name,
    item.description || "",
    item.category || "",
    item.subcategory || "",
    item.organization || "",
    ...(item.tags || []),
    ...(item.keywords || []),
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}
