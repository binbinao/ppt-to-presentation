export type WeatherCommonParams = {
    /** Elapsed time in seconds. Must be nonnegative. Defaults to `0`. */
    readonly time?: number;
    /** Particle size, from `0` to `50`. Defaults to `1` for rain and `3` for snow. */
    readonly size?: number;
    /** Depth of the particle field, from `0` to `20000`. Defaults to `5000`. */
    readonly sceneDepth?: number;
    /** Fall speed. Defaults to `4000` for rain and `100` for snow. */
    readonly speed?: number;
    /** Horizontal wind strength. Positive values move right. Defaults to `0` for rain and `25` for snow. */
    readonly wind?: number;
    /** Per-particle wind variation, from `0` to `1`. Defaults to `0` for rain and `0.5` for snow. */
    readonly windVariation?: number;
    /** Random horizontal velocity spread, from `0` to `1000`. Defaults to `0`. */
    readonly spread?: number;
    /** Particle color. Its alpha multiplies opacity. Defaults to `#cccccc` for rain and `#ffffff` for snow. */
    readonly color?: string;
    /** Particle opacity, from `0` to `1`. Defaults to `0.25` for rain and `1` for snow. */
    readonly opacity?: number;
    /** Blend with the source. Defaults to `lighten` for rain and `composite` for snow. */
    readonly transferMode?: 'composite' | 'lighten';
    /** Include the source behind the particles. Defaults to `true`. */
    readonly compositeWithOriginal?: boolean;
    /** Normalized pattern position. `[0.5, 0.5]` leaves it centered, the default. */
    readonly offset?: readonly [number, number];
    /** Unsigned 32-bit integer for a repeatable particle field. Defaults to `0`. */
    readonly seed?: number;
};
export type WeatherCommonResolved = Required<WeatherCommonParams>;
export declare const COMMON_WEATHER_DEFAULTS: {
    readonly time: 0;
    readonly sceneDepth: 5000;
    readonly spread: 0;
    readonly compositeWithOriginal: true;
    readonly offset: readonly [0.5, 0.5];
    readonly seed: 0;
};
export declare const createWeatherSchema: (defaults: WeatherCommonResolved, maxSpeed: number, maxWind: number) => {
    readonly time: {
        readonly type: 'number';
        readonly min: 0;
        readonly max: 10;
        readonly step: 0.01;
        readonly default: number;
        readonly description: 'Time';
        readonly hiddenFromList: false;
    };
    readonly size: {
        readonly type: 'number';
        readonly min: 0;
        readonly max: 50;
        readonly step: 0.01;
        readonly default: number;
        readonly description: 'Size';
        readonly hiddenFromList: false;
    };
    readonly sceneDepth: {
        readonly type: 'number';
        readonly min: 0;
        readonly max: 20000;
        readonly step: 1;
        readonly default: number;
        readonly description: 'Scene depth';
        readonly hiddenFromList: false;
    };
    readonly speed: {
        readonly type: 'number';
        readonly min: 0;
        readonly max: number;
        readonly step: 1;
        readonly default: number;
        readonly description: 'Speed';
        readonly hiddenFromList: false;
    };
    readonly wind: {
        readonly type: 'number';
        readonly min: number;
        readonly max: number;
        readonly step: 1;
        readonly default: number;
        readonly description: 'Wind';
        readonly hiddenFromList: false;
    };
    readonly windVariation: {
        readonly type: 'number';
        readonly min: 0;
        readonly max: 1;
        readonly step: 0.01;
        readonly default: number;
        readonly description: 'Wind variation';
        readonly hiddenFromList: false;
    };
    readonly spread: {
        readonly type: 'number';
        readonly min: 0;
        readonly max: 1000;
        readonly step: 1;
        readonly default: number;
        readonly description: 'Spread';
        readonly hiddenFromList: false;
    };
    readonly opacity: {
        readonly type: 'number';
        readonly min: 0;
        readonly max: 1;
        readonly step: 0.01;
        readonly default: number;
        readonly description: 'Opacity';
        readonly hiddenFromList: false;
    };
    readonly color: {
        readonly type: 'color';
        readonly default: string;
        readonly description: 'Color';
    };
    readonly transferMode: {
        readonly type: 'enum';
        readonly variants: {
            readonly composite: {};
            readonly lighten: {};
        };
        readonly default: "composite" | "lighten";
        readonly description: 'Transfer mode';
    };
    readonly compositeWithOriginal: {
        readonly type: 'boolean';
        readonly default: boolean;
        readonly description: 'Composite with original';
    };
    readonly offset: {
        readonly type: 'uv-coordinate';
        readonly step: 0.01;
        readonly default: readonly [number, number];
        readonly description: 'Offset';
    };
    readonly seed: {
        readonly type: 'number';
        readonly min: 0;
        readonly max: 4294967295;
        readonly step: 1;
        readonly integer: true;
        readonly default: number;
        readonly description: 'Seed';
        readonly hiddenFromList: false;
    };
};
export declare const resolveWeatherParams: (params: WeatherCommonParams, defaults: WeatherCommonResolved) => WeatherCommonResolved;
export declare const validateWeatherRange: (value: number | undefined, name: string, min: number, max: number | null) => void;
export declare const validateWeatherParams: (params: WeatherCommonParams, label: string, maxSpeed: number, maxWind: number) => void;
