"use client";

import {
    createContext,
    FC,
    PropsWithChildren,
    useCallback,
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
    diagnostic: Diagnostic | null;
    clearDiagnostic: () => void;
}

const messageSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.enum(["set", "status"]),
        ringing: z.boolean(),
    }),
    z.object({
        type: z.enum(["ping", "pong"]),
    }),
    z.object({
        type: z.literal("diagnostic"),
        level: z.enum(["info", "warning", "error"]),
        kind: z.string(),
        message: z.string(),
    }),
]);
type Message = z.infer<typeof messageSchema>;
type Diagnostic = Extract<Message, { type: "diagnostic" }>;

const DoorbellContext = createContext<DoorbellContextInterface | undefined>(
    undefined,
);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const DoorbellProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
    const [doorbellState, setDoorbellStateInternal] = useState<boolean>(false);
    const [connectionState, setConnectionState] = useState<ConnectionState>(
        ConnectionState.Connecting,
    );
    const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);

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

        ws.current.onclose = (ev) => {
            Sentry.addBreadcrumb({
                category: "doorbell.websocket",
                message: "WebSocket closed",
                data: {
                    url: WS_URL,
                    info: {
                        code: ev.code,
                        reason: ev.reason,
                        wasClean: ev.wasClean,
                    },
                },
            });
            setConnectionState(ConnectionState.Connecting);
        };

        ws.current.onerror = (error) => {
            Sentry.captureException(error.error, {
                tags: { url: WS_URL },
            });
            setConnectionState(ConnectionState.Error);
        };

        ws.current.onmessage = (e) => {
            try {
                const json = JSON.parse(String(e.data));
                const message = messageSchema.parse(json);
                if (message.type === "status") {
                    setDoorbellStateInternal(message.ringing);
                } else if (message.type === "diagnostic") {
                    setDiagnostic(message);
                }
            } catch (error) {
                Sentry.captureException(error, {
                    tags: { url: WS_URL },
                    extra: { message: e.data },
                });
            }
        };

        // Periodically send pings to prevent timeouts
        const timer = window.setInterval(() => {
            ws.current?.send(
                JSON.stringify({ type: "ping" } satisfies Message),
            );
        }, 20000 /* 20 seconds */);

        return () => {
            ws.current?.close();
            window.clearInterval(timer);
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

    const clearDiagnostic = useCallback(() => {
        setDiagnostic(null);
    }, []);

    return (
        <DoorbellContext
            value={{
                doorbellState,
                connectionState,
                setDoorbellState,
                diagnostic,
                clearDiagnostic,
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
        ...context,
    };
};
