import type { LightningParams } from './params.js';
type Point = readonly [number, number];
type Segment = {
    start: Point;
    end: Point;
    intensity: number;
    main: boolean;
};
export declare const lightningSegments: (p: Required<LightningParams>, width: number, height: number, alpha: ImageData | null) => Segment[];
export {};
