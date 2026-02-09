import { FC } from "react";
import { Dithering } from "@paper-design/shaders-react";

interface Props {
    fgColor?: string;
}

export const DitheredSoup: FC<Props> = ({ fgColor = "#7e3cff" }) => {
    return (
        <Dithering
            className="absolute inset-0"
            width="100%"
            height="100%"
            colorBack="#000000"
            colorFront={fgColor}
            shape="warp"
            type="4x4"
            size={2}
            speed={0.04}
            scale={1}
        />
    );
};
