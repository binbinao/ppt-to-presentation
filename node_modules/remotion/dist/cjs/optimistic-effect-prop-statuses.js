"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimisticEffectPropStatuses = void 0;
const nodes = new Map();
const listeners = new Set();
const keyForNode = (nodePath) => JSON.stringify([nodePath.absolutePath, nodePath.nodePath]);
exports.OptimisticEffectPropStatuses = {
    get: (nodePath, id) => { var _a; var _b; return (_b = (_a = nodes.get(keyForNode(nodePath))) === null || _a === void 0 ? void 0 : _a.get(id)) !== null && _b !== void 0 ? _b : null; },
    set: (nodePath, id, props) => {
        var _a;
        const key = keyForNode(nodePath);
        const current = nodes.get(key);
        if (((_a = current === null || current === void 0 ? void 0 : current.get(id)) !== null && _a !== void 0 ? _a : null) === props)
            return;
        if (props === null) {
            current === null || current === void 0 ? void 0 : current.delete(id);
            if ((current === null || current === void 0 ? void 0 : current.size) === 0)
                nodes.delete(key);
        }
        else {
            const next = current !== null && current !== void 0 ? current : new Map();
            next.set(id, props);
            nodes.set(key, next);
        }
        for (const listener of listeners)
            listener(nodePath);
    },
    copy: (nodePath, fromId, toId) => {
        const props = exports.OptimisticEffectPropStatuses.get(nodePath, fromId);
        if (props === null)
            return;
        exports.OptimisticEffectPropStatuses.set(nodePath, toId, props);
    },
    removeNode: (nodePath) => {
        if (!nodes.delete(keyForNode(nodePath)))
            return;
        for (const listener of listeners)
            listener(nodePath);
    },
    remap: (remappings) => {
        const moved = remappings.map(({ oldNodePath, nodePath }) => ({
            oldNodePath,
            nodePath,
            props: nodes.get(keyForNode(oldNodePath)),
        }));
        for (const { oldNodePath } of moved)
            nodes.delete(keyForNode(oldNodePath));
        for (const { nodePath, props } of moved) {
            if (nodePath !== null && props)
                nodes.set(keyForNode(nodePath), props);
        }
        for (const { oldNodePath, nodePath } of moved) {
            for (const listener of listeners)
                listener(oldNodePath);
            if (nodePath !== null)
                for (const listener of listeners)
                    listener(nodePath);
        }
    },
    clear: () => nodes.clear(),
    subscribe: (listener) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
};
