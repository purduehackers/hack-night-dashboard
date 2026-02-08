import { DitheredSoup } from "@/components/dash/dithered-soup";
import { getConfigs } from "@/lib/config";
import { FC } from "react";
import { LightningClock } from "@/components/dash/clock";
import { Glider } from "@/components/icons";
import { DoorbellProvider } from "@/components/doorbell/doorbell-context";
import { DoorbellNotifier } from "@/components/doorbell/doorbell-notifier";

export const Dash: FC = () => (
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
);

const TitleSection: FC = async () => {
    const { version, maintainer } = await getConfigs("version", "maintainer");
    return (
        <DoorbellProvider>
            <DoorbellNotifier maintainer={maintainer} />
            <div className="border-ph-purple relative flex grow items-center border border-b-0 p-16 text-white">
                <DitheredSoup />
                <div className="z-10 flex w-full flex-row-reverse justify-end drop-shadow-lg drop-shadow-black">
                    <div>
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
                    <div className="w-72">
                        <Glider className="fill-ph-yellow" />
                    </div>
                </div>
            </div>
        </DoorbellProvider>
    );
};
