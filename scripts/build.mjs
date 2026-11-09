// Builds dist/: ESM + CJS entries, the UMD bundle for the CDN, and type declarations.
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const MAX_GZIP = 8 * 1024;
const common = { bundle: true, target: "es2019", legalComments: "none", logLevel: "warning" };

rmSync("dist", { recursive: true, force: true });

for (const format of ["esm", "cjs"]) {
  await build({
    ...common,
    entryPoints: { index: "src/index.ts", react: "src/react.ts" },
    outdir: "dist",
    format,
    outExtension: { ".js": format === "esm" ? ".js" : ".cjs" },
    external: ["react"],
  });
}

const iife = await build({ ...common, entryPoints: ["src/index.ts"], format: "iife", globalName: "__adf", minify: true, write: false });
const umd =
  `/*! @adfacten/chat ${pkg.version} | Apache-2.0 */\n` +
  `(function(g,f){typeof exports=="object"&&typeof module<"u"?module.exports=f():typeof define=="function"&&define.amd?define(f):` +
  `(g=typeof globalThis<"u"?globalThis:g||self,g.AdfactenChat=f())})(this,function(){${iife.outputFiles[0].text}return __adf;});\n`;
const umdFile = `dist/chat-${pkg.version}.js`;
writeFileSync(umdFile, umd);

execFileSync("npx", ["tsc", "-p", "tsconfig.json"], { stdio: "inherit" });

const gz = gzipSync(umd, { level: 9 }).length;
console.log(`${umdFile}: ${umd.length} B, ${gz} B gzipped (limit ${MAX_GZIP})`);
if (gz > MAX_GZIP) {
  console.error("bundle is over the size limit");
  process.exit(1);
}
