import { DitheredSoup } from "@/components/dash/dithered-soup";
import { getConfigs } from "@/lib/config";
import { FC } from "react";
import { LightningClock } from "@/components/dash/clock";
import { Flag, Glider } from "@/components/icons";
import { DoorbellProvider } from "@/components/doorbell/doorbell-context";
import { DoorbellNotifier } from "@/components/doorbell/doorbell-notifier";

export const Dash: FC = () => (
    <div className="relative flex h-full w-full flex-row">
        <div className="flex grow flex-col">
            <TitleSection />
            <LightningClock />
        </div>
        <div className="border-ph-purple border border-l-0 p-16">
            <div className="text-4xl">live feed</div>
        </div>
    </div>
);

const TitleSection: FC = async () => {
    const { version, maintainer } = await getConfigs("version", "maintainer");
    return (
        <DoorbellProvider>
            <DoorbellNotifier maintainer={maintainer} />
            <div className="border-ph-purple relative flex grow items-center border border-b-0 px-32 py-16 text-white">
                <DitheredSoup />
                <div className="text-ph-yellow border-ph-purple absolute top-4 left-4 z-10 border bg-black p-2">
                    <Flag />
                </div>
                <div className="text-ph-yellow border-ph-purple absolute top-4 right-4 z-10 border bg-black p-2">
                    <Glider />
                </div>
                <div className="relative z-10">
                    <h1 className="font-silkscreen text-9xl font-normal">
                        <span>
                            <i>H</i>ack
                        </span>
                        <br />
                        <span>
                            N<i>i</i>ght
                        </span>
                    </h1>
                    <div className="text-ph-yellow font-inconsolata ms-4 mt-4 text-4xl font-bold">
                        {version}
                    </div>
                </div>
            </div>
        </DoorbellProvider>
    );
};
