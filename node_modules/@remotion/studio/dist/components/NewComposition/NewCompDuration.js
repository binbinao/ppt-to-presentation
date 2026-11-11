"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewCompDuration = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const colors_1 = require("../../helpers/colors");
const validate_new_comp_data_1 = require("../../helpers/validate-new-comp-data");
const layout_1 = require("../layout");
const layout_2 = require("../RenderModal/layout");
const InputAndValidationContainer_1 = require("./InputAndValidationContainer");
const InputDragger_1 = require("./InputDragger");
const ValidationMessage_1 = require("./ValidationMessage");
const fixedDurationStyle = {
    color: colors_1.LIGHT_TEXT,
    fontSize: 14,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.5,
    padding: '4px 6px',
};
const NewCompDuration = ({ durationInFrames, setDurationInFrames }) => {
    const onDurationInFramesChanged = (0, react_1.useCallback)((newValue) => {
        setDurationInFrames === null || setDurationInFrames === void 0 ? void 0 : setDurationInFrames(Number(newValue));
    }, [setDurationInFrames]);
    const onDurationChangedDirectly = (0, react_1.useCallback)((newVal) => {
        setDurationInFrames === null || setDurationInFrames === void 0 ? void 0 : setDurationInFrames(newVal);
    }, [setDurationInFrames]);
    const compDurationErrMessage = setDurationInFrames === null || durationInFrames === null
        ? null
        : (0, validate_new_comp_data_1.validateCompositionDuration)(durationInFrames);
    return ((0, jsx_runtime_1.jsxs)("div", { style: layout_2.optionRow, children: [(0, jsx_runtime_1.jsx)("div", { style: layout_2.label, children: "Duration in frames" }), (0, jsx_runtime_1.jsx)("div", { style: layout_2.rightRow, children: (0, jsx_runtime_1.jsxs)(InputAndValidationContainer_1.InputAndValidationContainer, { children: [setDurationInFrames === null ? ((0, jsx_runtime_1.jsx)("span", { style: fixedDurationStyle, children: durationInFrames !== null && durationInFrames !== void 0 ? durationInFrames : '—' })) : ((0, jsx_runtime_1.jsx)(InputDragger_1.InputDragger, { onValueChangeCancel: null, "aria-label": "Duration in frames", type: "number", value: durationInFrames !== null && durationInFrames !== void 0 ? durationInFrames : '', onTextChange: onDurationInFramesChanged, placeholder: "Duration (frames)", name: "durationInFrames", min: 1, step: 1, required: true, status: "ok", 
                            // Hitting Promise.all() limit in Chrome
                            max: 300000, onValueChange: onDurationChangedDirectly, rightAlign: false })), compDurationErrMessage ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(layout_1.Spacing, { y: 1, block: true }), (0, jsx_runtime_1.jsx)(ValidationMessage_1.ValidationMessage, { align: "flex-start", message: compDurationErrMessage, type: "error" })] })) : null] }) })] }));
};
exports.NewCompDuration = NewCompDuration;
