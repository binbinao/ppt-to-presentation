"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BorderRadiusIcon = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const BorderRadiusIcon = ({ color, individual, ...props }) => {
    return ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 12 12", fill: "none", ...props, children: (0, jsx_runtime_1.jsx)("path", { d: individual
                ? 'M4.25 1.25H1.25v3M1.25 7.75v3h3M7.75 1.25h3v3M10.75 7.75v3h-3'
                : 'M1.25 1.25H5.75C8.75 1.25 10.75 3.25 10.75 6.25V10.75', stroke: color, strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1" }) }));
};
exports.BorderRadiusIcon = BorderRadiusIcon;
