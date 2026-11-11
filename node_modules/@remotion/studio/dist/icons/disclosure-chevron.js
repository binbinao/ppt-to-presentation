"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisclosureChevron = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const style = {
    display: 'block',
    height: 10,
    transition: 'var(--remotion-disclosure-transition, transform 150ms ease)',
    width: 6,
};
const DisclosureChevron = ({ expanded }) => ((0, jsx_runtime_1.jsx)("svg", { viewBox: "0 0 6 10", style: { ...style, transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }, children: (0, jsx_runtime_1.jsx)("path", { d: "M1.5 1.5L4.5 5L1.5 8.5", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1" }) }));
exports.DisclosureChevron = DisclosureChevron;
