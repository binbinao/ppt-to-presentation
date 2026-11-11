import type { UvCoordinate } from '../uv-coordinate.js';
export type LightningType = 'direction' | 'strike' | 'breaking' | 'bouncy' | 'omni' | 'anywhere' | 'vertical' | 'two-way-strike';
export type LightningFractalType = 'linear' | 'semi-linear' | 'spline';
export type LightningParams = {
    readonly lightningType?: LightningType;
    /** Starting UV coordinate measured from the top-left. Defaults to [0.5, 0]. */
    readonly origin?: UvCoordinate;
    /** Destination or direction in UV coordinates. Defaults to [0.5, 1]. */
    readonly direction?: UvCoordinate;
    /** Each integer selects a repeatable bolt shape. Defaults to 10. */
    readonly conductivityState?: number;
    /** Radius of the bright center in pixels. Defaults to 3. */
    readonly coreRadius?: number;
    readonly coreOpacity?: number;
    readonly coreColor?: string;
    /** Radius of the surrounding glow in pixels. Defaults to 50. */
    readonly glowRadius?: number;
    readonly glowOpacity?: number;
    readonly glowColor?: string;
    readonly turbulence?: number;
    readonly forking?: number;
    readonly decay?: number;
    readonly decayMainCore?: boolean;
    /** Positive values repel the bolt from opaque pixels, negative values attract it. Ranges from -10 to 10. */
    readonly alphaObstacle?: number;
    /** Include the source behind the lightning. Defaults to true. */
    readonly compositeOnOriginal?: boolean;
    /** Number of subdivisions, from 1 to 12. Defaults to 6. */
    readonly complexity?: number;
    readonly minForkDistance?: number;
    readonly terminationThreshold?: number;
    readonly mainCoreCollisionOnly?: boolean;
    readonly fractalType?: LightningFractalType;
    readonly coreDrain?: number;
    readonly forkStrength?: number;
    readonly forkVariation?: number;
    /** Unsigned 32-bit seed for the bolt pattern. Defaults to 0. */
    readonly seed?: number;
};
export declare const lightningSchema: {
    readonly lightningType: {
        readonly type: 'enum';
        readonly description: 'Lightning type';
        readonly variants: {
            readonly direction: {};
            readonly strike: {};
            readonly breaking: {};
            readonly bouncy: {};
            readonly omni: {};
            readonly anywhere: {};
            readonly vertical: {};
            readonly 'two-way-strike': {};
        };
        readonly default: 'strike';
    };
    readonly origin: {
        readonly type: 'uv-coordinate';
        readonly description: string;
        readonly default: UvCoordinate;
        readonly min: 0;
        readonly max: 1;
        readonly step: 0.01;
        readonly visual: {
            readonly type: 'line';
            readonly to: 'direction';
        };
    };
    readonly direction: {
        readonly type: 'uv-coordinate';
        readonly description: string;
        readonly default: UvCoordinate;
        readonly min: 0;
        readonly max: 1;
        readonly step: 0.01;
    };
    readonly conductivityState: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
    };
    readonly coreRadius: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
    };
    readonly coreOpacity: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
    };
    readonly coreColor: {
        readonly type: 'color';
        readonly description: 'Core color';
        readonly default: '#ffffff';
    };
    readonly glowRadius: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
    };
    readonly glowOpacity: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
    };
    readonly glowColor: {
        readonly type: 'color';
        readonly description: 'Glow color';
        readonly default: '#4059ff';
    };
    readonly turbulence: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
    };
    readonly forking: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
    };
    readonly decay: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
    };
    readonly decayMainCore: {
        readonly type: 'boolean';
        readonly description: 'Decay main core';
        readonly default: false;
    };
    readonly alphaObstacle: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
    };
    readonly compositeOnOriginal: {
        readonly type: 'boolean';
        readonly description: 'Composite on original';
        readonly default: true;
    };
    readonly complexity: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
        readonly integer: true;
    };
    readonly minForkDistance: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
    };
    readonly terminationThreshold: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
    };
    readonly mainCoreCollisionOnly: {
        readonly type: 'boolean';
        readonly description: 'Main core collision only';
        readonly default: false;
    };
    readonly fractalType: {
        readonly type: 'enum';
        readonly description: 'Fractal type';
        readonly variants: {
            readonly linear: {};
            readonly 'semi-linear': {};
            readonly spline: {};
        };
        readonly default: 'linear';
    };
    readonly coreDrain: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
    };
    readonly forkStrength: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
    };
    readonly forkVariation: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
    };
    readonly seed: {
        readonly type: 'number';
        readonly description: string;
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly step: number;
        readonly hiddenFromList: false;
        readonly integer: true;
    };
};
export declare const resolve: (params: LightningParams) => Required<LightningParams>;
export declare const validateLightningParams: (params: LightningParams) => void;
