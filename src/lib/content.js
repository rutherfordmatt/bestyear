/*
  Copy lives in content/*.md and is parsed here at BUILD time, so the markdown
  stays the single source of truth and the site can never drift from it.

  Anything missing renders as a visible placeholder rather than silently
  disappearing — see placeholder() and the PLACEHOLDER prefix.
*/

const files = import.meta.glob("../../content/*.md", {
  query: "?raw", import: "default", eager: true,
});

export const PLACEHOLDER_PREFIX = "[PLACEHOLDER";

/** A clearly marked stand-in for copy that isn't written yet. */
export function placeholder(what) {
  return `${PLACEHOLDER_PREFIX}: ${what}]`;
}

export function isPlaceholder(text) {
  return typeof text === "string" && text.startsWith(PLACEHOLDER_PREFIX);
}

/** Split markdown into a tree of sections keyed by heading text. */
function parseSections(markdown) {
  const lines = markdown.split("\n");
  const root = { title: "", body: [], sections: {}, order: [] };
  let h2 = null;
  let h3 = null;

  for (const line of lines) {
    const m1 = /^#\s+(.*)$/.exec(line);
    const m2 = /^##\s+(.*)$/.exec(line);
    const m3 = /^###\s+(.*)$/.exec(line);

    if (m1) { root.title = m1[1].trim(); h2 = h3 = null; continue; }
    if (m2) {
      const name = m2[1].trim();
      h2 = { title: name, body: [], sections: {}, order: [] };
      root.sections[name] = h2;
      root.order.push(name);
      h3 = null;
      continue;
    }
    if (m3) {
      const name = m3[1].trim();
      h3 = { title: name, body: [], sections: {}, order: [] };
      const parent = h2 || root;
      parent.sections[name] = h3;
      parent.order.push(name);
      continue;
    }
    (h3 || h2 || root).body.push(line);
  }
  return root;
}

const trimBlank = (lines) => {
  const out = [...lines];
  while (out.length && !out[0].trim()) out.shift();
  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out;
};

/** Body text as paragraphs, with markdown bold/italic turned into HTML. */
function paragraphs(lines) {
  const text = trimBlank(lines).join("\n");
  if (!text.trim()) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !p.startsWith("- ") && !p.startsWith("|"));
}

/** Inline markdown → HTML. Escapes first, so content can never inject markup. */
export function inline(md = "") {
  const escaped = String(md)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+?)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\[([^\]]+)\]/g, "$1");
}

/*
  A field is "- **Label:** value" — the colon is what makes it a field.
  A bullet that merely STARTS with bold ("- **Look back honestly.** Your wins
  ...") is prose, not a label, and must stay a bullet.
*/
const FIELD_RE = /^\s*-\s+\*\*([^*]+?)\s*:\s*\*\*\s*(.*)$|^\s*-\s+\*\*([^*]+?)\*\*\s*:\s*(.*)$/;

function matchField(line) {
  const m = FIELD_RE.exec(line);
  if (!m) return null;
  const key = (m[1] ?? m[3] ?? "").trim().replace(/\?$/, "");
  const value = (m[2] ?? m[4] ?? "").trim();
  return key ? { key, value } : null;
}

/** Pull "- **Label:** value" bullets out of a body. */
function fields(lines) {
  const out = {};
  for (const line of lines) {
    const f = matchField(line);
    if (f) out[f.key] = f.value;
  }
  return out;
}

/** Bullets that aren't labelled fields. Bold inside them is kept. */
function bullets(lines) {
  return lines
    .filter((l) => /^\s*-\s+/.test(l) && !matchField(l))
    .map((l) => l.replace(/^\s*-\s+/, "").trim())
    .filter(Boolean);
}

const cache = new Map();

/** Load and parse one content file by name, e.g. "step-1" or "landing". */
export function doc(name) {
  if (cache.has(name)) return cache.get(name);
  const path = `../../content/${name}.md`;
  const raw = files[path];
  if (!raw) {
    const empty = { title: placeholder(`content/${name}.md is missing`), missing: true, sections: {}, order: [] };
    cache.set(name, empty);
    return empty;
  }
  const parsed = parseSections(raw);
  parsed.missing = false;
  cache.set(name, parsed);
  return parsed;
}

/** Walk a path of headings: section(doc("step-1"), "Prompts", "Prompt 1: Wins") */
export function section(root, ...path) {
  let node = root;
  for (const name of path) {
    node = node?.sections?.[name];
    if (!node) return null;
  }
  return node;
}

/** Plain text of a section, first paragraph only. */
export function text(root, ...path) {
  const node = section(root, ...path);
  if (!node) return placeholder(path.join(" › "));
  const paras = paragraphs(node.body);
  return paras[0] || placeholder(path.join(" › "));
}

/** All paragraphs of a section. */
export function paras(root, ...path) {
  const node = section(root, ...path);
  if (!node) return [placeholder(path.join(" › "))];
  const list = paragraphs(node.body);
  return list.length ? list : [placeholder(path.join(" › "))];
}

/** Labelled fields of a section. */
export function fieldsOf(root, ...path) {
  const node = section(root, ...path);
  return node ? fields(node.body) : {};
}

/** Bare bullets of a section. */
export function bulletsOf(root, ...path) {
  const node = section(root, ...path);
  return node ? bullets(node.body) : [];
}

/**
 * A step's prompts, in order, as structured objects.
 * Handles both "### Prompt 1: Wins" and the odd unnumbered heading.
 */
export function promptsOf(stepDoc) {
  const prompts = section(stepDoc, "Prompts");
  if (!prompts) return [];
  return prompts.order.map((heading) => {
    const node = prompts.sections[heading];
    const f = fields(node.body);
    const m = /^Prompt\s+(\d+)\s*:\s*(.*)$/i.exec(heading);
    return {
      n: m ? Number(m[1]) : null,
      name: m ? m[2].trim() : heading,
      heading,
      question: f.Question || "",
      followUp: f["Follow-up for each"] || f["Follow-up"] || "",
      example: f["Placeholder example"] || f["Placeholder examples"] || "",
      hint: f["Stuck? hint"] || f["Stuck"] || "",
      options: f.Options || f["Options (pick any)"] || "",
      defaultValue: f.Default || "",
      actions: f.Actions || "",
      note: paragraphs(node.body)[0] || "",
      bullets: bullets(node.body),
    };
  });
}

/** The standard header block every step page needs. */
export function stepCopy(n) {
  const d = doc(`step-${n}`);
  return {
    doc: d,
    title: text(d, "Title"),
    promise: text(d, "One-line promise"),
    intro: paras(d, "Intro"),
    prompts: promptsOf(d),
    transition: text(d, "Transition line"),
    softNote: section(d, "Optional note (shown softly at the end of this step)")
      ? paras(d, "Optional note (shown softly at the end of this step)")
      : null,
  };
}
