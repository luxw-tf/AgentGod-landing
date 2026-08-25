/* Static sanity check: CSS class coverage, link targets, tag balance. */
const fs = require("fs");

const pages = ["index.html", "how-it-works.html", "philosophy.html", "docs.html"];
const css = fs.readFileSync("css/main.css", "utf8");
const js = fs.readFileSync("js/main.js", "utf8");

// Classes defined in CSS
const defined = new Set();
for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) defined.add(m[1]);
// Classes referenced in JS (classList / querySelector)
const jsUsed = new Set();
for (const m of js.matchAll(/["'.]([a-z][\w-]*__[\w-]+|is-[\w-]+)["'\s,)]/g)) jsUsed.add(m[1]);

let problems = 0;
const report = (page, msg) => { console.log(`  ✗ ${page}: ${msg}`); problems++; };

const allIds = {};
for (const p of pages) {
  const html = fs.readFileSync(p, "utf8");
  allIds[p] = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  console.log(`\n${page}`);

  // --- class coverage -----------------------------------------------------
  const used = new Set();
  for (const m of html.matchAll(/\sclass="([^"]+)"/g)) {
    m[1].trim().split(/\s+/).forEach((c) => c && used.add(c));
  }
  const missing = [...used].filter((c) => !defined.has(c));
  if (missing.length) report(page, `classes with no CSS rule: ${missing.join(", ")}`);
  else console.log(`  ✓ ${used.size} classes, all defined in CSS`);

  // --- duplicate class attributes -----------------------------------------
  // Browsers honour only the first, so the second silently does nothing.
  for (const m of html.matchAll(/<[a-zA-Z][^>]*?\sclass="[^"]*"[^>]*?\sclass="/g)) {
    const line = (html.slice(0, m.index).match(/\n/g) || []).length + 1;
    report(page, `duplicate class attribute at line ${line} — second one is ignored`);
  }

  // --- link targets -------------------------------------------------------
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|#$)/.test(href) || href === "#") continue;

    if (href.startsWith("#")) {
      if (!allIds[page].has(href.slice(1))) report(page, `dead anchor ${href}`);
      continue;
    }
    const [file, hash] = href.split("#");
    if (!fs.existsSync(file)) { report(page, `missing file ${file}`); continue; }
    if (hash && allIds[file] && !allIds[file].has(hash)) report(page, `dead anchor ${href}`);
  }

  // --- img src present ----------------------------------------------------
  for (const m of html.matchAll(/<img src="([^"]+)"/g)) {
    if (!fs.existsSync(m[1])) console.log(`  · placeholder (expected): ${m[1]}`);
  }

  // --- tag balance --------------------------------------------------------
  const void_ = new Set(["img", "br", "hr", "meta", "link", "input", "source", "path", "circle", "rect", "use"]);
  const stack = [];
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)) {
    const [, close, tag, attrs, selfClose] = m;
    if (void_.has(tag.toLowerCase()) || selfClose) continue;
    if (close) {
      const open = stack.pop();
      if (open !== tag) report(page, `tag mismatch: closed </${tag}>, expected </${open}>`);
    } else stack.push(tag);
  }
  if (stack.length) report(page, `unclosed tags: ${stack.join(" > ")}`);
  else console.log("  ✓ tags balanced");

  // --- terminal scripts referenced exist in JS ---------------------------
  for (const m of html.matchAll(/data-terminal="([^"]+)"/g)) {
    if (!js.includes(`${m[1]}:`)) report(page, `no terminal script named "${m[1]}" in js/main.js`);
  }
}

// --- JS-applied classes must exist in CSS ---------------------------------
console.log("\njs/main.js");
const jsMissing = [...jsUsed].filter((c) => !defined.has(c));
if (jsMissing.length) console.log(`  ✗ classes toggled by JS with no CSS rule: ${jsMissing.join(", ")}`);
else console.log(`  ✓ ${jsUsed.size} JS-referenced classes all defined`);

console.log(problems ? `\n${problems} problem(s)\n` : "\nAll checks passed.\n");
process.exit(problems ? 1 : 0);
