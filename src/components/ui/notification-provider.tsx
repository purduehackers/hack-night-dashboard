import { FC, PropsWithChildren } from "react";
import { Provider, Viewport } from "@radix-ui/react-toast";

export const NotificationProvider: FC<PropsWithChildren> = ({ children }) => (
    <Provider swipeDirection="right" duration={0}>
        {children}
        <Viewport className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end gap-4 overflow-clip p-4" />
    </Provider>
);
