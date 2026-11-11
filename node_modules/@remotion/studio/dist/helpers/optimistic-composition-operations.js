"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCompositionsWithoutPendingDeletions = exports.useOptimisticCompositionOperations = exports.applyOptimisticCompositionOperations = exports.applyOptimisticCompositionOperation = exports.observeCompositionOperationsBuild = exports.getActiveOptimisticCompositionOperations = void 0;
const react_1 = require("react");
const create_folder_tree_1 = require("./create-folder-tree");
const persist_open_folders_1 = require("./persist-open-folders");
const use_sync_external_store_1 = require("./use-sync-external-store");
// Hashes of reported builds, oldest first.
const buildHashes = [];
const isBuildInstalled = (hash) => {
    const installed = typeof __webpack_hash__ === 'string' ? __webpack_hash__ : null;
    if (hash === null || installed === null) {
        return true;
    }
    const index = buildHashes.lastIndexOf(hash);
    return index === -1 || buildHashes.lastIndexOf(installed) >= index;
};
let pending = [];
let getRegistrySnapshot = null;
const listeners = new Set();
const setPending = (next) => {
    if (next === pending) {
        return;
    }
    pending = next;
    for (const listener of listeners) {
        listener();
    }
};
const subscribe = (listener) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
const getPending = () => pending;
const getTreeShape = (items) => items.map((item) => item.type === 'composition'
    ? item.composition.id
    : [item.folderName, getTreeShape(item.items)]);
// Returns the entries that still have to be projected onto `snapshot`. Live
// registry updates (for example metadata from React state) do not retire an
// edit, only a reported build or a registry that already contains the edit.
const reconcile = (entries, snapshot) => {
    let tree = null;
    let oldest = true;
    const next = entries.filter(({ operation, status, build }) => {
        if (status === 'built' &&
            build !== null &&
            (build.baseline.compositions !== snapshot.compositions ||
                build.baseline.folders !== snapshot.folders) &&
            isBuildInstalled(build.hash)) {
            return false;
        }
        // Only the oldest edit can be compared with the registry. Newer edits were
        // made on top of edits whose source may not have been reloaded yet.
        if (oldest && status !== 'saving') {
            if (operation.type === 'delete') {
                if (!snapshot.compositions.some(({ id }) => id === operation.compositionId)) {
                    return false;
                }
            }
            else {
                tree !== null && tree !== void 0 ? tree : (tree = (0, create_folder_tree_1.createFolderTree)(snapshot.compositions, snapshot.folders, {}));
                const moved = applyMove({ tree, operation, foldersExpanded: {} });
                if (moved !== null &&
                    JSON.stringify(getTreeShape(moved)) ===
                        JSON.stringify(getTreeShape(tree))) {
                    return false;
                }
            }
        }
        oldest = false;
        return true;
    });
    return next.length === entries.length ? entries : next;
};
const getActiveOptimisticCompositionOperations = (snapshot) => reconcile(pending, snapshot).map(({ operation }) => operation);
exports.getActiveOptimisticCompositionOperations = getActiveOptimisticCompositionOperations;
// Called for every hot reload message. Edits persisted before a successful
// build are contained in it.
const observeCompositionOperationsBuild = (event) => {
    var _a;
    if ((event.action !== 'built' && event.action !== 'sync') ||
        event.errors.length > 0) {
        return;
    }
    if (event.hash !== undefined) {
        buildHashes.push(event.hash);
        if (buildHashes.length > 100) {
            buildHashes.shift();
        }
    }
    if (getRegistrySnapshot === null ||
        !pending.some(({ status }) => status === 'saved')) {
        return;
    }
    const build = { hash: (_a = event.hash) !== null && _a !== void 0 ? _a : null, baseline: getRegistrySnapshot() };
    setPending(pending.map((entry) => entry.status === 'saved' ? { ...entry, status: 'built', build } : entry));
};
exports.observeCompositionOperationsBuild = observeCompositionOperationsBuild;
// Shows the operation immediately and keeps it until hot reload delivers the
// persisted source. Failed edits roll back only their own operation, so newer
// queued edits stay visible.
const applyOptimisticCompositionOperation = async ({ operation, getSnapshot, persist, }) => {
    getRegistrySnapshot = getSnapshot;
    const entry = {
        operation,
        status: 'saving',
        build: null,
    };
    setPending([...pending, entry]);
    const settle = (success) => {
        setPending(reconcile(pending.flatMap((candidate) => {
            if (candidate !== entry) {
                return [candidate];
            }
            return success
                ? [{ operation, status: 'saved', build: null }]
                : [];
        }), getSnapshot()));
    };
    try {
        const result = await persist();
        settle(result.success);
        return result;
    }
    catch (error) {
        settle(false);
        throw error;
    }
};
exports.applyOptimisticCompositionOperation = applyOptimisticCompositionOperation;
const getFolderPath = ({ folderName, parentName, }) => [parentName, folderName].filter(Boolean).join('/');
const matchesDescriptor = (item, descriptor) => descriptor.type === 'composition'
    ? item.type === 'composition' &&
        item.composition.id === descriptor.compositionId
    : item.type === 'folder' &&
        item.folderName === descriptor.folderName &&
        item.parentName === descriptor.parentName;
const moveIntoFolderPath = ({ item, folderPath, foldersExpanded, }) => {
    var _a;
    if (item.type === 'composition') {
        const { name, parent } = (0, create_folder_tree_1.splitParentIntoNameAndParent)(folderPath);
        if (item.composition.folderName === name &&
            item.composition.parentFolderName === parent) {
            return item;
        }
        return {
            ...item,
            composition: {
                ...item.composition,
                folderName: name,
                parentFolderName: parent,
            },
        };
    }
    if (item.parentName === folderPath) {
        return item;
    }
    const nextPath = getFolderPath({
        folderName: item.folderName,
        parentName: folderPath,
    });
    return {
        ...item,
        parentName: folderPath,
        folder: { ...item.folder, parent: folderPath },
        expanded: (_a = foldersExpanded[(0, persist_open_folders_1.openFolderKey)({ folderName: item.folderName, parentName: folderPath })]) !== null && _a !== void 0 ? _a : false,
        items: item.items.map((child) => moveIntoFolderPath({ item: child, folderPath: nextPath, foldersExpanded })),
    };
};
const replaceAt = (items, index, replacement, deleteCount) => [
    ...items.slice(0, index),
    ...replacement,
    ...items.slice(index + deleteCount),
];
const removeFromTree = (items, descriptor) => {
    for (let index = 0; index < items.length; index++) {
        const item = items[index];
        if (matchesDescriptor(item, descriptor)) {
            return { items: replaceAt(items, index, [], 1), removed: item };
        }
        if (item.type === 'folder') {
            const result = removeFromTree(item.items, descriptor);
            if (result.removed !== null) {
                return {
                    items: replaceAt(items, index, [{ ...item, items: result.items }], 1),
                    removed: result.removed,
                };
            }
        }
    }
    return { items, removed: null };
};
// Mirrors the codemod: root and folder destinations append the item at the end.
const insertIntoTree = ({ items, item, destination, folderPath, foldersExpanded, }) => {
    if (destination.type === 'root') {
        return [
            ...items,
            moveIntoFolderPath({ item, folderPath: null, foldersExpanded }),
        ];
    }
    for (let index = 0; index < items.length; index++) {
        const candidate = items[index];
        if (destination.type !== 'folder') {
            if (matchesDescriptor(candidate, destination.target)) {
                return replaceAt(items, destination.type === 'before' ? index : index + 1, [moveIntoFolderPath({ item, folderPath, foldersExpanded })], 0);
            }
        }
        else if (candidate.type === 'folder' &&
            candidate.folderName === destination.folderName &&
            candidate.parentName === destination.parentName) {
            return replaceAt(items, index, [
                {
                    ...candidate,
                    items: [
                        ...candidate.items,
                        moveIntoFolderPath({
                            item,
                            folderPath: getFolderPath(candidate),
                            foldersExpanded,
                        }),
                    ],
                },
            ], 1);
        }
        if (candidate.type === 'folder') {
            const children = insertIntoTree({
                items: candidate.items,
                item,
                destination,
                folderPath: getFolderPath(candidate),
                foldersExpanded,
            });
            if (children !== null) {
                return replaceAt(items, index, [{ ...candidate, items: children }], 1);
            }
        }
    }
    return null;
};
const appendSourceFileRemap = (item, remap) => {
    const sourceFileRemaps = [...item.sourceFileRemaps, remap];
    return item.type === 'composition'
        ? { ...item, sourceFileRemaps }
        : {
            ...item,
            sourceFileRemaps,
            items: item.items.map((child) => appendSourceFileRemap(child, remap)),
        };
};
const applyMove = ({ tree, operation, foldersExpanded, }) => {
    const { items, removed } = removeFromTree(tree, operation.item);
    if (removed === null) {
        return null;
    }
    // Rows moved into another file must report that file, so follow-up edits
    // queued before hot reload address the registration where it will be.
    const { sourceFile, destinationFile } = operation;
    return insertIntoTree({
        items,
        item: sourceFile !== null &&
            destinationFile !== null &&
            sourceFile !== destinationFile
            ? appendSourceFileRemap(removed, {
                from: sourceFile,
                to: destinationFile,
            })
            : removed,
        destination: operation.destination,
        folderPath: null,
        foldersExpanded,
    });
};
const applyOptimisticCompositionOperations = ({ items, operations, foldersExpanded, }) => {
    return operations.reduce((tree, operation) => {
        var _a;
        if (operation.type === 'delete') {
            return removeFromTree(tree, {
                type: 'composition',
                compositionId: operation.compositionId,
            }).items;
        }
        return (_a = applyMove({ tree, operation, foldersExpanded })) !== null && _a !== void 0 ? _a : tree;
    }, items);
};
exports.applyOptimisticCompositionOperations = applyOptimisticCompositionOperations;
const useOptimisticCompositionOperations = ({ compositions, folders, }) => {
    const all = (0, use_sync_external_store_1.useSyncExternalStore)(subscribe, getPending, getPending);
    (0, react_1.useEffect)(() => {
        setPending(reconcile(pending, { compositions, folders }));
    }, [compositions, folders]);
    return (0, react_1.useMemo)(() => reconcile(all, { compositions, folders }).map(({ operation }) => operation), [all, compositions, folders]);
};
exports.useOptimisticCompositionOperations = useOptimisticCompositionOperations;
// Navigation targets: compositions that are not being deleted.
const useCompositionsWithoutPendingDeletions = (snapshot) => {
    const operations = (0, exports.useOptimisticCompositionOperations)(snapshot);
    const { compositions } = snapshot;
    return (0, react_1.useMemo)(() => {
        const deleted = new Set(operations.flatMap((operation) => operation.type === 'delete' ? [operation.compositionId] : []));
        return deleted.size === 0
            ? compositions
            : compositions.filter(({ id }) => !deleted.has(id));
    }, [compositions, operations]);
};
exports.useCompositionsWithoutPendingDeletions = useCompositionsWithoutPendingDeletions;
