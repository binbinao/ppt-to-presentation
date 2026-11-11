export type SinglePassState = {
    readonly gl: WebGL2RenderingContext;
    readonly program: WebGLProgram;
    readonly vao: WebGLVertexArrayObject;
    readonly vbo: WebGLBuffer;
    readonly texture: WebGLTexture;
    readonly uniforms: Record<string, WebGLUniformLocation | null>;
};
export declare const setupSinglePass: (target: HTMLCanvasElement, fragmentShader: string, effectName: string, uniformNames: readonly string[]) => SinglePassState;
export declare const prepareSinglePassSource: ({ state, source, width, height, flipSourceY, }: {
    state: SinglePassState;
    source: TexImageSource;
    width: number;
    height: number;
    flipSourceY: boolean;
}) => void;
export declare const drawSinglePass: ({ gl }: SinglePassState) => void;
export declare const cleanupSinglePass: ({ gl, program, vao, vbo, texture, }: SinglePassState) => void;
