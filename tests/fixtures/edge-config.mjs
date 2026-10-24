import { createHash } from "node:crypto";
import { createServer } from "node:http";

const defaults = {
    version: "1.00",
    title: "Hack Night Dashboard",
    description: "A dashboard for Hack Night",
};
let items = { ...defaults };
let unavailable = false;

createServer(async (request, response) => {
    const url = new URL(request.url, "http://127.0.0.1:4118");
    const json = (value, status = 200) => {
        response.writeHead(status, {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        });
        response.end(JSON.stringify(value));
    };

    if (url.pathname === "/health") return json({ ok: true });
    if (url.pathname === "/__config" && request.method === "POST") {
        let body = "";
        for await (const chunk of request) body += chunk;
        const config = JSON.parse(body);
        items = { ...defaults, ...config.items };
        unavailable = config.unavailable ?? false;
        return json({ ok: true });
    }
    if (url.pathname === "/api/hack-night-sessions") {
        return json({
            docs: [],
            hasNextPage: false,
            hasPrevPage: false,
            limit: 100,
            nextPage: null,
            page: 1,
            pagingCounter: 1,
            prevPage: null,
            totalDocs: 0,
            totalPages: 1,
        });
    }
    if (unavailable) return json({ error: "Unavailable" }, 401);

    const digest = createHash("sha256")
        .update(JSON.stringify(items))
        .digest("hex");
    response.setHeader("x-edge-config-digest", digest);
    if (url.pathname === "/ecfg_test/digest") return json(digest);
    if (url.pathname === "/ecfg_test/items") return json(items);
    if (url.pathname.startsWith("/ecfg_test/item/")) {
        const key = url.pathname.slice("/ecfg_test/item/".length);
        return key in items ? json(items[key]) : json(null, 404);
    }
    return json({ error: "Not found" }, 404);
}).listen(4118, "127.0.0.1");
