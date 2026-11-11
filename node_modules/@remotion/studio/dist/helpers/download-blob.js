"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadBlob = exports.getDownloadFilename = void 0;
const getDownloadFilename = (path) => {
    return path.slice(path.lastIndexOf('/') + 1);
};
exports.getDownloadFilename = getDownloadFilename;
const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (0, exports.getDownloadFilename)(filename);
    a.click();
    URL.revokeObjectURL(url);
};
exports.downloadBlob = downloadBlob;
