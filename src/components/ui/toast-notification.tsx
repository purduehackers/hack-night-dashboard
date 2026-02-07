import { ComponentPropsWithoutRef, FC, ReactNode } from "react";
import * as Toast from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

const defaultClasses = [
    "border-ph-yellow bg-background text-foreground border p-4 w-sm pointer-events-auto",
    "data-[state=closed]:animate-[slideOutToRight_200ms_ease-in]",
    "data-[state=open]:animate-[slideInFromRight_200ms_ease-out] ",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
    "data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform data-[swipe=cancel]:duration-200 data-[swipe=cancel]:ease-out",
    "data-[swipe=end]:animate-[slideRightFromEnd_100ms_ease-out]",
];

type ToastRootProps = Exclude<
    ComponentPropsWithoutRef<typeof Toast.Root>,
    "children"
>;
interface Props extends ToastRootProps {
    title: string;
    description?: string;
    icon?: ReactNode;
}
export const ToastNotification: FC<Props> = ({
    title,
    description,
    icon,
    className,
    ...props
}) => {
    return (
        <Toast.Root {...props} className={cn(...defaultClasses, className)}>
            <div className="mb-2 flex flex-row items-start justify-between gap-8">
                <Toast.Title className="font-bold">
                    {icon && <span className="me-2">{icon}</span>}
                    <span>{title}</span>
                </Toast.Title>
                <Toast.Close
                    aria-label="Close"
                    className="cursor-pointer px-2 hover:underline"
                >
                    <span aria-hidden>X</span>
                </Toast.Close>
            </div>
            <Toast.Description>{description}</Toast.Description>
        </Toast.Root>
    );
};
