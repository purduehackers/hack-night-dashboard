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

    const ws = useRef<ReconnectingWebSocket | null>(null);

    useEffect(() => {
        ws.current = new ReconnectingWebSocket(
            "wss://api.purduehackers.com/doorbell",
        );

        ws.current.onopen = () => setConnectionState(ConnectionState.Connected);
        ws.current.onclose = () => {
            setConnectionState(ConnectionState.Connecting);
        };
        ws.current.onerror = () => {
            setConnectionState(ConnectionState.Error);
        };
        ws.current.onmessage = (e) => {
            const json = JSON.parse(String(e.data));
            const message = messageSchema.parse(json);
            setDoorbellStateInternal(message.ringing);
        };

        return () => {
            ws.current?.close();
        };
    }, []);

    const setDoorbellState = (state: boolean) => {
        setDoorbellStateInternal(state);

        if (!ws.current) return;

        const message: Message = { type: "set", ringing: state };
        ws.current.send(JSON.stringify(message));
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
