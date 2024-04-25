const esbuild = require("esbuild");
const { nodeExternalsPlugin } = require("esbuild-node-externals");
const { dependencies, peerDependencies } = require("./package.json");

esbuild
  .build({
    entryPoints: ["./src/components/TransportMap.tsx"],
    outfile: "dist/index.js",
    bundle: true,
    format: "esm",
    target: "es6",
    plugins: [nodeExternalsPlugin()],
    external: [].concat.apply(
      [],
      [Object.keys(dependencies), Object.keys(peerDependencies)],
    ),
  })
  .catch(() => process.exit(1));
