"use client";

import { cn } from "@/lib/utils";
import { useLightningTimeClock } from "@purduehackers/time/react";
import { ComponentProps, FC } from "react";

type LightningTimeColors = ReturnType<typeof useLightningTimeClock>["colors"];
function lightningColorGradient(colors: LightningTimeColors): string {
    return `linear-gradient(120deg in oklch, ${colors.boltColor}, ${colors.zapColor}, ${colors.sparkColor})`;
}

interface Props {
    containerProps?: ComponentProps<"div">;
    lightningTimeProps?: ComponentProps<"div">;
    normalTimeProps?: ComponentProps<"div">;
}
export const LightningClock: FC<Props> = ({
    containerProps,
    lightningTimeProps,
    normalTimeProps,
}) => {
    const { lightningString, formattedNormalTime, colors } =
        useLightningTimeClock();
    const { style: containerStyle, ...restContainerProps } =
        containerProps ?? {};
    const { className: lightningClassName, ...restLightningProps } =
        lightningTimeProps ?? {};
    return (
        <div
            {...restContainerProps}
            style={{
                ...containerStyle,
                borderImageSource: lightningColorGradient(colors),
                borderImageSlice: 1,
            }}
        >
            <div
                className={cn("grid grid-cols-1", lightningClassName)}
                {...restLightningProps}
            >
                <div className="invisible [grid-area:1/1]">0~0~0|0</div>
                <div className="[grid-area:1/1]">{lightningString}</div>
            </div>
            <div {...normalTimeProps}>({formattedNormalTime})</div>
        </div>
    );
};
