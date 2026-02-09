"use client";

import { DitheredSoup } from "@/components/dithered-soup";
import { DoorbellButton } from "@/components/doorbell/doorbell-button";
import {
    ConnectionState,
    useDoorbell,
} from "@/components/doorbell/doorbell-context";

interface Props {
    maintainer: string;
}
export default function DoorbellPageContent({ maintainer }: Props) {
    const { connectionState } = useDoorbell();

    let title: string;
    switch (connectionState) {
        case ConnectionState.Connected:
            title = "Ring the doorbell";
            break;
        case ConnectionState.Connecting:
            title = "Connecting...";
            break;
        case ConnectionState.Error:
            title = "Error connecting";
            break;
    }
    const isError = connectionState === ConnectionState.Error;

    return (
        <div className="border-ph-purple relative size-full border">
            <DitheredSoup />
            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-16 p-4 sm:p-16 md:justify-evenly">
                <h1 className="font-silkscreen text-center text-5xl drop-shadow-lg drop-shadow-black sm:text-8xl">
                    {title}
                </h1>
                {isError ? (
                    <div className="max-w-xl border border-red-500 bg-black p-8 text-lg *:not-first:mt-4">
                        <p>
                            An error occurred while connecting to the doorbell.
                        </p>
                        <p>
                            Please reload the page and try again. If the issue
                            persists, contact {maintainer}.
                        </p>
                        <p>
                            In the meantime, send a message in the Purdue
                            Hackers Discord server so someone can let you in.
                        </p>
                    </div>
                ) : (
                    <DoorbellButton />
                )}
            </div>
        </div>
    );
}
