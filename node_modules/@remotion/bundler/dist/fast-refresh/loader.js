"use strict";
/**
 * ⚠️ Be careful when refactoring this file!
 * This gets injected into every file of the browser.
 * You cannot have returns, optional chains, inverse the if statement etc.
 * Check the Typescript output in dist/ to see that no extra `var` statements were produced
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Source code is adapted from https://github.com/WebHotelier/webpack-fast-refresh#readme and rewritten in Typescript. This file is MIT licensed.
 */
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2020 Vercel, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
const node_crypto_1 = require("node:crypto");
// This file is copied from the @vercel/next.js, with removed TS annotations
//
// https://github.com/vercel/next.js/blob/canary/packages/react-refresh-utils/loader.ts
// This function gets unwrapped into global scope, which is why we don't invert
// if-blocks. Also, you cannot use `return`.
function RefreshModuleRuntime() {
    var _a;
    var _b;
    // Legacy CSS implementations will `eval` browser code in a Node.js context
    // to extract CSS. For backwards compatibility, we need to check we're in a
    // browser context before continuing.
    if (typeof self !== 'undefined' &&
        // AMP / No-JS mode does not inject these helpers:
        '$RefreshHelpers$' in self) {
        const currentExports = __webpack_module__.exports;
        const prevExports = (_b = (_a = __webpack_module__.hot.data) === null || _a === void 0 ? void 0 : _a.prevExports) !== null && _b !== void 0 ? _b : null;
        // This cannot happen in MainTemplate because the exports mismatch between
        // templating and execution.
        self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, __webpack_module__.id);
        // A module can be accepted automatically based on its exports, e.g. when
        // it is a Refresh Boundary.
        if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {
            // Save the previous exports on update so we can compare the boundary
            // signatures.
            __webpack_module__.hot.dispose((data) => {
                data.prevExports = currentExports;
            });
            // Unconditionally accept an update to this module, we'll check if it's
            // still a Refresh Boundary later.
            __webpack_module__.hot.accept();
            // This field is set when the previous version of this module was a
            // Refresh Boundary, letting us know we need to check for invalidation or
            // enqueue an update.
            if (prevExports !== null) {
                // A boundary can become ineligible if its exports are incompatible
                // with the previous exports.
                //
                // For example, if you add/remove/change exports, we'll want to
                // re-execute the importing modules, and force those components to
                // re-render. Similarly, if you convert a class component to a
                // function, we want to invalidate the boundary.
                if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevExports, currentExports)) {
                    __webpack_module__.hot.invalidate();
                }
                else {
                    self.$RefreshHelpers$.scheduleUpdate();
                }
            }
        }
        else {
            // Since we just executed the code for the module, it's possible that the
            // new exports made it ineligible for being a boundary.
            // We only care about the case when we were _previously_ a boundary,
            // because we already accepted this update (accidental side effect).
            const isNoLongerABoundary = prevExports !== null;
            if (isNoLongerABoundary) {
                __webpack_module__.hot.invalidate();
            }
        }
    }
}
let refreshModuleRuntime = RefreshModuleRuntime.toString();
refreshModuleRuntime = refreshModuleRuntime.slice(refreshModuleRuntime.indexOf('{') + 1, refreshModuleRuntime.lastIndexOf('}'));
const ReactRefreshLoader = function (source, inputSourceMap) {
    // Importing a module that declares the global variables _a and _b
    // will conflict with the global variables that React Fast Refresh uses.
    // https://github.com/remotion-dev/remotion/issues/3699
    const renamedSymbols = refreshModuleRuntime
        .replace(/_a/g, '_remotion_globalVariableA')
        .replace(/_b/g, '_remotion_globalVariableB');
    const sourceHash = (0, node_crypto_1.createHash)('sha256').update(source).digest('hex');
    this.callback(null, `${source}\n;${renamedSymbols}\n/* remotion-source-sha256:${sourceHash} */`, inputSourceMap);
};
exports.default = ReactRefreshLoader;
