"use client";

// Coordinator is an element that provides "global" information tracking such as
// pausing/unpausing of notifications and checkpoint announcements

import {
    createContext,
    FC,
    PropsWithChildren,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

export interface CoordinatorInfo {
    /**
     * Whether all popups (notifications, sessions, and checkpoints) are paused.
     */
    allPopupsPaused: boolean;
    /**
     * Requests that all popups be paused. Each pause request increments a
     * pause counter and thus must be met with a corresponding unpause request.
     */
    pauseAllPopups: () => void;
    /**
     * Requests that all popups be unpaused. Each unpause request decrements
     * the pause counter. All popups are unpaused when the counter hits zero.
     */
    unpauseAllPopups: () => void;

    /**
     * Whether checkpoint announcements are paused.
     */
    checkpointsPaused: boolean;
    /**
     * Requests that checkpoint announcements be paused. Each pause request
     * increments a pause counter and thus must be met with a corresponding
     * unpause request.
     */
    pauseCheckpoints: () => void;
    /**
     * Requests that checkpoint announcements be unpaused. Each unpause request
     * decrements the pause counter. Checkpoints are unpaused when the counter
     * hits zero.
     */
    unpauseCheckpoints: () => void;
}

const CoordinatorContext = createContext<CoordinatorInfo | undefined>(
    undefined,
);

export const Coordinator: FC<PropsWithChildren<unknown>> = ({ children }) => {
    const [allPopupsPauseCount, setAllPopupsPauseCount] = useState(0);
    const [checkpointsPauseCount, setCheckpointsPauseCount] = useState(0);

    const pauseAllPopups = useCallback(() => {
        setAllPopupsPauseCount((prev) => prev + 1);
    }, []);

    const unpauseAllPopups = useCallback(() => {
        setAllPopupsPauseCount((prev) => Math.max(0, prev - 1));
    }, []);

    const pauseCheckpoints = useCallback(() => {
        setCheckpointsPauseCount((prev) => prev + 1);
    }, []);

    const unpauseCheckpoints = useCallback(() => {
        setCheckpointsPauseCount((prev) => Math.max(0, prev - 1));
    }, []);

    const info: CoordinatorInfo = useMemo<CoordinatorInfo>(
        () => ({
            allPopupsPaused: allPopupsPauseCount > 0,
            pauseAllPopups,
            unpauseAllPopups,
            checkpointsPaused:
                allPopupsPauseCount > 0 || checkpointsPauseCount > 0,
            pauseCheckpoints,
            unpauseCheckpoints,
        }),
        [
            allPopupsPauseCount,
            pauseAllPopups,
            unpauseAllPopups,
            checkpointsPauseCount,
            pauseCheckpoints,
            unpauseCheckpoints,
        ],
    );
    return (
        <CoordinatorContext.Provider value={info}>
            {children}
        </CoordinatorContext.Provider>
    );
};

export function useCoordinator(): CoordinatorInfo {
    const info = useContext(CoordinatorContext);
    if (info === undefined) {
        throw new Error(
            "useCoordinator() must be called from inside a <Coordinator>",
        );
    }
    return { ...info };
}
