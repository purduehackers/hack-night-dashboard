import { expect, test } from "@playwright/test";

const message = {
    id: "1",
    channel: { id: "1052236377338683514", name: "checkpoints" },
    author: { id: "123", name: "Hacker", avatarHash: null },
    timestamp: "2026-11-21T02:00:00Z",
    content: { markdown: "My project", html: "<p>My project</p>" },
};

async function openDashboard(page) {
    let socket;
    await page.routeWebSocket(
        "wss://api.purduehackers.com/discord/dashboard",
        (ws) => {
            socket = ws;
        },
    );
    await page.route("**/api/version", (route) =>
        route.fulfill({ body: "test" }),
    );
    await page.route("**/api/sessions?**", (route) =>
        route.fulfill({
            json: {
                docs: [],
                hasNextPage: false,
                hasPrevPage: false,
                limit: 1,
                nextPage: null,
                page: 1,
                pagingCounter: 1,
                prevPage: null,
                totalDocs: 0,
                totalPages: 0,
            },
        }),
    );
    await page.addInitScript(() => {
        window.gongs = 0;
        HTMLMediaElement.prototype.play = async function () {
            if (this.src.endsWith("/gong.mp3")) window.gongs++;
        };
    });
    // The dashboard pauses checkpoints during its midnight countdown.
    await page.clock.setFixedTime(new Date(message.timestamp));
    await page.goto("/");
    await expect.poll(() => Boolean(socket)).toBe(true);
    return (frame) => socket.send(JSON.stringify(frame));
}

test("a delayed Twitter preview updates the feed and active checkpoint once", async ({
    page,
}) => {
    const send = await openDashboard(page);
    send(message);
    await expect(
        page.getByRole("heading", { name: /Checkpoint!/ }),
    ).toBeVisible();
    const tweet = {
        url: "https://twitter.com/hacker/status/123",
        author: { name: "Hacker (@hacker)" },
        description: "It works\\!",
        image: { url: new URL("/glider.svg", page.url()).href },
        footer: { text: "X" },
    };
    const update = {
        ...message,
        embeds: [tweet],
        embedRevision: 2,
        updateOnly: true,
    };
    send(update);
    send(update);
    send(message); // Older reconnect replay.
    const cards = page.locator(`a[href="${tweet.url}"]`);
    await expect(cards).toHaveCount(2);
    await expect(cards.first()).toContainText("It works!");
    await expect(cards.last()).toContainText(tweet.author.name);
    for (const image of await cards.locator("img").all()) {
        await expect
            .poll(() => image.evaluate((el) => el.naturalWidth))
            .toBeGreaterThan(0);
    }
    send({ ...update, embeds: [], embedRevision: 3 });
    send(update); // A retried, older snapshot cannot undo suppression.
    await expect(cards).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.gongs)).toBe(1);
});

test("embed-only messages show multiple cards and use a thumbnail for an external player", async ({
    page,
}) => {
    const send = await openDashboard(page);
    const poster = new URL("/glider.svg", page.url()).href;
    const frame = {
        ...message,
        channel: { id: "2", name: "general" },
        content: { markdown: "", html: "" },
        embeds: [
            {
                title: "Demo video",
                url: "https://example.com/watch",
                video: { url: "https://example.com/player" },
                thumbnail: { url: poster },
            },
            {
                title: "Build log",
                fields: [{ name: "Status", value: "Shipped" }],
            },
        ],
    };
    send({ ...frame, updateOnly: true, embedRevision: 1 });
    send({ ...frame, embeds: [{ title: "Barrier" }], id: "2" });
    await expect(page.getByText("Barrier")).toBeVisible();
    await expect(page.getByText("Demo video")).toHaveCount(0);
    send(frame);
    await expect(page.getByRole("link", { name: /Demo video/ })).toBeVisible();
    await expect(page.getByAltText("Demo video preview")).toHaveAttribute(
        "src",
        poster,
    );
    await expect(page.getByText("Status Shipped")).toBeVisible();
    await expect(page.locator("video")).toHaveCount(0);
});
