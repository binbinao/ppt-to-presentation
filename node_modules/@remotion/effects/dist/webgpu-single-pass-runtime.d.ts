export type WebGpuSinglePassState = {
    readonly context: GPUCanvasContext;
    readonly label: string;
    resources: {
        readonly device: GPUDevice;
        readonly shader: string;
        readonly uniformBufferSize: number;
        readonly sourceFilter: GPUFilterMode;
        readonly auxiliary: {
            readonly texture: GPUTexture;
            readonly width: number;
            readonly height: number;
            readonly format: 'rgba8unorm' | 'rgba32float';
            uploadedData: Uint8Array<ArrayBuffer> | Float32Array<ArrayBuffer> | null;
        } | null;
        readonly pipeline: GPURenderPipeline;
        readonly uniforms: GPUBuffer;
        readonly sampler: GPUSampler;
        readonly bindGroupLayout: GPUBindGroupLayout;
        source: {
            readonly texture: GPUTexture;
            readonly bindGroup: GPUBindGroup;
            readonly width: number;
            readonly height: number;
        } | null;
    } | null;
};
export declare const WEBGPU_SINGLE_PASS_VERTEX = "\nstruct VertexOutput {\n\t@builtin(position) position: vec4f,\n\t@location(0) uv: vec2f,\n}\n\n@vertex fn vertex(@builtin(vertex_index) index: u32) -> VertexOutput {\n\tlet positions = array<vec2f, 3>(vec2f(-1, -1), vec2f(3, -1), vec2f(-1, 3));\n\tlet position = positions[index];\n\tvar output: VertexOutput;\n\toutput.position = vec4f(position, 0, 1);\n\toutput.uv = vec2f(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);\n\treturn output;\n}\n";
export declare const setupWebGpuSinglePass: (target: HTMLCanvasElement, label: string) => WebGpuSinglePassState;
export declare const cleanupWebGpuSinglePass: (state: WebGpuSinglePassState) => void;
export declare const applyWebGpuSinglePass: ({ state, source, device, shader, uniformData, }: {
    state: WebGpuSinglePassState;
    source: CanvasImageSource;
    width: number;
    height: number;
    device: GPUDevice;
    shader: string;
    uniformData: Float32Array<ArrayBuffer>;
}, options?: {
    sourceFilter: GPUFilterMode | null;
    auxiliaryTexture: {
        data: Uint8Array<ArrayBuffer> | Float32Array<ArrayBuffer>;
        width: number;
        height: number;
        format: 'rgba8unorm' | 'rgba32float';
    } | null;
} | null) => void;
