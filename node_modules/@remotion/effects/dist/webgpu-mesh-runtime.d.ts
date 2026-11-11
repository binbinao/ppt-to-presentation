export type WebGpuMeshState = {
    readonly context: GPUCanvasContext;
    readonly label: string;
    resources: {
        readonly device: GPUDevice;
        readonly shader: string;
        readonly uniformSize: number;
        readonly topology: GPUPrimitiveTopology;
        readonly blend: boolean;
        readonly pipeline: GPURenderPipeline;
        readonly flipPipeline: GPURenderPipeline;
        readonly sampler: GPUSampler;
        readonly uniforms: GPUBuffer;
        multisample: {
            readonly resolved: GPUTexture;
            readonly texture: GPUTexture;
            readonly width: number;
            readonly height: number;
        } | null;
        vertices: {
            readonly buffer: GPUBuffer;
            readonly size: number;
        } | null;
        source: {
            readonly texture: GPUTexture;
            readonly width: number;
            readonly height: number;
        } | null;
    } | null;
};
export declare const setupWebGpuMesh: (target: HTMLCanvasElement, label: string) => WebGpuMeshState;
export declare const cleanupWebGpuMesh: (state: WebGpuMeshState) => void;
export declare const applyWebGpuMesh: ({ state, source, width, height, vertices, device, shader, uniformData, topology, blend, vertexCount, instanceCount, }: {
    state: WebGpuMeshState;
    source: CanvasImageSource;
    width: number;
    height: number;
    vertices: Float32Array | null;
    shader: string;
    uniformData: Float32Array<ArrayBuffer>;
    topology: GPUPrimitiveTopology;
    blend: boolean;
    vertexCount: number;
    instanceCount: number;
    device: GPUDevice;
}) => void;
