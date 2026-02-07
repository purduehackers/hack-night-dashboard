import { getConfig } from "@/lib/config";
import DoorbellPageContent from "./content";
import { DoorbellProvider } from "@/components/doorbell/doorbell-context";

const maintainer = await getConfig("maintainer");

export default function Page() {
    return (
        <DoorbellProvider>
            <DoorbellPageContent maintainer={maintainer} />
        </DoorbellProvider>
    );
}
