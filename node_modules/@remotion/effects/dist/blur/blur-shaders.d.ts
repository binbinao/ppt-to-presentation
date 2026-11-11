export declare const BLUR_VS = "#version 300 es\nlayout(location = 0) in vec2 aPos;\nlayout(location = 1) in vec2 aUv;\nout vec2 vUv;\nvoid main() {\n\tvUv = aUv;\n\tgl_Position = vec4(aPos, 0.0, 1.0);\n}\n";
export declare const BLUR_FS_HORIZONTAL: string;
export declare const BLUR_FS_VERTICAL: string;
