# esbuild-plugin-http-imports

> **NOTE**: If you want an extended esbuild development server go to https://deno.land/x/esbuild_serve 

An esbuild plugin that resolves http(s) modules, for use with browsers and Deno.

Maintained by lucsoft


## Example

```ts
// test/index.js
import { build, stop } from "https://deno.land/x/esbuild/mod.js";
import { httpImports } from "https://deno.land/x/esbuild_plugin_http_imports/index.ts";

let { outputFiles } = await build({
  bundle: true,
  entryPoints: ["test/hello.jsx"],
  jsxFactory: "h",
  plugins: [httpImports()],
  write: false,
});

eval(outputFiles[0].text);
// expected: <h1>Hello, world!</h1>
// actual: <h1>Hello, world!</h1>

stop();
```

```js
// test/hello.jsx
import { h } from "https://unpkg.com/preact@10.5.13/dist/preact.module.js";
import render from "https://unpkg.com/preact-render-to-string@5.1.19/dist/index.module.js?module";

let app = <h1>Hello, world!</h1>;
let html = render(app);

console.log("expected: %s", "<h1>Hello, world!</h1>");
console.log("actual: %s", html);
```
