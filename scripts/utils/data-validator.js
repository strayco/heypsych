// scripts/utils/data-validator.js
export function validateEntityBasic(data, kind) {
  if (!data?.slug) throw new Error(`[${kind}] missing "slug"`);
  if (!data?.name && !data?.title) throw new Error(`[${kind}] missing "name" or "title"`);
}
