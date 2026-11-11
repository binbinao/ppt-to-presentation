"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyDir = copyDir;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
async function copyDir({ src, dest, onSymlinkDetected, onProgress, copiedBytes = 0, lastReportedProgress = 0, }) {
    await node_fs_1.default.promises.mkdir(dest, { recursive: true });
    const entries = await node_fs_1.default.promises.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = node_path_1.default.join(src, entry.name);
        const destPath = node_path_1.default.join(dest, entry.name);
        if (entry.isDirectory()) {
            copiedBytes = await copyDir({
                src: srcPath,
                dest: destPath,
                onSymlinkDetected,
                onProgress,
                copiedBytes,
                lastReportedProgress,
            });
        }
        else if (entry.isSymbolicLink()) {
            const realpath = await node_fs_1.default.promises.realpath(srcPath);
            onSymlinkDetected(entry, src);
            // Native realpath resolves mapped network drives to UNC paths.
            // Junctions can only target local directories.
            const type = process.platform === 'win32' &&
                !realpath.startsWith('\\\\') &&
                (await node_fs_1.default.promises.stat(realpath)).isDirectory()
                ? 'junction'
                : undefined;
            await node_fs_1.default.promises.symlink(realpath, destPath, type);
        }
        else {
            const [, { size }] = await Promise.all([
                node_fs_1.default.promises.copyFile(srcPath, destPath),
                node_fs_1.default.promises.stat(srcPath),
            ]);
            copiedBytes += size;
            if (copiedBytes - lastReportedProgress > 1024 * 1024 * 10) {
                onProgress(copiedBytes);
                lastReportedProgress = copiedBytes;
            }
        }
    }
    return copiedBytes;
}
