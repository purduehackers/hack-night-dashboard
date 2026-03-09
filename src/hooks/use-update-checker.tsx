"use client";

import { captureException } from "@sentry/nextjs";
import { useEffect, useRef } from "react";

const POLL_INTERVAL = 30_000;

export function useUpdateChecker() {
    const hashRef = useRef<string | null>(null);

    useEffect(() => {
        async function checkForUpdate() {
            try {
                const res = await fetch("/api/update-hash");
                if (!res.ok) return;
                const { hash } = (await res.json()) as { hash: string };
                if (hashRef.current === null) {
                    hashRef.current = hash;
                } else if (hashRef.current !== hash) {
                    const url = new URL(window.location.href);
                    url.searchParams.set("skip_audio", "1");
                    window.location.href = url.toString();
                }
            } catch (error) {
                captureException(error);
            }
        }

        checkForUpdate();
        const id = setInterval(checkForUpdate, POLL_INTERVAL);
        return () => clearInterval(id);
    }, []);
}
