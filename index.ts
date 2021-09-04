import type {
    Loader,
    OnLoadArgs,
    OnLoadResult,
    OnResolveArgs,
    Plugin
} from "https://deno.land/x/esbuild@v0.12.25/mod.d.ts";

const namespace = "http-import";

export type Options = {
    allowPrivateModules?: boolean;
    defaultToJavascriptIfNothingElseFound?: boolean;
};

export const httpImports = (options: Options = {}): Plugin => ({
    name: namespace,
    setup(build) {

        build.onResolve({ filter: /^https:\/\// }, ({ path }: OnResolveArgs) => ({
            path: path,
            namespace,
        }));

        build.onResolve({ filter: /.*/, namespace }, ({ path, importer }: OnResolveArgs) => ({
            path: new URL(path, importer).toString(),
            namespace
        }));

        build.onLoad({ filter: /.*/, namespace }, async ({ path }: OnLoadArgs): Promise<OnLoadResult> => {
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
            const { pathname } = new URL(path);
            const loader = (pathname.match(/[^.]+$/)?.[ 0 ]) as (Loader | undefined);
            if (options.defaultToJavascriptIfNothingElseFound)
                return { contents, loader: loader ?? "js" };
            return { contents, loader };
        });
    }
})


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

function appendAuthHeaderFromPrivateModules(path: string, headers: Headers) {
    const env = Deno.env.get("DENO_AUTH_TOKENS")?.trim();
    if (!env) return;

    try {
        const denoAuthToken = env.split(";").find(x => new URL("https://" + x.split("@").at(-1)!).hostname == new URL(path).hostname);

        if (!denoAuthToken) return;

        if (denoAuthToken.includes(":"))
            headers.append("Authorization", `Basic ${btoa(denoAuthToken.split('@')[ 0 ])}`);
        else
            headers.append("Authorization", `Bearer ${denoAuthToken.split('@')[ 0 ]}`);

    } catch (error) {
        console.log(error, env);
        return;
    }
}