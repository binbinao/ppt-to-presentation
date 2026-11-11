"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStudioArtifactFilename = exports.getPortableDownloadFilename = void 0;
const windowsDeviceName = /^(?:con|prn|aux|nul|clock\$|conin\$|conout\$|com[0-9¹²³]|lpt[0-9¹²³]) *(?:\.|$)/i;
const windowsShortName = /^[^.]{1,6}~\d+(?:\.[^.]{1,3})?$/;
const getPortableDownloadFilename = (filename) => {
    const name = filename
        .replace(/[\p{Cc}\p{Cs}<>:"\\/|?*]/gu, '_')
        .replace(/^ +|[. ]+$/g, '');
    if (!name || windowsDeviceName.test(name)) {
        return '_' + name;
    }
    return windowsShortName.test(name) ? name.replace('~', '_') : name;
};
exports.getPortableDownloadFilename = getPortableDownloadFilename;
const validateStudioArtifactFilename = (filename) => {
    for (const segment of filename.split('/')) {
        if ((0, exports.getPortableDownloadFilename)(segment) !== segment) {
            throw new Error(`Invalid render artifact filename: ${filename}`);
        }
    }
};
exports.validateStudioArtifactFilename = validateStudioArtifactFilename;
