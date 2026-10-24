"use client";

import { captureException } from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const POLL_INTERVAL = 30_000;
const REQUEST_TIMEOUT = 10_000;

export function useUpdateChecker(renderedHash: string): void {
    const router = useRouter();

    useEffect(() => {
        const controller = new AbortController();
        let timeoutId: ReturnType<typeof setTimeout>;

        async function poll() {
            try {
                const res = await fetch("/api/update-hash", {
                    cache: "no-store",
                    signal: AbortSignal.any([
                        controller.signal,
                        AbortSignal.timeout(REQUEST_TIMEOUT),
                    ]),
                });
                if (!res.ok) return;
                const data: unknown = await res.json();
                if (
                    !data ||
                    typeof data !== "object" ||
                    !("hash" in data) ||
                    typeof data.hash !== "string" ||
                    data.hash.length === 0
                ) {
                    throw new Error("Invalid configuration digest response");
                }

                // Compare with the server-rendered snapshot, including on the
                // first poll. Keep retrying until a refresh actually renders it.
                if (!controller.signal.aborted && data.hash !== renderedHash) {
                    router.refresh();
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
    }, [renderedHash, router]);
}
