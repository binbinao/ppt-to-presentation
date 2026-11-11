"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchIgnoreNextChangePlugin = void 0;
// Webpack plugin that suppresses the next file change for dynamically specified files.
// Used to prevent a full webpack rebuild when the studio writes to a watched file
// (e.g. updating default props). On ignoreNextChange(), the current file and directory
// timestamps are snapshotted. When watchpack fires the aggregated callback, the old
// timestamps are restored, the file is removed from changedFiles, and the original
// callback is skipped (which would trigger _invalidate → compile). The watchpack
// listeners are re-registered and unpaused so subsequent real changes still work.
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
class WatchIgnoreNextChangePlugin {
    constructor(trace) {
        this.filesToIgnore = new Map();
        this.filesRequiringRebuild = new Set();
        this.dirsToIgnore = new Set();
        this.snapshotFileTimestamps = new Map();
        this.snapshotDirTimestamps = new Map();
        this.snapshotDirectoryContents = new Map();
        this.suppressedFilesHistory = new Set();
        this.currentWatcher = null;
        this.pendingFileChanges = new Map();
        this.notifiedFiles = new Map();
        this.notifiedDirectories = new Set();
        this.notifiedDirectoryContents = new Map();
        this.notifyFileChanges = null;
        this.pendingFlush = null;
        this.notifying = false;
        this.trace = trace;
    }
    ignoreNextChange(file, contents) {
        var _a;
        if (this.filesRequiringRebuild.has(file)) {
            return;
        }
        // Snapshot current timestamps from the watcher BEFORE the file is written
        if ((_a = this.currentWatcher) === null || _a === void 0 ? void 0 : _a.getInfo) {
            const info = this.currentWatcher.getInfo();
            if (this.filesRequiringRebuild.has(file))
                return;
            const fileTs = info.fileTimeInfoEntries.get(file);
            if (fileTs !== undefined && !this.snapshotFileTimestamps.has(file)) {
                this.snapshotFileTimestamps.set(file, fileTs);
            }
            const snapshot = new Map(info.fileTimeInfoEntries);
            for (let dir = node_path_1.default.dirname(file); dir !== node_path_1.default.dirname(dir); dir = node_path_1.default.dirname(dir)) {
                this.dirsToIgnore.add(dir);
                if (!this.snapshotDirectoryContents.has(dir)) {
                    this.snapshotDirectoryContents.set(dir, snapshot);
                }
                const timestamp = info.contextTimeInfoEntries.get(dir);
                if (timestamp !== undefined && !this.snapshotDirTimestamps.has(dir)) {
                    this.snapshotDirTimestamps.set(dir, timestamp);
                }
            }
        }
        this.filesToIgnore.set(file, contents);
        this.trace('[WatchIgnoreNextChange] Registered ignore for', file);
    }
    releaseChangedSuppressions() {
        for (const [file, expected] of this.filesToIgnore) {
            let contents = null;
            let readable = true;
            try {
                contents = (0, node_fs_1.readFileSync)(file, 'utf8');
            }
            catch (error) {
                readable = error.code === 'ENOENT';
            }
            if (readable && contents === expected)
                continue;
            this.requireRebuild(file);
            this.notifyFileChanged(file, contents);
        }
    }
    isIgnoredDirectory(directory, timestamps, changedFiles, removedFiles) {
        var _a, _b;
        const snapshot = this.snapshotDirectoryContents.get(directory);
        if (!snapshot || !timestamps || (removedFiles === null || removedFiles === void 0 ? void 0 : removedFiles.has(directory)))
            return false;
        const prefix = directory + node_path_1.default.sep;
        const files = new Set([
            ...snapshot.keys(),
            ...timestamps.keys(),
            ...(changedFiles !== null && changedFiles !== void 0 ? changedFiles : []),
            ...(removedFiles !== null && removedFiles !== void 0 ? removedFiles : []),
            ...this.filesRequiringRebuild,
        ]);
        for (const file of files) {
            if (!file.startsWith(prefix) || this.filesToIgnore.has(file))
                continue;
            if (this.isAlreadyNotified(file))
                continue;
            if (this.dirsToIgnore.has(file) && !(removedFiles === null || removedFiles === void 0 ? void 0 : removedFiles.has(file)))
                continue;
            if (this.filesRequiringRebuild.has(file) ||
                (changedFiles === null || changedFiles === void 0 ? void 0 : changedFiles.has(file)) ||
                (removedFiles === null || removedFiles === void 0 ? void 0 : removedFiles.has(file)))
                return false;
            const before = snapshot.get(file);
            const after = timestamps.get(file);
            if ((before ? ((_a = before.timestamp) !== null && _a !== void 0 ? _a : true) : null) !==
                (after ? ((_b = after.timestamp) !== null && _b !== void 0 ? _b : true) : null))
                return false;
        }
        return true;
    }
    requireRebuild(file) {
        this.unignoreNextChange(file);
        this.filesRequiringRebuild.add(file);
    }
    notifyFileChanged(file, contents) {
        if (!this.filesRequiringRebuild.has(file))
            return;
        this.pendingFileChanges.set(file, contents);
        this.scheduleNotification();
    }
    scheduleNotification() {
        if (this.pendingFlush !== null ||
            this.notifyFileChanges === null ||
            this.pendingFileChanges.size === 0) {
            return;
        }
        // Finish multi-file edits and their source-mutation receipts before compiling.
        this.pendingFlush = setImmediate(() => {
            var _a;
            this.pendingFlush = null;
            const files = new Map(this.pendingFileChanges);
            this.pendingFileChanges.clear();
            if (files.size > 0)
                (_a = this.notifyFileChanges) === null || _a === void 0 ? void 0 : _a.call(this, files);
        });
    }
    isAlreadyNotified(file) {
        const notified = this.notifiedFiles.get(file);
        if (!notified)
            return false;
        let contents;
        try {
            contents = (0, node_fs_1.readFileSync)(file, 'utf8');
        }
        catch (error) {
            if (error.code !== 'ENOENT')
                return false;
            contents = null;
        }
        if (contents === notified.contents)
            return true;
        this.notifiedFiles.delete(file);
        return false;
    }
    isAlreadyNotifiedDirectory(directory, timestamps) {
        var _a, _b;
        if (!timestamps || !this.notifiedDirectories.has(directory))
            return false;
        const prefix = directory + node_path_1.default.sep;
        const files = new Set([
            ...this.notifiedDirectoryContents.keys(),
            ...timestamps.keys(),
        ]);
        for (const file of files) {
            if ((file !== directory && !file.startsWith(prefix)) ||
                this.isAlreadyNotified(file))
                continue;
            const expected = (_a = this.notifiedDirectoryContents.get(file)) !== null && _a !== void 0 ? _a : null;
            const entry = timestamps.get(file);
            const actual = entry ? ((_b = entry.timestamp) !== null && _b !== void 0 ? _b : true) : null;
            if (expected !== actual)
                return false;
        }
        return true;
    }
    consumeNotifiedSuppression(file, timestamps) {
        var _a;
        for (const suppressed of this.filesToIgnore.keys()) {
            if (suppressed !== file &&
                (!suppressed.startsWith(file + node_path_1.default.sep) ||
                    !this.isAlreadyNotified(suppressed)))
                continue;
            for (const [dir, snapshot] of this.snapshotDirectoryContents) {
                if (suppressed.startsWith(dir + node_path_1.default.sep)) {
                    snapshot.set(suppressed, (_a = timestamps === null || timestamps === void 0 ? void 0 : timestamps.get(suppressed)) !== null && _a !== void 0 ? _a : null);
                }
            }
            this.filesToIgnore.delete(suppressed);
            this.snapshotFileTimestamps.delete(suppressed);
            this.suppressedFilesHistory.add(suppressed);
        }
        if (this.dirsToIgnore.has(file) &&
            ![...this.filesToIgnore.keys()].some((pending) => pending.startsWith(file + node_path_1.default.sep))) {
            this.dirsToIgnore.delete(file);
            this.snapshotDirTimestamps.delete(file);
            this.snapshotDirectoryContents.delete(file);
        }
    }
    unignoreNextChange(file) {
        this.filesToIgnore.delete(file);
        this.snapshotFileTimestamps.delete(file);
        for (let dir = node_path_1.default.dirname(file); dir !== node_path_1.default.dirname(dir); dir = node_path_1.default.dirname(dir)) {
            this.dirsToIgnore.delete(dir);
            this.snapshotDirTimestamps.delete(dir);
            this.snapshotDirectoryContents.delete(dir);
        }
    }
    // Returns and clears the list of files whose changes were previously
    // suppressed. Caller can use this to e.g. touch the files later and
    // trigger a real rebuild.
    consumeSuppressedFilesHistory() {
        const files = [...this.suppressedFilesHistory];
        this.suppressedFilesHistory.clear();
        return files;
    }
    consumeSuppressedFilesForRebuild(onlyFile = null) {
        // Include writes whose watcher event has not arrived yet.
        const candidates = onlyFile === null
            ? new Set([
                ...this.suppressedFilesHistory,
                ...this.filesToIgnore.keys(),
            ])
            : [onlyFile];
        const files = [];
        for (const file of candidates) {
            const wasSuppressed = this.suppressedFilesHistory.delete(file);
            if (wasSuppressed || this.filesToIgnore.has(file)) {
                files.push(file);
                this.requireRebuild(file);
            }
        }
        return files;
    }
    apply(compiler) {
        compiler.hooks.watchClose.tap('WatchIgnoreNextChangePlugin', () => {
            if (this.pendingFlush !== null)
                clearImmediate(this.pendingFlush);
            this.pendingFlush = null;
            this.notifyFileChanges = null;
            this.pendingFileChanges.clear();
            this.notifiedFiles.clear();
            this.notifiedDirectories.clear();
            this.notifiedDirectoryContents.clear();
            this.snapshotDirectoryContents.clear();
        });
        compiler.hooks.afterEnvironment.tap('WatchIgnoreNextChangePlugin', () => {
            const wfs = compiler.watchFileSystem;
            if (!(wfs === null || wfs === void 0 ? void 0 : wfs.watch)) {
                return;
            }
            const originalWatch = wfs.watch.bind(wfs);
            const self = this;
            wfs.watch = (files, directories, missing, startTime, options, callback, callbackUndelayed) => {
                const watchedDirectories = new Set(directories);
                const wrappedCallbackUndelayed = (fileName, changeTime) => {
                    var _a, _b, _c;
                    var _d, _e, _f, _g, _h;
                    self.releaseChangedSuppressions();
                    const info = self.dirsToIgnore.has(fileName) ||
                        self.notifiedDirectories.has(fileName)
                        ? (_b = (_a = self.currentWatcher) === null || _a === void 0 ? void 0 : _a.getInfo) === null || _b === void 0 ? void 0 : _b.call(_a)
                        : null;
                    if ((!self.notifying &&
                        (self.isAlreadyNotified(fileName) ||
                            (self.notifiedDirectories.has(fileName) &&
                                self.isAlreadyNotifiedDirectory(fileName, (_e = (_d = info === null || info === void 0 ? void 0 : info.fileTimeInfoEntries) !== null && _d !== void 0 ? _d : (_c = self.currentWatcher) === null || _c === void 0 ? void 0 : _c.getFileTimeInfoEntries()) !== null && _e !== void 0 ? _e : null)))) ||
                        self.filesToIgnore.has(fileName) ||
                        (self.dirsToIgnore.has(fileName) &&
                            self.isIgnoredDirectory(fileName, (_f = info === null || info === void 0 ? void 0 : info.fileTimeInfoEntries) !== null && _f !== void 0 ? _f : null, (_g = info === null || info === void 0 ? void 0 : info.changes) !== null && _g !== void 0 ? _g : null, (_h = info === null || info === void 0 ? void 0 : info.removals) !== null && _h !== void 0 ? _h : null))) {
                        self.trace('[WatchIgnoreNextChange] Suppressed callbackUndelayed for', fileName);
                        return;
                    }
                    callbackUndelayed(fileName, changeTime);
                };
                const wrappedCallback = (err, fileTimestamps, dirTimestamps, changedFiles, removedFiles) => {
                    var _a, _b, _c, _d;
                    self.releaseChangedSuppressions();
                    const ignoredDirs = [...self.dirsToIgnore].filter((dir) => self.isIgnoredDirectory(dir, fileTimestamps !== null && fileTimestamps !== void 0 ? fileTimestamps : null, changedFiles !== null && changedFiles !== void 0 ? changedFiles : null, removedFiles !== null && removedFiles !== void 0 ? removedFiles : null));
                    const alreadyNotified = [];
                    if (!self.notifying) {
                        for (const changes of [changedFiles, removedFiles]) {
                            for (const file of changes !== null && changes !== void 0 ? changes : []) {
                                self.pendingFileChanges.delete(file);
                                if (self.isAlreadyNotified(file) ||
                                    self.isAlreadyNotifiedDirectory(file, fileTimestamps !== null && fileTimestamps !== void 0 ? fileTimestamps : null)) {
                                    self.consumeNotifiedSuppression(file, fileTimestamps !== null && fileTimestamps !== void 0 ? fileTimestamps : null);
                                    changes === null || changes === void 0 ? void 0 : changes.delete(file);
                                    alreadyNotified.push(file);
                                }
                            }
                        }
                    }
                    // A rebuild-required write wins over subsequent suppressed writes in
                    // the same watcher batch. Release it only when the watcher sees it.
                    for (const file of changedFiles !== null && changedFiles !== void 0 ? changedFiles : []) {
                        self.filesRequiringRebuild.delete(file);
                    }
                    for (const file of removedFiles !== null && removedFiles !== void 0 ? removedFiles : []) {
                        self.filesRequiringRebuild.delete(file);
                    }
                    const hasIgnoredFiles = self.filesToIgnore.size > 0;
                    const suppressedFiles = [];
                    const suppressedDirs = [];
                    if (fileTimestamps) {
                        for (const file of [...self.filesToIgnore.keys()]) {
                            const wasInChanged = (_a = changedFiles === null || changedFiles === void 0 ? void 0 : changedFiles.has(file)) !== null && _a !== void 0 ? _a : false;
                            if (wasInChanged) {
                                changedFiles.delete(file);
                                const timestamp = fileTimestamps.get(file);
                                for (const [dir, snapshot] of self.snapshotDirectoryContents) {
                                    if (file.startsWith(dir + node_path_1.default.sep)) {
                                        snapshot.set(file, timestamp !== null && timestamp !== void 0 ? timestamp : null);
                                    }
                                }
                            }
                            const prev = self.snapshotFileTimestamps.get(file);
                            if (prev !== undefined) {
                                fileTimestamps.set(file, prev);
                            }
                            if (wasInChanged) {
                                suppressedFiles.push(file);
                                self.suppressedFilesHistory.add(file);
                                self.filesToIgnore.delete(file);
                                self.snapshotFileTimestamps.delete(file);
                            }
                        }
                    }
                    if (dirTimestamps) {
                        for (const dir of ignoredDirs) {
                            const wasInChanged = (_b = changedFiles === null || changedFiles === void 0 ? void 0 : changedFiles.has(dir)) !== null && _b !== void 0 ? _b : false;
                            if (wasInChanged) {
                                changedFiles.delete(dir);
                            }
                            const prev = self.snapshotDirTimestamps.get(dir);
                            if (prev !== undefined) {
                                dirTimestamps.set(dir, prev);
                            }
                            if (wasInChanged) {
                                suppressedDirs.push(dir);
                                self.dirsToIgnore.delete(dir);
                                self.snapshotDirTimestamps.delete(dir);
                                self.snapshotDirectoryContents.delete(dir);
                            }
                        }
                    }
                    if (removedFiles) {
                        for (const file of self.filesToIgnore.keys()) {
                            removedFiles.delete(file);
                        }
                        for (const dir of ignoredDirs) {
                            removedFiles.delete(dir);
                        }
                    }
                    const remainingChanges = (_c = changedFiles === null || changedFiles === void 0 ? void 0 : changedFiles.size) !== null && _c !== void 0 ? _c : 0;
                    const remainingRemovals = (_d = removedFiles === null || removedFiles === void 0 ? void 0 : removedFiles.size) !== null && _d !== void 0 ? _d : 0;
                    if ((hasIgnoredFiles ||
                        suppressedDirs.length > 0 ||
                        alreadyNotified.length > 0) &&
                        remainingChanges === 0 &&
                        remainingRemovals === 0) {
                        self.trace('[WatchIgnoreNextChange] All changes suppressed, re-registering watcher. Suppressed files:', suppressedFiles, 'dirs:', suppressedDirs);
                        // Don't call the callback — that would trigger _invalidate() → compile().
                        // Instead, re-register the watchpack listeners and unpause,
                        // so the watch loop stays alive for future changes.
                        // NodeWatchFileSystem uses:
                        //   this.watcher.once("change", callbackUndelayed)
                        //   this.watcher.once("aggregated", (changes, removals) => { this.watcher.pause(); callback(...) })
                        // After "aggregated" fires, the watcher is paused and the .once listeners are consumed.
                        // We need to restore them.
                        const watchpack = wfs.watcher;
                        if (watchpack) {
                            watchpack.once('change', wrappedCallbackUndelayed);
                            watchpack.once('aggregated', (...args) => {
                                const changes = args[0];
                                const removals = args[1];
                                watchpack.pause();
                                const fs = wfs.inputFileSystem;
                                if (fs === null || fs === void 0 ? void 0 : fs.purge) {
                                    for (const item of changes) {
                                        fs.purge(item);
                                    }
                                    for (const item of removals) {
                                        fs.purge(item);
                                    }
                                }
                                const fetchedFileTimestamps = new Map();
                                const fetchedContextTimestamps = new Map();
                                watchpack.collectTimeInfoEntries(fetchedFileTimestamps, fetchedContextTimestamps);
                                wrappedCallback(null, fetchedFileTimestamps, fetchedContextTimestamps, changes, removals);
                            });
                            watchpack.paused = false;
                            // Clear suppressed files from accumulated changes.
                            // While paused, watchpack's _onChange still adds to
                            // aggregatedChanges. If we don't clear them, unpausing
                            // will cause the same files to re-trigger via _onTimeout.
                            for (const file of [...suppressedFiles, ...alreadyNotified]) {
                                watchpack.aggregatedChanges.delete(file);
                                watchpack.aggregatedRemovals.delete(file);
                            }
                            for (const dir of suppressedDirs) {
                                watchpack.aggregatedChanges.delete(dir);
                                watchpack.aggregatedRemovals.delete(dir);
                            }
                        }
                        else {
                            callback(err, fileTimestamps, dirTimestamps, changedFiles, removedFiles);
                        }
                        return;
                    }
                    if (hasIgnoredFiles) {
                        self.trace('[WatchIgnoreNextChange] Partial suppression. Remaining changes:', changedFiles ? [...changedFiles] : []);
                    }
                    callback(err, fileTimestamps, dirTimestamps, changedFiles, removedFiles);
                };
                const watcher = originalWatch(files, directories, missing, startTime, options, wrappedCallback, wrappedCallbackUndelayed);
                self.currentWatcher = watcher;
                const originalGetFileTimeInfoEntries = watcher.getFileTimeInfoEntries.bind(watcher);
                watcher.getFileTimeInfoEntries = () => {
                    self.releaseChangedSuppressions();
                    const entries = originalGetFileTimeInfoEntries();
                    for (const [file, notified] of self.notifiedFiles) {
                        if (self.isAlreadyNotified(file))
                            entries.set(file, notified.timestamp);
                    }
                    for (const file of self.filesToIgnore.keys()) {
                        const prev = self.snapshotFileTimestamps.get(file);
                        if (prev !== undefined) {
                            entries.set(file, prev);
                        }
                    }
                    return entries;
                };
                const originalGetContextTimeInfoEntries = watcher.getContextTimeInfoEntries.bind(watcher);
                watcher.getContextTimeInfoEntries = () => {
                    self.releaseChangedSuppressions();
                    const entries = originalGetContextTimeInfoEntries();
                    const fileTimestamps = originalGetFileTimeInfoEntries();
                    for (const dir of self.dirsToIgnore) {
                        if (!self.isIgnoredDirectory(dir, fileTimestamps, null, null))
                            continue;
                        const prev = self.snapshotDirTimestamps.get(dir);
                        if (prev !== undefined) {
                            entries.set(dir, prev);
                        }
                    }
                    return entries;
                };
                if (watcher.getInfo) {
                    const originalGetInfo = watcher.getInfo.bind(watcher);
                    watcher.getInfo = () => {
                        self.releaseChangedSuppressions();
                        const info = originalGetInfo();
                        const ignoredDirs = [...self.dirsToIgnore].filter((dir) => self.isIgnoredDirectory(dir, info.fileTimeInfoEntries, info.changes, info.removals));
                        if (!self.notifying) {
                            for (const changes of [info.changes, info.removals]) {
                                for (const file of changes) {
                                    if (self.isAlreadyNotified(file) ||
                                        self.isAlreadyNotifiedDirectory(file, info.fileTimeInfoEntries)) {
                                        self.consumeNotifiedSuppression(file, info.fileTimeInfoEntries);
                                        changes.delete(file);
                                    }
                                }
                            }
                        }
                        for (const [file, notified] of self.notifiedFiles) {
                            if (self.isAlreadyNotified(file))
                                info.fileTimeInfoEntries.set(file, notified.timestamp);
                        }
                        for (const file of self.filesToIgnore.keys()) {
                            info.changes.delete(file);
                            const prev = self.snapshotFileTimestamps.get(file);
                            if (prev !== undefined) {
                                info.fileTimeInfoEntries.set(file, prev);
                            }
                        }
                        for (const dir of ignoredDirs) {
                            info.changes.delete(dir);
                            const prev = self.snapshotDirTimestamps.get(dir);
                            if (prev !== undefined) {
                                info.contextTimeInfoEntries.set(dir, prev);
                            }
                        }
                        return info;
                    };
                }
                if (watcher.getAggregatedChanges) {
                    const originalGetAggregatedChanges = watcher.getAggregatedChanges.bind(watcher);
                    watcher.getAggregatedChanges = () => {
                        self.releaseChangedSuppressions();
                        const changes = originalGetAggregatedChanges();
                        const fileTimestamps = originalGetFileTimeInfoEntries();
                        const ignoredDirs = [...self.dirsToIgnore].filter((dir) => self.isIgnoredDirectory(dir, fileTimestamps, changes, null));
                        for (const file of self.filesToIgnore.keys()) {
                            changes.delete(file);
                        }
                        for (const dir of ignoredDirs) {
                            changes.delete(dir);
                        }
                        return changes;
                    };
                }
                self.notifyFileChanges = (notifications) => {
                    var _a, _b, _c, _d, _e;
                    var _f;
                    const info = (_f = (_a = watcher.getInfo) === null || _a === void 0 ? void 0 : _a.call(watcher)) !== null && _f !== void 0 ? _f : {
                        changes: new Set(),
                        removals: new Set(),
                        fileTimeInfoEntries: watcher.getFileTimeInfoEntries(),
                        contextTimeInfoEntries: watcher.getContextTimeInfoEntries(),
                    };
                    const now = Date.now();
                    for (const [file, contents] of notifications) {
                        const stat = (0, node_fs_1.statSync)(file, { throwIfNoEntry: false });
                        const timestamp = stat
                            ? { timestamp: stat.mtimeMs, safeTime: now }
                            : null;
                        self.notifiedFiles.set(file, { contents, timestamp });
                        info.fileTimeInfoEntries.set(file, timestamp);
                        if (stat) {
                            info.changes.add(file);
                            info.removals.delete(file);
                        }
                        else {
                            info.changes.delete(file);
                            info.removals.add(file);
                        }
                        (_c = (_b = wfs.inputFileSystem).purge) === null || _c === void 0 ? void 0 : _c.call(_b, file);
                    }
                    self.notifiedDirectoryContents = new Map([...info.fileTimeInfoEntries].map(([file, entry]) => {
                        var _a;
                        return [
                            file,
                            entry ? ((_a = entry.timestamp) !== null && _a !== void 0 ? _a : true) : null,
                        ];
                    }));
                    for (const file of notifications.keys()) {
                        for (let dir = node_path_1.default.dirname(file); dir !== node_path_1.default.dirname(dir); dir = node_path_1.default.dirname(dir)) {
                            if (watchedDirectories.has(dir)) {
                                info.changes.add(dir);
                                info.removals.delete(dir);
                                info.contextTimeInfoEntries.set(dir, {
                                    timestamp: now,
                                    safeTime: now,
                                });
                                (_e = (_d = wfs.inputFileSystem).purge) === null || _e === void 0 ? void 0 : _e.call(_d, dir);
                            }
                            self.notifiedDirectories.add(dir);
                            self.notifiedDirectoryContents.set(dir, true);
                        }
                    }
                    self.notifying = true;
                    try {
                        const { watching } = compiler;
                        if (watching &&
                            'invalidateWithChangesAndRemovals' in watching &&
                            typeof watching.invalidateWithChangesAndRemovals === 'function') {
                            for (const file of info.changes)
                                self.filesRequiringRebuild.delete(file);
                            for (const file of info.removals)
                                self.filesRequiringRebuild.delete(file);
                            watching.invalidateWithChangesAndRemovals(info.changes, info.removals);
                        }
                        else {
                            wrappedCallbackUndelayed(notifications.keys().next().value, now);
                            wrappedCallback(null, info.fileTimeInfoEntries, info.contextTimeInfoEntries, info.changes, info.removals);
                        }
                    }
                    finally {
                        self.notifying = false;
                    }
                };
                self.scheduleNotification();
                return watcher;
            };
        });
    }
}
exports.WatchIgnoreNextChangePlugin = WatchIgnoreNextChangePlugin;
