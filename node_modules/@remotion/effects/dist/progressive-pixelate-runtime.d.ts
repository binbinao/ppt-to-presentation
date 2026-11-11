export type ProgressivePixelateUniforms = {
    readonly uSource: WebGLUniformLocation | null;
    readonly uResolution: WebGLUniformLocation | null;
    readonly uMode: WebGLUniformLocation | null;
    readonly uStart: WebGLUniformLocation | null;
    readonly uEnd: WebGLUniformLocation | null;
    readonly uCenter: WebGLUniformLocation | null;
    readonly uWidth: WebGLUniformLocation | null;
    readonly uHeight: WebGLUniformLocation | null;
    readonly uRotation: WebGLUniformLocation | null;
    readonly uRadialStart: WebGLUniformLocation | null;
    readonly uStartBlockSize: WebGLUniformLocation | null;
    readonly uEndBlockSize: WebGLUniformLocation | null;
};
export type ProgressivePixelateState = {
    readonly gl: WebGL2RenderingContext;
    readonly program: WebGLProgram;
    readonly vao: WebGLVertexArrayObject;
    readonly vbo: WebGLBuffer;
    readonly texture: WebGLTexture;
    readonly uniforms: ProgressivePixelateUniforms;
};
export declare const setupProgressivePixelate: (target: HTMLCanvasElement) => ProgressivePixelateState;
export declare const prepareProgressivePixelate: ({ state, source, width, height, flipSourceY, }: {
    readonly state: ProgressivePixelateState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly flipSourceY: boolean;
}) => void;
export declare const drawProgressivePixelate: (state: ProgressivePixelateState) => void;
export declare const cleanupProgressivePixelate: ({ gl, program, vao, vbo, texture, }: ProgressivePixelateState) => void;
export declare const PROGRESSIVE_PIXELATE_WEBGPU_SHADER = "\n\nstruct VertexOutput {\n\t@builtin(position) position: vec4f,\n\t@location(0) uv: vec2f,\n}\n\n@vertex fn vertex(@builtin(vertex_index) index: u32) -> VertexOutput {\n\tlet positions = array<vec2f, 3>(vec2f(-1, -1), vec2f(3, -1), vec2f(-1, 3));\n\tlet position = positions[index];\n\tvar output: VertexOutput;\n\toutput.position = vec4f(position, 0, 1);\n\toutput.uv = vec2f(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);\n\treturn output;\n}\n\nstruct Params {\n resolutionModeBlock: vec4f,\n startEnd: vec4f,\n centerSize: vec4f,\n controls: vec4f,\n}\n@group(0) @binding(0) var source: texture_2d<f32>;\n@group(0) @binding(1) var sourceSampler: sampler;\n@group(0) @binding(2) var<uniform> params: Params;\nfn linearProgress(uv: vec2f) -> f32 {\n let gradient = params.startEnd.zw - params.startEnd.xy;\n let gradientLengthSq = dot(gradient, gradient);\n if (gradientLengthSq <= 0.0000001) { return 0.0; }\n return clamp(dot(uv - params.startEnd.xy, gradient) / gradientLengthSq, 0.0, 1.0);\n}\nfn radialProgress(uv: vec2f) -> f32 {\n let radii = params.centerSize.zw * params.resolutionModeBlock.xy * 0.5;\n if (radii.x <= 0.0000001 || radii.y <= 0.0000001) { return 0.0; }\n let delta = (uv - params.centerSize.xy) * params.resolutionModeBlock.xy;\n let angle = radians(params.controls.x);\n let c = cos(angle);\n let s = sin(angle);\n let local = vec2f(c * delta.x + s * delta.y, -s * delta.x + c * delta.y);\n let ellipseProgress = clamp(length(local / radii), 0.0, 1.0);\n let distance = 1.0 - params.controls.y;\n if (abs(distance) <= 0.0000001) { return step(params.controls.y, ellipseProgress); }\n return clamp((ellipseProgress - params.controls.y) / distance, 0.0, 1.0);\n}\nfn samplePixelated(uv: vec2f, blockSize: f32) -> vec4f {\n let pixelSizeUv = vec2f(blockSize) / params.resolutionModeBlock.xy;\n let blockUv = floor(uv / pixelSizeUv) * pixelSizeUv + pixelSizeUv * 0.5;\n return textureSampleLevel(source, sourceSampler, vec2f(blockUv.x, 1.0 - blockUv.y), 0);\n}\n@fragment fn fragment(input: VertexOutput) -> @location(0) vec4f {\n var progress: f32;\n if (params.resolutionModeBlock.z == 0.0) { progress = linearProgress(input.uv); }\n else { progress = radialProgress(input.uv); }\n let targetBlockSize = max(1.0, mix(params.resolutionModeBlock.w, params.controls.z, progress));\n let level = log2(targetBlockSize);\n let lowerBlockSize = exp2(floor(level));\n let upperBlockSize = lowerBlockSize * 2.0;\n let levelProgress = fract(level);\n let uv = vec2f(input.uv.x, 1.0 - input.uv.y);\n return mix(samplePixelated(uv, lowerBlockSize), samplePixelated(uv, upperBlockSize), levelProgress);\n}\n";
