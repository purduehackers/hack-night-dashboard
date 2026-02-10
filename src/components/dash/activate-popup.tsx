"use client";

import { FC, useState } from "react";
import { PowerIcon } from "lucide-react";
import { PopupDialog } from "../ui/popup-dialog";

export const ActivatePopup: FC = () => {
    const [isOpen, setIsOpen] = useState(true);

    return isOpen ? (
        <PopupDialog
            open={isOpen}
            onClose={() => setIsOpen(false)}
            title={
                <>
                    <PowerIcon className="me-4 mb-1 inline size-4" />
                    Activate dashboard
                </>
            }
            action="Activate"
        >
            <div className="*:not-first:mt-4">
                <p>
                    The browser won&apos;t play audio until you&apos;ve
                    interacted with the page.
                </p>
                <p>Dismiss this popup to enable doorbell audio!</p>
            </div>
        </PopupDialog>
    ) : null;
};
