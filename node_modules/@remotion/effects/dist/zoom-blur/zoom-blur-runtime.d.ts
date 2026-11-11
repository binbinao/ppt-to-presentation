export type ZoomBlurState = {
    readonly gl: WebGL2RenderingContext;
    readonly program: WebGLProgram;
    readonly vao: WebGLVertexArrayObject;
    readonly vbo: WebGLBuffer;
    readonly textureSource: WebGLTexture;
    readonly uniforms: {
        readonly uSource: WebGLUniformLocation | null;
        readonly uResolution: WebGLUniformLocation | null;
        readonly uCenter: WebGLUniformLocation | null;
        readonly uAmount: WebGLUniformLocation | null;
        readonly uSamples: WebGLUniformLocation | null;
    };
};
export declare const setupZoomBlur: (target: HTMLCanvasElement) => ZoomBlurState;
export declare const cleanupZoomBlur: (state: ZoomBlurState) => void;
export declare const applyZoomBlur: ({ state, source, width, height, amount, center, samples, flipSourceY, }: {
    readonly state: ZoomBlurState;
    readonly source: CanvasImageSource;
    readonly width: number;
    readonly height: number;
    readonly amount: number;
    readonly center: readonly [number, number];
    readonly samples: number;
    readonly flipSourceY: boolean;
}) => void;
