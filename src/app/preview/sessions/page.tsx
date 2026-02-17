"use client";

import { fetcher, SessionOverlayContent } from "@/components/dash/sessions";
import { Overlay } from "@/components/ui/overlay";
import { useEffect, useState } from "react";
import useSWR from "swr";

export default function Page() {
    const [selectedSessionIndex, setSelectedSessionIndex] = useState<
        number | null
    >(null);
    const [now, setNow] = useState<number>(0);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            clearInterval(timer);
        };
    }, []);

    const { data, isLoading, error } = useSWR(
        ["/api/sessions", new Date("1970-01-01"), new Date("2100-01-01")],
        fetcher,
    );

    return (
        <div className="text-lg">
            <h1 className="mb-4 text-6xl font-bold">Preview sessions:</h1>

            {isLoading ? (
                <div>Loading...</div>
            ) : error !== undefined ? (
                <div className="text-red-400">Error: {String(error)}</div>
            ) : (
                <>
                    <Overlay
                        open={selectedSessionIndex !== null}
                        className="p-0"
                    >
                        {selectedSessionIndex !== null && (
                            <SessionOverlayContent
                                session={data!.docs[selectedSessionIndex]}
                                now={now}
                            />
                        )}
                        <button
                            className="absolute top-4 right-4 border bg-black px-2 py-1 shadow-lg shadow-black"
                            onClick={() => setSelectedSessionIndex(null)}
                        >
                            Close
                        </button>
                    </Overlay>

                    <ul className="list-inside list-disc">
                        {data!.docs.map((session, i) => (
                            <li key={session.id}>
                                <a
                                    href="#"
                                    onClick={() => setSelectedSessionIndex(i)}
                                    className="hover:underline"
                                >
                                    {new Date(session.date).toLocaleString()} -{" "}
                                    {session.title} by{" "}
                                    {session.host.preferred_name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
