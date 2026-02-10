import { getConfigs } from "@/lib/config";
import { FC } from "react";
import { GliderFlat } from "@/components/icons";
import { DoorbellProvider } from "@/components/doorbell/doorbell-context";
import { DoorbellNotifier } from "@/components/doorbell/doorbell-notifier";
import { NotificationProvider } from "@/components/ui/notification-provider";
import { ActivateNotification } from "./activate-notification";
import { DitheredSoup } from "@/components/dithered-soup";
import { LightningClock } from "./clock";

const { version, maintainer } = await getConfigs("version", "maintainer");

export const Dash: FC = () => (
    <NotificationProvider>
        <ActivateNotification />
        <DoorbellProvider>
            <DoorbellNotifier maintainer={maintainer} />
            <div className="relative flex h-full w-full flex-row">
                <div className="flex grow flex-col">
                    <TitleSection />
                    <LightningClock />
                </div>
                <div className="border-ph-purple relative w-[20dvw] border border-l-0 p-16">
                    {/* Live feed placeholder panel */}
                    <DitheredSoup fgColor="#fe0" />
                </div>
            </div>
        </DoorbellProvider>
    </NotificationProvider>
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
                        <i>H</i>ack
                    </span>
                    <br />
                    <span>
                        N<i>i</i>ght
                    </span>
                </h1>
                <div className="text-ph-yellow font-inconsolata col-2 ms-4 mt-4 text-4xl font-bold">
                    {version}
                </div>
            </div>
        </div>
    );
};
