"use client";

import { ComponentPropsWithRef, FC, useEffect, useState } from "react";
import useSWR from "swr";
import { Overlay } from "@/components/ui/overlay";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import { LightningClock } from "./clock";
import { useCoordinator } from "./coordinator";
import { HydratedSession, SessionsAPIResponseSchema } from "@/lib/cms";
import { DiscordUserMention } from "@/components/ui/discord";
import { GliderFlat, PixelClock } from "@/components/icons";
import Image from "next/image";
import { cn } from "@/lib/utils";

const AS_MS = {
    second: 1000,
    minute: 60 * 1000,
    day: 24 * 60 * 60 * 1000,
} as const;

/**
 * When to announce sessions and for how long each time
 */
const SESSION_ANNOUNCEMENT_TIMES: Readonly<
    { minutesBefore: number; durationMinutes: number }[]
> = [
    { minutesBefore: 1, durationMinutes: 2 },
    { minutesBefore: 10, durationMinutes: 1 },
    { minutesBefore: 30, durationMinutes: 1 },
] as const;

export async function fetcher([baseUrl, since, until]: [string, Date, Date]) {
    const params = new URLSearchParams({
        since: since.toISOString(),
        until: until.toISOString(),
    });
    return fetch(`${baseUrl}?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => SessionsAPIResponseSchema.parse(data));
}

/**
 * Returns the time range in which to search for sessions based on the current time.
 */
function getSessionTimeRange(): { since: Date; until: Date } {
    // Start is beginning of the current day
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    // End is the start of today + 2 days
    const end = new Date(start.getTime() + 2 * AS_MS.day);

    return {
        since: start,
        until: end,
    };
}

export const SessionAnnouncer: FC = () => {
    const { notificationsPaused } = useCoordinator();
    const [now, setNow] = useState<number>();

    // Fetch session data
    const { since, until } = getSessionTimeRange();
    const { data } = useSWR(["/api/sessions", since, until], fetcher, {
        refreshInterval: 60_000, // 1 minute
    });

    // Update `now` every second
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNow(Date.now());
        const timer = window.setInterval(
            () => setNow(Date.now()),
            AS_MS.second,
        );
        return () => window.clearInterval(timer);
    }, [setNow]);

    const activeSession =
        now === undefined
            ? undefined
            : data?.docs.find((session) => {
                  const startTime = new Date(session.date).getTime();
                  return SESSION_ANNOUNCEMENT_TIMES.some(
                      ({ minutesBefore, durationMinutes }) => {
                          const startAnnouncing =
                              startTime - minutesBefore * AS_MS.minute;
                          const stopAnnouncing =
                              startAnnouncing + durationMinutes * AS_MS.minute;
                          return startAnnouncing <= now && now < stopAnnouncing;
                      },
                  );
              });

    return (
        <Overlay
            open={activeSession !== undefined && !notificationsPaused}
            className="p-0"
        >
            {activeSession && (
                <SessionOverlayContent now={now!} session={activeSession} />
            )}
        </Overlay>
    );
};

function timerText(sessionDate: string, now: number): string {
    const start = new Date(sessionDate).getTime();
    if (start <= now) return "starting now";
    const msLeft = start - now;
    console.log({ msLeft });
    const minutesLeft = Math.floor(msLeft / AS_MS.minute);
    const secondsLeft = Math.floor(msLeft / AS_MS.second);
    const selected = minutesLeft > 0 ? minutesLeft : secondsLeft;
    const suffix = selected === 1 ? "" : "s";
    return minutesLeft > 0
        ? `in ${minutesLeft} minute${suffix}`
        : `in ${secondsLeft} second${suffix}`;
}

export const SessionOverlayContent: FC<{
    session: HydratedSession;
    now: number;
}> = ({ session, now }) => {
    // const images = [...session.images!, ...session.images!];
    const hasDiscord = session.host.discordName !== undefined;
    const namesSame =
        hasDiscord &&
        session.host.discordName?.trim() === session.host.preferred_name.trim();
    const mention = hasDiscord ? (
        <DiscordUserMention
            userId={session.host.discord_id!}
            displayName={session.host.discordName!}
            avatarHash={session.host.avatarHash}
            kind={session.host.avatarHash ? "withImage" : "at"}
        />
    ) : null;

    return (
        <div className="relative size-full p-8">
            <div className="border-ph-purple flex size-full flex-col justify-between gap-8 border bg-black p-8">
                <h1 className="font-silkscreen text-ph-yellow text-[9rem] leading-[0.85]">
                    {session.title.split("").map((c, i) => (
                        <span key={i} className="-mx-[0.07em]">
                            {c}
                        </span>
                    ))}
                </h1>

                {/* Description & images */}
                <div className="flex items-center justify-between gap-8">
                    <div
                        className="font-polysans flex-2 text-4xl *:flex *:flex-col *:gap-4"
                        dangerouslySetInnerHTML={{
                            __html: convertLexicalToHTML({
                                data: session.description,
                            }),
                        }}
                    />

                    <div
                        className={cn(
                            "flex flex-1 items-center justify-evenly gap-8",
                            // images.length > 1 ? "flex-2" : "flex-1",
                        )}
                    >
                        {/* FIXME: display images from CMS */}
                        <GliderFlat className="block h-40" width={undefined} />
                    </div>
                </div>

                {/* Footer */}
                <div className="font-inconsolata flex items-center justify-between gap-8 text-4xl font-bold">
                    <div>
                        Hosted by{" "}
                        {namesSame ? (
                            mention
                        ) : (
                            <>
                                {session.host.preferred_name.trim()}
                                {hasDiscord && <>&nbsp;({mention})</>}
                            </>
                        )}
                    </div>
                    <div className="animate-pulse">
                        <PixelClock className="fill-foreground me-3 mb-1 inline size-8 align-middle" />
                        {timerText(session.date, now)}
                    </div>
                </div>

                <LightningClock
                    containerProps={{
                        className:
                            "absolute right-0 bottom-0 flex gap-4 h-8 items-center px-4 text-base font-bold drop-shadow-sm drop-shadow-black",
                    }}
                />
            </div>
        </div>
    );
};

const PAYLOAD_URL = process.env.PAYLOAD_URL ?? "https://cms.purduehackers.com";
const SessionImage: FC<
    {
        image: NonNullable<HydratedSession["images"]>[number];
    } & Omit<
        ComponentPropsWithRef<typeof Image>,
        "src" | "width" | "height" | "alt" | "srcSet"
    >
> = ({ image, ...rest }) => {
    if (typeof image.image === "number") return null;
    if (!image.image.url || !image.image.width || !image.image.height)
        return null;
    const url = new URL(image.image.url, PAYLOAD_URL).href;
    return (
        // <div className="border-ph-purple max-h-80 flex-1 border">
        <Image
            unoptimized
            src={url}
            width={image.image.width}
            height={image.image.height}
            alt=""
            {...rest}
        />
        // </div>
    );
};
