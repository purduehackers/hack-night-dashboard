"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";

const CheckpointsStatusMessage = z.object({
    type: z.literal("checkpoints:status"),
    active: z.boolean(),
});

export default function RightPage() {
    const [checkpointsActive, setCheckpointsActive] = useState(false);
    const [listening, setListening] = useState(false);
    const checkpointsFrame = useRef<HTMLIFrameElement>(null);
    const [clicked, setClicked] = useState(false);

    useEffect(() => {
        document.addEventListener("pointerdown", () => setClicked(true));
    }, []);

    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== "https://checkpoints.purduehackers.com")
                return;
            const parseResult = CheckpointsStatusMessage.safeParse(event.data);
            if (!parseResult.success) return;
            setCheckpointsActive(parseResult.data.active);
        };

        window.addEventListener("message", onMessage);
        // Register before loading the frames so their initial status isn't missed.
        setListening(true);
        return () => window.removeEventListener("message", onMessage);
    }, []);

    return (
        <div className="fixed inset-0 bg-black">
            {!clicked && (
                <div className="fixed inset-0 z-50 bg-red-400 text-6xl text-black">
                    Click to enable audio
                </div>
            )}
            {listening && (
                <>
                    <iframe
                        ref={checkpointsFrame}
                        allow="autoplay"
                        src="https://checkpoints.purduehackers.com/host"
                        loading="eager"
                        className={`absolute inset-0 size-full border-0 ${checkpointsActive ? "visible" : "invisible"}`}
                        aria-hidden={!checkpointsActive}
                        tabIndex={checkpointsActive ? 0 : -1}
                    />
                    {!checkpointsActive && (
                        <iframe
                            allow="autoplay"
                            src="https://jukebox.purduehackers.com/display"
                            loading="eager"
                            className="absolute inset-0 size-full border-0"
                        />
                    )}
                </>
            )}
        </div>
    );
}
