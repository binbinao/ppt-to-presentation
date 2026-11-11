"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UvCoordinateHandle = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const colors_1 = require("../helpers/colors");
const style = {
    filter: colors_1.SELECTED_OUTLINE_UV_DROP_SHADOW,
};
const UvCoordinateHandle = ({ x, y, selected, onPointerDown }) => {
    return ((0, jsx_runtime_1.jsx)("circle", { cx: x, cy: y, r: selected ? 6.8 : 4.25, fill: colors_1.WHITE, stroke: colors_1.BLUE, strokeWidth: 2, style: style, vectorEffect: "non-scaling-stroke", pointerEvents: onPointerDown === null ? 'none' : 'all', cursor: "default", onPointerDown: onPointerDown !== null && onPointerDown !== void 0 ? onPointerDown : undefined }));
};
exports.UvCoordinateHandle = UvCoordinateHandle;
