# esbuild-plugin-http-imports

An esbuild plugin that resolves http(s) modules, for use with browsers and Deno.

Maintained by lucsoft

## Example

```js
// test/index.js
import { build, stop } from "https://deno.land/x/esbuild@v0.14.0/mod.js";
import { httpImports } from "https://deno.land/x/esbuild_plugin_http_imports@v1.2.0/index.js";

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
