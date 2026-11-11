import { type WebGpuSinglePassState } from './webgpu-single-pass-runtime.js';
export type WebGpuColorState = WebGpuSinglePassState & {
    readonly colorContext: CanvasRenderingContext2D;
    colors: {
        key: string;
        data: Uint8Array<ArrayBuffer>;
    } | null;
};
export declare const setupWebGpuColors: (target: HTMLCanvasElement, label: string) => WebGpuColorState;
export declare const getWebGpuColors: (state: WebGpuColorState, colors: readonly string[]) => Uint8Array<ArrayBuffer>;
