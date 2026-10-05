import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const config = require("../metro.config.js");

test("Metro resolve Three para ESM no iOS e Android, incluindo imports CommonJS do R3F", () => {
  for (const platform of ["ios", "android", "web"]) {
    const result = config.resolver.resolveRequest({}, "three", platform);
    assert.equal(result.type, "sourceFile");
    assert.equal(path.basename(result.filePath), "three-runtime.mjs");
    assert.ok(existsSync(result.filePath));
  }
});

test("a entrada resolvida inicializa sem process.emitWarning, como no Hermes", () => {
  const { filePath } = config.resolver.resolveRequest({}, "three", "ios");
  const script = `globalThis.process.emitWarning = undefined;
    const THREE = await import(${JSON.stringify(pathToFileURL(filePath).href)});
    const warnings = [];
    console.warn = (...args) => warnings.push(args.join(" "));
    const clock = new THREE.Clock();
    clock.getDelta();
    clock.stop();
    if (warnings.length) throw new Error(warnings.join("\\n"));
    const original = await import(${JSON.stringify(pathToFileURL(path.join(root, "node_modules/three/build/three.module.js")).href)});
    if (THREE.TextureLoader !== original.TextureLoader || THREE.Scene !== original.Scene)
      throw new Error("O facade duplicou classes do Three");
    const scene = new THREE.Scene();
    const sphere = new THREE.SphereGeometry(1, 12, 8);
    if (!scene.isScene || !sphere.attributes.position) throw new Error("Three não inicializou");
    sphere.dispose();`;
  assert.doesNotThrow(() =>
    execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      encoding: "utf8",
    }),
  );
});

test("ícones e splash do manifesto apontam para arquivos presentes", () => {
  const { expo } = JSON.parse(
    readFileSync(path.join(root, "app.json"), "utf8"),
  );
  const splash = expo.plugins.find(
    (plugin: unknown) =>
      Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
  );
  for (const asset of [
    expo.icon,
    expo.android.adaptiveIcon.foregroundImage,
    expo.web.favicon,
    splash[1].image,
  ]) {
    assert.ok(existsSync(path.resolve(root, asset)), `Asset ausente: ${asset}`);
  }
});
