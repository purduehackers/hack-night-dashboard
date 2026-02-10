import { type FC, useEffect, useState } from "react";
import { PopupDialog } from "../ui/popup-dialog";

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
        <PopupDialog
            open={isOpen}
            onClose={onClose}
            title={<span>🔔 Ding dong!</span>}
            action={<span>Ok ({secondsLeft} s)</span>}
        >
            <p>Someone is at the door!</p>
        </PopupDialog>
    );
};
