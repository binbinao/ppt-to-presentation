"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunksOption = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const cliFlag = 'chunks';
exports.chunksOption = {
    name: 'Chunks',
    addedIn: '4.0.542',
    cliFlag,
    description: (type) => ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: ["The frame range that each Lambda function renders, as a list of", ' ', (0, jsx_runtime_1.jsx)("code", { children: "[startFrame, endFrame]" }), " pairs. Use it instead of setting the number of frames per Lambda or the concurrency when the cost of rendering is uneven, so that expensive parts of a video get split into shorter chunks than cheap parts.", ' ', type === 'cli'
                ? 'Pass a JSON array, or a file path pointing to a JSON file.'
                : null] })),
    ssrName: 'chunks',
    docLink: 'https://www.remotion.dev/docs/options/chunks',
    type: [],
    getValue: () => {
        throw new Error('Option resolution not implemented');
    },
    setConfig: () => {
        throw new Error('Not implemented');
    },
    id: cliFlag,
};
