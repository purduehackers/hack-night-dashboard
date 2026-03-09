import { digest } from "@vercel/edge-config";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
    const hash = await digest();
    return NextResponse.json({ hash });
}
