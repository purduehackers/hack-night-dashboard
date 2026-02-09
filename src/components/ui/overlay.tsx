"use client";

import { AnimatePresence, HTMLMotionProps } from "motion/react";
import { FC, PropsWithChildren } from "react";
import { motion } from "motion/react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { DitheredSoup } from "@/components/dithered-soup";

// Defines reüsable animations for the overlay
const animations = {
    fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
} as const satisfies Readonly<Record<string, HTMLMotionProps<"div">>>;
type Animation = keyof typeof animations;

interface Props {
    open: boolean;
    animation?: Animation;
    className?: string;
    color?: string;
}
export const Overlay: FC<PropsWithChildren<Props>> = ({
    open,
    className,
    animation = "fade",
    color = "#7e3cff",
    children,
}) => {
    const overlayElement = (
        <AnimatePresence>
            {open && (
                <motion.div
                    className={cn("fixed inset-0 z-40 bg-black p-8", className)}
                    {...animations[animation]}
                >
                    <div
                        className="relative size-full border"
                        style={{ borderColor: color }}
                    >
                        <DitheredSoup fgColor={color} />
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (typeof document !== "undefined") {
        return createPortal(overlayElement, document.body);
    } else {
        return overlayElement;
    }
};
