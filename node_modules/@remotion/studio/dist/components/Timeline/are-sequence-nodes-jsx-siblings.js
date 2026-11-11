"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.areSequenceNodesJsxSiblings = void 0;
const areSequenceNodesJsxSiblings = (source, target) => {
    const sourcePath = source.nodePath;
    const targetPath = target.nodePath;
    return (source.absolutePath === target.absolutePath &&
        sourcePath.length === targetPath.length &&
        sourcePath.at(-1) === 'openingElement' &&
        targetPath.at(-1) === 'openingElement' &&
        sourcePath.at(-3) === 'children' &&
        typeof sourcePath.at(-2) === 'number' &&
        typeof targetPath.at(-2) === 'number' &&
        sourcePath
            .slice(0, -2)
            .every((segment, index) => segment === targetPath[index]));
};
exports.areSequenceNodesJsxSiblings = areSequenceNodesJsxSiblings;
