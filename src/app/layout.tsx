import type { Metadata } from "next";
import { Inconsolata, Silkscreen } from "next/font/google";
import "./globals.css";
import { getConfigs } from "@/lib/config";

const silkscreen = Silkscreen({
    weight: ["400", "700"],
    variable: "--font-silkscreen",
    subsets: ["latin"],
});

const inconsolata = Inconsolata({
    variable: "--font-inconsolata",
    subsets: ["latin"],
});

export const generateMetadata = async (): Promise<Metadata> => {
    return await getConfigs("title");
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-dvh w-dvw">
            <body
                className={`${inconsolata.variable} ${silkscreen.variable} text-foreground h-dvh w-dvw antialiased`}
            >
                {children}
            </body>
        </html>
    );
}
