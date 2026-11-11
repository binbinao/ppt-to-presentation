export type ParsedCubeLut = {
    readonly size: number;
    readonly domainMin: readonly [number, number, number];
    readonly domainMax: readonly [number, number, number];
    readonly data: Float32Array;
};
export declare const parseCubeLut: (content: string) => ParsedCubeLut;
