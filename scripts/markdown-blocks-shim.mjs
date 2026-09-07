// Lets scripts/sync-articles.mjs (a plain-`node`-run script — no ts-node,
// tsx or bun as a new runtime dependency) call the shared converter that now
// lives in lib/markdown-blocks.ts, without relying on Node's own TS support:
// as of this Node version, `node` refuses a bare `.ts` import outside the
// `--experimental-strip-types` flag, and adding that flag to `npm run sync` /
// `npm run prebuild` would make the script's invocation depend on Node's
// still-experimental TS handling rather than on this repo's own tooling.
//
// `typescript` is already a devDependency (it drives `npm run typecheck`);
// its `transpileModule` strips types synchronously and in-process, so each
// file below is read, stripped, and imported from a data: URL — no build
// step, no new dependency, no flag. lib/markdown-blocks.ts has exactly one
// local import (lib/notes.ts): transpile that first, then rewrite the one
// `@/lib/notes` specifier in markdown-blocks.ts's source to the resulting
// data: URL before transpiling and importing it, so the two modules chain
// without either resolving the `@/*` alias — which only webpack/vitest,
// not plain node, know how to do. If markdown-blocks.ts ever grows a second
// local import, extend `LOCAL_IMPORTS` rather than special-casing another one.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

function transpileToDataUrl(relPath, source = fs.readFileSync(path.join(process.cwd(), relPath), 'utf-8')) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  });
  return `data:text/javascript,${encodeURIComponent(outputText)}`;
}

const LOCAL_IMPORTS = { '@/lib/notes': 'lib/notes.ts' };

let mainSource = fs.readFileSync(path.join(process.cwd(), 'lib', 'markdown-blocks.ts'), 'utf-8');
for (const [specifier, relPath] of Object.entries(LOCAL_IMPORTS)) {
  // Replace the whole quoted specifier ('@/lib/notes') with a JSON-escaped
  // string literal, not a bare text splice: the transpiled module's own
  // comments and string literals routinely contain an apostrophe (e.g.
  // "draft's markdown body"), which would otherwise terminate the
  // single-quoted import specifier early and corrupt the source.
  mainSource = mainSource.replaceAll(`'${specifier}'`, JSON.stringify(transpileToDataUrl(relPath)));
}

const mod = await import(transpileToDataUrl('lib/markdown-blocks.ts', mainSource));

export const { markdownToBlocks } = mod;
