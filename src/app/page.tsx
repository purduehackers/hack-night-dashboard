import { Dash } from "@/components/dash/dash";
import { Flag } from "@/components/icons";

export default function Home() {
    return (
        <div className="size-full bg-black p-8">
            <div className="text-ph-yellow border-ph-purple absolute top-12 left-12 z-10 border bg-black p-2">
                <Flag />
            </div>
            <Dash />
        </div>
    );
}
