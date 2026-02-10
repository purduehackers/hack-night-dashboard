"use client";

// Coordinator is an element that provides "global" information tracking such as
// pausing/unpausing of notifications

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
     * Whether notifications are paused.
     */
    notificationsPaused: boolean;
    /**
     * Requests that notifications be paused. Each pause request increments a
     * pause counter and thus must be met with a corresponding unpause request.
     */
    pauseNotifications: () => void;
    /**
     * Requests that notifications be unpaused. Each unpause request decrements
     * the pause counter. Notifications are unpaused when the counter hits zero.
     */
    unpauseNotifications: () => void;
}

const CoordinatorContext = createContext<CoordinatorInfo | undefined>(
    undefined,
);

export const Coordinator: FC<PropsWithChildren<unknown>> = ({ children }) => {
    const [pauseCount, setPauseCount] = useState(0);

    const pauseNotifications = useCallback(() => {
        setPauseCount((prev) => prev + 1);
    }, []);

    const unpauseNotifications = useCallback(() => {
        setPauseCount((prev) => Math.max(0, prev - 1));
    }, []);

    const info: CoordinatorInfo = useMemo<CoordinatorInfo>(
        () => ({
            notificationsPaused: pauseCount > 0,
            pauseNotifications,
            unpauseNotifications,
        }),
        [pauseCount, pauseNotifications, unpauseNotifications],
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
