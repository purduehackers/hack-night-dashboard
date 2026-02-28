"use client";

import "./discord.css";
import { FC, useEffect, useRef, useState } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { addBreadcrumb, captureException } from "@sentry/nextjs";
import z from "zod";
import { DiscordUserMention } from "@/components/ui/discord";
import { motion } from "motion/react";

const DISCORD_FEED_WS_URL =
    process.env.DISCORD_FEED_WS_URL ??
    "wss://api.purduehackers.com/discord/dashboard";

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
    const [messages, setMessages] = useState<DiscordMessage[]>([]);
    const wsRef = useRef<ReconnectingWebSocket>(null);

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
                setMessages((prev) => [message, ...prev]);
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

    return messages.length > 0 ? (
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
                    .filter((message) => message.content.html.length > 0)
                    .map((message) => (
                        <DiscordMessage key={message.id} message={message} />
                    ))}
            </div>
        </div>
    ) : (
        <div className="text-center text-2xl">Start chatting in Discord!</div>
    );
};

const DiscordMessage: FC<{ message: DiscordMessage }> = ({ message }) => {
    const time = message.timestamp.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: undefined,
    });
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
                <div className="text-foreground/70 ms-4 grow text-right font-normal">
                    {time}
                </div>
            </div>
            <div
                className="discord-text font-polysans line-clamp-3 text-2xl leading-tight text-ellipsis"
                dangerouslySetInnerHTML={{ __html: message.content.html }}
            />
        </motion.div>
    );
};
