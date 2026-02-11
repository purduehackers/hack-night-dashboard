import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Where } from "payload";
import { stringify } from "qs-esm";
import * as Sentry from "@sentry/nextjs";

const PAYLOAD_URL = process.env.PAYLOAD_URL ?? "https://cms.purduehackers.com";

const CACHE_TTL_SECONDS = 60;

/**
 * Fetches upcoming sessions.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    const params = request.nextUrl.searchParams;
    const sinceStr = params.get("since");
    const untilStr = params.get("until");
    if (!sinceStr || !untilStr) {
        return new NextResponse("Missing required parameter(s)");
    }
    let since: Date;
    let until: Date;
    try {
        since = z.coerce.date().parse(sinceStr);
        until = z.coerce.date().parse(untilStr);
    } catch (error) {
        return new NextResponse(
            `Invalid date value: ${(error as Error).message}`,
            { status: 400 },
        );
    }
    const upstreamParams: { limit?: number; sort?: string; where?: Where } = {
        limit: 100,
        sort: "date",
        where: {
            published: {
                equals: true,
            },
            date: {
                greater_than_equal: since,
                less_than_equal: until,
            },
        },
    };
    const query = stringify(upstreamParams);
    let response;
    try {
        response = await fetch(`${PAYLOAD_URL}/api/sessions?${query}`, {
            headers: {
                Authorization: `service-accounts API-Key ${process.env.PAYLOAD_API_KEY}`,
            },
            next: { revalidate: CACHE_TTL_SECONDS },
        });
    } catch (error) {
        Sentry.captureException(error, {
            contexts: { params: upstreamParams },
        });
        return new NextResponse(`Failed to send upstream API request to CMS`, {
            status: 500,
        });
    }
    if (!response.ok) {
        Sentry.captureException(
            new Error(
                `Upstream API request to CMS failed with status ${response.status}`,
                { cause: response },
            ),
            {
                contexts: {
                    response: {
                        status_code: response.status,
                        headers: response.headers as unknown as Record<
                            string,
                            string
                        >,
                        type: response.type,
                    },
                },
            },
        );
        return new NextResponse("Upstream API request to CMS failed", {
            status: 502,
        });
    }

    return new NextResponse(response.body, {
        headers: {
            "Content-Type":
                response.headers.get("Content-Type") ??
                "application/octet-stream",
            "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}, stale-if-errror=3600`,
        },
    });
}
