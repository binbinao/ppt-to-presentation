"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRenderFrameInput = void 0;
const react_1 = require("react");
const noop_1 = require("../../helpers/noop");
const useRenderFrameInput = (initial, fallback, max) => {
    const [committed, setCommitted] = (0, react_1.useState)(initial);
    const [preview, setPreview] = (0, react_1.useState)(null);
    const committedFrame = Math.max(0, Math.min(max, Math.floor(committed !== null && committed !== void 0 ? committed : fallback)));
    const onValueChangeEnd = (0, react_1.useCallback)((frame) => {
        if (frame !== committedFrame) {
            setCommitted(frame);
        }
        setPreview(null);
    }, [committedFrame]);
    const onValueChangeCancel = (0, react_1.useCallback)(() => setPreview(null), []);
    return {
        value: preview === null ? committedFrame : Math.max(0, Math.min(max, preview)),
        integerOnly: true,
        step: 1,
        onTextChange: noop_1.noop,
        onValueChange: setPreview,
        onValueChangeEnd,
        onValueChangeCancel,
    };
};
exports.useRenderFrameInput = useRenderFrameInput;
