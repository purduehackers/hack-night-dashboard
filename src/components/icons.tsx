import { FC, SVGProps } from "react";

export const Flag: FC = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M22 4V16H21V17H19V18H13V17H6V18H5V22H3V5H2V3H3V2H5V3H6V5H5V6H6V5H13V6H19V5H21V4H22Z"
            fill="#FFEE00"
        />
    </svg>
);

export const GliderFlat: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 29 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        {...props}
    >
        <title>Purdue Hackers logo</title>
        <path
            d="M9.66699 28H0V18.667H9.66699V28ZM19.333 9.33301H29V28H19.333V18.667H9.66699V0H19.333V9.33301Z"
            fill="#FFEE00"
        />
    </svg>
);

export const PixelClock: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg
        id="clock"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        {...props}
    >
        <path d="m22,9v-2h-1v-2h-1v-1h-1v-1h-2v-1h-2v-1h-6v1h-2v1h-2v1h-1v1h-1v2h-1v2h-1v6h1v2h1v2h1v1h1v1h2v1h2v1h6v-1h2v-1h2v-1h1v-1h1v-2h1v-2h1v-6h-1Zm-1,6h-1v2h-1v2h-2v1h-2v1h-6v-1h-2v-1h-2v-2h-1v-2h-1v-6h1v-2h1v-2h2v-1h2v-1h6v1h2v1h2v2h1v2h1v6Z" />
        <polygon points="16 15 16 16 15 16 15 17 14 17 14 16 13 16 13 15 12 15 12 14 11 14 11 5 13 5 13 13 14 13 14 14 15 14 15 15 16 15" />
    </svg>
);
