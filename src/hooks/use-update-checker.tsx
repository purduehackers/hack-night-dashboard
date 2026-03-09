"use client";

import { captureException } from "@sentry/nextjs";
import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL = 30_000;

interface UpdateHashResponse {
    hash: string;
    version: string;
}

export function useUpdateChecker(initialVersion: string): string {
    const hashRef = useRef<string | null>(null);
    const [version, setVersion] = useState(initialVersion);

    useEffect(() => {
        const controller = new AbortController();
        let timeoutId: ReturnType<typeof setTimeout>;

        async function poll() {
            try {
                const res = await fetch("/api/update-hash", {
                    signal: controller.signal,
                });
                if (!res.ok) return;
                const data = (await res.json()) as UpdateHashResponse;

                if (hashRef.current === null) {
                    // First successful poll: initialize hash and reconcile version if needed.
                    hashRef.current = data.hash;
                    if (data.version !== initialVersion) {
                        setVersion(data.version);
                    }
                    return;
                }

                if (hashRef.current !== data.hash) {
                    setVersion(data.version);
                    hashRef.current = data.hash;
                }
            } catch (error) {
                if (controller.signal.aborted) return;
                captureException(error);
            } finally {
                if (!controller.signal.aborted) {
                    timeoutId = setTimeout(poll, POLL_INTERVAL);
                }
            }
        }

        poll();
        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, []);

    return version;
}
