export type MirrorDirection = 'horizontal' | 'vertical';
export type MirrorState = {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    vao: WebGLVertexArrayObject;
    vbo: WebGLBuffer;
    textureSource: WebGLTexture;
    uniforms: {
        uSource: WebGLUniformLocation | null;
        uPosition: WebGLUniformLocation | null;
        uDirection: WebGLUniformLocation | null;
        uInvert: WebGLUniformLocation | null;
    };
};
export declare const setupMirror: (target: HTMLCanvasElement) => MirrorState;
export declare const cleanupMirror: (state: MirrorState) => void;
export declare const applyMirror: ({ state, source, width, height, position, direction, invert, flipSourceY, }: {
    readonly state: MirrorState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly position: number;
    readonly direction: MirrorDirection;
    readonly invert: boolean;
    readonly flipSourceY: boolean;
}) => void;
