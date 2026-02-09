"use client";

import { FC } from "react";
import { useLightningTimeClock } from "@purduehackers/time/react";
import { useWindowSize } from "react-use";
import ReactConfetti from "react-confetti";
import { LightningTime } from "@purduehackers/time";

enum State {
    Default,
    CountingDown,
    Confetti,
}

const CONFETTI_DURATION_SECONDS = 10;

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
    return (
        <div className="fixed inset-0">
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
};
