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
    src: "../fonts/ABCWhytePlusVariableEdu-Regular.woff2",
    fallback: ["system-ui", "sans-serif"],
    variable: "--font-whyte-plus",
});

export const generateMetadata = async (): Promise<Metadata> => {
    const { title, description } = await getConfigs("title", "description");
    const image = {
        url: "https://night.purduehackers.com/opengraph.png",
        type: "image/png",
        width: 2220,
        height: 1096,
        alt: "Logo & title section of Hack Night dashboard",
    };
    return {
        title,
        description,
        icons: "/glider-flat.svg",
        openGraph: {
            type: "website",
            url: "https://night.purduehackers.com",
            title,
            description,
            siteName: "Purdue Hackers",
            images: image,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            creator: "@purduehackers",
            images: image,
        },
    };
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
                <div className="size-full bg-black p-8">{children}</div>
            </body>
        </html>
    );
}
