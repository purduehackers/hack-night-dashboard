"use client";

import { FC, useState } from "react";
import { ToastNotification } from "@/components/ui/toast-notification";
import { PowerIcon } from "lucide-react";

export const ActivateNotification: FC = () => {
    const [isOpen, setIsOpen] = useState(true);

    return isOpen ? (
        <ToastNotification
            key="activate-dash"
            open={isOpen}
            onOpenChange={setIsOpen}
            title="Activate dashboard"
            description="Dismiss this notification to enable doorbell audio"
            icon={<PowerIcon className="mb-1 inline size-4" />}
            duration={31556952000} // 1 year
        ></ToastNotification>
    ) : null;
};
