"use client";

import {
    createContext,
    FC,
    PropsWithChildren,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

export enum ConnectionState {
    Connecting,
    Connected,
    Error,
}

interface DoorbellContextInterface {
    doorbellState: boolean;
    connectionState: ConnectionState;
    setDoorbellState: (status: boolean) => void;
}

const messageSchema = z.object({
    type: z.enum(["set", "status"]),
    ringing: z.boolean(),
});
type Message = z.infer<typeof messageSchema>;

const DoorbellContext = createContext<DoorbellContextInterface | undefined>(
    undefined,
);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const DoorbellProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
    const [doorbellState, setDoorbellStateInternal] = useState<boolean>(false);
    const [connectionState, setConnectionState] = useState<ConnectionState>(
        ConnectionState.Connecting,
    );

    const WS_URL = "wss://api.purduehackers.com/doorbell";
    const ws = useRef<ReconnectingWebSocket | null>(null);

    useEffect(() => {
        // Create websocket and attach lightweight Sentry instrumentation:
        // - breadcrumbs for lifecycle events
        // - spans for handling messages
        // - scoped tags/extras when capturing exceptions
        ws.current = new ReconnectingWebSocket(WS_URL);

        ws.current.onopen = () => {
            Sentry.addBreadcrumb({
                category: "doorbell.websocket",
                message: "WebSocket opened",
                data: { url: WS_URL },
            });
            setConnectionState(ConnectionState.Connected);
        };

        ws.current.onclose = () => {
            Sentry.addBreadcrumb({
                category: "doorbell.websocket",
                message: "WebSocket closed",
                data: { url: WS_URL },
            });
            setConnectionState(ConnectionState.Connecting);
        };

        ws.current.onerror = (error) => {
            Sentry.captureException(error, {
                tags: { url: WS_URL },
            });
            setConnectionState(ConnectionState.Error);
        };

        ws.current.onmessage = (e) => {
            try {
                const json = JSON.parse(String(e.data));
                const message = messageSchema.parse(json);
                setDoorbellStateInternal(message.ringing);
            } catch (error) {
                Sentry.captureException(error, {
                    tags: { url: WS_URL },
                    extra: { message: e.data },
                });
            }
        };

        return () => {
            ws.current?.close();
        };
    }, []);

    const setDoorbellState = (state: boolean) => {
        setDoorbellStateInternal(state);

        if (!ws.current) return;

        const message: Message = { type: "set", ringing: state };
        try {
            ws.current.send(JSON.stringify(message));
        } catch (error) {
            Sentry.captureException(error, {
                tags: { url: WS_URL },
                extra: { message },
            });
        }
    };

    return (
        <DoorbellContext
            value={{
                doorbellState,
                connectionState,
                setDoorbellState,
            }}
        >
            {children}
        </DoorbellContext>
    );
};

export const useDoorbell = () => {
    const context = useContext(DoorbellContext);

    if (context === undefined) {
        throw new Error("useDoorbell must be used within a DoorbellProvider");
    }

    return {
        ringing: context.doorbellState,
        setRinging: context.setDoorbellState,
        connectionState: context.connectionState,
    };
};
