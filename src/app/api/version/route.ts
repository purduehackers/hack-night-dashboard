import { CMSFindResponseSchema } from "@/lib/cms";
import { NextResponse } from "next/server";
import { SelectIncludeType, Where } from "payload";
import { stringify } from "qs-esm";
import * as Sentry from "@sentry/nextjs";

const WEEK_SECONDS = 7 * 24 * 60 * 60;
const WEEK_MS = WEEK_SECONDS * 1000;

interface MinimalEvent {
    slug: string;
    start: string;
}

// Returns the version of the latest hack night event whose start time is before the current time.
// Searches events whose start time is now +/- 1 week.
export async function GET(): Promise<NextResponse> {
    let now = new Date();
    const cmsQuery: {
        limit: number;
        where: Where;
        select?: SelectIncludeType;
    } = {
        limit: 0,
        where: {
            eventType: { equals: "hack-night" },
            start: {
                greater_than_equal: new Date(now.getTime() - WEEK_MS),
                less_than: new Date(now.getTime() + WEEK_MS),
            },
        },
        select: {
            slug: true,
            start: true,
        },
    };

    try {
        const response = await fetch(
            `https://cms.purduehackers.com/api/events?${stringify(cmsQuery)}`,
            {
                headers: {
                    Authorization: `service-accounts API-Key ${process.env.PAYLOAD_API_KEY}`,
                },
                signal: AbortSignal.timeout(100000),
            },
        );
        if (!response.ok) {
            throw new Error(
                `CMS returned ${response.status} ${response.statusText}: ${await response.text()}`,
            );
        }
        const data = CMSFindResponseSchema<MinimalEvent>().parse(
            await response.json(),
        );
        // Get the current time again in case the API request took a while
        now = new Date();

        let latestVersionStartingBeforeNow: string | undefined = undefined;
        let latestDate: Date | undefined = undefined;
        for (const event of data.docs) {
            const start = new Date(event.start);
            if (
                start < now &&
                (latestDate === undefined || start > latestDate)
            ) {
                latestDate = start;
                latestVersionStartingBeforeNow = event.slug;
            }
        }
        if (latestVersionStartingBeforeNow === undefined) {
            latestVersionStartingBeforeNow = "?.?.?";
        }

        // Find the start date of the next hack night
        let nextDate: Date | undefined = undefined;
        for (const event of data.docs) {
            const start = new Date(event.start);
            if (start > now && (nextDate === undefined || start < nextDate)) {
                nextDate = start;
            }
        }

        const headers: HeadersInit = {};
        if (latestDate === undefined && nextDate === undefined) {
            // No hack nights found in search window. Use a shorter TTL in case
            // this is a mistake and one gets published soon.
            headers["Cache-Control"] = "public, max-age=60, s-maxage=60";
        } else if (nextDate === undefined) {
            // The next hack night after the active one isn't within the search
            // window, so we can cache the current version until the end of the
            // search window, which is 1 week from now.
            headers["Cache-Control"] =
                `public, max-age=${WEEK_SECONDS}, s-maxage=${WEEK_SECONDS}`;
        } else {
            // We know when the next hack night after the active one starts, so
            // cache until then.
            const ttlSeconds = Math.floor(
                (nextDate.getTime() - now.getTime()) / 1000,
            );
            headers["Cache-Control"] = `public, s-maxage=${ttlSeconds}`;
            headers["Expires"] = nextDate.toUTCString();
        }
        return new NextResponse(latestVersionStartingBeforeNow, { headers });
    } catch (error) {
        Sentry.captureException(error);
        console.error(error);
        return new NextResponse(
            "Unexpected error. Tell Kian if you're seeing this.",
            {
                status: 500,
                headers: { "Cache-Control": "no-store" },
            },
        );
    }
}
