// Enhanced scripts/utils/file-reader.js
import fs from "node:fs";
import path from "node:path";

export function readJsonFilesRecursively(dir) {
  const results = [];

  function walkDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");

          // Skip empty files
          if (!content.trim()) {
            console.log(`⏭️  Skipping empty file: ${entry.name}`);
            continue;
          }

          const data = JSON.parse(content);
          results.push({ file: fullPath, data });
        } catch (error) {
          // Don't throw here - let the main script handle it
          console.log(`⚠️  Warning: Could not parse ${entry.name} - ${error.message}`);
          results.push({ file: fullPath, data: null, error: error.message });
        }
      }
    }
  }

  walkDir(dir);
  return results.filter((item) => item.data !== null); // Only return valid JSON files
}
