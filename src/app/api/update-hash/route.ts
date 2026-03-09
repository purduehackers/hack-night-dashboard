import { digest } from "@vercel/edge-config";
import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
    const [hash, version] = await Promise.all([
        digest(),
        getConfig("version"),
    ]);
    return NextResponse.json({ hash, version });
}
