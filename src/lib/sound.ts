import { useCallback, useEffect, useRef } from "react";

interface UseSoundOptions {
    /**
     * If true, loops repeatedly until paused. Defaults to false.
     */
    loop?: boolean;
    /**
     * If true, the returned play() method rewinds to the start of the audio
     * source before playing.
     * Defaults to true.
     */
    rewind?: boolean;
}

export function useSound(src: string, opts: UseSoundOptions = {}) {
    const { loop = false, rewind = true } = opts;

    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = new Audio(src);
        console.log("audio", audio);
        audio.loop = loop;

        audioRef.current = audio;
        return () => audio.pause();
    }, [src, loop]);

    return {
        play: useCallback(async () => {
            if (rewind && audioRef.current) {
                audioRef.current.currentTime = 0;
            }
            return audioRef.current?.play();
        }, [rewind]),
        pause: useCallback(async () => audioRef.current?.pause(), []),
    };
}
