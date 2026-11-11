export declare const DEFAULT_AMOUNT: 1;
export declare const DEFAULT_BRIGHTNESS_AMOUNT: 0;
export declare const DEFAULT_HUE_DEGREES: 0;
export declare const colorAmountSchema: {
    readonly type: 'number';
    readonly min: 0;
    readonly max: 1;
    readonly step: 0.01;
    readonly default: 1;
    readonly description: 'Amount';
    readonly hiddenFromList: false;
};
export declare const colorMultiplierSchema: {
    readonly type: 'number';
    readonly min: 0;
    readonly step: 0.01;
    readonly default: 1;
    readonly description: 'Amount';
    readonly hiddenFromList: false;
};
export declare const brightnessAmountSchema: {
    readonly type: 'number';
    readonly min: -1;
    readonly max: 1;
    readonly step: 0.01;
    readonly default: 0;
    readonly description: 'Amount';
    readonly hiddenFromList: false;
};
export declare const hueDegreesSchema: {
    readonly type: 'rotation-degrees';
    readonly step: 1;
    readonly default: 0;
    readonly description: 'Degrees';
};
export declare const assertOptionalFiniteNumber: (value: unknown, name: string) => void;
export declare const validateUnitInterval: (value: number, name: string) => void;
export declare const validateNonNegative: (value: number, name: string) => void;
export declare const validateSignedUnitInterval: (value: number, name: string) => void;
export declare const clampColorChannel: (value: number) => number;
export type ParsedColorRgba = readonly [number, number, number, number];
export declare const parseColorRgba: (ctx: CanvasRenderingContext2D, color: string) => ParsedColorRgba;
