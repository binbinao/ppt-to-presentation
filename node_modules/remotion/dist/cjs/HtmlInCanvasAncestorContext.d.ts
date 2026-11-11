export type HtmlInCanvasPaintState = {
    pendingChildren: number;
    generation: number;
    release: (() => void) | null;
    blockPaint: () => () => void;
};
export declare const HtmlInCanvasAncestorContext: import("react").Context<HtmlInCanvasPaintState | null>;
