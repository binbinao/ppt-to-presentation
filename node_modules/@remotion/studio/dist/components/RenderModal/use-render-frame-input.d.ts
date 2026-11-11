import { noop } from '../../helpers/noop';
export declare const useRenderFrameInput: (initial: number | null, fallback: number, max: number) => {
    value: number;
    integerOnly: boolean;
    step: number;
    onTextChange: typeof noop;
    onValueChange: import("react").Dispatch<import("react").SetStateAction<number | null>>;
    onValueChangeEnd: (frame: number) => void;
    onValueChangeCancel: () => void;
};
export type RenderFrameInput = ReturnType<typeof useRenderFrameInput>;
