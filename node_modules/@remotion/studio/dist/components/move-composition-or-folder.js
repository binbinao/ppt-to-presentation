"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveCompositionOrFolder = void 0;
const optimistic_composition_operations_1 = require("../helpers/optimistic-composition-operations");
const composition_selector_drag_data_1 = require("./composition-selector-drag-data");
const actions_1 = require("./RenderQueue/actions");
const moveCompositionOrFolder = ({ dragData, destination, destinationFile, getSnapshot, }) => {
    const { item: source, sourceFile } = dragData;
    return (0, optimistic_composition_operations_1.applyOptimisticCompositionOperation)({
        operation: {
            type: 'move',
            item: source,
            destination,
            sourceFile,
            destinationFile,
        },
        getSnapshot,
        persist: () => {
            const { signal } = new AbortController();
            const common = {
                destination,
                destinationFile,
                symbolicatedStack: (0, composition_selector_drag_data_1.compositionSelectorDragDataToSymbolicatedStack)(dragData),
                undoRedoNavigation: null,
            };
            return source.type === 'composition'
                ? (0, actions_1.moveComposition)({ ...common, compositionId: source.compositionId }, signal)
                : (0, actions_1.moveFolder)({
                    ...common,
                    folderName: source.folderName,
                    parentName: source.parentName,
                }, signal);
        },
    });
};
exports.moveCompositionOrFolder = moveCompositionOrFolder;
