"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConflictingOutputPaths = void 0;
const getConflictingOutputPaths = (paths) => {
    const files = new Map();
    for (const path of paths) {
        const key = path
            .normalize('NFD')
            .toLowerCase()
            .toUpperCase()
            .normalize('NFC');
        const existing = files.get(key);
        if (existing !== undefined) {
            return [existing, path];
        }
        files.set(key, path);
    }
    for (const [key, path] of files) {
        let slash = key.indexOf('/');
        while (slash !== -1) {
            const parentFile = files.get(key.slice(0, slash));
            if (parentFile !== undefined) {
                return [parentFile, path];
            }
            slash = key.indexOf('/', slash + 1);
        }
    }
    return null;
};
exports.getConflictingOutputPaths = getConflictingOutputPaths;
