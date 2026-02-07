"use client";

import { FC, ReactNode, useEffect, useState } from "react";
import * as Toast from "@radix-ui/react-toast";
import {
    useDoorbell,
    ConnectionState,
} from "@/components/doorbell/doorbell-context";
import { ToastNotification } from "@/components/ui/toast-notification";
import { Spinner } from "@/components/ui/spinner";
import useSound from "use-sound";
import { DoorbellAlert } from "./doorbell-alert";

const DEBOUNCE_SECONDS = 20;

interface DoorbellNotifierProps {
    maintainer: string;
}
export const DoorbellNotifier: FC<DoorbellNotifierProps> = ({ maintainer }) => {
    const { ringing, connectionState, setRinging } = useDoorbell();
    // Controls the visibility of the doorbell connection notification
    const [notificationVisible, setNotificationVisible] = useState(false);
    // I don't know why we use 0.85, but that's what the old dashboard used
    const [playSound] = useSound("/doorbell.mp3", { volume: 0.85 });
    // Controls the visibility of the doorbell alert
    const [alertOpen, setAlertOpen] = useState(false);
    // True if in the debounce period
    const [debounce, setDebounce] = useState(false);

    function dismissDoorbell() {
        setDebounce(false);
        setAlertOpen(false);
        setRinging(false);
    }

    // Display the notification whenever the connection state changes. The
    // content of the notification already depends on the connection state, so
    // all we need to do is set it to be visible.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNotificationVisible(true);
    }, [connectionState]);

    // When someone rings the doorbell,
    // 1. play the sound
    // 2. show an alert that disappears in 20 seconds
    useEffect(() => {
        if (ringing && !debounce) {
            playSound();
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDebounce(true);
            setAlertOpen(true);
        }
    }, [ringing, playSound, debounce]);

    let notification: {
        title: string;
        description: string;
        durationMs?: number;
        icon?: ReactNode;
    };
    switch (connectionState) {
        case ConnectionState.Connecting:
            notification = {
                title: "Doorbell connecting...",
                description: "Wiring up the doorbell",
                icon: <Spinner />,
            };
            break;
        case ConnectionState.Connected:
            notification = {
                title: "Doorbell connected",
                description: "Ready to ring!",
                durationMs: 5000,
                icon: "🔔",
            };
            break;
        case ConnectionState.Error:
            notification = {
                title: "Error connecting to doorbell",
                description: `Something went wrong. Please let ${maintainer} know.`,
                icon: "⚠️",
            };
            break;
    }

    return (
        <Toast.Provider swipeDirection="right" duration={0}>
            <ToastNotification
                open={notificationVisible}
                onOpenChange={setNotificationVisible}
                type="background"
                title={notification.title}
                description={notification.description}
                duration={notification.durationMs}
                icon={notification.icon}
            />
            <DoorbellAlert
                isOpen={alertOpen}
                initialSecondsLeft={DEBOUNCE_SECONDS}
                onClose={dismissDoorbell}
            />
            <Toast.Viewport className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end gap-4 overflow-clip p-4" />
        </Toast.Provider>
    );
};
