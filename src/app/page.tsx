import { Dash } from "@/components/dash/dash";
import { Flag } from "@/components/icons";

export default function Home() {
	return (
		<div className="p-8 size-full bg-black">
			<div className="absolute top-12 left-12 text-ph-yellow z-10 p-2 border border-ph-purple bg-black">
				<Flag />
			</div>
			<Dash />
		</div>
	);
}
