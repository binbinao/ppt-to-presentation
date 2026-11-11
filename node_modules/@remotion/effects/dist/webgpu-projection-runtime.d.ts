export type WebGpuProjectionState = {
    context: GPUCanvasContext;
    resources: {
        device: GPUDevice;
        shader: string;
        format: GPUTextureFormat;
        pipeline: GPURenderPipeline;
        uniforms: GPUBuffer;
        sampler: GPUSampler;
        source: {
            texture: GPUTexture;
            bindGroup: GPUBindGroup;
            width: number;
            height: number;
        } | null;
    } | null;
};
export declare const cleanupWebGpuProjection: (state: WebGpuProjectionState) => void;
export declare const setupWebGpuProjection: (target: HTMLCanvasElement, label: string) => WebGpuProjectionState;
export declare const applyWebGpuProjection: ({ state, source, device, shader, uniformData, }: {
    state: WebGpuProjectionState;
    source: CanvasImageSource;
    width: number;
    height: number;
    device: GPUDevice;
    shader: string;
    uniformData: Float32Array<ArrayBuffer>;
}) => void;
