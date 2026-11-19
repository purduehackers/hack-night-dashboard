"use client";

import useSWR from "swr";

async function fetchVersion(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        let msg = `Request returned ${response.status} ${response.statusText}`;
        const contentType = response.headers.get("Content-Type")?.split(";")[0];
        if (
            contentType?.startsWith("text/") ||
            contentType === "application/json"
        )
            msg += ": " + (await response.text());
        throw new Error(msg);
    }
    return response.text();
}

export function HackNightVersion() {
    const {
        data: version,
        error,
        isLoading,
    } = useSWR("/api/version", fetchVersion, {
        // Poll every 10 seconds. Fresh responses can come from the browser cache.
        refreshInterval: 10_000,
    });

    return (
        <div className="text-ph-yellow font-inconsolata col-2 ms-4 mt-4 text-4xl font-bold">
            {isLoading
                ? "Loading version..."
                : error
                  ? "Error loading version :("
                  : `v${version}`}
        </div>
    );
}
