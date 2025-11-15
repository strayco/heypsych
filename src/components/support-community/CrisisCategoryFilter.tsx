import React from "react";
import { Badge } from "@/components/ui/badge";

interface Props {
  categories: Array<{ id: string; label: string; count: number }>;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CrisisCategoryFilter({ categories, selectedCategory, onSelectCategory }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelectCategory(null)}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          selectedCategory === null
            ? "bg-red-600 text-white shadow-md"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
        aria-pressed={selectedCategory === null}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            selectedCategory === category.id
              ? "bg-red-600 text-white shadow-md"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          aria-pressed={selectedCategory === category.id}
        >
          {category.label}
          <span className="ml-1.5 text-xs opacity-75">({category.count})</span>
        </button>
      ))}
    </div>
  );
}
