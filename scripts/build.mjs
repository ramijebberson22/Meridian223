#!/usr/bin/env node
/** Builds the static site into dist/ (upload that folder anywhere). */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { compile } from "tailwindcss";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const require = createRequire(import.meta.url);
const twDir = path.dirname(require.resolve("tailwindcss/package.json"));
const hash = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 10);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?|html)$/.test(e.name)) out.push(p);
  }
  return out;
}

async function css() {
  const compiler = await compile(fs.readFileSync(path.join(root, "src/styles.css"), "utf8"), {
    base: root,
    loadStylesheet: async (id) => {
      const file = id === "tailwindcss" ? path.join(twDir, "index.css") : path.join(twDir, id.replace(/^tailwindcss\//, ""));
      return { path: file, base: twDir, content: fs.readFileSync(file, "utf8") };
    },
    loadModule: async () => {
      throw new Error("no plugins");
    },
  });
  const candidates = new Set();
  for (const f of [...walk(path.join(root, "src")), ...walk(path.join(root, "public"))])
    for (const t of fs.readFileSync(f, "utf8").split(/[\s"'`{}]+/)) if (t && t.length < 120) candidates.add(t);
  return (await esbuild.transform(compiler.build([...candidates]), { loader: "css", minify: true })).code;
}

const t0 = Date.now();
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, "assets"), { recursive: true });
const result = await esbuild.build({
  entryPoints: { library: path.join(root, "src/library.tsx"), play: path.join(root, "src/play.tsx") },
  bundle: true,
  splitting: true,
  format: "esm",
  minify: true,
  target: ["es2020", "chrome100", "firefox100", "safari15"],
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  outdir: path.join(dist, "assets"),
  entryNames: "[name]-[hash]",
  chunkNames: "chunk-[hash]",
  metafile: true,
  legalComments: "none",
});
const entryFile = (name) =>
  path.basename(Object.entries(result.metafile.outputs).find(([, o]) => o.entryPoint && o.entryPoint.endsWith(`src/${name}.tsx`))[0]);
const style = await css();
const cssName = `app-${hash(style)}.css`;
fs.writeFileSync(path.join(dist, "assets", cssName), style);
for (const f of fs.readdirSync(path.join(root, "public"))) {
  const src = path.join(root, "public", f);
  if (!f.endsWith(".html")) {
    fs.copyFileSync(src, path.join(dist, f));
    continue;
  }
  const entry = f === "play.html" ? "play" : "library";
  fs.writeFileSync(
    path.join(dist, f),
    fs.readFileSync(src, "utf8").replace("%CSS%", `assets/${cssName}`).replace("%JS%", `assets/${entryFile(entry)}`),
  );
}
console.log(`built dist/ in ${Date.now() - t0}ms`);
