import { useState } from "react";
import type { DiscordEmbed } from "@/lib/discord-embed";
import { cn } from "@/lib/utils";

function EmbedCard({
    embed,
    featured,
}: {
    embed: DiscordEmbed;
    featured: boolean;
}) {
    const [failedMedia, setFailedMedia] = useState<ReadonlySet<string>>(
        () => new Set(),
    );
    const markFailed = (url: string) =>
        setFailedMedia((failed) => new Set(failed).add(url));
    const image = [
        embed.image?.proxy_url,
        embed.image?.url,
        embed.thumbnail?.proxy_url,
        embed.thumbnail?.url,
        embed.type === "image" ? embed.url : undefined,
    ].find((url) => url && !failedMedia.has(url));
    // Player pages (e.g. YouTube) have a thumbnail but aren't video files.
    const directVideo =
        embed.type === "gifv" ||
        embed.video?.content_type?.startsWith("video/") ||
        /\.(mp4|webm|mov|ogv)(?:[?#]|$)/i.test(embed.video?.url ?? "")
            ? embed.video?.url
            : undefined;
    const video = [embed.video?.proxy_url, directVideo].find(
        (url) => url && !failedMedia.has(url),
    );
    const heading = embed.title ?? embed.author?.name;
    const footer = embed.footer?.text ?? embed.provider?.name;
    const hasText = Boolean(
        heading || embed.description || embed.fields?.length || footer,
    );
    const hasMedia = Boolean(video || image);
    if (!hasText && !hasMedia && !embed.url) return null;

    const Card = embed.url ? "a" : "div";
    const mediaClassName = cn(
        "min-h-0 max-w-full rounded object-contain",
        featured ? "max-h-[42dvh]" : "max-h-32",
    );
    return (
        <Card
            href={embed.url}
            className={cn(
                "border-ph-purple grid min-h-0 min-w-0 gap-2 overflow-hidden rounded-sm border-l-4 bg-white/10 p-3 leading-tight",
                featured ? "text-3xl" : "text-lg",
                featured &&
                    hasText &&
                    hasMedia &&
                    "grid-cols-2 items-center gap-5 p-5",
            )}
            style={
                embed.color === undefined
                    ? undefined
                    : {
                          borderColor: `#${embed.color.toString(16).padStart(6, "0")}`,
                      }
            }
        >
            {(hasText || !hasMedia) && (
                <div className="min-w-0 space-y-1 overflow-hidden [overflow-wrap:anywhere]">
                    {embed.title && embed.author?.name && (
                        <p className="text-ph-pink truncate">
                            {embed.author.name}
                        </p>
                    )}
                    {heading && (
                        <p className="text-ph-pink line-clamp-2 font-bold">
                            {heading}
                        </p>
                    )}
                    {embed.description && (
                        <p
                            className={cn(
                                "font-polysans whitespace-pre-line",
                                featured ? "line-clamp-6" : "line-clamp-3",
                            )}
                        >
                            {embed.description}
                        </p>
                    )}
                    {embed.fields?.map((field, index) => (
                        <div key={index} className="line-clamp-2">
                            <strong>{field.name}</strong> {field.value}
                        </div>
                    ))}
                    {footer && (
                        <p className="text-foreground/70 truncate text-[0.8em]">
                            {footer}
                        </p>
                    )}
                    {!hasText && embed.url && (
                        <p className="text-ph-pink truncate">{embed.url}</p>
                    )}
                </div>
            )}
            {video ? (
                <video
                    src={video}
                    poster={image}
                    aria-label={
                        embed.video?.description ??
                        heading ??
                        "Discord video preview"
                    }
                    autoPlay
                    muted
                    loop
                    playsInline
                    className={mediaClassName}
                    onError={() => markFailed(video)}
                />
            ) : (
                image && (
                    // eslint-disable-next-line @next/next/no-img-element -- Discord supplies external media URLs at runtime.
                    <img
                        src={image}
                        alt={
                            embed.image?.description ??
                            embed.thumbnail?.description ??
                            `${heading ?? footer ?? "Discord"} preview`
                        }
                        className={mediaClassName}
                        onError={() => markFailed(image)}
                    />
                )
            )}
        </Card>
    );
}

export function DiscordEmbeds({
    embeds,
    featured = false,
}: {
    embeds: DiscordEmbed[];
    featured?: boolean;
}) {
    if (!embeds.length) return null;
    return (
        <div
            className={cn(
                "grid min-h-0 gap-2 overflow-hidden",
                featured
                    ? "grid-cols-[repeat(auto-fit,minmax(min(24rem,100%),1fr))]"
                    : "mt-2",
            )}
        >
            {embeds.map((embed, index) => (
                <EmbedCard
                    key={`${embed.url ?? embed.title ?? "embed"}-${index}`}
                    embed={embed}
                    featured={featured}
                />
            ))}
        </div>
    );
}
