import { type ParsedColorRgba } from '../color-utils.js';
import type { WeatherRenderParams } from './runtime.js';
export type WeatherWebGpuState = {
    readonly context: GPUCanvasContext;
    readonly colorCtx: CanvasRenderingContext2D;
    cachedColor: string | null;
    cachedColorRgba: ParsedColorRgba;
    resources: {
        readonly device: GPUDevice;
        readonly particles: GPURenderPipeline;
        readonly composite: GPURenderPipeline;
        readonly uniforms: GPUBuffer;
        readonly sampler: GPUSampler;
        textures: {
            readonly source: GPUTexture;
            readonly weather: GPUTexture;
            readonly particleGroup: GPUBindGroup;
            readonly compositeGroup: GPUBindGroup;
            readonly width: number;
            readonly height: number;
            readonly sourceWidth: number;
            readonly sourceHeight: number;
        } | null;
    } | null;
};
export declare const setupWeatherWebGpu: (target: HTMLCanvasElement) => WeatherWebGpuState;
export declare const cleanupWeatherWebGpu: (state: WeatherWebGpuState) => void;
export declare const drawWeatherWebGpu: ({ state, source, width, height, device, params, type, }: {
    state: WeatherWebGpuState;
    source: CanvasImageSource;
    width: number;
    height: number;
    device: GPUDevice;
    params: WeatherRenderParams;
    type: 'rain' | 'snow';
}) => void;
