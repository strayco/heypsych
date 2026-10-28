import { describe, it, expect } from "vitest";
import { ENTITY_COLUMNS, ENTITY_COLUMN_LIST, ENTITY_SQL_COLUMNS } from "../entity-columns";

describe("entity columns", () => {
  it("client and SQL column lists match", () => {
    expect(ENTITY_COLUMNS).toBe(ENTITY_COLUMN_LIST.join(", "));
    expect(ENTITY_SQL_COLUMNS).toBe(ENTITY_COLUMNS);
  });

  it("never fetches the search_vector column", () => {
    expect(ENTITY_COLUMN_LIST).not.toContain("search_vector");
  });
});
