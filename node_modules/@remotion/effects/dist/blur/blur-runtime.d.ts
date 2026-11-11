export type BlurState = {
    gl: WebGL2RenderingContext;
    programHorizontal: WebGLProgram;
    programVertical: WebGLProgram;
    vao: WebGLVertexArrayObject;
    vbo: WebGLBuffer;
    textureSource: WebGLTexture;
    textureIntermediate: WebGLTexture;
    framebuffer: WebGLFramebuffer;
    horizontal: {
        uRadius: WebGLUniformLocation | null;
        uTexelSize: WebGLUniformLocation | null;
        uSource: WebGLUniformLocation | null;
    };
    vertical: {
        uRadius: WebGLUniformLocation | null;
        uTexelSize: WebGLUniformLocation | null;
        uSource: WebGLUniformLocation | null;
    };
};
export declare const setupBlur: (target: HTMLCanvasElement) => BlurState;
export declare const cleanupBlur: (state: BlurState) => void;
type ApplyBlurParams = {
    readonly state: BlurState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly radius: number;
    readonly horizontal: boolean;
    readonly vertical: boolean;
    readonly flipSourceY: boolean;
};
export declare const applyBlur: ({ state, source, width, height, radius, horizontal, vertical, flipSourceY, }: ApplyBlurParams) => void;
export {};
