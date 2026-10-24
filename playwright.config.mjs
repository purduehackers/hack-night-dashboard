import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests",
    workers: 1,
    use: {
        baseURL: "http://127.0.0.1:4117",
        viewport: { width: 1920, height: 1080 },
        timezoneId: "America/Indiana/Indianapolis",
        trace: "retain-on-failure",
    },
    webServer: [
        {
            command: "node tests/fixtures/edge-config.mjs",
            url: "http://127.0.0.1:4118/health",
        },
        {
            command:
                "bun run build && bun run start --hostname 127.0.0.1 --port 4117",
            url: "http://127.0.0.1:4117",
            timeout: 180_000,
            env: {
                EDGE_CONFIG: "http://127.0.0.1:4118/ecfg_test?token=test",
                DISCORD_BOT_TOKEN: "test",
                PAYLOAD_URL: "http://127.0.0.1:4118",
                PAYLOAD_API_KEY: "test",
                NEXT_PUBLIC_SENTRY_DSN: "",
                SENTRY_AUTH_TOKEN: "",
            },
        },
    ],
});
