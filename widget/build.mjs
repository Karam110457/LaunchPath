import { build, context } from "esbuild";

const isWatch = process.argv.includes("--watch");

const options = {
  entryPoints: ["widget/src/index.tsx"],
  bundle: true,
  minify: !isWatch,
  format: "iife",
  target: "es2020",
  outfile: "public/widget.js",
  jsx: "transform",
  jsxFactory: "h",
  jsxFragment: "Fragment",
  inject: ["widget/src/preact-shim.ts"],
  define: {
    "process.env.NODE_ENV": isWatch ? '"development"' : '"production"',
  },
  logLevel: "info",
};

if (isWatch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await build(options);
}
