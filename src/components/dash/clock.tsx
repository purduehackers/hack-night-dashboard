"use client";

import { FC } from "react";
import { useLightningTimeClock } from "@purduehackers/time/react";
import { useWindowSize } from "react-use";
import ReactConfetti from "react-confetti";
import { LightningTime } from "@purduehackers/time";
import { Overlay } from "@/components/ui/overlay";
import { createPortal } from "react-dom";

enum State {
    Default,
    Announcing,
    CountingDown,
    Confetti,
}

const CONFETTI_DURATION_SECONDS = 10;

const announcementStartTime = "f~f~d|2";
const countdownStartTime = "f~f~e|b";
const midnight = "0~0~0|0";
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

    // Lightning time is lexicographically ordered, so string comparisons work
    let state: State;
    if (lightningString >= countdownStartTime) {
        state = State.CountingDown;
    } else if (lightningString >= announcementStartTime) {
        state = State.Announcing;
    } else if (lightningString < confettiStopTime) {
        state = State.Confetti;
    } else {
        state = State.Default;
    }

    return (
        <>
            <div className="border-rainbow flex items-end justify-between gap-16 border p-16">
                <div className="text-ph-yellow drop-shadow-ph-yellow font-sans text-8xl font-black whitespace-nowrap italic drop-shadow-sm">
                    {lightningString}
                </div>
                <div className="text-3xl font-bold">
                    ({formattedNormalTime})
                </div>
            </div>
            <Announcement open={state === State.Announcing} />
            {state === State.Confetti && <Confetti />}
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
        <div className="fixed inset-0 z-50">
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
