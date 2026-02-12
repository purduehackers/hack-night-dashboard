import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Where } from "payload";
import { stringify } from "qs-esm";
import * as Sentry from "@sentry/nextjs";
import { RESTGetAPIGuildMemberResult } from "discord-api-types/rest/v10";
import { CMSSessionsResponseSchema, HydratedSession } from "@/lib/cms";

const PAYLOAD_URL = process.env.PAYLOAD_URL ?? "https://cms.purduehackers.com";

const DISCORD_API = "https://discord.com/api/v10";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("Missing DISCORD_BOT_TOKEN");
const GUILD_ID = process.env.DISCORD_GUILD_ID ?? "772576325897945119";

const SESSION_CACHE_TTL_SECONDS = 60;
const DISCORD_CACHE_TTL_SECONDS = 3600; // 1 hour

function logAndReturnError(response: Response) {
    const error = new Error(
        `Failed to fetch guild member: Discord API returned ${response.status} response`,
    );
    Sentry.captureException(error, {
        contexts: {
            response: {
                type: response.type,
                status_code: response.status,
                headers: response.headers as unknown as Record<string, string>,
            },
        },
    });
    return error;
}

async function fetchGuildMember(
    id: string,
): Promise<RESTGetAPIGuildMemberResult | null> {
    console.log("guild member", id);
    const response = await fetch(
        `${DISCORD_API}/guilds/${GUILD_ID}/members/${id}`,
        {
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`,
            },
            next: {
                revalidate: DISCORD_CACHE_TTL_SECONDS,
            },
        },
    );
    if (!response.ok) {
        if (response.status === 404) {
            return null;
        } else {
            throw logAndReturnError(response);
        }
    }
    const data = (await response.json()) as RESTGetAPIGuildMemberResult;
    return data;
}

/**
 * Fetches upcoming sessions and hydrates host fields with name & avatar from
 * Discord API.
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
    const upstreamParams: {
        limit?: number;
        depth?: number;
        sort?: string;
        where?: Where;
    } = {
        depth: 2,
        limit: 100,
        sort: "date",
        where: {
            // published: {
            //     equals: true,
            // },
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
            next: { revalidate: SESSION_CACHE_TTL_SECONDS },
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

    const data = CMSSessionsResponseSchema.parse(await response.json());
    const hydratedDocs = await Promise.all(
        data.docs.map(async (session): Promise<HydratedSession> => {
            if (!session.host.discord_id) return session;
            const guildMember = await fetchGuildMember(session.host.discord_id);
            if (!guildMember) return session;
            const name =
                guildMember.nick ??
                guildMember.user.global_name ??
                guildMember.user.username;
            const avatarHash = guildMember.avatar ?? guildMember.user.avatar;
            return {
                ...session,
                host: { ...session.host, discordName: name, avatarHash },
            };
        }),
    );

    return NextResponse.json(
        { ...data, docs: hydratedDocs },
        {
            headers: {
                "Content-Type":
                    response.headers.get("Content-Type") ??
                    "application/octet-stream",
                "Cache-Control": `public, max-age=${SESSION_CACHE_TTL_SECONDS}, stale-if-errror=3600`,
            },
        },
    );
}
