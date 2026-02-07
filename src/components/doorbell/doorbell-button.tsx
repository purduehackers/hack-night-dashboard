"use client";

import { FC, useEffect } from "react";
import { ConnectionState, useDoorbell } from "./doorbell-context";
import { cn } from "@/lib/utils";
import useSound from "use-sound";

export const DoorbellButton: FC = () => {
    const { ringing, setRinging, connectionState } = useDoorbell();
    const [playSound] = useSound("/doorbell.mp3");

    useEffect(() => {
        if (ringing) {
            playSound();
        }
    }, [ringing, playSound]);

    return (
        <button
            className={cn(
                "border-ph-yellow block aspect-square cursor-pointer border p-8 text-9xl transition-colors duration-200 ease-out disabled:cursor-not-allowed sm:p-12 sm:text-[15rem]",
                ringing
                    ? "bg-ph-amber"
                    : "bg-black hover:bg-[color-mix(in_oklch,var(--color-amber-200)_30%,black_70%)]",
                !ringing && "disabled:opacity-50",
            )}
            onClick={() => {
                console.log("click");
                setRinging(true);
            }}
            disabled={connectionState !== ConnectionState.Connected || ringing}
        >
            🔔
        </button>
    );
};
