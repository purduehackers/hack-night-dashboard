import { digest } from "@vercel/edge-config";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

export async function GET(): Promise<NextResponse> {
    try {
        return NextResponse.json({ hash: await digest() }, { headers });
    } catch (error) {
        Sentry.captureException(error);

        return NextResponse.json(
            { error: "Failed to load configuration" },
            { status: 503, headers },
        );
    }
}
