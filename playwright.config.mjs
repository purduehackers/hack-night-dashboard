import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:4117";

export default defineConfig({
    testDir: "./tests",
    use: {
        baseURL,
        viewport: { width: 1280, height: 720 },
        timezoneId: "America/Indiana/Indianapolis",
    },
    webServer: {
        command: "bun run dev --hostname 127.0.0.1 --port 4117",
        url: baseURL,
        timeout: 120_000,
        env: { DISCORD_BOT_TOKEN: "test", NEXT_PUBLIC_SENTRY_DSN: "" },
    },
});
