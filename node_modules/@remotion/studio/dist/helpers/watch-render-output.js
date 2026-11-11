"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.watchRenderOutput = void 0;
const output_path_1 = require("./output-path");
const preview_server_events_1 = require("./preview-server-events");
const getOutputPathname = (path) => {
    const serverPath = window.remotion_fileSystemPlatform === 'win32'
        ? path.replace(/\\/g, '/')
        : path;
    return new URL((0, output_path_1.getEncodedOutputPath)(serverPath).replace(/\/{2,}/g, '/'), 'http://localhost').pathname;
};
const watchRenderOutput = (path, onChange) => {
    const pathname = getOutputPathname(path);
    const connection = (0, preview_server_events_1.getPreviewServerConnectionState)();
    let clientId = connection.type === 'connected' ? connection.clientId : null;
    return (0, preview_server_events_1.subscribeToPreviewServerEvents)((event) => {
        if (event.type === 'init' && event.clientId !== clientId) {
            clientId = event.clientId;
            onChange();
        }
        if (event.type === 'render-output-written' &&
            getOutputPathname(event.path) === pathname) {
            onChange();
        }
    });
};
exports.watchRenderOutput = watchRenderOutput;
