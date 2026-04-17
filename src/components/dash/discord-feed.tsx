"use client";

import "./discord.css";
import { FC, useEffect, useRef, useState } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { addBreadcrumb, captureException } from "@sentry/nextjs";
import z from "zod";
import { DiscordUserAvatar, DiscordUserMention } from "@/components/ui/discord";
import { motion } from "motion/react";
import { useCoordinator } from "./coordinator";
import { Overlay } from "../ui/overlay";
import { LightningClock } from "./clock";
import { cn } from "@/lib/utils";
import { useSound } from "@/lib/sound";

const DISCORD_FEED_WS_URL = "wss://api.purduehackers.com/discord/dashboard";

const CHECKPOINTS_CHANNEL_IDS = new Set([
    "1479527770483593266", // thread in #bot-dump
    "1052236377338683514", // #checkpoints
]);
/**

 * Amount of time for which each #checkpoints message will be presented.
 */
const CHECKPOINTS_DISPLAY_DURATION_MS = 30000;

const discordMessageSchema = z.object({
    id: z.string(),
    channel: z.object({
        id: z.string(),
        name: z.string(),
    }),
    author: z.object({
        id: z.string(),
        name: z.string(),
        avatarHash: z.string().nullable(),
    }),
    timestamp: z.iso.datetime({ offset: true }).transform((d) => new Date(d)),
    content: z.object({
        markdown: z.string().trim(),
        html: z.string().trim(),
    }),
    attachments: z.array(z.string()).default([]),
});
type DiscordMessage = z.infer<typeof discordMessageSchema>;

export const DiscordFeed: FC = () => {
    // Messages are ordered new to old
    const [messages, setMessages] = useState<DiscordMessage[]>([]);
    // currentCheckpoint is the message being shown; checkpointQueue holds waiting messages
    const [currentCheckpoint, setCurrentCheckpoint] =
        useState<DiscordMessage | null>(null);
    const [checkpointQueue, setCheckpointQueue] = useState<DiscordMessage[]>(
        [],
    );
    const wsRef = useRef<ReconnectingWebSocket>(null);
    const startTimeRef = useRef<number>(0);
    const msLeftRef = useRef<number>(CHECKPOINTS_DISPLAY_DURATION_MS);
    const { checkpointsPaused, pauseCheckpoints, unpauseCheckpoints } =
        useCoordinator();
    const gongSound = useSound("/gong.mp3");

    useEffect(() => {
        const ws = new ReconnectingWebSocket(DISCORD_FEED_WS_URL);

        ws.addEventListener("open", () => {
            addBreadcrumb({
                category: "discord.feed",
                message: "WebSocket connected",
                data: { url: DISCORD_FEED_WS_URL },
            });
        });

        ws.addEventListener("close", (ev) => {
            addBreadcrumb({
                category: "discord.feed",
                message: "WebSocket disconnected",
                data: {
                    url: DISCORD_FEED_WS_URL,
                    info: {
                        code: ev.code,
                        reason: ev.reason,
                        wasClean: ev.wasClean,
                    },
                },
            });
        });

        ws.addEventListener("error", (ev) => {
            captureException(ev.error, {
                tags: { component: DiscordFeed.displayName },
            });
        });

        ws.addEventListener("message", (ev) => {
            try {
                const message = discordMessageSchema.parse(JSON.parse(ev.data));
                setMessages((prev) => [message, ...prev.slice(0, 100)]);
                if (CHECKPOINTS_CHANNEL_IDS.has(message.channel.id)) {
                    setCheckpointQueue((prev) => [...prev, message]);
                }
            } catch (error) {
                captureException(error, {
                    tags: { component: DiscordFeed.displayName },
                    extra: { message: ev.data },
                });
            }
        });

        wsRef.current = ws;
        return () => {
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, []);

    // Promotion effect: when nothing is displayed and the queue has items, promote the next one.
    useEffect(() => {
        if (currentCheckpoint === null && checkpointQueue.length > 0) {
            const [next, ...rest] = checkpointQueue;
            msLeftRef.current = CHECKPOINTS_DISPLAY_DURATION_MS;
            setCurrentCheckpoint(next);
            setCheckpointQueue(rest);
        }
    }, [currentCheckpoint, checkpointQueue]);

    // Timer effect: displays the current checkpoint for its remaining time,
    // pausing and saving remaining time when checkpointsPaused becomes true.
    useEffect(() => {
        if (currentCheckpoint === null || checkpointsPaused) return;

        startTimeRef.current = performance.now();
        const timer = setTimeout(() => {
            // Checkpoint fully displayed — clear it (promotion effect will pick up the next one)
            gongSound.pause();
            msLeftRef.current = CHECKPOINTS_DISPLAY_DURATION_MS;
            setCurrentCheckpoint(null);
        }, msLeftRef.current);
        // Only play the gong sound if this is the first time this checkpoint is
        // being displayed.
        if (msLeftRef.current == CHECKPOINTS_DISPLAY_DURATION_MS) {
            gongSound.play();
        }

        return () => {
            clearTimeout(timer);
            // Save the remaining display time for the current checkpoint
            const elapsed = performance.now() - startTimeRef.current;
            const remaining = msLeftRef.current - elapsed;
            gongSound.pause();
            // If the remaining time is less than 5 seconds, it'll look
            // too choppy to show the checkpoint and then immediately hide
            // it, so we just count it as done.
            if (remaining < 5000) {
                // Wait 2 seconds in between individual checkpoints
                pauseCheckpoints();
                setTimeout(unpauseCheckpoints, 2000);
                msLeftRef.current = CHECKPOINTS_DISPLAY_DURATION_MS;
                setCurrentCheckpoint(null);
            } else {
                msLeftRef.current = remaining;
            }
        };
    }, [
        currentCheckpoint,
        checkpointsPaused,
        gongSound,
        pauseCheckpoints,
        unpauseCheckpoints,
    ]);

    return (
        <>
            {messages.length > 0 ? (
                <div className="h-full text-2xl">
                    {/* Overlay a translucent gradient to make messages "fade out" towards top */}
                    <div
                        className="pointer-events-none absolute top-0 z-10 h-30 w-full"
                        style={{
                            backgroundImage:
                                "linear-gradient(to bottom, #000000aa, #00000000)",
                        }}
                        aria-hidden
                    />

                    <div className="flex h-full flex-col-reverse overflow-hidden">
                        {messages
                            .filter(
                                (message) => message.content.html.length > 0,
                            )
                            .map((message) => (
                                <DiscordMessage
                                    key={message.id}
                                    message={message}
                                />
                            ))}
                    </div>
                </div>
            ) : (
                <div className="text-center text-2xl">
                    Start chatting in Discord!
                </div>
            )}

            <Overlay
                open={currentCheckpoint !== null && !checkpointsPaused}
                className="p-0"
                color="#00ff00"
            >
                {currentCheckpoint && (
                    <CheckpointOverlayContent message={currentCheckpoint} />
                )}
            </Overlay>
        </>
    );
};

const DiscordMessage: FC<{ message: DiscordMessage }> = ({ message }) => {
    const time = message.timestamp.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: undefined,
    });

    const attachments = message.attachments.filter(
        (url) => isPhotoUrl(url) || isVideoUrl(url),
    );

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                y: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                layout: { type: "spring", stiffness: 300, damping: 30 },
            }}
            className="border-foreground/20 py-2 not-last:border-t first:pb-0"
        >
            <DiscordUserMention
                kind="withImage"
                userId={message.author.id}
                displayName={message.author.name}
                avatarHash={message.author.avatarHash}
                className="text-ph-pink bg-ph-purple/40"
            />
            <div className="flex flex-row items-center">
                <div className="grow overflow-hidden text-2xl font-medium text-nowrap text-ellipsis">
                    in{" "}
                    <span className="text-ph-yellow">
                        #{message.channel.name}
                    </span>
                </div>
                <div className="text-foreground/70 ms-4 grow text-right font-normal whitespace-nowrap">
                    {time}
                </div>
            </div>
            {message.content.markdown.trim().length > 0 && (
                <div
                    className="discord-text font-polysans line-clamp-3 text-2xl leading-tight text-ellipsis"
                    dangerouslySetInnerHTML={{ __html: message.content.html }}
                />
            )}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {attachments.map((url, i) => {
                        const className =
                            "max-h-30 h-full max-w-full rounded-sm";
                        if (isVideoUrl(url)) {
                            return (
                                <video
                                    key={i}
                                    src={url}
                                    className={className}
                                    autoPlay
                                    muted
                                    loop
                                    controls={false}
                                ></video>
                            );
                        } else if (isPhotoUrl(url)) {
                            return (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    key={i}
                                    src={url}
                                    alt=""
                                    className={className}
                                ></img>
                            );
                        }
                    })}
                </div>
            )}
        </motion.div>
    );
};

function isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url);
}

function isPhotoUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
}

const CheckpointOverlayContent: FC<{ message: DiscordMessage }> = ({
    message,
}) => {
    const hasText = message.content.html.length > 0;
    const visibleAttachments = message.attachments.slice(0, 3);
    const hasAttachments = visibleAttachments.length > 0;

    const time = message.timestamp.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
    });

    return (
        <div className="relative size-full p-8">
            <div className="flex size-full flex-col justify-between gap-8 border border-[#0f0] bg-black p-8">
                {/* Header */}
                <div className="flex items-center justify-between gap-8">
                    <h1 className="font-pixel text-ph-yellow shrink-0 text-7xl leading-none">
                        Checkpoint! 🏁
                    </h1>
                    <div className="font-inconsolata flex min-w-0 items-center gap-4 text-4xl font-bold">
                        {message.author.avatarHash && (
                            <DiscordUserAvatar
                                userId={message.author.id}
                                displayName={message.author.name}
                                avatarHash={message.author.avatarHash}
                                size={64}
                                className="size-16 shrink-0"
                            />
                        )}
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate">
                                {message.author.name}
                            </span>
                            <span className="text-foreground/50 text-2xl font-normal">
                                {time}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Text */}
                {hasText && (
                    <div
                        className={cn(
                            "discord-text font-polysans text-3xl leading-snug",
                            hasAttachments && "line-clamp-5",
                        )}
                        dangerouslySetInnerHTML={{
                            __html: message.content.html,
                        }}
                    />
                )}

                {/* Attachments */}
                {hasAttachments && (
                    <div className="flex items-center gap-4 overflow-hidden">
                        {visibleAttachments.map((url, i) =>
                            isVideoUrl(url) ? (
                                <video
                                    key={i}
                                    src={url}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    className="max-h-full min-h-0 w-auto min-w-0 rounded object-scale-down object-top"
                                />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    key={i}
                                    src={url}
                                    className="max-h-full min-h-0 w-auto min-w-0 rounded object-scale-down object-top"
                                    alt=""
                                />
                            ),
                        )}
                    </div>
                )}

                {/* Empty div for flexbox justification */}
                {(!hasAttachments || !hasText) && <div></div>}

                {/* Lightning clock */}
                <LightningClock
                    containerProps={{
                        className:
                            "absolute right-0 bottom-0 flex gap-4 h-8 items-center px-4 text-base font-bold drop-shadow-md drop-shadow-black",
                    }}
                    lightningTimeProps={{ className: "text-foreground" }}
                />
            </div>
        </div>
    );
};
