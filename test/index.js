import { build, stop } from "https://deno.land/x/esbuild@v0.17.15/mod.js";
import { httpImports } from '../index.ts';

const { outputFiles } = await build({
  bundle: true,
  entryPoints: [ 'test/hello.jsx' ],
  jsxFactory: 'h',
  plugins: [ httpImports() ],
  write: false
});

eval(outputFiles[ 0 ].text);
// expected: <h1>Hello, world!</h1>
// actual: <h1>Hello, world!</h1>

stop();
