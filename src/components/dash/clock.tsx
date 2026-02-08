"use client";

import { FC } from "react";
import { useLightningTimeClock } from "@purduehackers/time/react";

export const LightningClock: FC = () => {
    const { lightningString, formattedNormalTime } = useLightningTimeClock();
    return (
        <div className="border-rainbow flex items-end justify-between gap-16 border p-16">
            <div className="text-ph-yellow drop-shadow-ph-yellow font-sans text-8xl font-black whitespace-nowrap italic drop-shadow-sm">
                {lightningString}
            </div>
            <div className="text-3xl font-bold">({formattedNormalTime})</div>
        </div>
    );
};
