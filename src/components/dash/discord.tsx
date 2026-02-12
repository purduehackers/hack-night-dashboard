import { cn } from "@/lib/utils";
import { ComponentPropsWithRef, FC } from "react";
import Image from "next/image";

interface DiscordUserProps {
    userId: string;
    displayName: string;
    avatarHash?: string | null;
}

export const DiscordUserMention: FC<
    DiscordUserProps &
        ComponentPropsWithRef<"span"> & {
            kind: "at" | "withImage" | "plain";
        }
> = ({ userId, displayName, avatarHash, kind, className, ...restProps }) => {
    return (
        <span
            {...restProps}
            className={cn(
                kind !== "plain" &&
                    "bg-discord-mention-bg text-discord-mention-fg rounded-md px-2 py-1 align-baseline",
                className,
            )}
        >
            {kind === "withImage" && (
                <DiscordUserAvatar
                    userId={userId}
                    displayName={displayName}
                    avatarHash={avatarHash}
                    size={32}
                    className="me-2 mb-1 inline-block size-[1em] align-middle"
                />
            )}
            {kind === "at" && "@"}
            {displayName}
        </span>
    );
};

export const DiscordUserAvatar: FC<
    DiscordUserProps &
        Omit<ComponentPropsWithRef<typeof Image>, "src" | "alt" | "srcSet"> & {
            size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
        }
> = ({ userId, displayName, avatarHash, size, className, ...restProps }) => {
    const sizeParam = size ? `?size=${size}` : "";
    const url = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.webp${sizeParam}`;
    return (
        <Image
            {...restProps}
            unoptimized
            src={url}
            alt={`${displayName}'s Discord avatar`}
            width={size}
            height={size}
            className={cn("rounded-full", className)}
        />
    );
};
