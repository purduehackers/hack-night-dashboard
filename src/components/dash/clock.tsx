"use client";

import { FC, useEffect } from "react";
import { useLightningTimeClock } from "@purduehackers/time/react";
import { useWindowSize } from "react-use";
import ReactConfetti from "react-confetti";
import { LightningTime } from "@purduehackers/time";
import { Overlay } from "@/components/ui/overlay";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useCoordinator } from "@/components/dash/coordinator";

const CONFETTI_DURATION_SECONDS = 10;

const announcementStartTime = "f~f~d|1";
const countdownStartTime = "f~f~e|b";
const midnight = "0~0~0|0";
const countdownEndTime = "0~0~0|2";
// Calculate the stop time as the confetti duration plus 5 seconds to allow all
// of it to fall off the screen.
const confettiStopTime = ((): string => {
    const lt = new LightningTime();
    const date = lt.convertFromLightning(midnight);
    date.setTime(date.getTime() + (CONFETTI_DURATION_SECONDS + 5) * 1000);
    return lt.convertToLightning(date).lightningString;
})();

export const LightningClock: FC = () => {
    const { lightningString, formattedNormalTime } = useLightningTimeClock();
    const { pauseNotifications, unpauseNotifications } = useCoordinator();

    // Lightning time is lexicographically ordered, so string comparisons work

    // Yes, OR is correct here, not AND, since the time wraps around
    const isCountdown =
        lightningString > countdownStartTime ||
        lightningString < countdownEndTime;

    const isAnnouncing =
        lightningString >= announcementStartTime &&
        lightningString < countdownStartTime;

    const isConfetti = lightningString < confettiStopTime;

    // Pause notifications when entering countdown, and unpause when exiting.
    // Runs on mount as well, so mounting during countdown applies the pause.
    useEffect(() => {
        if (isCountdown) {
            pauseNotifications();
        } else {
            unpauseNotifications();
        }
    }, [isCountdown, pauseNotifications, unpauseNotifications]);

    return (
        <>
            <motion.div
                layout
                animate={{ transition: { duration: 2 } }}
                className={cn(
                    "border-rainbow flex gap-16 border bg-black p-16",
                    isCountdown
                        ? "flex-col items-center justify-center *:scale-150"
                        : "flex-row items-end justify-between",
                    isCountdown && "fixed inset-8 z-40",
                )}
            >
                <div className="text-ph-yellow font-sans text-8xl font-black whitespace-nowrap italic">
                    {lightningString}
                </div>
                <div className="text-3xl font-bold">
                    ({formattedNormalTime})
                </div>
            </motion.div>
            <Announcement open={isAnnouncing} />
            {isConfetti && <Confetti />}
        </>
    );
};

// From <https://github.com/chenglou/tween-functions>.
// Copyright © 2001 Robert Penner
// All rights reserved.
// BSD license. See LICENSE.txt at the link above.
function easeOutQuad(t: number, b: number, _c: number, d: number) {
    const c = _c - b;
    return -c * (t /= d) * (t - 2) + b;
}

const Confetti: FC = () => {
    const { width, height } = useWindowSize();
    const element = (
        <div className="pointer-events-none fixed inset-0 z-50">
            <ReactConfetti
                width={width}
                height={height}
                recycle={false} // Stop once all pieces are dropped
                numberOfPieces={60 * CONFETTI_DURATION_SECONDS}
                tweenDuration={CONFETTI_DURATION_SECONDS * 1000} // Time over which to drop confetti
                tweenFunction={easeOutQuad}
            />
        </div>
    );
    return typeof document !== "undefined"
        ? createPortal(element, document.body)
        : element;
};

const Announcement: FC<{ open: boolean }> = ({ open }) => {
    const { lightningString, formattedNormalTime } = useLightningTimeClock();

    return (
        // #fb2c36 = red-500
        <Overlay open={open} color="#fb2c36">
            <div className="text-foreground relative flex size-full h-full flex-col items-center justify-evenly px-16 py-8 text-center">
                <h1 className="font-silkscreen text-9xl leading-tight tracking-tighter drop-shadow-lg drop-shadow-black">
                    Countdown time!
                </h1>
                <div className="font-bold drop-shadow-sm drop-shadow-black">
                    <span className="text-4xl">{lightningString}</span>
                    <span className="ms-8 text-2xl">
                        ({formattedNormalTime})
                    </span>
                </div>
            </div>
        </Overlay>
    );
};
