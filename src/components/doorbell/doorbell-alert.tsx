import { type FC, useEffect, useState } from "react";
import { ToastNotification } from "@/components/ui/toast-notification";

interface Props {
    isOpen: boolean;
    initialSecondsLeft: number;
    onClose: () => void;
}
export const DoorbellAlert: FC<Props> = ({
    isOpen,
    initialSecondsLeft,
    onClose,
}) => {
    const [secondsLeft, setSecondsLeft] = useState(initialSecondsLeft);

    useEffect(() => {
        if (!isOpen) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSecondsLeft(initialSecondsLeft);

        const timer = window.setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer);
                }
                return prev - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [isOpen, initialSecondsLeft, onClose]);

    // We need a separate effect to call onClose() because it updates the state
    // of the parent component, which can't be done from inside the callback
    // given to setSecondsLeft().
    useEffect(() => {
        if (isOpen && secondsLeft === 0) {
            onClose();
            // We must set secondsLeft to be non-zero here. Otherwise, when the
            // notification is displayed the next time, the if condition will be
            // true and the notification will self-destruct.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSecondsLeft(initialSecondsLeft);
        }
    }, [isOpen, secondsLeft, onClose, initialSecondsLeft]);

    return (
        <ToastNotification
            key="doorbell-alert"
            title="Ding dong!"
            icon="🔔"
            open={isOpen}
            duration={0}
            onOpenChange={(newOpen) => {
                if (!newOpen) onClose();
            }}
            description={`Someone is at the door    (${secondsLeft} s)`}
        />
    );
};
