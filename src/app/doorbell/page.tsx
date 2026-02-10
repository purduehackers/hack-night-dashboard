import type { Metadata } from "next";
import { getConfig } from "@/lib/config";
import DoorbellPageContent from "./content";
import { DoorbellProvider } from "@/components/doorbell/doorbell-context";

const maintainer = await getConfig("maintainer");

export const metadata: Metadata = {
    title: "Hack Night Doorbell",
};

export default function Page() {
    return (
        <DoorbellProvider>
            <DoorbellPageContent maintainer={maintainer} />
        </DoorbellProvider>
    );
}
