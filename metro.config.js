const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// The native R3F entry uses require("three"). Three r186's CJS entry
// calls Node-only process.emitWarning before re-exporting its ESM build.
// Resolve both import styles to one ESM facade on Hermes and web.
// Its Clock adapter uses Timer while preserving R3F's legacy clock contract.
const threeEsm = path.join(__dirname, "src/lib/three-runtime.mjs");
const previousResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "three") {
    return { type: "sourceFile", filePath: threeEsm };
  }
  return previousResolveRequest
    ? previousResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
