import { expect, test } from "@playwright/test";

const updateConfig = (request, config = {}) =>
    request.post("http://127.0.0.1:4118/__config", { data: config });
const isPoll = (response) => response.url().endsWith("/api/update-hash");

async function nextPoll(page) {
    const response = page.waitForResponse(isPoll);
    await page.clock.fastForward(31_000);
    const result = await response;
    if (result.ok()) await result.finished();
    // Let the response handler schedule its next poll before advancing time.
    await page.evaluate(() => new Promise(requestAnimationFrame));
}

test.beforeEach(async ({ page, request }) => {
    await updateConfig(request);
    await page.clock.install({ time: new Date("2026-10-23T15:00:00-04:00") });
    await page.route("**/observe*", (route) => route.fulfill({ status: 200 }));
    await page.route("**/*.ingest.*.sentry.io/**", (route) =>
        route.fulfill({ status: 200 }),
    );
    await page.routeWebSocket(
        "wss://api.purduehackers.com/discord/dashboard",
        () => {},
    );
});

test("refreshes config and metadata while preserving the live feed", async ({
    page,
    request,
}) => {
    let socket;
    let socketConnections = 0;
    await page.routeWebSocket(
        "wss://api.purduehackers.com/discord/dashboard",
        (ws) => {
            socket = ws;
            socketConnections++;
        },
    );
    let refreshRequests = 0;
    page.on("request", (req) => {
        if (req.headers().rsc === "1") refreshRequests++;
    });
    const firstPoll = page.waitForResponse(isPoll);
    await page.goto("/");
    await (await firstPoll).finished();
    await expect(page.getByText("v1.00", { exact: true })).toBeVisible();
    await expect.poll(() => socketConnections).toBe(1);
    socket.send(
        JSON.stringify({
            id: "refresh-test-message",
            channel: { id: "test-channel", name: "general" },
            author: {
                id: "123456789012345678",
                name: "Tester",
                avatarHash: null,
            },
            timestamp: "2026-10-23T19:00:00Z",
            content: {
                markdown: "Keep this message",
                html: "Keep this message",
            },
        }),
    );
    await expect(
        page.getByText("Keep this message", { exact: true }),
    ).toBeVisible();
    await page.evaluate(() => {
        document.body.dataset.refreshTest = "same-document";
    });

    await nextPoll(page);
    expect(refreshRequests).toBe(0);

    await updateConfig(request, {
        items: { version: "1.01", title: "Updated Hack Night" },
    });
    await nextPoll(page);
    await expect(page.getByText("v1.01", { exact: true })).toBeVisible();
    await expect(page).toHaveTitle("Updated Hack Night");
    await expect(
        page.getByText("Keep this message", { exact: true }),
    ).toBeVisible();
    await expect(page.locator("body")).toHaveAttribute(
        "data-refresh-test",
        "same-document",
    );
    expect(socketConnections).toBe(1);
    expect(refreshRequests).toBeGreaterThan(0);

    // A second update must work in the same long-lived server and browser.
    await updateConfig(request, { items: { version: "1.02" } });
    await nextPoll(page);
    await expect(page.getByText("v1.02", { exact: true })).toBeVisible();

    await updateConfig(request, {
        items: { version: "1.02", title: "Metadata changed on its own" },
    });
    await nextPoll(page);
    await expect(page).toHaveTitle("Metadata changed on its own");
    await expect(page.getByText("v1.02", { exact: true })).toBeVisible();
});

test("reconciles an edit between server rendering and the first poll", async ({
    page,
    request,
}) => {
    let first = true;
    await page.route("**/api/update-hash", async (route) => {
        if (first) {
            first = false;
            await updateConfig(request, { items: { version: "2.00" } });
        }
        await route.continue();
    });
    await page.goto("/");
    await expect(page.getByText("v2.00", { exact: true })).toBeVisible();
});

test("keeps the last render through failed polls and retries a failed refresh", async ({
    page,
    request,
}) => {
    let mode = "ok";
    await page.route("**/api/update-hash", async (route) => {
        if (mode === "error") {
            return route.fulfill({
                status: 503,
                json: { error: "Unavailable" },
            });
        }
        if (mode === "invalid") return route.fulfill({ json: { hash: null } });
        return route.continue();
    });
    const firstPoll = page.waitForResponse(isPoll);
    await page.goto("/");
    await (await firstPoll).finished();
    await expect(page.getByText("v1.00", { exact: true })).toBeVisible();
    await updateConfig(request, { items: { version: "3.00" } });

    mode = "error";
    await nextPoll(page);
    await expect(page.getByText("v1.00", { exact: true })).toBeVisible();
    mode = "invalid";
    await nextPoll(page);
    await expect(page.getByText("v1.00", { exact: true })).toBeVisible();

    // Return the old RSC payload once: observing a new hash must not mark it
    // applied until the server has actually rendered the new configuration.
    await updateConfig(request);
    const staleRsc = await request.get("/", { headers: { RSC: "1" } });
    const staleBody = await staleRsc.body();
    await updateConfig(request, { items: { version: "3.00" } });
    let staleRefresh = true;
    await page.route("**/*", async (route) => {
        if (route.request().headers().rsc === "1" && staleRefresh) {
            staleRefresh = false;
            return route.fulfill({ response: staleRsc, body: staleBody });
        }
        return route.fallback();
    });
    mode = "ok";
    await nextPoll(page);
    await expect.poll(() => staleRefresh).toBe(false);
    await expect(page.getByText("v1.00", { exact: true })).toBeVisible();
    await nextPoll(page);
    await expect(page.getByText("v3.00", { exact: true })).toBeVisible();
});

test("times out a stalled poll without overlapping requests and then recovers", async ({
    page,
    request,
}) => {
    let requests = 0;
    await page.route("**/api/update-hash", (route) => {
        requests++;
        // Leave the first request pending until the browser aborts it.
        if (requests > 1) return route.continue();
    });
    const aborted = page.waitForEvent("requestfailed", (req) =>
        req.url().endsWith("/api/update-hash"),
    );
    await page.goto("/");
    await expect(page.getByText("v1.00", { exact: true })).toBeVisible();
    await expect.poll(() => requests).toBe(1);
    await page.clock.fastForward(60_000);
    expect(requests).toBe(1);
    // Wait for the fetch to abort before advancing to its scheduled retry.
    await aborted;
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await updateConfig(request, { items: { version: "5.00" } });
    await nextPoll(page);
    await expect(page.getByText("v5.00", { exact: true })).toBeVisible();
});

test("serves fresh uncached digests and a controlled error response", async ({
    request,
}) => {
    const initial = await request.get("/api/update-hash");
    expect(initial.status()).toBe(200);
    expect(initial.headers()["cache-control"]).toContain("no-store");
    const { hash } = await initial.json();
    expect(typeof hash).toBe("string");
    await updateConfig(request, { items: { version: "4.00" } });
    const changed = await request.get("/api/update-hash");
    expect((await changed.json()).hash).not.toBe(hash);

    await updateConfig(request, { unavailable: true });
    const failed = await request.get("/api/update-hash");
    expect(failed.status()).toBe(503);
    expect(failed.headers()["cache-control"]).toContain("no-store");
    expect(await failed.json()).toEqual({
        error: "Failed to load configuration",
    });
});
