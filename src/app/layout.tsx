import "./globals.css";
import type { Metadata } from "next";
import { Inconsolata, Silkscreen } from "next/font/google";
import localFont from "next/font/local";
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

const whyte = localFont({
    src: "../assets/ABCWhytePlusVariableEdu-Regular.woff2",
    fallback: ["system-ui", "sans-serif"],
    variable: "--font-whyte-plus",
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
                className={`${inconsolata.variable} ${silkscreen.variable} ${whyte.variable} text-foreground font-inconsolata h-dvh w-dvw antialiased`}
            >
                {children}
            </body>
        </html>
    );
}
