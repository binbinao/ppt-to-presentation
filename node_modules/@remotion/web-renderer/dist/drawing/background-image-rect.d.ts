type LengthPercentage = {
    unit: '%' | 'px';
    value: number;
};
export declare const splitAtTopLevel: (value: string, separator: ',' | ' ') => string[];
export declare const parseLengthPercentage: (value: string) => LengthPercentage | null;
export declare const resolveSize: ({ containerSize, value, }: {
    containerSize: number;
    value: string | undefined;
}) => number;
export declare const resolvePosition: ({ containerSize, imageSize, value, }: {
    containerSize: number;
    imageSize: number;
    value: string;
}) => number;
export declare const parsePosition: (value: string) => {
    x: string;
    y: string;
};
export declare const getBackgroundImageRect: ({ backgroundPosition, backgroundSize, positioningArea, intrinsicSize, backgroundRepeat, }: {
    backgroundPosition: string;
    backgroundSize: string;
    backgroundRepeat?: string;
    positioningArea: DOMRect;
    intrinsicSize: {
        width: number;
        height: number;
    } | null;
}) => DOMRect;
export {};
