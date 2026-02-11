"use client";

import { FC, useEffect } from "react";
import useSWR from "swr";

const DAY_AS_MS = 24 * 60 * 60 * 1000;

function fetcher([baseUrl, since, until]: [string, Date, Date]) {
    const params = new URLSearchParams({
        since: since.toISOString(),
        until: until.toISOString(),
    });
    return fetch(`${baseUrl}?${params.toString()}`).then((res) => res.json());
}

/**
 * Returns the time range in which to search for sessions based on the current time.
 */
function getSessionTimeRange(): { since: Date; until: Date } {
    // Start is beginning of the current day
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    // End is the start of today + 2 days
    const end = new Date(start.getTime() + 2 * DAY_AS_MS);

    return {
        since: start,
        until: end,
    };
}

export const SessionAnnouncer: FC = () => {
    const { since, until } = getSessionTimeRange();
    const { data } = useSWR(["/api/sessions", since, until], fetcher, {
        refreshInterval: 60_000, // 1 minute
    });
    useEffect(() => {
        console.log("Fetched sessions", data);
    }, [data]);
    return null;
};
