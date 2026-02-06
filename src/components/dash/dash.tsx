import { DitheredSoup } from "@/components/dash/dithered-soup";
import { getConfig } from "@/lib/config";
import { FC } from "react";

export const Dash: FC = () => (
	<div className="flex flex-row h-full w-full">
		<div className="grow flex flex-col">
			<TitleSection />
			<div className="border border-rainbow p-16">
				<div className="text-6xl">now o&apos;clock</div>
			</div>
		</div>
		<div className="border border-ph-purple p-16">
			<div className="text-4xl">live feed</div>
		</div>
	</div>
);

const TitleSection: FC = async () => {
	const version = await getConfig("version");
	return (
		<div className="grow relative text-white p-32 border-ph-purple border">
			<DitheredSoup />
			<div className="relative z-10">
				<h1 className="text-9xl font-silkscreen font-normal">
					<i>H</i>ack
					<br />
					N<i>i</i>ght
				</h1>
				<div className="font-bold text-4xl text-ph-yellow ms-4 font-inconsolata mt-4">
					{version}
				</div>
			</div>
		</div>
	);
};
