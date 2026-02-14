"use client";

import { addBreadcrumb } from "@sentry/nextjs";
import { FC, useEffect, useRef } from "react";

export const ScreenyNoSleepy: FC = () => {
    const wakeLockRef = useRef<WakeLockSentinel>(null);

    useEffect(() => {
        if (!("wakeLock" in navigator)) {
            console.warn("Wake Lock API is not supported in this browser.");
            return;
        }

        let released = false;

        async function requestWakeLock() {
            if (released) return;
            try {
                const lock = await navigator.wakeLock.request("screen");
                lock.addEventListener("release", () => {
                    addBreadcrumb({
                        category: "waker",
                        message: "Wake lock released",
                    });
                    wakeLockRef.current = null;
                    // Re-acquire if the component is still mounted
                    if (document.visibilityState === "visible") {
                        requestWakeLock();
                    }
                });
                addBreadcrumb({
                    category: "waker",
                    message: "Wake lock acquired",
                });
                wakeLockRef.current = lock;
            } catch (err) {
                console.warn("Failed to acquire wake lock", err);
            }
        }

        requestWakeLock();

        // Re-acquire on visibility change (browser releases wake lock when tab is hidden)
        function handleVisibilityChange() {
            if (document.visibilityState === "visible") {
                requestWakeLock();
            }
        }
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            released = true;
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
            wakeLockRef.current?.release();
            wakeLockRef.current = null;
        };
    }, []);

    // Don't render anything
    return null;
};
