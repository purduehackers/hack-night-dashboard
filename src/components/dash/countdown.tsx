"use client";

import { FC, useEffect } from "react";
import { useWindowSize } from "react-use";
import ReactConfetti from "react-confetti";
import { useLightningTimeClock } from "@purduehackers/time/react";
import { LightningTime } from "@purduehackers/time";
import { Overlay } from "@/components/ui/overlay";
import { createPortal } from "react-dom";
import { useCoordinator } from "@/components/dash/coordinator";
import { LightningClock } from "./clock";
import { useSound } from "@/lib/sound";

const CONFETTI_DURATION_SECONDS = 10;

const announcementStartTime = "f~f~8|8"; // 23:57:30
const clockSoundStartTime = "f~f~d|2"; // 23:59
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

export const Countdown: FC = () => {
    const { lightningString } = useLightningTimeClock();
    const { pauseNotifications, unpauseNotifications } = useCoordinator();
    const { play, pause } = useSound("/clock.mp3", { loop: true });

    // Lightning time is lexicographically ordered, so string comparisons work

    // Yes, OR is correct here, not AND, since the time wraps around
    const isCountdown =
        lightningString >= countdownStartTime ||
        lightningString < countdownEndTime;

    const isAnnouncing =
        lightningString >= announcementStartTime &&
        lightningString < countdownStartTime;

    const isSoundPlaying =
        lightningString >= clockSoundStartTime &&
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

    // Play audio when it's time
    useEffect(() => {
        if (isSoundPlaying) {
            play();
        } else {
            pause();
        }
    }, [isSoundPlaying, play, pause]);

    const content = (
        <>
            <Announcement open={isAnnouncing} />
            <CountdownClock open={isCountdown} />
            {isConfetti && <Confetti />}
        </>
    );
    return typeof document !== "undefined"
        ? createPortal(content, document.body)
        : content;
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
                // Use easeOut so confetti starts strong then gradually fades away
                tweenFunction={easeOutQuad}
            />
        </div>
    );
    return typeof document !== "undefined"
        ? createPortal(element, document.body)
        : element;
};

const Announcement: FC<{ open: boolean }> = ({ open }) => {
    return (
        // #fb2c36 = red-500
        <Overlay open={open} color="#fb2c36">
            <div className="text-foreground relative flex size-full h-full flex-col items-center justify-evenly px-16 py-8 text-center">
                <h1 className="font-silkscreen text-9xl leading-tight tracking-tighter drop-shadow-lg drop-shadow-black">
                    Countdown time!
                </h1>
                <LightningClock
                    containerProps={{
                        className:
                            "font-bold drop-shadow-sm drop-shadow-black flex items-center gap-8",
                    }}
                    lightningTimeProps={{
                        className: "text-foreground text-5xl",
                    }}
                    normalTimeProps={{ className: "text-3xl" }}
                />
            </div>
        </Overlay>
    );
};

const CountdownClock: FC<{ open: boolean }> = ({ open }) => {
    return (
        <Overlay open={open}>
            <div className="relative flex size-full items-center justify-center">
                <LightningClock
                    containerProps={{
                        className: "border-5 bg-black p-32 text-center",
                    }}
                    lightningTimeProps={{
                        className: "font-whyte text-9xl font-black italic",
                    }}
                    normalTimeProps={{ className: "mt-8 text-4xl" }}
                />
            </div>
        </Overlay>
    );
};
