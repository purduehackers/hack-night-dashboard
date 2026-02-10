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
