import { getConfigs } from "@/lib/config";
import { FC } from "react";
import { GliderFlat } from "@/components/icons";
import { DoorbellProvider } from "@/components/doorbell/doorbell-context";
import { DoorbellNotifier } from "@/components/doorbell/doorbell-notifier";
import { NotificationProvider } from "@/components/ui/notification-provider";
import { ActivatePopup } from "./activate-popup";
import { DitheredSoup } from "@/components/dithered-soup";
import { Countdown } from "./countdown";
import { Coordinator } from "./coordinator";
import { SessionAnnouncer } from "./sessions";
import { LightningClock } from "./clock";
import { ScreenyNoSleepy } from "./waker";
import { DiscordFeed } from "./discord-feed";

const { version, maintainer } = await getConfigs("version", "maintainer");

export const Dash: FC = () => (
    <Coordinator>
        <NotificationProvider>
            <ActivatePopup />
            <SessionAnnouncer />
            <Countdown />
            <ScreenyNoSleepy />
            <DoorbellProvider>
                <DoorbellNotifier maintainer={maintainer} />
                <div className="relative flex h-full w-full flex-row">
                    <div className="flex flex-3 flex-col">
                        <TitleSection />
                        <LightningClock
                            containerProps={{
                                className:
                                    "flex flex-row items-end justify-between gap-16 border bg-black p-16",
                            }}
                            lightningTimeProps={{
                                className:
                                    "text-ph-yellow font-whyte text-8xl font-black whitespace-nowrap italic",
                            }}
                            normalTimeProps={{
                                className: "text-3xl font-bold",
                            }}
                        />
                    </div>
                    <div className="border-ph-purple relative flex-1 overflow-hidden border border-l-0 p-8">
                        <DiscordFeed />
                    </div>
                </div>
            </DoorbellProvider>
        </NotificationProvider>
    </Coordinator>
);

const TitleSection: FC = async () => {
    return (
        <div className="border-ph-purple relative flex grow items-center gap-8 border border-b-0 p-16 text-white">
            <DitheredSoup />
            <div className="z-10 grid w-full grid-cols-[auto_1fr] drop-shadow-lg drop-shadow-black">
                <div className="me-16 flex h-full items-center">
                    <GliderFlat className="mt-5 block size-54" />
                </div>
                <h1 className="font-silkscreen text-9xl font-normal">
                    <span>
                        <i className="me-2">H</i>ack
                    </span>
                    <br />
                    <span>
                        N<i className="relative -left-1.5">i</i>ght
                    </span>
                </h1>
                <div className="text-ph-yellow font-inconsolata col-2 ms-4 mt-4 text-4xl font-bold">
                    {version}
                </div>
            </div>
        </div>
    );
};
