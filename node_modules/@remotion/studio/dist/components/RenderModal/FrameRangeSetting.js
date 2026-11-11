"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameRangeSetting = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const InputDragger_1 = require("../NewComposition/InputDragger");
const layout_1 = require("./layout");
const MultiRangeSlider_1 = require("./MultiRangeSlider");
const INPUT_WIDTH = 40;
const startFrameInputContainer = {
    display: 'flex',
    justifyContent: 'flex-end',
    width: INPUT_WIDTH,
};
const FrameRangeSetting = ({ startFrame, endFrame, durationInFrames }) => {
    const minStartFrame = 0;
    const maxEndFrame = durationInFrames - 1;
    return ((0, jsx_runtime_1.jsxs)("div", { style: layout_1.optionRow, children: [(0, jsx_runtime_1.jsx)("div", { style: layout_1.label, children: "Frame range" }), (0, jsx_runtime_1.jsxs)("div", { style: layout_1.rightRow, children: [(0, jsx_runtime_1.jsx)("div", { style: startFrameInputContainer, children: (0, jsx_runtime_1.jsx)(InputDragger_1.InputDragger, { ...startFrame, min: minStartFrame, max: endFrame.value, name: "Start frame", status: "ok", rightAlign: true, style: { width: INPUT_WIDTH } }) }), (0, jsx_runtime_1.jsx)(MultiRangeSlider_1.MultiRangeSlider, { min: minStartFrame, max: maxEndFrame, start: startFrame.value, end: endFrame.value, step: 1, onLeftThumbDrag: startFrame.onValueChangeEnd, onRightThumbDrag: endFrame.onValueChangeEnd }), ' ', (0, jsx_runtime_1.jsx)("div", { style: { width: INPUT_WIDTH }, children: (0, jsx_runtime_1.jsx)(InputDragger_1.InputDragger, { ...endFrame, min: startFrame.value, max: maxEndFrame, name: "End frame", status: "ok", rightAlign: true, style: { width: INPUT_WIDTH } }) })] })] }));
};
exports.FrameRangeSetting = FrameRangeSetting;
