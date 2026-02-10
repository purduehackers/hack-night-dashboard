import { FC, PropsWithChildren, ReactNode, useCallback } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { AnimatePresence, motion } from "motion/react";

interface Props {
    open: boolean;
    onClose: () => void;
    /**
     * Content to render as popup title
     */
    title: ReactNode;
    /**
     * Content to render as action button
     */
    action?: ReactNode;
}
export const PopupDialog: FC<PropsWithChildren<Props>> = ({
    title,
    action,
    children,
    open,
    onClose,
}) => {
    const onOpenChange = useCallback(
        (newOpen: boolean) => {
            if (!newOpen) {
                onClose();
            }
        },
        [onClose],
    );
    return (
        <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
            <AnimatePresence>
                {open && (
                    <AlertDialog.Portal forceMount>
                        <AlertDialog.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[60] bg-black/50"
                            />
                        </AlertDialog.Overlay>
                        <AlertDialog.Content asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="border-ph-yellow bg-background absolute top-1/2 left-1/2 z-[65] max-w-xl min-w-md -translate-1/2 border p-8 text-lg shadow-lg shadow-black"
                            >
                                <AlertDialog.Title className="mb-4 text-2xl font-bold">
                                    {title}
                                </AlertDialog.Title>
                                <AlertDialog.Description asChild>
                                    <div>{children}</div>
                                </AlertDialog.Description>
                                {action !== undefined && (
                                    <div className="mt-4 flex justify-end gap-4">
                                        <AlertDialog.Action className="cursor-pointer font-bold hover:underline">
                                            {action}
                                        </AlertDialog.Action>
                                    </div>
                                )}
                            </motion.div>
                        </AlertDialog.Content>
                    </AlertDialog.Portal>
                )}
            </AnimatePresence>
        </AlertDialog.Root>
    );
};
