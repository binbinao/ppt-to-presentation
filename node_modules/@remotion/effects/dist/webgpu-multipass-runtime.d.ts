export declare const WEBGPU_MULTIPASS_BINDINGS = "\n\nstruct VertexOutput {\n\t@builtin(position) position: vec4f,\n\t@location(0) uv: vec2f,\n}\n\n@vertex fn vertex(@builtin(vertex_index) index: u32) -> VertexOutput {\n\tlet positions = array<vec2f, 3>(vec2f(-1, -1), vec2f(3, -1), vec2f(-1, 3));\n\tlet position = positions[index];\n\tvar output: VertexOutput;\n\toutput.position = vec4f(position, 0, 1);\n\toutput.uv = vec2f(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);\n\treturn output;\n}\n\n@group(0) @binding(0) var source: texture_2d<f32>;\n@group(0) @binding(1) var sourceSampler: sampler;\n@group(0) @binding(2) var<uniform> params: Params;\n@group(0) @binding(3) var secondary: texture_2d<f32>;\n";
export type WebGpuPass = {
    readonly shader: string;
    readonly uniforms: Float32Array<ArrayBuffer>;
    readonly source: number;
    readonly secondary: number;
};
type PassResources = {
    readonly shader: string;
    readonly size: number;
    readonly format: GPUTextureFormat;
    readonly pipeline: GPURenderPipeline;
    readonly uniforms: GPUBuffer;
};
export type WebGpuMultipassState = {
    readonly context: GPUCanvasContext;
    readonly label: string;
    resources: {
        readonly device: GPUDevice;
        readonly layout: GPUBindGroupLayout;
        readonly sampler: GPUSampler;
        readonly format: GPUTextureFormat;
        readonly passes: PassResources[];
        readonly textures: GPUTexture[];
        auxiliary: {
            readonly texture: GPUTexture;
            readonly width: number;
            readonly height: number;
        } | null;
        width: number;
        height: number;
        source: {
            readonly texture: GPUTexture;
            readonly width: number;
            readonly height: number;
        } | null;
    } | null;
};
export declare const setupWebGpuMultipass: (target: HTMLCanvasElement, label: string) => WebGpuMultipassState;
export declare const cleanupWebGpuMultipass: (state: WebGpuMultipassState) => void;
export declare const applyWebGpuMultipass: ({ state, source, width, height, device, passes, auxiliarySource, }: {
    state: WebGpuMultipassState;
    source: CanvasImageSource;
    width: number;
    height: number;
    device: GPUDevice;
    passes: readonly WebGpuPass[];
    auxiliarySource: HTMLCanvasElement | null;
}) => void;
export {};
