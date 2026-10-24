import { getConfig } from "@/lib/config";
import { digest } from "@vercel/edge-config";
import { FC } from "react";
import { GliderFlat } from "@/components/icons";
// import { DoorbellProvider } from "@/components/doorbell/doorbell-context";
// import { DoorbellNotifier } from "@/components/doorbell/doorbell-notifier";
import { NotificationProvider } from "@/components/ui/notification-provider";
// import { ActivatePopup } from "./activate-popup";
import { DitheredSoup } from "@/components/dithered-soup";
import { Countdown } from "./countdown";
import { Coordinator } from "./coordinator";
import { SessionAnnouncer } from "./sessions";
import { LightningClock } from "./clock";
import { ScreenyNoSleepy } from "./waker";
import { DiscordFeed } from "./discord-feed";
import { ConfigRefresh } from "./config-refresh";

export const Dash: FC = async () => {
    // Read the digest before the displayed values so an edit during rendering
    // is still detected by the client's first poll.
    const hash = await digest();
    const version = await getConfig("version");

    return (
        <Coordinator>
            <ConfigRefresh hash={hash} />
            <NotificationProvider>
                {/*<ActivatePopup />*/}
                <SessionAnnouncer />
                <Countdown />
                <ScreenyNoSleepy />
                {/* Doorbell integration disabled; keep the wiring for future use. */}
                {/* <DoorbellProvider> */}
                {/* <DoorbellNotifier maintainer={maintainer} /> */}
                <div className="relative flex h-full w-full flex-row">
                    <div className="flex flex-2 flex-col">
                        <TitleSection version={version} />
                        <LightningClock
                            containerProps={{
                                className:
                                    "flex flex-row items-end justify-between gap-16 border bg-black px-16 py-12",
                            }}
                            lightningTimeProps={{
                                className:
                                    "font-whyte text-8xl font-black whitespace-nowrap italic",
                            }}
                            normalTimeProps={{
                                className: "text-4xl font-bold",
                            }}
                        />
                    </div>
                    <DiscordFeed />
                </div>
                {/* </DoorbellProvider> */}
            </NotificationProvider>
        </Coordinator>
    );
};

const TitleSection: FC<{ version: string }> = ({ version }) => {
    return (
        <div className="border-ph-purple relative flex grow items-center gap-8 border border-b-0 p-16 text-white">
            <DitheredSoup />
            <div className="z-10 grid w-full grid-cols-[auto_1fr] drop-shadow-lg drop-shadow-black">
                <div className="me-16 flex h-full items-center">
                    <GliderFlat className="mt-5 block size-54" />
                </div>
                <h1 className="font-pixel text-9xl font-normal uppercase">
                    <span>
                        <i className="me-2">H</i>ack
                    </span>
                    <br />
                    <span>
                        N<i className="relative me-3">i</i>ght
                    </span>
                </h1>
                <div className="text-ph-yellow font-inconsolata col-2 ms-4 mt-4 text-4xl font-bold">
                    v{version}
                </div>
            </div>
        </div>
    );
};
