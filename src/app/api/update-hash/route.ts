import { digest } from "@vercel/edge-config";
import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
    try {
        const [hash, version] = await Promise.all([
            digest(),
            getConfig("version"),
        ]);
        return NextResponse.json({ hash, version });
    } catch (error) {
        Sentry.captureException(error);

        return NextResponse.json(
            { error: "Failed to load configuration" },
            { status: 503 }
        );
    }
}
