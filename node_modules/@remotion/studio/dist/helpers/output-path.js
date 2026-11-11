"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutputRoute = exports.getEncodedOutputPath = exports.getRenderJobOutputPath = void 0;
const getRenderJobOutputPath = (job) => {
    if (job.type !== 'client-video' && job.type !== 'client-still') {
        return job.outName;
    }
    return job.outName.replace(window.remotion_fileSystemPlatform === 'win32' ? /^[\\/]+/ : /^\/+/, '');
};
exports.getRenderJobOutputPath = getRenderJobOutputPath;
const getEncodedOutputPath = (path) => {
    return `/${encodeURIComponent(path)}`;
};
exports.getEncodedOutputPath = getEncodedOutputPath;
const getOutputRoute = (path) => {
    return `/outputs${(0, exports.getEncodedOutputPath)(path)}`;
};
exports.getOutputRoute = getOutputRoute;
