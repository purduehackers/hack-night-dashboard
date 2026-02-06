import { DitheredSoup } from "@/components/dash/dithered-soup";
import { getConfig } from "@/lib/config";
import { FC } from "react";

export const Dash: FC = () => (
    <div className="flex h-full w-full flex-row">
        <div className="flex grow flex-col">
            <TitleSection />
            <div className="border-rainbow border p-16">
                <div className="text-6xl">now o&apos;clock</div>
            </div>
        </div>
        <div className="border-ph-purple border p-16">
            <div className="text-4xl">live feed</div>
        </div>
    </div>
);

const TitleSection: FC = async () => {
    const version = await getConfig("version");
    return (
        <div className="border-ph-purple relative grow border p-32 text-white">
            <DitheredSoup />
            <div className="relative z-10">
                <h1 className="font-silkscreen text-9xl font-normal">
                    <i>H</i>ack
                    <br />N<i>i</i>ght
                </h1>
                <div className="text-ph-yellow font-inconsolata ms-4 mt-4 text-4xl font-bold">
                    {version}
                </div>
            </div>
        </div>
    );
};
