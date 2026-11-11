"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOptimisticEffects = exports.OptimisticEffects = void 0;
const react_1 = require("react");
const optimistic_effect_prop_statuses_js_1 = require("./optimistic-effect-prop-statuses.js");
const use_sync_external_store_js_1 = require("./use-sync-external-store.js");
const entries = new Map();
const listeners = new Set();
const nodeListeners = new Map();
const installedMutations = new Set();
const acknowledgedMutations = new Set();
let activeSourceRevision = null;
let nextId = 0;
let nextOperation = 0;
let snapshot = [];
const emptyItems = [];
const keyForNode = (node) => JSON.stringify([node.absolutePath, node.nodePath]);
const apply = (entry, items, operation) => {
    var _a;
    const { action } = operation;
    if (action.type === 'restore') {
        const fromIds = new Set(action.fromItems.map((item) => item.id));
        const targetIds = new Set(action.items.map((item) => item.id));
        const restored = items.filter((item) => !fromIds.has(item.id) || targetIds.has(item.id));
        for (let targetIndex = 0; targetIndex < action.items.length; targetIndex++) {
            const target = action.items[targetIndex];
            const existingIndex = restored.findIndex((item) => item.id === target.id);
            const isMove = action.movedIds.includes(target.id) && existingIndex !== -1;
            if (!isMove && (fromIds.has(target.id) || existingIndex !== -1))
                continue;
            const restoredItem = isMove
                ? restored.splice(existingIndex, 1)[0]
                : ((_a = entry.recipes.get(target.id)) !== null && _a !== void 0 ? _a : target);
            const following = action.items
                .slice(targetIndex + 1)
                .find((item) => restored.some((current) => current.id === item.id));
            const preceding = action.items
                .slice(0, targetIndex)
                .reverse()
                .find((item) => restored.some((current) => current.id === item.id));
            const position = following
                ? restored.findIndex((item) => item.id === following.id)
                : preceding
                    ? restored.findIndex((item) => item.id === preceding.id) + 1
                    : restored.length;
            restored.splice(position, 0, restoredItem);
        }
        return restored;
    }
    if (action.type === 'delete') {
        if (action.ids.some((id) => !items.some((item) => item.id === id)))
            return null;
        return items.filter((item) => !action.ids.includes(item.id));
    }
    if (action.type === 'duplicate') {
        if (action.ids.some((id) => !items.some((item) => item.id === id)))
            return null;
        return items.flatMap((item) => {
            const index = action.ids.indexOf(item.id);
            return index === -1
                ? [item]
                : [item, entry.recipes.get(operation.addedIds[index])];
        });
    }
    if (action.beforeId !== null &&
        !items.some((item) => item.id === action.beforeId))
        return null;
    if (action.type === 'add') {
        const index = action.beforeId === null
            ? items.length
            : items.findIndex((item) => item.id === action.beforeId);
        return [
            ...items.slice(0, index),
            entry.recipes.get(operation.addedIds[0]),
            ...items.slice(index),
        ];
    }
    const moving = items.find((candidate) => candidate.id === action.id);
    if (!moving)
        return null;
    if (action.beforeId === action.id)
        return items;
    const remaining = items.filter((candidate) => candidate !== moving);
    const destination = action.beforeId === null
        ? remaining.length
        : remaining.findIndex((candidate) => candidate.id === action.beforeId);
    return [
        ...remaining.slice(0, destination),
        moving,
        ...remaining.slice(destination),
    ];
};
const update = (entry) => {
    var _a;
    let items = entry.compiled;
    let persisted = entry.compiled;
    for (const operation of entry.operations) {
        if (operation.status !== 'queued' && operation.status !== 'acknowledged')
            continue;
        const result = apply(entry, items, operation);
        if (result === null) {
            operation.status = 'cancelled';
            continue;
        }
        items = result;
        if (operation.status === 'acknowledged') {
            persisted = (_a = apply(entry, persisted, operation)) !== null && _a !== void 0 ? _a : persisted;
        }
    }
    if (!entry.operations.some((operation) => operation.status === 'queued' || operation.status === 'acknowledged')) {
        entry.frozenRuntime = false;
        entry.refreshMutationIds.clear();
    }
    const compiledIndexes = new Map(entry.compiled.map((item, index) => [item.id, index]));
    const persistedIndexes = new Map(persisted.map((item, index) => [item.id, index]));
    const describe = (item) => {
        var _a, _b;
        let origin = item;
        const visited = new Set();
        while (!compiledIndexes.has(origin.id) &&
            origin.originId !== null &&
            !visited.has(origin.id)) {
            visited.add(origin.id);
            const previous = entry.recipes.get(origin.originId);
            if (!previous)
                break;
            origin = previous;
        }
        const sourceIndex = (_a = compiledIndexes.get(origin.id)) !== null && _a !== void 0 ? _a : null;
        return {
            ...item,
            descriptor: sourceIndex === null ? origin.descriptor : null,
            sourceIndex,
            runtimeSourceIndex: sourceIndex,
            persistedIndex: (_b = persistedIndexes.get(item.id)) !== null && _b !== void 0 ? _b : null,
            propStatuses: optimistic_effect_prop_statuses_js_1.OptimisticEffectPropStatuses.get(entry.nodePath, item.id),
        };
    };
    entry.snapshot = {
        nodePath: entry.nodePath,
        compiledItems: entry.compiled.map(describe),
        persistedItems: persisted.map(describe),
        items: items.map(describe),
        operations: [...entry.operations],
    };
};
const publish = (keys) => {
    var _a;
    snapshot = [...entries.values()].map((entry) => entry.snapshot);
    for (const key of new Set(keys)) {
        for (const listener of (_a = nodeListeners.get(key)) !== null && _a !== void 0 ? _a : [])
            listener();
    }
    for (const listener of listeners)
        listener();
};
const settleEntry = (entry) => {
    var _a;
    let last = -1;
    for (let index = 0; index < entry.operations.length; index++) {
        const operation = entry.operations[index];
        if (operation.status === 'queued')
            break;
        if (operation.status === 'acknowledged' &&
            operation.mutationId !== null &&
            installedMutations.has(operation.mutationId))
            last = index;
    }
    if (last === -1)
        return false;
    let { compiled } = entry;
    for (const operation of entry.operations.splice(0, last + 1)) {
        if (operation.status !== 'acknowledged')
            continue;
        compiled = (_a = apply(entry, compiled, operation)) !== null && _a !== void 0 ? _a : compiled;
        operation.status = 'settled';
    }
    entry.compiled = compiled.map((item) => ({
        ...item,
        originId: item.id,
        descriptor: null,
    }));
    for (const item of entry.compiled)
        entry.recipes.set(item.id, item);
    update(entry);
    return true;
};
const subscribeToKey = (key, listener) => {
    var _a;
    if (key === null)
        return () => undefined;
    const current = (_a = nodeListeners.get(key)) !== null && _a !== void 0 ? _a : new Set();
    current.add(listener);
    nodeListeners.set(key, current);
    return () => {
        current.delete(listener);
        if (current.size === 0)
            nodeListeners.delete(key);
    };
};
const ensure = (nodePath, definitions) => {
    const key = keyForNode(nodePath);
    const previous = entries.get(key);
    if (previous)
        return previous;
    const compiled = definitions.map((definition) => {
        const id = `effect-${++nextId}`;
        return { id, definition, originId: id, descriptor: null };
    });
    const entry = {
        nodePath,
        compiled,
        operations: [],
        recipes: new Map(compiled.map((item) => [item.id, item])),
        frozenRuntime: false,
        refreshPending: false,
        refreshMutationIds: new Set(),
        refreshSourceRevision: null,
        snapshot: {
            nodePath,
            compiledItems: [],
            persistedItems: [],
            items: [],
            operations: [],
        },
    };
    update(entry);
    entries.set(key, entry);
    snapshot = [...entries.values()].map((item) => item.snapshot);
    return entry;
};
optimistic_effect_prop_statuses_js_1.OptimisticEffectPropStatuses.subscribe((nodePath) => {
    const entry = entries.get(keyForNode(nodePath));
    if (!entry)
        return;
    update(entry);
    publish([keyForNode(nodePath)]);
});
const entryForEffect = (nodePath, id) => {
    const entry = entries.get(keyForNode(nodePath));
    if (entry === null || entry === void 0 ? void 0 : entry.recipes.has(id))
        return entry;
    return [...entries.values()].find((candidate) => candidate.recipes.has(id));
};
const releaseRefreshedRuntimes = () => {
    const changed = [];
    for (const [key, entry] of entries) {
        if (!entry.frozenRuntime ||
            entry.refreshPending ||
            (entry.refreshSourceRevision !== null &&
                entry.refreshSourceRevision === activeSourceRevision &&
                [...entry.refreshMutationIds].some((id) => !acknowledgedMutations.has(id))))
            continue;
        entry.frozenRuntime = false;
        entry.refreshMutationIds.clear();
        update(entry);
        changed.push(key);
    }
    return changed;
};
const acknowledgeOperations = (operations, mutationId) => {
    const changedEntries = new Set();
    for (const operation of operations) {
        const entry = entries.get(keyForNode(operation.nodePath));
        if (!entry || operation.status !== 'queued')
            continue;
        operation.status = 'acknowledged';
        operation.mutationId = mutationId;
        changedEntries.add(entry);
    }
    acknowledgedMutations.add(mutationId);
    const changedKeys = [];
    for (const entry of changedEntries) {
        update(entry);
        settleEntry(entry);
        changedKeys.push(keyForNode(entry.nodePath));
    }
    changedKeys.push(...releaseRefreshedRuntimes());
    if (changedKeys.length > 0)
        publish(changedKeys);
};
exports.OptimisticEffects = {
    get: (nodePath) => { var _a; var _b; return (_b = (_a = entries.get(keyForNode(nodePath))) === null || _a === void 0 ? void 0 : _a.snapshot) !== null && _b !== void 0 ? _b : null; },
    getItems: (nodePath, definitions) => {
        var _a;
        const entry = definitions === null
            ? entries.get(keyForNode(nodePath))
            : ensure(nodePath, definitions);
        return (_a = entry === null || entry === void 0 ? void 0 : entry.snapshot.items) !== null && _a !== void 0 ? _a : emptyItems;
    },
    getSnapshot: () => snapshot,
    startSourceMutation: (revision) => {
        activeSourceRevision = revision;
    },
    finishSourceMutation: (revision) => {
        if (activeSourceRevision === revision)
            activeSourceRevision = null;
        const changed = releaseRefreshedRuntimes();
        if (changed.length > 0)
            publish(changed);
    },
    startRefresh: () => {
        for (const entry of entries.values()) {
            if (entry.operations.some((operation) => operation.status === 'queued' ||
                operation.status === 'acknowledged')) {
                entry.frozenRuntime = true;
                entry.refreshPending = true;
                entry.refreshSourceRevision = activeSourceRevision;
            }
        }
    },
    acknowledgeMutation: (mutationId) => {
        acknowledgedMutations.add(mutationId);
        const changed = releaseRefreshedRuntimes();
        if (changed.length > 0)
            publish(changed);
    },
    getPropStatuses: (nodePath, id) => {
        const entry = entryForEffect(nodePath, id);
        return entry ? optimistic_effect_prop_statuses_js_1.OptimisticEffectPropStatuses.get(entry.nodePath, id) : null;
    },
    setPropStatuses: (nodePath, id, props) => {
        const entry = entryForEffect(nodePath, id);
        if (entry)
            optimistic_effect_prop_statuses_js_1.OptimisticEffectPropStatuses.set(entry.nodePath, id, props);
    },
    subscribe: (listener) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
    subscribeToNode: (nodePath, listener) => subscribeToKey(keyForNode(nodePath), listener),
    begin: ({ nodePath, definitions, action, }) => {
        var _a;
        var _b;
        const entry = ensure(nodePath, definitions);
        if (action.type === 'restore') {
            for (const item of action.items) {
                if (!entry.recipes.has(item.id))
                    entry.recipes.set(item.id, item);
            }
        }
        const added = action.type === 'add'
            ? [
                {
                    id: `effect-${++nextId}`,
                    definition: action.definition,
                    originId: null,
                    descriptor: action.descriptor,
                },
            ]
            : action.type === 'duplicate'
                ? action.ids.map((id) => {
                    const item = entry.snapshot.items.find((candidate) => candidate.id === id);
                    if (!item)
                        throw new Error('The effect is no longer available.');
                    return {
                        id: `effect-${++nextId}`,
                        definition: item.definition,
                        originId: id,
                        descriptor: null,
                    };
                })
                : [];
        for (const item of added)
            entry.recipes.set(item.id, item);
        const operation = {
            id: ++nextOperation,
            get nodePath() {
                return entry.nodePath;
            },
            addedIds: added.map((item) => item.id),
            action: action.type === 'add'
                ? {
                    type: 'add',
                    beforeId: action.index === null
                        ? null
                        : ((_b = (_a = entry.snapshot.items[action.index]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null),
                }
                : action,
            status: 'queued',
            mutationId: null,
        };
        entry.operations.push(operation);
        if (action.type === 'duplicate') {
            action.ids.forEach((id, index) => optimistic_effect_prop_statuses_js_1.OptimisticEffectPropStatuses.copy(entry.nodePath, id, added[index].id));
        }
        update(entry);
        publish([keyForNode(entry.nodePath)]);
        return operation;
    },
    resolveIndex: (nodePath, id) => {
        var _a;
        var _b;
        const index = (_b = (_a = entries
            .get(keyForNode(nodePath))) === null || _a === void 0 ? void 0 : _a.snapshot.persistedItems.findIndex((item) => item.id === id)) !== null && _b !== void 0 ? _b : -1;
        return index < 0 ? null : index;
    },
    getOperationStatus: (operation) => operation.status,
    setAddedDescriptor: (operation, descriptor) => {
        const entry = entries.get(keyForNode(operation.nodePath));
        if (!entry ||
            operation.action.type !== 'add' ||
            operation.status === 'failed' ||
            operation.status === 'cancelled' ||
            operation.status === 'settled')
            return;
        const id = operation.addedIds[0];
        const item = entry.recipes.get(id);
        if (!item)
            return;
        for (const recipe of entry.recipes.values()) {
            let origin = recipe;
            const visited = new Set();
            while (origin.id !== id &&
                origin.originId !== null &&
                !visited.has(origin.id)) {
                visited.add(origin.id);
                const previous = entry.recipes.get(origin.originId);
                if (!previous)
                    break;
                origin = previous;
            }
            if (origin.id !== id)
                continue;
            entry.recipes.set(recipe.id, {
                ...recipe,
                definition: descriptor.definition,
                descriptor: recipe.id === id ? descriptor : recipe.descriptor,
            });
        }
        update(entry);
        publish([keyForNode(entry.nodePath)]);
    },
    acknowledge: (operation, mutationId) => acknowledgeOperations([operation], mutationId),
    acknowledgeOperations,
    settle: (mutationIds) => {
        for (const id of mutationIds)
            installedMutations.add(id);
        const keys = [];
        for (const [key, entry] of entries) {
            if (entry.frozenRuntime) {
                entry.refreshPending = false;
                for (const id of mutationIds)
                    entry.refreshMutationIds.add(id);
            }
            if (settleEntry(entry))
                keys.push(key);
        }
        keys.push(...releaseRefreshedRuntimes());
        if (keys.length > 0)
            publish(keys);
    },
    rollback: (operation) => {
        const entry = entries.get(keyForNode(operation.nodePath));
        if (!entry ||
            operation.status === 'settled' ||
            operation.status === 'failed' ||
            operation.status === 'cancelled')
            return;
        operation.status = 'failed';
        update(entry);
        publish([keyForNode(entry.nodePath)]);
    },
    remap: (remappings) => {
        const changes = remappings.map(({ oldNodePath, nodePath }) => ({
            oldKey: keyForNode(oldNodePath),
            nodePath,
            entry: entries.get(keyForNode(oldNodePath)),
        }));
        for (const { oldKey } of changes)
            entries.delete(oldKey);
        optimistic_effect_prop_statuses_js_1.OptimisticEffectPropStatuses.remap(remappings);
        const changedKeys = [];
        for (const { oldKey, nodePath, entry } of changes) {
            if (!entry)
                continue;
            changedKeys.push(oldKey);
            if (nodePath === null) {
                for (const operation of entry.operations)
                    if (operation.status === 'queued')
                        operation.status = 'cancelled';
                continue;
            }
            entry.nodePath = nodePath;
            const newKey = keyForNode(nodePath);
            entries.set(newKey, entry);
            changedKeys.push(newKey);
            update(entry);
        }
        publish(changedKeys);
    },
    clear: () => {
        const keys = [...entries.keys()];
        for (const entry of entries.values())
            for (const operation of entry.operations)
                if (operation.status === 'queued')
                    operation.status = 'cancelled';
        entries.clear();
        optimistic_effect_prop_statuses_js_1.OptimisticEffectPropStatuses.clear();
        installedMutations.clear();
        acknowledgedMutations.clear();
        activeSourceRevision = null;
        publish(keys);
    },
    invalidateFile: (absolutePath) => {
        const keys = [];
        for (const [key, entry] of entries) {
            if (entry.nodePath.absolutePath !== absolutePath)
                continue;
            for (const operation of entry.operations) {
                if (operation.status === 'queued' ||
                    operation.status === 'acknowledged')
                    operation.status = 'cancelled';
            }
            entries.delete(key);
            optimistic_effect_prop_statuses_js_1.OptimisticEffectPropStatuses.removeNode(entry.nodePath);
            keys.push(key);
        }
        if (keys.length > 0)
            publish(keys);
    },
    reconcile: (nodePath, definitions) => {
        const entry = entries.get(keyForNode(nodePath));
        if (!entry ||
            entry.operations.some((operation) => operation.status === 'queued' || operation.status === 'acknowledged'))
            return;
        if (entry.compiled.length === definitions.length &&
            entry.compiled.every((item, index) => item.definition === definitions[index]))
            return;
        const available = [...entry.compiled];
        const sameOrder = entry.compiled.length === definitions.length &&
            entry.compiled.every((item, index) => item.definition.type === definitions[index].type);
        entry.compiled = definitions.map((definition, position) => {
            if (sameOrder)
                return { ...entry.compiled[position], definition };
            const index = available.findIndex((item) => item.definition === definition);
            if (index !== -1)
                return available.splice(index, 1)[0];
            const sameTypeIndex = available.findIndex((item) => item.definition.type === definition.type);
            if (sameTypeIndex !== -1)
                return { ...available.splice(sameTypeIndex, 1)[0], definition };
            const id = `effect-${++nextId}`;
            return { id, definition, originId: id, descriptor: null };
        });
        entry.operations = [];
        entry.recipes = new Map(entry.compiled.map((item) => [item.id, item]));
        update(entry);
        publish([keyForNode(entry.nodePath)]);
    },
    projectEffects: (nodePath, effects, history) => {
        var _a;
        var _b, _c, _d, _e;
        const entry = nodePath === null ? null : entries.get(keyForNode(nodePath));
        if (entry &&
            history &&
            !entry.frozenRuntime &&
            entry.compiled.length === effects.length &&
            entry.compiled.every((item, index) => item.definition === effects[index].definition)) {
            entry.compiled.forEach((item, index) => history.set(item.id, effects[index]));
        }
        if (!entry ||
            !entry.operations.some((operation) => operation.status === 'queued' || operation.status === 'acknowledged'))
            return {
                effects,
                sourceIndices: null,
                itemIds: (_b = entry === null || entry === void 0 ? void 0 : entry.snapshot.items.map((item) => item.id)) !== null && _b !== void 0 ? _b : null,
            };
        const projected = [];
        const sourceIndices = [];
        const itemIds = [];
        for (const item of entry.snapshot.items) {
            const compiledId = item.sourceIndex === null ? null : (_a = entry.compiled[item.sourceIndex]) === null || _a === void 0 ? void 0 : _a.id;
            const descriptor = compiledId !== null && entry.frozenRuntime
                ? history === null || history === void 0 ? void 0 : history.get(compiledId)
                : item.sourceIndex === null
                    ? ((_e = (_c = item.descriptor) !== null && _c !== void 0 ? _c : history === null || history === void 0 ? void 0 : history.get((_d = item.originId) !== null && _d !== void 0 ? _d : item.id)) !== null && _e !== void 0 ? _e : null)
                    : effects[item.sourceIndex];
            if (!descriptor)
                continue;
            history === null || history === void 0 ? void 0 : history.set(item.id, descriptor);
            projected.push(descriptor);
            sourceIndices.push(item.sourceIndex);
            itemIds.push(item.id);
        }
        return { effects: projected, sourceIndices, itemIds };
    },
};
const useOptimisticEffects = (nodePath) => {
    const key = nodePath === null ? null : keyForNode(nodePath);
    const observer = (0, react_1.useMemo)(() => ({
        subscribe: (listener) => subscribeToKey(key, listener),
        getSnapshot: () => { var _a; var _b; return key === null ? null : ((_b = (_a = entries.get(key)) === null || _a === void 0 ? void 0 : _a.snapshot) !== null && _b !== void 0 ? _b : null); },
    }), [key]);
    return (0, use_sync_external_store_js_1.useSyncExternalStore)(observer.subscribe, observer.getSnapshot, () => null);
};
exports.useOptimisticEffects = useOptimisticEffects;
