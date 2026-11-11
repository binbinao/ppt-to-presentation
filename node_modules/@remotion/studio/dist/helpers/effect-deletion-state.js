"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateEffectDeletionSelection = exports.getEffectDeletionSelectionRevision = void 0;
let selectionRevision = 0;
const getEffectDeletionSelectionRevision = () => selectionRevision;
exports.getEffectDeletionSelectionRevision = getEffectDeletionSelectionRevision;
const invalidateEffectDeletionSelection = () => selectionRevision++;
exports.invalidateEffectDeletionSelection = invalidateEffectDeletionSelection;
