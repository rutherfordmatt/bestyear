/*
  Generates src/lib/values.js from the Values Finder's own list, so both sites
  use identical names and slugs.

  Source: /Users/mattrutherford/Dev/Values/drafts/value-pages/_guide/values.json
  Slug rule (verified against all 155 entries): name.toLowerCase() with spaces
  replaced by hyphens. Hyphens already in a name (Self-control, Risk-taking)
  are kept as-is.

  Run: npm run values
*/
import { readFileSync, writeFileSync } from "node:fs";

const SOURCE = process.env.VALUES_SOURCE
  || "/Users/mattrutherford/Dev/Values/drafts/value-pages/_guide/values.json";
const OUT = new URL("../src/lib/values.js", import.meta.url);

const slugify = (name) => name.toLowerCase().replaceAll(" ", "-");

const raw = JSON.parse(readFileSync(SOURCE, "utf8"));

// Fail loudly rather than silently shipping a list that has drifted.
for (const v of raw) {
  if (slugify(v.name) !== v.slug) {
    throw new Error(`Slug rule broken: "${v.name}" -> expected "${slugify(v.name)}", got "${v.slug}"`);
  }
}

const families = [];
const seen = new Map();
for (const v of raw) {
  if (!seen.has(v.family)) {
    seen.set(v.family, { name: v.family, blurb: v.familyBlurb, values: [] });
    families.push(seen.get(v.family));
  }
  seen.get(v.family).values.push({ slug: v.slug, name: v.name, meaning: v.meaning });
}

const body = `// GENERATED FILE — do not edit by hand. Run \`npm run values\` to rebuild.
// Source of truth: the Values Finder's value list (${raw.length} values, ${families.length} families).
// Slug rule: name.toLowerCase() with spaces replaced by hyphens.
// Both sites must stay identical — see docs/values-finder-changes.md.

export const FAMILIES = ${JSON.stringify(families, null, 2)};

export const ALL_VALUES = FAMILIES.flatMap((f) =>
  f.values.map((v) => ({ ...v, family: f.name }))
);

export const BY_SLUG = Object.fromEntries(ALL_VALUES.map((v) => [v.slug, v]));

export const VALUE_COUNT = ALL_VALUES.length;

/** Turn a name into the shared slug form. */
export function slugify(name) {
  return String(name).trim().toLowerCase().replaceAll(" ", "-");
}

/**
 * Resolve an incoming slug (from the Values Finder fragment, or storage) to a
 * known value. Unknown slugs come back as a custom value so a visitor's own
 * words are never silently dropped.
 */
export function resolveSlug(slug) {
  const key = slugify(slug);
  if (BY_SLUG[key]) return { ...BY_SLUG[key], source: "finder" };
  if (!key) return null;
  const name = key
    .split("-")
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
  return { slug: key, name, meaning: "", family: "Your own", source: "custom" };
}
`;

writeFileSync(OUT, body);
console.log(`Wrote ${raw.length} values in ${families.length} families to src/lib/values.js`);
