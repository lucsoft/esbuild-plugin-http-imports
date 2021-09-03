import type {
    Loader,
    OnLoadArgs,
    OnResolveArgs,
    PluginBuild,
} from "https://deno.land/x/esbuild@v0.12.25/mod.d.ts";

const name = "http-fetch";
let options: Options = {};
export type Options = {
    allowPrivateModules?: boolean;
};

const setup = ({ onResolve, onLoad }: PluginBuild) => {

    onResolve({ filter: /^https:\/\// }, resolveFile);
    onResolve({ filter: /.*/, namespace: "http-fetch" }, resolveUrl);
    onLoad({ filter: /.*/, namespace: "http-fetch" }, loadSource);
};

const resolveFile = ({ path }: OnResolveArgs) => ({
    path: path,
    namespace: "http-fetch",
});

const resolveUrl = ({ path, importer }: OnResolveArgs) => ({
    path: new URL(path, importer).href,
    namespace: "http-fetch",
});

const loadSource = async ({ path }: OnLoadArgs) => {
    const headers = new Headers();
    if (options.allowPrivateModules) {
        appendAuthHeaderFromPrivateModules(path, headers);
    }
    const source = await fetch(path, { headers });

    if (!source.ok) {
        const message = `GET ${path} failed: status ${source.status}`;
        throw new Error(message);
    }

    let contents = await source.text();
    const pattern = /\/\/# sourceMappingURL=(\S+)/;
    const match = contents.match(pattern);
    if (match) {
        const url = new URL(match[ 1 ], source.url);
        const dataurl = await loadMap(url, headers);
        const comment = `//# sourceMappingURL=${dataurl}`;
        contents = contents.replace(pattern, comment);
    }

    const { pathname } = new URL(source.url);
    const loader = (pathname.match(/[^.]+$/)?.[ 0 ]) as (Loader | undefined);

    return { contents, loader };
};

const loadMap = async (url: URL, headers: Headers) => {
    const map = await fetch(url.href, { headers });
    const type = map.headers.get("content-type")?.replace(/\s/g, "");
    const buffer = await map.arrayBuffer();
    const blob = new Blob([ buffer ], { type });
    const reader = new FileReader();
    return new Promise((cb) => {
        reader.onload = (e) => cb(e.target?.result);
        reader.readAsDataURL(blob);
    });
};

export default (paraOptions: Options = {}) => {
    options = paraOptions;
    return { name, setup };
};

function appendAuthHeaderFromPrivateModules(path: string, headers: Headers) {
    const env = Deno.env.get("DENO_AUTH_TOKENS");
    if (!env) return;
    const denoAuthToken = env.split(";").find(x => new URL(x.split("@").at(-1)!).hostname == new URL(path).hostname);
    if (!denoAuthToken) return;

    if (denoAuthToken.includes(":"))
        headers.append("Authorization", `Basic ${btoa(denoAuthToken.split('@')[ 0 ])}`);
    else
        headers.append("Authorization", `Bearer ${denoAuthToken.split('@')[ 0 ]}`);
}
