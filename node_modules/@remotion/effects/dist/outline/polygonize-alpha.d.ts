export type OutlinePoint = readonly [x: number, y: number];
export declare const polygonizeAlpha: ({ data, width, height, simplification, }: {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    readonly simplification: number;
}) => OutlinePoint[][];
