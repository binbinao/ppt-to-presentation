export type WebGlProjectionState = {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    texture: WebGLTexture;
    vao: WebGLVertexArrayObject;
    uniforms: WebGLUniformLocation | null;
    source: WebGLUniformLocation | null;
};
export declare const setupWebGlProjection: (target: HTMLCanvasElement, shader: string) => WebGlProjectionState;
export declare const applyWebGlProjection: ({ state, source, width, height, flipSourceY, uniformData, }: {
    state: WebGlProjectionState;
    source: CanvasImageSource;
    width: number;
    height: number;
    flipSourceY: boolean;
    uniformData: Float32Array<ArrayBuffer>;
}) => void;
export declare const cleanupWebGlProjection: ({ gl, program, texture, vao, }: WebGlProjectionState) => void;
