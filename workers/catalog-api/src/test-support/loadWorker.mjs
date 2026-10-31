import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const workerDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = path.resolve(workerDirectory, "../../..");

export function loadWorker() {
  return loadProjectTypeScript(path.join(workerDirectory, "index.ts"));
}

export function loadProjectTypeScript(filename, mocks = {}) {
  return loadTypeScriptModule(filename, new Map(), mocks);
}

function loadTypeScriptModule(filename, cache, mocks) {
  const absolutePath = path.resolve(filename);
  if (cache.has(absolutePath)) return cache.get(absolutePath).exports;

  const loadedModule = { exports: {} };
  cache.set(absolutePath, loadedModule);
  const source = fs.readFileSync(absolutePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  const localRequire = (specifier) => {
    if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
    const basePath = specifier.startsWith("@/")
      ? path.resolve(projectRoot, specifier.slice(2))
      : specifier.startsWith(".")
        ? path.resolve(path.dirname(absolutePath), specifier)
        : "";
    if (!basePath) throw new Error(`Unexpected Worker test dependency: ${specifier}`);
    const candidate = [basePath, `${basePath}.ts`, `${basePath}.js`, path.join(basePath, "index.ts")]
      .find((candidatePath) => fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile());
    if (!candidate) throw new Error(`Worker test module not found: ${specifier} from ${absolutePath}`);
    return loadTypeScriptModule(candidate, cache, mocks);
  };
  const globals = {
    module: loadedModule,
    exports: loadedModule.exports,
    require: localRequire,
    __filename: absolutePath,
    __dirname: path.dirname(absolutePath),
    URL,
    URLSearchParams,
    Request,
    Response,
    Headers,
    TextEncoder,
    TextDecoder,
    AbortController,
    crypto: globalThis.crypto,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    fetch: (...args) => globalThis.fetch(...args),
    process,
  };
  vm.runInNewContext(compiled.outputText, globals, { filename: absolutePath });
  return loadedModule.exports;
}
