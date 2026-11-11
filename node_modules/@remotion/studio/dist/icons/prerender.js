"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrerenderIcon = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const PrerenderIcon = ({ color, ...props }) => {
    const maskId = (0, react_1.useId)();
    return ((0, jsx_runtime_1.jsxs)("svg", { ...props, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 16 16", children: [(0, jsx_runtime_1.jsxs)("mask", { id: maskId, children: [(0, jsx_runtime_1.jsx)("rect", { x: 5, y: 5.5, width: 10.5, height: 9.5, rx: 1.5, fill: "white" }), (0, jsx_runtime_1.jsx)("path", { d: "M8.75 8v4.5l3.75-2.25z", fill: "black" })] }), (0, jsx_runtime_1.jsx)("path", { d: "M3.5 8.5H1.5a1 1 0 0 1-1-1V1.5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1V4", fill: "none", stroke: color, strokeDasharray: "2 1.25" }), (0, jsx_runtime_1.jsx)("rect", { x: 5, y: 5.5, width: 10.5, height: 9.5, rx: 1.5, fill: color, mask: `url(#${maskId})` })] }));
};
exports.PrerenderIcon = PrerenderIcon;
