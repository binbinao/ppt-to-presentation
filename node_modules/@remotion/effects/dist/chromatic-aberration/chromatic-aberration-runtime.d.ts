export type ChromaticAberrationState = {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    vao: WebGLVertexArrayObject;
    vbo: WebGLBuffer;
    textureSource: WebGLTexture;
    uniforms: {
        uSource: WebGLUniformLocation | null;
        uOffset: WebGLUniformLocation | null;
    };
};
export declare const setupChromaticAberration: (target: HTMLCanvasElement) => ChromaticAberrationState;
export declare const cleanupChromaticAberration: (state: ChromaticAberrationState) => void;
export declare const applyChromaticAberration: ({ state, source, width, height, amount, angle, flipSourceY, }: {
    readonly state: ChromaticAberrationState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly amount: number;
    readonly angle: number;
    readonly flipSourceY: boolean;
}) => void;
